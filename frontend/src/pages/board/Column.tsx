import { useState } from 'react';
import { type Column as ColumnType, type Card as CardType } from '../../types';
import Card from './Card';
import { useForm } from 'react-hook-form';
import { api } from '../../services/api';
import { useBoardStore } from '../../store/boardStore';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Plus, Trash2, MoreHorizontal, GripVertical } from 'lucide-react'; // <-- 1. IMPORT GripVertical

// --- DND IMPORTS ---
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core'; 

// --- END DND IMPORTS ---

interface ColumnProps {
  column: ColumnType;
  onCardClick: (card: CardType) => void;
}

type CreateCardForm = {
  title: string;
};

const Column: React.FC<ColumnProps> = ({ column, onCardClick }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const { register, handleSubmit, reset } = useForm<CreateCardForm>();
  const addCard = useBoardStore((state) => state.addCard);

  const sortedCards = column.cards || [];
  const cardIds = sortedCards.map(card => card.id);
  const deleteColumn = useBoardStore((state) => state.deleteColumn);
  
  // --- DND HOOKS ---
  
  const {
    attributes,
    listeners, // <-- 2. We will move listeners to a button
    setNodeRef: setSortableNodeRef, 
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: 'Column',
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  
  const { setNodeRef: setDroppableNodeRef } = useDroppable({
    id: column.id, 
    data: {
      type: 'Column', 
    },
  });
  
  // --- END DND HOOKS ---
  
  const onDeleteColumn = async () => {
    if (window.confirm('Are you sure you want to delete this column and all its cards?')) {
      try {
        const response = await api.delete(`/api/columns/${column.id}`);
        if (response.success) {
          deleteColumn(column.id); 
        } else {
          alert(response.message || 'Failed to delete column');
        }
      } catch (error) {
        console.error('Failed to delete column:', error);
      }
    }
  };
  const onCreateCard = async (data: CreateCardForm) => {
    try {
      const response = await api.post(`/api/cards/column/${column.id}`, { title: data.title });
      if (response.success) {
        const newCard = {
          ...response.data,
          description: null, due_date: null, labels: [], assigned_user: null
        };
        addCard(newCard);
        reset();
        setShowAddForm(false);
      } else {
        alert(response.message || 'Failed to create card');
      }
    } catch (error) {
      console.error('Failed to create card:', error);
    }
  };

  return (
    <div
      ref={setSortableNodeRef} 
      style={style}
      className="lex flex-col flex-shrink-0 w-72 bg-gray-100 rounded-lg shadow-md overflow-hidden h-full"
    >
      {/* Column Header */}
      <div
        {...attributes} // <-- 3. Keep attributes for accessibility
        // ...but REMOVE listeners
        className="flex justify-between items-center p-3 border-b border-gray-200 relative" // <-- 4. REMOVE cursor-grab
      >
        {/* Color Stripe (Top) - Placeholder */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-green-500"></div> 

        {/* --- 5. ADDED DEDICATED COLUMN DRAG HANDLE --- */}
        <button
          {...listeners} // <-- 6. Listeners are ONLY on this button
          className="p-1 text-gray-400 hover:text-gray-800 cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <GripVertical size={18} />
        </button>
        {/* --- END OF NEW HANDLE --- */}

        <h3 className="font-semibold text-gray-800 flex-grow ml-1">
          {column.title}
          <span className="text-gray-500 text-sm ml-2">{column.cards.length}</span>
        </h3>

        {/* Column Options Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative z-10"
          onPointerDown={(e) => e.stopPropagation()} // Stop drag
        >
          <MoreHorizontal size={18} />
        </Button>

        {/* Delete Column Button */}
        <Button
          variant="ghost"
          size="icon"
          className="text-neutral-500 hover:text-red-400 relative z-10 -mr-1"
          onClick={onDeleteColumn}
          onPointerDown={(e) => e.stopPropagation()} // Stop drag
        >
          <Trash2 size={16} />
        </Button>
      </div>

      {/* --- THIS IS THE NEW STRUCTURE --- */}

      {/* Add Card Form/Button (Moved to top) */}
      <div className="p-2 border-b border-gray-200">
        {showAddForm ? (
          <form onSubmit={handleSubmit(onCreateCard)}>
            <Input
              placeholder="Enter card title..."
              registration={register('title', { required: true })}
            />
            <div className="mt-2 flex gap-2">
              <Button type="submit" size="sm">Add Card</Button>
              <Button variant="secondary" size="sm" onClick={() => setShowAddForm(false)}>Cancel</Button>
            </div>
          </form>
        ) : (
          <Button variant="ghost" className="w-full justify-start" onClick={() => setShowAddForm(true)}>
            <Plus size={16} className="mr-2" /> Add New Task
          </Button>
        )}
      </div>

      {/* Column Content (Card List) */}
      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div 
          ref={setDroppableNodeRef} 
          className="flex-grow p-2 overflow-y-auto min-h-[60px]"
        >
          {sortedCards.map((card) => (
            <Card 
              key={card.id} 
              card={card} 
              columnId={column.id}
              onClick={() => onCardClick(card)}
            />
          ))}
        </div>
      </SortableContext>
      {/* --- END NEW STRUCTURE --- */}

    </div>
  );
};

export default Column;