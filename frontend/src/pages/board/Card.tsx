import { type Card as CardType } from '../../types';
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2 } from 'lucide-react';
import { useBoardStore } from '../../store/boardStore';
import { api } from '../../services/api';
import { CalendarDays, CheckSquare, MessageCircle, Paperclip } from 'lucide-react';
import Avatar from '../../components/ui/Avatar';
interface CardProps {
  card: CardType;
  columnId: number; // <-- ADD THIS PROP
  onClick: () => void;
}

const Card: React.FC<CardProps> = ({ card, columnId, onClick }) => { // <-- ADD IT HERE
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
      columnId: columnId, // <-- USE THE PROP, NOT card.column_id
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
        // Use the prop here too, just to be safe
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
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="p-3 mb-2 bg-white rounded-md shadow-sm border border-transparent hover:border-gray-300 cursor-pointer relative group"
    >
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
  );
};

export default Card;