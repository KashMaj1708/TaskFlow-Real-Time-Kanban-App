import { useEffect } from 'react';
import { socket, connectSocket, disconnectSocket } from '../services/socket';
import { useAuthStore } from '../store/authStore';
import { useBoardStore } from '../store/boardStore';
import { type Card, type Column } from '../types';

export const useSocket = (boardId: string) => {
  // Get all the actions from our board store
  const {
    addColumn,
    deleteColumn,
    addCard,
    deleteCard,
    handleSocketCardUpdate,
    handleSocketColumnUpdate,
    handleSocketColumnMove,
    handleSocketCardMove,
  } = useBoardStore((state) => ({
    addColumn: state.addColumn,
    deleteColumn: state.deleteColumn,
    addCard: state.addCard,
    deleteCard: state.deleteCard,
    handleSocketCardUpdate: state.handleSocketCardUpdate,
    handleSocketColumnUpdate: state.handleSocketColumnUpdate,
    handleSocketColumnMove: state.handleSocketColumnMove,
    handleSocketCardMove: state.handleSocketCardMove,
  }));
  
  // Get the current user's ID
  const userId = useAuthStore((state) => state.user?.id);

  useEffect(() => {
    // 1. Connect the socket
    connectSocket();

    // 2. Join the board room
    socket.emit('board:join', boardId);
    console.log(`Socket: Joining room board:${boardId}`);

    // 3. Define all event handlers
    const onColumnCreated = (column: Column) => {
      console.log('Socket: Received column:created', column);
      addColumn(column);
    };
    
    const onColumnDeleted = ({ columnId }: { columnId: number }) => {
      console.log('Socket: Received column:deleted', columnId);
      deleteColumn(columnId);
    };

    const onCardCreated = (card: Card) => {
      console.log('Socket: Received card:created', card);
      addCard(card);
    };
    
    const onCardDeleted = ({ cardId, columnId }: { cardId: number; columnId: number }) => {
      console.log('Socket: Received card:deleted', cardId);
      deleteCard(cardId, columnId);
    };

    // --- Handlers for events we added in this phase ---
    const onColumnUpdated = (column: { id: number; title: string }) => {
      console.log('Socket: Received column:updated', column);
      handleSocketColumnUpdate(column);
    };

    const onCardUpdated = (card: Card) => {
      console.log('Socket: Received card:updated', card);
      handleSocketCardUpdate(card);
    };
    
    const onColumnMoved = (data: { columnId: number; newPosition: number; movedBy: number }) => {
        console.log('Socket: Received column:moved', data);
        // We removed the check. The store is now idempotent.
        handleSocketColumnMove(data.columnId, data.newPosition);
      };
      
      const onCardMoved = (data: { cardId: number; newColumnId: number; newPosition: number; oldColumnId: number; movedBy: number }) => {
        console.log('Socket: Received card:moved', data);
        // We removed the check. The store is now idempotent.
        handleSocketCardMove(data.cardId, data.newColumnId, data.newPosition, data.oldColumnId);
      };
    // 4. Register all listeners
    socket.on('column:created', onColumnCreated);
    socket.on('column:deleted', onColumnDeleted);
    socket.on('card:created', onCardCreated);
    socket.on('card:deleted', onCardDeleted);
    socket.on('column:updated', onColumnUpdated);
    socket.on('card:updated', onCardUpdated);
    socket.on('column:moved', onColumnMoved);
    socket.on('card:moved', onCardMoved);
    
    // 5. Cleanup on unmount
    return () => {
      console.log(`Socket: Leaving room board:${boardId}`);
      socket.emit('board:leave', boardId);
      
      // Remove all listeners
      socket.off('column:created', onColumnCreated);
      socket.off('column:deleted', onColumnDeleted);
      socket.off('card:created', onCardCreated);
      socket.off('card:deleted', onCardDeleted);
      socket.off('column:updated', onColumnUpdated);
      socket.off('card:updated', onCardUpdated);
      socket.off('column:moved', onColumnMoved);
      socket.off('card:moved', onCardMoved);

      // We'll leave the main connection open
      // disconnectSocket(); 
    };
  }, [boardId, userId, addColumn, deleteColumn, addCard, deleteCard, handleSocketCardUpdate, handleSocketColumnUpdate, handleSocketColumnMove, handleSocketCardMove]);
};