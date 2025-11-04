import React, { useState, useEffect, useMemo } from 'react';
import { type Card, type BoardMember } from '../../types';
import { useBoardStore } from '../../store/boardStore';
import { api } from '../../services/api';
import { X, User, Calendar, Tag, FileText } from 'lucide-react';
import ReactDatePicker from 'react-datepicker';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';

interface CardDetailsModalProps {
  card: Card;
  onClose: () => void;
}

const CardDetailsModal: React.FC<CardDetailsModalProps> = ({ card, onClose }) => {
  const { activeBoard, updateCard } = useBoardStore();
  const members = activeBoard?.members || [];

  // Local state for editing
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [dueDate, setDueDate] = useState<Date | null>(
    card.due_date ? new Date(card.due_date) : null
  );

  // We use useMemo to avoid re-calculating on every render
  const assignedUser = useMemo(() => {
    return members.find(m => m.id === card.assigned_user?.id);
  }, [members, card.assigned_user]);

  // Generic debounce timer for API calls
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // --- API Call Handler ---
  // This function will be called on blur or on change with a debounce
  const handleUpdate = (field: string, value: any) => {
    // Clear any existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set a new timer
    const timer = setTimeout(async () => {
      try {
        const payload = {
          [field]: value,
        };
        const res = await api.put(`/api/cards/${card.id}`, payload);
        if (res.success) {
          // Update local state in the store
          updateCard(res.data);
        }
      } catch (err) {
        console.error(`Failed to update ${field}`, err);
      }
    }, 500); // 500ms debounce

    setDebounceTimer(timer);
  };

  // --- Specific Field Handlers ---
  
  const handleTitleBlur = () => {
    if (title === card.title) return; // No change
    handleUpdate('title', title);
  };

  const handleDescriptionBlur = () => {
    if (description === (card.description || '')) return; // No change
    handleUpdate('description', description);
  };

  const handleDateChange = (date: Date | null) => {
    setDueDate(date);
    // API wants ISO string or null
    handleUpdate('due_date', date ? date.toISOString() : null);
  };
  
  const handleAssignMember = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const userId = e.target.value ? parseInt(e.target.value) : null;
    handleUpdate('assigned_user_id', userId);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 relative flex gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white"
        >
          <X size={24} />
        </button>

        {/* Main Content (Left) */}
        <div className="flex-grow w-3/5">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="text-2xl font-semibold text-gray-900 bg-transparent w-full rounded-md p-2 -ml-2
                   focus:outline-none focus:bg-gray-200 hover:bg-gray-200/50"
          />

          {/* Description */}
          <div className="mt-4">
            <h3 className="text-sm font-medium text-neutral-400 flex items-center gap-2 mb-2">
              <FileText size={16} /> Description
            </h3>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              placeholder="Add a more detailed description..."
              className="w-full h-32 p-2 bg-gray-100 rounded-md
                     focus:outline-none focus:bg-gray-200 resize-none
                     placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Sidebar (Right) */}
        <div className="w-2/5 flex flex-col gap-4">
          <h3 className="text-sm font-medium text-neutral-400">Add to card</h3>
          
          {/* Assign Member */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <User size={16} /> Members
            </label>
            <select
              value={assignedUser?.id || ''}
              onChange={handleAssignMember}
              className="w-full px-3 py-2 text-gray-900 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Unassigned</option>
              {members.map(member => (
                <option key={member.id} value={member.id}>
                  {member.username}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar size={16} /> Due date
            </label>
            <ReactDatePicker
              selected={dueDate}
              onChange={handleDateChange}
              isClearable
              placeholderText="Set due date"
              className="w-full px-3 py-2 text-gray-900 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Labels (Simple for now) */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Tag size={16} /> Labels
            </label>
            <div className="flex flex-wrap gap-2">
              {card.labels.map((label, index) => (
                <span 
                  key={index} 
                  className="px-2 py-0.5 rounded-full text-sm font-medium"
                  style={{ backgroundColor: label.color, color: '#FFFFFF' }} // Simple contrast
                >
                  {label.text}
                </span>
              ))}
              <Button variant="secondary" size="sm" className="opacity-50 cursor-not-allowed">
                +
              </Button>
            </div>
            <p className="text-xs text-neutral-500">Label editing coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardDetailsModal;