import { type Card as CardType } from '../../types';
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, GripVertical } from 'lucide-react'; // <-- ADDED GripVertical
import { useBoardStore } from '../../store/boardStore';
import { api } from '../../services/api';
import { CalendarDays, CheckSquare, MessageCircle, Paperclip } from 'lucide-react';
import Avatar from '../../components/ui/Avatar';

interface CardProps {
  card: CardType;
  columnId: number;
  onClick: () => void;
}

const Card: React.FC<CardProps> = ({ card, columnId, onClick }) => {
  const deleteCard = useBoardStore((state) => state.deleteCard);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: 'Card',
      columnId: columnId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const onDeleteCard = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    try {
      const response = await api.delete(`/api/cards/${card.id}`);
      if (response.success) {
        deleteCard(card.id, columnId); 
      } else {
        alert(response.message || 'Failed to delete card');
      }
    } catch (error) {
      console.error('Failed to delete card:', error);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      // attributes and listeners moved to handle
      onClick={onClick}
      className="p-3 mb-2 bg-white rounded-md shadow-sm border border-transparent hover:border-gray-300 cursor-pointer relative group"
    >
      {/* --- ADDED DRAG HANDLE --- */}
      <button
        {...attributes}
        {...listeners}
        className="absolute top-2 left-1 p-1 text-gray-400 hover:text-gray-800 cursor-grab"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={16} />
      </button>

      {/* --- ADDED DELETE BUTTON --- */}
      <button
        onClick={onDeleteCard}
        className="absolute top-1 right-1 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 size={16} />
      </button>

      {/* --- WRAPPED CONTENT IN DIV WITH MARGIN --- */}
      <div className="ml-4">
        {/* Labels (Top) */}
        <div className="flex flex-wrap gap-1 mb-2">
          {card.labels.map((label, index) => (
            <span
              key={index}
              className="px-2 py-0.5 rounded-sm text-xs font-medium"
              style={{ backgroundColor: label.color, color: '#FFFFFF' }}
            >
              {label.text}
            </span>
          ))}
        </div>

        {/* Card Title */}
        <p className="font-medium text-gray-900 mb-2">{card.title}</p>

        {/* Footer Icons & Avatars */}
        <div className="flex justify-between items-end text-gray-500 text-sm">
          <div className="flex items-center gap-2">
            {/* Due Date */}
            {card.due_date && (
              <div className="flex items-center gap-1">
                <CalendarDays size={14} />
                <span className="text-xs">{new Date(card.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            )}
            {/* Checklist (Placeholder) */}
            <div className="flex items-center gap-1 opacity-50">
              <CheckSquare size={14} />
              <span className="text-xs">0/0</span>
            </div>
            {/* Comments (Placeholder) */}
            <div className="flex items-center gap-1 opacity-50">
              <MessageCircle size={14} />
              <span className="text-xs">0</span>
            </div>
            {/* Attachments (Placeholder) */}
            <div className="flex items-center gap-1 opacity-50">
              <Paperclip size={14} />
              <span className="text-xs">0</span>
            </div>
          </div>

          {/* Assigned User Avatar */}
          {card.assigned_user && (
            <Avatar user={card.assigned_user} size="sm" />
          )}
        </div>
      </div>
      {/* --- END WRAPPER DIV --- */}
    </div>
  );
};

export default Card;