import { useState } from 'react';
import { type Column as ColumnType } from '../../types';
import Card from './Card';
import { useForm } from 'react-hook-form';
import { api } from '../../services/api';
import { useBoardStore } from '../../store/boardStore';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Plus, Trash2 } from 'lucide-react';

// --- DND IMPORTS ---
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';

// --- END DND IMPORTS ---

interface ColumnProps {
  column: ColumnType;
}

type CreateCardForm = {
  title: string;
};

const Column: React.FC<ColumnProps> = ({ column }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const { register, handleSubmit, reset } = useForm<CreateCardForm>();
  const addCard = useBoardStore((state) => state.addCard);

  const sortedCards = column.cards || [];
  const cardIds = sortedCards.map(card => card.id);
  const deleteColumn = useBoardStore((state) => state.deleteColumn);
  // --- DND HOOKS ---
  const {
    attributes,
    listeners,
    setNodeRef,
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
  // --- END DND HOOKS ---
  const onDeleteColumn = async () => {
    // Add a confirmation
    if (window.confirm('Are you sure you want to delete this column and all its cards?')) {
      try {
        const response = await api.delete(`/api/columns/${column.id}`);
        if (response.success) {
          deleteColumn(column.id); // Update state
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
      const response = await api.post(`/api/columns/${column.id}/cards`, { title: data.title });
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
      ref={setNodeRef}
      style={style}
      className="flex-shrink-0 w-72 bg-neutral-800 rounded-lg shadow-md flex flex-col h-fit"
    >
     {/* Column Header */}
  <div
    {...attributes}
    {...listeners}
    className="p-4 border-b border-neutral-700 cursor-grab active:cursor-grabbing flex justify-between items-center"
  >
    <h3 className="font-semibold">{column.title}</h3>
    <button 
      onClick={onDeleteColumn}
      className="text-neutral-500 hover:text-red-400 p-1 rounded-md"
      // Stop drag from starting when clicking button
      onPointerDown={(e) => e.stopPropagation()}
    >
      <Trash2 size={16} />
    </button>
  </div>

      {/* Cards List (Droppable Zone) */}
      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div className="flex-grow p-2 overflow-y-auto min-h-[60px]">
        {sortedCards.map((card) => (
  <Card 
    key={card.id} 
    card={card} 
    columnId={column.id} // <-- PASS THE PROP HERE
  />
))}
        </div>
      </SortableContext>

      {/* Add Card Form */}
      <div className="p-2">
        {showAddForm ? (
          <form onSubmit={handleSubmit(onCreateCard)} className="flex flex-col gap-2">
            <Input
              placeholder="Enter card title..."
              registration={register('title', { required: true })}
              autoFocus
            />
            <div className="flex gap-2">
              <Button type="submit" variant="primary">Add Card</Button>
              <Button type="button" variant="secondary" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button
            variant="secondary"
            onClick={() => setShowAddForm(true)}
            className="w-full flex items-center justify-center gap-2 text-neutral-400 hover:text-white"
          >
            <Plus size={16} /> Add a card
          </Button>
        )}
      </div>
    </div>
  );
};

export default Column;