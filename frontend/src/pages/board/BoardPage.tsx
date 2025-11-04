import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useBoardStore } from '../../store/boardStore';
import Column from './Column';
import { useForm } from 'react-hook-form';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { ArrowLeft, Plus, Users, LayoutDashboard, Filter } from 'lucide-react'; // Import Users
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../../components/ui/Avatar';
import CardDetailsModal from '../../components/board/CardDetailsModal';
// --- DND IMPORTS ---
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
// --- END DND IMPORTS ---

// --- Socket & Modal Imports ---
import { socketService } from '../../services/socketService';
import { type BoardMember, type Column as ColumnType, type Card } from '../../types'; // Renamed Column type
import MembersModal from '../../components/board/MembersModal';
// --- End Socket & Modal Imports ---

type CreateColumnForm = {
  title: string;
};

// Type guard for our draggable items (with fixes)
type ActiveDragType = {
  type: 'Column' | 'Card';
  id: number;
  data: {
    columnId?: number; // Optional to fix Column drag
    [key: string]: any;
  };
};

const BoardPage = () => {
    const { user } = useAuth();
  const { boardId } = useParams<{ boardId: string }>();
  // --- UPDATE THIS LINE to include all store actions ---
  const { activeBoard, setActiveBoard, addColumn, moveColumn, moveCard,
          addCard, deleteCard, deleteColumn, addMember, removeMember, syncMovedColumn, syncMovedCard, updateCard } = useBoardStore();
          
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDrag, setActiveDrag] = useState<ActiveDragType | null>(null);

  // --- ADD THIS STATE ---
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const { register, handleSubmit, reset } = useForm<CreateColumnForm>();

  // DND Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require the mouse to move 5px before activating a drag
      // This prevents a simple click from being treated as a drag
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch Board
  useEffect(() => {
    if (!boardId) return;
    const fetchBoard = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/boards/${boardId}`);
        if (response.success) {
          // Sort columns and cards by position on initial load
          const boardData = response.data;
          boardData.columns.sort((a: any, b: any) => a.position - b.position);
          boardData.columns.forEach((col: any) => {
            col.cards.sort((a: any, b: any) => a.position - b.position);
          });
          setActiveBoard(boardData);
          setError(null);
        } else {
          setError(response.message || 'Failed to load board');
        }
      } catch (err) {
        setError('An error occurred while fetching the board.');
      } finally {
        setLoading(false);
      }
    };
    fetchBoard();
  }, [boardId, setActiveBoard]);

  // --- ADD THIS NEW useEffect for Sockets ---
  useEffect(() => {
    // Connect and join board
    socketService.connect();
    if (boardId) {
      socketService.joinBoard(boardId);
    }

    // --- Listen for all real-time events ---
    socketService.listen('column:created', (data: ColumnType) => { // Use ColumnType
      addColumn(data);
    });

    socketService.listen('column:updated', (data: { id: number, title: string }) => {
      // We'll implement this properly in Phase 6
    });
    
    socketService.listen('column:deleted', (data: { columnId: number }) => {
      deleteColumn(data.columnId);
    });

    socketService.listen('column:moved', (data: { columnId: number, newPosition: number, movedBy: number }) => {
        // Only apply update if you are not the one who moved it
        if (data.movedBy !== user?.id) {
          syncMovedColumn(data.columnId, data.newPosition);
        }
      });

    socketService.listen('card:created', (data: Card) => {
      addCard(data);
    });

    socketService.listen('card:updated', (data: Card) => {
      // We'll implement this in Phase 6
      updateCard(data);
    });

    socketService.listen('card:deleted', (data: { cardId: number, columnId: number }) => {
      deleteCard(data.cardId, data.columnId);
    });

    socketService.listen('card:moved', (data: { cardId: number, oldColumnId: number, newColumnId: number, newPosition: number, movedBy: number }) => {
        // Only apply update if you are not the one who moved it
        if (data.movedBy !== user?.id) {
          syncMovedCard(data.cardId, data.oldColumnId, data.newColumnId, data.newPosition);
        }
      });
    
    // --- Phase 5 Socket Events ---
    socketService.listen('board:member:added', (data: BoardMember) => {
      addMember(data);
    });

    socketService.listen('board:member:removed', (data: { userId: number }) => {
      removeMember(data.userId);
    });

    // Cleanup on unmount
    return () => {
      if (boardId) {
        socketService.leaveBoard(boardId);
      }
      // Remove all listeners to prevent memory leaks
      socketService.removeListener('column:created');
      socketService.removeListener('column:updated');
      socketService.removeListener('column:deleted');
      socketService.removeListener('column:moved');
      socketService.removeListener('card:created');
      socketService.removeListener('card:updated');
      socketService.removeListener('card:deleted');
      socketService.removeListener('card:moved');
      socketService.removeListener('board:member:added');
      socketService.removeListener('board:member:removed');
     
    };
    // Add all store actions to dependency array
  }, [boardId, addColumn, addCard, deleteCard, deleteColumn, addMember, removeMember, syncMovedColumn, syncMovedCard, updateCard, user?.id]);
  // --- END SOCKET useEffect ---

  // Create Column
  const onCreateColumn = async (data: CreateColumnForm) => {
    if (!boardId) return;
    try {
      const response = await api.post(`/api/boards/${boardId}/columns`, { title: data.title });
      if (response.success) {
        // We let the socket event handle the state update
        // addColumn({ ...response.data, cards: [] }); 
        reset();
      } else {
        alert(response.message || 'Failed to create column');
      }
    } catch (error) {
      console.error('Failed to create column:', error);
    }
  };

  // --- DND HANDLERS ---
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveDrag({
      type: active.data.current?.type,
      id: Number(active.id),
      data: active.data.current || {},
    });
  };

  // This is the function with the "always drops at top" bug
  // AND the infinite loop bug
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !activeDrag) return;

    const activeId = active.id as number;
    const overId = over.id as number;
    
    if (activeDrag.type !== 'Card') return;
    
    const overIsColumn = over.data.current?.type === 'Column';
    const overIsCard = over.data.current?.type === 'Card';

    const startColumnId = activeDrag.data.columnId;
    let endColumnId: number;

    if (overIsColumn) {
      endColumnId = overId;
    } else if (overIsCard) {
      endColumnId = over.data.current?.columnId;
    } else {
      return; 
    }

    if (startColumnId === undefined) {
      return; 
    }

    if (startColumnId === endColumnId) return;

    const activeCard = activeBoard?.columns.flatMap(c => c.cards).find(c => c.id === activeId);
    if (!activeCard) return;

    const currentColumn = activeBoard?.columns.find(c => c.cards.some(card => card.id === activeId));
    if (!currentColumn) return; 
    
    const currentColumnId = currentColumn.id;
    const dragIndex = currentColumn.cards.findIndex(c => c.id === activeId);

    if (currentColumnId !== endColumnId) {
      moveCard(activeId, currentColumnId, endColumnId, dragIndex, 0); 
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !activeDrag) {
      setActiveDrag(null);
      return;
    }

    const activeId = active.id as number;
    const overId = over.id as number;
    const startColumnId = activeDrag.data.columnId; // This is 'number | undefined'

    // Dragging a COLUMN
    if (activeDrag.type === 'Column' && activeId !== overId) {
      const oldIndex = activeBoard?.columns.findIndex(c => c.id === activeId) ?? 0;
      const newIndex = activeBoard?.columns.findIndex(c => c.id === overId) ?? 0;
      
      // Update local state
      moveColumn(oldIndex, newIndex);
      
      // Call API
      api.put(`/api/columns/${activeId}/move`, { newPosition: newIndex })
         .catch(err => console.error("Failed to move column", err));
    }

    // Dragging a CARD
    if (activeDrag.type === 'Card') {
      const overIsCard = over.data.current?.type === 'Card';
      const overIsColumn = over.data.current?.type === 'Column';
      
      let endColumnId: number;
      let newIndex: number; // The new position in the *end* column

      if (overIsColumn) {
        endColumnId = overId;
        // If dropping on an empty column, the new index is 0
        const endColCards = activeBoard?.columns.find(c => c.id === endColumnId)?.cards;
        newIndex = endColCards ? endColCards.length : 0;
      } else if (overIsCard) {
        endColumnId = over.data.current?.columnId;
        newIndex = activeBoard?.columns.find(c => c.id === endColumnId)?.cards.findIndex(c => c.id === overId) ?? 0;
      } else {
        setActiveDrag(null);
        return;
      }
      
      // Check if startColumnId is defined
      if (startColumnId === undefined) {
        console.error("Drag start column ID is undefined for a card.");
        setActiveDrag(null);
        return;
      }
      
      // Find the card's original index in its starting column
      const oldIndex = activeBoard?.columns
        .find(c => c.id === startColumnId)
        ?.cards.findIndex(c => c.id === activeId) ?? 0;

      // --- THIS IS THE FIX ---
      // We removed the `if (startColumnId === endColumnId)` check.
      // This *one* call will optimistically update the state for BOTH
      // same-column and cross-column moves.
      moveCard(activeId, startColumnId, endColumnId, oldIndex, newIndex);
      // --- END FIX ---
      
      // Call API
      api.put(`/api/cards/${activeId}/move`, { newColumnId: endColumnId, newPosition: newIndex })
         .catch(err => console.error("Failed to move card", err));
    }

    setActiveDrag(null);
  };
  // --- END DND HANDLERS ---

  if (loading) return <div className="p-8 text-center">Loading Board...</div>;
  if (error) return <div className="p-8 text-center text-red-400">{error}</div>;
  if (!activeBoard) return <div className="p-8 text-center">Board not found.</div>;
  
  // Get sorted columns for rendering
  const sortedColumns = activeBoard.columns;
  const columnIds = sortedColumns.map(col => col.id);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-screen p-4 gap-4 text-neutral-900">
        
        {/* Board Header (This is the updated block) */}
        <div className="flex-shrink-0 flex justify-between items-center px-4">
          {/* Left Side */}
          <div className="flex items-center gap-2">
            <Link to="/" className="text-neutral-400 hover:text-white" title="Back to Dashboard">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-2xl font-bold">{activeBoard.title}</h1>
            <Button variant="ghost" className="text-neutral-400">
              <LayoutDashboard size={16} className="mr-2" /> Customize
            </Button>
            <Button variant="ghost" className="text-neutral-400">
              <Filter size={16} className="mr-2" /> Show: All
            </Button>
          </div>
          
          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Member Avatars */}
            <div className="flex -space-x-2">
              {activeBoard.members.map((member) => (
                <Avatar key={member.id} user={member} size="md" />
              ))}
            </div>
            
            {/* Members Button */}
            <Button 
              variant="secondary" 
              className="flex items-center gap-2"
              onClick={() => setShowMembersModal(true)}
            >
              <Users size={16} />
              Members
            </Button>
          </div>
        </div>

        {/* Board Canvas (Scrollable) */}
        <div className="flex-grow flex gap-4 overflow-x-auto pb-4">
          <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
            {sortedColumns.map((col) => (
              <Column 
                key={col.id} 
                column={col} 
                onCardClick={(card) => {
                  console.log('BoardPage heard click from column:', card.id);
                  setSelectedCard(card);
                }}
              />
            ))}
          </SortableContext>
          
          {/* Add New Column Form */}
          <div className="flex-shrink-0 w-72 p-2 bg-gray-200 rounded-lg h-fit">
            <form onSubmit={handleSubmit(onCreateColumn)} className="flex flex-col gap-2">
              <Input
                placeholder="Enter column title..."
                registration={register('title', { required: true })}
              />
              <Button type="submit" variant="secondary" className="flex items-center justify-center gap-2">
                <Plus size={16} /> Add Column
              </Button>
            </form>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      {showMembersModal && (
        <MembersModal onClose={() => setShowMembersModal(false)} />
      )}
      
      {selectedCard && (
        <CardDetailsModal 
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </DndContext>
  );
};

export default BoardPage;