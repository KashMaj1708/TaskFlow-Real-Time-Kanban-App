import React, { useState, useEffect, useMemo } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { type Card } from '../../types';
import { api } from '../../services/api';
import { X, User, Clock, AlignLeft } from 'lucide-react';
import ReactDatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

// --- THIS IS THE PROP FIX ---
interface CardDetailsModalProps {
  cardId: number; // It now accepts cardId
  onClose: () => void;
}
// --- END PROP FIX ---

const CardDetailsModal: React.FC<CardDetailsModalProps> = ({ cardId, onClose }) => {
  const { activeBoard } = useBoardStore();
  const members = activeBoard?.members || [];

  // --- THIS IS THE FIX for BUG 1 ---
  // Subscribe to the store to get the LIVE card data
  const card = useBoardStore(state => 
    state.activeBoard?.columns
      .flatMap(c => c.cards)
      .find(c => c.id === cardId)
  );
  // --- END FIX ---

  // Local state for editing
  const [title, setTitle] = useState(card?.title || '');
  const [description, setDescription] = useState(card?.description || '');
  const [dueDate, setDueDate] = useState<Date | null>(
    card?.due_date ? new Date(card.due_date) : null
  );
  
  // Sync local state if the card changes (e.g., from a socket event)
  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDescription(card.description || '');
      setDueDate(card.due_date ? new Date(card.due_date) : null);
    }
  }, [card]);

  // We use useMemo to avoid re-calculating on every render
  const assignedUser = useMemo(() => {
    return members.find(m => m.id === card?.assigned_user?.id);
  }, [members, card?.assigned_user]);

  // Generic debounce timer for API calls
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // If card is deleted or not found, close the modal
  if (!card) {
    // We use a simple effect to close, avoiding state updates during render
    useEffect(() => {
      onClose();
    }, [onClose]);
    return null;
  }

  // Generic update handler with debounce
  const handleUpdate = (field: keyof Card, value: any) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(async () => {
      try {
        const payload = {
          [field]: value,
        };
        // Use cardId from props
        await api.put(`/api/cards/${cardId}`, payload);
      } catch (err) {
        console.error(`Failed to update ${field}`, err);
      }
    }, 500); // 500ms debounce

    setDebounceTimer(timer);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleTitleBlur = () => {
    if (title === card?.title) return; // No change
    handleUpdate('title', title);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };
  
  const handleDescriptionBlur = () => {
    if (description === (card?.description || '')) return; // No change
    handleUpdate('description', description);
  };

  const handleAssignMember = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const userId = e.target.value === 'none' ? null : Number(e.target.value);
    handleUpdate('assigned_user_id', userId);
  };
  
  const handleDateChange = (date: Date | null) => {
    setDueDate(date);
    handleUpdate('due_date', date ? date.toISOString() : null);
  };


  return (
    <div
      className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 relative flex gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>

        {/* Left Side (Content) */}
        <div className="flex-grow">
          <input
            value={title}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            className="text-2xl font-semibold text-gray-900 bg-transparent w-full rounded-md p-2 -ml-2
                       focus:outline-none focus:bg-gray-200 hover:bg-gray-200/50"
          />

          <h3 className="text-sm font-semibold text-gray-500 mt-6 mb-2 flex items-center gap-2">
            <AlignLeft size={16} /> Description
          </h3>
          <textarea
            value={description}
            onChange={handleDescriptionChange}
            onBlur={handleDescriptionBlur}
            placeholder="Add a more detailed description..."
            className="w-full h-32 p-2 bg-gray-100 rounded-md
                         focus:outline-none focus:bg-gray-200 resize-none
                         placeholder:text-gray-400"
          />
          {/* ... other fields like attachments/activity ... */}
        </div>

        {/* Right Side (Sidebar) */}
        <div className="w-48 flex-shrink-0">
          <h3 className="text-sm font-semibold text-gray-500 mb-2">Actions</h3>
          
          <label className="text-sm font-semibold text-gray-500 mt-4 mb-2 flex items-center gap-2">
            <User size={16} /> Assign
          </label>
          <select
            value={assignedUser?.id ?? 'none'}
            onChange={handleAssignMember}
            className="w-full px-3 py-2 text-gray-900 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="none">Unassigned</option>
            {members.map(member => (
              <option key={member.id} value={member.id}>
                {member.username}
              </option>
            ))}
          </select>

          <label className="text-sm font-semibold text-gray-500 mt-4 mb-2 flex items-center gap-2">
            <Clock size={16} /> Due Date
          </label>
          <ReactDatePicker
            selected={dueDate}
            onChange={handleDateChange}
            dateFormat="MMM d, yyyy"
            placeholderText="Set due date"
            className="w-full px-3 py-2 text-gray-900 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* ... other actions like 'Labels' or 'Delete' ... */}
        </div>
      </div>
    </div>
  );
};

export default CardDetailsModal;