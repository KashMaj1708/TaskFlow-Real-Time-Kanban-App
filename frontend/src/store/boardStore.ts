import create from 'zustand';
import { type Board, type Column, type Card, type BoardMember } from '../types';

// Helper function for reordering (immutable)
const reorder = (list: any[], startIndex: number, endIndex: number) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

interface BoardState {
  boards: Board[];
  setBoards: (boards: Board[]) => void;
  addBoard: (board: Board) => void;

  activeBoard: Board | null;
  setActiveBoard: (board: Board) => void;
  
  addColumn: (column: Column) => void;
  deleteColumn: (columnId: number) => void;

  addCard: (card: Card) => void;
  deleteCard: (cardId: number, columnId: number) => void;
  addMember: (member: BoardMember) => void;
  removeMember: (userId: number) => void;
  moveColumn: (dragIndex: number, hoverIndex: number) => void;
  moveCard: (
    cardId: number,
    startColumnId: number,
    endColumnId: number,
    dragIndex: number,
    hoverIndex: number
  ) => void;

  handleSocketCardUpdate: (card: Card) => void;
  handleSocketColumnUpdate: (column: { id: number; title: string }) => void;
  
  // Actions for move events
  handleSocketColumnMove: (columnId: number, newPosition: number) => void;
  handleSocketCardMove: (
    cardId: number,
    newColumnId: number,
    newPosition: number,
    oldColumnId: number
  ) => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  boards: [],
  setBoards: (boards) => set({ boards }),
  addBoard: (board) => set((state) => ({ boards: [...state.boards, board] })),

  activeBoard: null,
  setActiveBoard: (board) => set({ activeBoard: board }),
  
  addColumn: (column) => set((state) => {
    if (!state.activeBoard) return {};
    const columnExists = state.activeBoard.columns.some(c => c.id === column.id);
    if (columnExists) return {};
    const newColumn = { ...column, cards: column.cards || [] };
    const newColumns = [...state.activeBoard.columns, newColumn];
    return {
      activeBoard: { ...state.activeBoard, columns: newColumns }
    };
  }),

  deleteColumn: (columnId) => set((state) => {
    if (!state.activeBoard) return {};
    return {
      activeBoard: {
        ...state.activeBoard,
        columns: state.activeBoard.columns.filter(c => c.id !== columnId)
      }
    };
  }),
  
  addCard: (card) => set((state) => {
    if (!state.activeBoard) return {};
    
    const newColumns = state.activeBoard.columns.map(col => {
      if (col.id === card.column_id) {
        
        // Declare 'cards' ONCE
        const cards = col.cards || []; 
        
        // Check for existence
        const cardExists = cards.some(c => c.id === card.id);
        if (cardExists) return { ...col }; // Already exists, do nothing
        
        // Add the new card
        return { ...col, cards: [...cards, card] };
      }
      return col;
    });
    return {
      activeBoard: { ...state.activeBoard, columns: newColumns }
    };
  }),

  deleteCard: (cardId, columnId) => set((state) => {
    if (!state.activeBoard) return {};
    const newColumns = state.activeBoard.columns.map(col => {
      if (col.id === columnId) {
        return { ...col, cards: (col.cards || []).filter(card => card.id !== cardId) };
      }
      return col;
    });
    return { activeBoard: { ...state.activeBoard, columns: newColumns } };
  }),
  addMember: (member) => set((state) => {
    if (!state.activeBoard) return {};
    // Prevent duplicates
    if (state.activeBoard.members.some(m => m.id === member.id)) {
      return state;
    }
    const newMembers = [...state.activeBoard.members, member];
    return {
      activeBoard: { ...state.activeBoard, members: newMembers }
    };
  }),
  
  removeMember: (userId) => set((state) => {
    if (!state.activeBoard) return {};
    const newMembers = state.activeBoard.members.filter(m => m.id !== userId);
    return {
      activeBoard: { ...state.activeBoard, members: newMembers }
    };
  }),
  moveColumn: (dragIndex, hoverIndex) => set((state) => {
    if (!state.activeBoard) return {};
    
    const reorderedColumns = reorder(
      state.activeBoard.columns,
      dragIndex,
      hoverIndex
    );
    
    return {
      activeBoard: {
        ...state.activeBoard,
        columns: reorderedColumns.map((col, index) => ({ ...col, position: index })),
      },
    };
  }),

  // --- THIS IS THE CORRECTED IMMUTABLE FUNCTION ---
  moveCard: (cardId, startColumnId, endColumnId, dragIndex, hoverIndex) => set((state) => {
    if (!state.activeBoard) return {};

    // Moving within the same column
    if (startColumnId === endColumnId) {
      const newColumns = state.activeBoard.columns.map(col => {
        if (col.id === startColumnId) {
          const reorderedCards = reorder(col.cards, dragIndex, hoverIndex)
                                .map((card, index) => ({ ...card, position: index }));
          return { ...col, cards: reorderedCards };
        }
        return col;
      });
      return { activeBoard: { ...state.activeBoard, columns: newColumns } };
    }

    // Moving to a different column
    let movedCard: Card | undefined;
    const tempColumns = state.activeBoard.columns.map(col => {
      if (col.id === startColumnId) {
        // Create new array for start column without the moved card
        const newCards = col.cards.filter(card => card.id !== cardId);
        movedCard = col.cards.find(card => card.id === cardId);
        return { ...col, cards: newCards };
      }
      return col;
    });

    if (!movedCard) return {}; // Card not found, something went wrong

    const finalColumns = tempColumns.map(col => {
      if (col.id === endColumnId) {
        // Create new array for end column with the moved card
        const newCards = Array.from(col.cards || []);
        newCards.splice(hoverIndex, 0, { ...movedCard!, column_id: endColumnId });
        return { ...col, cards: newCards };
      }
      return col;
    });

    // Finally, re-assign positions for both affected columns
    const finalColumnsWithPositions = finalColumns.map(col => {
      if (col.id === startColumnId || col.id === endColumnId) {
        return {
          ...col,
          cards: col.cards.map((card, index) => ({ ...card, position: index }))
        };
      }
      return col;
    });

    return { activeBoard: { ...state.activeBoard, columns: finalColumnsWithPositions } };
  }),
  handleSocketCardUpdate: (updatedCard) => set((state) => {
    if (!state.activeBoard) return {};
    const newColumns = state.activeBoard.columns.map(col => {
      if (col.id === updatedCard.column_id) {
        return {
          ...col,
          cards: col.cards.map(card => card.id === updatedCard.id ? updatedCard : card)
        };
      }
      return col;
    });
    return { activeBoard: { ...state.activeBoard, columns: newColumns } };
  }),

  handleSocketColumnUpdate: (updatedColumn) => set((state) => {
    if (!state.activeBoard) return {};
    const newColumns = state.activeBoard.columns.map(col =>
      col.id === updatedColumn.id ? { ...col, title: updatedColumn.title } : col
    );
    return { activeBoard: { ...state.activeBoard, columns: newColumns } };
  }),

  handleSocketColumnMove: (columnId, newPosition) => set((state) => {
    if (!state.activeBoard) return {};
    
    const movedColumn = state.activeBoard.columns.find(c => c.id === columnId);
    if (!movedColumn) return {};

    const otherColumns = state.activeBoard.columns.filter(c => c.id !== columnId);
    otherColumns.splice(newPosition, 0, { ...movedColumn, position: newPosition });
    
    // Re-assign positions based on new array order
    const reorderedColumns = otherColumns.map((col, index) => ({ ...col, position: index }));

    return {
      activeBoard: { ...state.activeBoard, columns: reorderedColumns }
    };
  }),
  
  handleSocketCardMove: (cardId, newColumnId, newPosition, oldColumnId) => set((state) => {
    if (!state.activeBoard) return {};

    // Find the card and remove it from its old column
    let movedCard: Card | undefined;
    const tempColumns = state.activeBoard.columns.map(col => {
      if (col.id === oldColumnId) {
        movedCard = col.cards.find(c => c.id === cardId);
        return { ...col, cards: col.cards.filter(c => c.id !== cardId) };
      }
      return col;
    });

    if (!movedCard) return {}; // Card not found, or already moved

    // Add card to new column at new position
    const finalColumns = tempColumns.map(col => {
      if (col.id === newColumnId) {
        const newCards = Array.from(col.cards || []);
        newCards.splice(newPosition, 0, { ...movedCard!, column_id: newColumnId, position: newPosition });
        return { ...col, cards: newCards };
      }
      return col;
    });

    // Re-normalize positions for both affected columns
    const finalColumnsWithPositions = finalColumns.map(col => {
      if (col.id === oldColumnId || col.id === newColumnId) {
        return {
          ...col,
          cards: col.cards.map((card, index) => ({ ...card, position: index }))
        };
      }
      return col;
    });
    
    return { activeBoard: { ...state.activeBoard, columns: finalColumnsWithPositions } };
  }),
}));