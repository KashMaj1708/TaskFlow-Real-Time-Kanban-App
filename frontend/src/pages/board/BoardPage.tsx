import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useBoardStore } from '../../store/boardStore';
import Column from './Column';
import { useForm } from 'react-hook-form';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { ArrowLeft, Plus, Users, LayoutDashboard, Filter } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../../components/ui/Avatar';
import CardDetailsModal from '../../components/board/CardDetailsModal';
// --- DND IMPORTS ---
import {
  DndContext,
  closestCorners,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
// --- END DND IMPORTS ---

// --- Socket & Modal Imports ---
import { getSocket, connectSocket, disconnectSocket } from '../../services/socketService'; 
import { type BoardMember, type Column as ColumnType, type Card } from '../../types';
import MembersModal from '../../components/board/MembersModal';
// --- End Socket & Modal Imports ---

type CreateColumnForm = {
  title: string;
};

// Type guard for our draggable items
type ActiveDragType = {
  type: 'Column' | 'Card';
  id: number;
  data: {
    columnId?: number;
    [key: string]: any;
  };
};

const BoardPage = () => {
  const { user, logout } = useAuth(); 
  const { boardId } = useParams<{ boardId: string }>();

  // --- Store actions ---
  const {
    activeBoard,
    setActiveBoard,
    moveColumn,
    moveCard,
    // Socket actions:
    addCard,
    updateCardInStore, 
    removeCard,
    addColumn,
    removeColumn,
    addMember,
    syncMovedColumn,
    syncMovedCard,
  } = useBoardStore((state) => ({
    activeBoard: state.activeBoard,
    setActiveBoard: state.setActiveBoard,
    moveColumn: state.moveColumn,
    moveCard: state.moveCard,
    addCard: state.addCard,
    updateCardInStore: state.updateCard, 
    removeCard: state.deleteCard,       
    addColumn: state.addColumn,
    removeColumn: state.deleteColumn,      
    addMember: state.addMember,
    syncMovedColumn: state.syncMovedColumn,
    syncMovedCard: state.syncMovedCard,
  }));
  // --- End Store actions ---

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDrag, setActiveDrag] = useState<ActiveDragType | null>(null);

  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const { register, handleSubmit, reset } = useForm<CreateColumnForm>();

  // DND Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
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
          const boardData = response.data;
          // Sort on initial load
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

  // --- Socket useEffect ---
  useEffect(() => {
    if (!boardId) return;

    const socket = getSocket(); 

    // 1. Define event handlers
    const onConnect = () => {
      console.log('Socket successfully connected, joining room...');
      socket.emit('join:board', boardId); 
    };

    const onCardCreated = (newCard: Card) => addCard(newCard);
    const onCardUpdated = (updatedCard: Card) => updateCardInStore(updatedCard);
    const onCardDeleted = ({ cardId, columnId }: { cardId: number; columnId: number }) => removeCard(cardId, columnId);
    const onColumnCreated = (newColumn: ColumnType) => addColumn(newColumn);
    const onColumnDeleted = ({ columnId }: { columnId: number }) => removeColumn(columnId);
    const onMemberJoined = (newMember: BoardMember) => addMember(newMember);
    
    const onColumnMoved = ({ columns, movedBy }: { columns: { id: number, order: number }[], movedBy: number }) => {
      if (movedBy === user?.id) return; // Ignore our own events
      const columnPayload = columns.map(c => ({ id: c.id, position: c.order }));
      syncMovedColumn(columnPayload);
    };
    const onCardMoved = ({ cards, movedBy }: { cards: { id: number, order: number, column_id: number }[], movedBy: number }) => {
       if (movedBy === user?.id) return; // Ignore our own events
      const cardPayload = cards.map(c => ({ id: c.id, position: c.order, column_id: c.column_id }));
      syncMovedCard(cardPayload);
    };

    // 2. Attach listeners
    socket.on('connect', onConnect); 
    socket.on('card:created', onCardCreated);
    socket.on('card:updated', onCardUpdated);
    socket.on('card:deleted', onCardDeleted);
    socket.on('column:created', onColumnCreated);
    socket.on('column:deleted', onColumnDeleted);
    socket.on('member:joined', onMemberJoined);
    socket.on('column:moved', onColumnMoved);
    socket.on('card:moved', onCardMoved);

    // 3. Connect (this will start the auth process)
    connectSocket();

    // 4. Cleanup function
    return () => {
      console.log('Cleaning up socket listeners and disconnecting...');
      socket.emit('leave:board', boardId); 
      
      socket.off('connect', onConnect); 
      socket.off('card:created', onCardCreated);
      socket.off('card:updated', onCardUpdated);
      socket.off('card:deleted', onCardDeleted);
      socket.off('column:created', onColumnCreated);
      socket.off('column:deleted', onColumnDeleted);
      socket.off('member:joined', onMemberJoined);
      socket.off('column:moved', onColumnMoved);
      socket.off('card:moved', onCardMoved);

      disconnectSocket();
    };
  }, [
      boardId, addCard, updateCardInStore, removeCard, addColumn, 
      removeColumn, addMember, syncMovedColumn, syncMovedCard, user?.id // Added user
    ]);
  // --- END SOCKET useEffect ---

  // Create Column
  const onCreateColumn = async (data: CreateColumnForm) => {
    if (!boardId) return;
    try {
      await api.post(`/api/columns/board/${boardId}`, { title: data.title });
      reset();
    } catch (error) {
      console.error('Failed to create column:', error);
    }
  };

  // --- DND HANDLERS (WITH DEBUG LOGS) ---
  const handleDragStart = (event: DragStartEvent) => {
    // --- DEBUG ---
    console.log('[DragStart] Fired');
    console.log('[DragStart] Active element data:', event.active.data.current);
    // --- END DEBUG ---
    
    const { active } = event;
    setActiveDrag({
      type: active.data.current?.type,
      id: Number(active.id),
      data: active.data.current || {},
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    // --- DEBUG ---
    console.log('[DragEnd] Fired');
    // --- END DEBUG ---
    
    const { active, over } = event;

    if (!over || !activeDrag || !boardId) {
      // --- DEBUG ---
      console.log('[DragEnd] Exiting early: "over" or "activeDrag" or "boardId" is missing.');
      console.log({ over, activeDrag, boardId });
      // --- END DEBUG ---
      setActiveDrag(null);
      return;
    }

    const activeId = active.id as number;
    const overId = over.id as number;
    
    // --- COLUMN DRAG END ---
    if (activeDrag.type === 'Column' && activeId !== overId) {
      // --- DEBUG ---
      console.log('[DragEnd] Drag type is Column');
      // --- END DEBUG ---
      
      const oldIndex = activeBoard?.columns.findIndex(c => c.id === activeId) ?? 0;
      const newIndex = activeBoard?.columns.findIndex(c => c.id === overId) ?? 0;
      moveColumn(oldIndex, newIndex); 
      
      const updatedColumns = useBoardStore.getState().activeBoard?.columns.map((col, index) => ({
        id: col.id,
        order: index, 
      }));

      if (updatedColumns) {
        // --- DEBUG ---
        console.log('[DragEnd] Sending COLUMN update API request:', updatedColumns);
        // --- END DEBUG ---
        api.put(`/api/columns/board/${boardId}/order`, { columns: updatedColumns })
          .catch(err => console.error("Failed to save column move:", err));
      }
    }

    // --- CARD DRAG END ---
    if (activeDrag.type === 'Card') {
      // --- DEBUG ---
      console.log('[DragEnd] Drag type is Card');
      // --- END DEBUG ---
      
      const startColumnId = activeDrag.data.columnId;
      const overIsCard = over.data.current?.type === 'Card';
      const overIsColumn = over.data.current?.type === 'Column';
      
      let endColumnId: number;
      let newIndex: number;

      if (overIsColumn) {
        endColumnId = overId;
        const endColCards = activeBoard?.columns.find(c => c.id === endColumnId)?.cards;
        newIndex = endColCards ? endColCards.length : 0;
      } else if (overIsCard) {
        endColumnId = over.data.current?.columnId;
        newIndex = activeBoard?.columns.find(c => c.id === endColumnId)?.cards.findIndex(c => c.id === overId) ?? 0;
      } else {
        // --- DEBUG ---
        console.log('[DragEnd] Exiting: "over" is not a Card or Column.');
        // --- END DEBUG ---
        setActiveDrag(null);
        return;
      }
      
      if (startColumnId === undefined) {
        // --- DEBUG ---
        console.error("[DragEnd] CRITICAL ERROR: startColumnId is undefined. Drag data:", activeDrag.data);
        // --- END DEBUG ---
        setActiveDrag(null);
        return;
      }
      
      const oldIndex = activeBoard?.columns
        .find(c => c.id === startColumnId)
        ?.cards.findIndex(c => c.id === activeId) ?? 0;

      moveCard(activeId, startColumnId, endColumnId, oldIndex, newIndex);

      const { activeBoard: newActiveBoard } = useBoardStore.getState();
      const startCol = newActiveBoard?.columns.find(c => c.id === startColumnId);
      const endCol = newActiveBoard?.columns.find(c => c.id === endColumnId);
      
      const cardUpdates: { id: number, order: number, column_id: number }[] = [];
      if (endCol) {
        cardUpdates.push(...endCol.cards.map((card, index) => ({
          id: card.id,
          order: index,
          column_id: endCol.id,
        })));
      }
      if (startCol && startColumnId !== endColumnId) {
        cardUpdates.push(...startCol.cards.map((card, index) => ({
          id: card.id,
          order: index,
          column_id: startCol.id,
        })));
      }
      
      // --- DEBUG ---
      console.log('[DragEnd] Card updates to be sent:', cardUpdates);
      // --- END DEBUG ---
      
      if (cardUpdates.length > 0) {
        // --- DEBUG ---
        console.log('[DragEnd] Sending CARD update API request...');
        // --- END DEBUG ---
        api.put(`/api/columns/board/${boardId}/cards/order`, { cards: cardUpdates })
          .catch(err => console.error("Failed to save card move:", err));
      } else {
        // --- DEBUG ---
        console.log('[DragEnd] No card updates to send.');
        // --- END DEBUG ---
      }
    }

    setActiveDrag(null);
  };
  // --- END DND HANDLERS ---

  if (loading) return <div className="p-8 text-center">Loading Board...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!activeBoard) return <div className="p-8 text-center">Board not found.</div>;
  
  const sortedColumns = activeBoard.columns;
  const columnIds = sortedColumns.map(col => col.id);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-screen p-4 gap-4 text-neutral-900">
        
        {/* Board Header */}
        <div className="flex-shrink-0 flex justify-between items-center px-4">
          {/* Left Side */}
          <div className="flex items-center gap-2">
            <Link to="/" className="text-neutral-400 hover:text-gray-700" title="Back to Dashboard">
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
          
          {/* --- THIS IS THE UPDATED RIGHT SIDE --- */}
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

            {/* Added Auth Controls */}
            <span className="text-gray-400">|</span>
            <Button variant="secondary" size="sm" onClick={logout}>
              Log Out
            </Button>
            <Avatar user={user!} size="md" />
            
          </div>
          {/* --- END UPDATED RIGHT SIDE --- */}
          
        </div>

        {/* Board Canvas (Scrollable) */}
        <div className="flex-grow flex gap-4 overflow-x-auto pb-4">
          <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
            {sortedColumns.map((col) => (
              <Column 
                key={col.id} 
                column={col} 
                onCardClick={(card) => {
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
          cardId={selectedCard.id}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </DndContext>
  );
};

export default BoardPage;