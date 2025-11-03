import { type Card as CardType } from '../../types';
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2 } from 'lucide-react';
import { useBoardStore } from '../../store/boardStore';
import { api } from '../../services/api';

interface CardProps {
  card: CardType;
  columnId: number; // <-- ADD THIS PROP
}

const Card: React.FC<CardProps> = ({ card, columnId }) => { // <-- ADD IT HERE
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
      className="p-3 mb-2 bg-neutral-700 rounded-md shadow-sm hover:bg-neutral-600 cursor-grab active:cursor-grabbing relative group"
    >
      <p>{card.title}</p>
      
      <button
        onClick={onDeleteCard}
        className="absolute top-2 right-2 text-neutral-500 hover:text-red-400 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Trash2 size={14} />
      </button>
      
      {card.assigned_user?.id && (
        <div className="mt-2 flex justify-end">
           <div 
             className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
             style={{ backgroundColor: card.assigned_user.avatar_color || '#3B82F6' }}
             title={card.assigned_user.username || ''}
           >
             {card.assigned_user.username?.charAt(0).toUpperCase()}
           </div>
        </div>
      )}
    </div>
  );
};

export default Card;