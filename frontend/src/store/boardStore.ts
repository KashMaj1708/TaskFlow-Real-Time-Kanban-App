import create from 'zustand';
import { type Board, type Column, type Card, type BoardMember } from '../types';
import { api } from '../services/api';
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
  
  // --- THIS IS THE FIX ---
  syncMovedColumn: (updatedColumns: { id: number; position: number }[]) => void;
  syncMovedCard: (
    updatedCards: { id: number; position: number; column_id: number }[]
  ) => void;
  // --- END FIX ---
  
  updateCard: (updatedCard: Card) => void;
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
    const columnOrderPayload = reorderedColumns.map(col => ({
      id: col.id,
      order: col.position, // We use 'order' for the API
    }));
    console.log("SYNC: Firing moveColumn API call", columnOrderPayload); // <-- ADD THIS LOG
    api.put(
      `/api/columns/board/${state.activeBoard.id}/order`,
      { columns: columnOrderPayload }
    ).catch(err => console.error("Failed to sync column move", err));
    
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

    let finalColumnsWithPositions: Column[];

    // Case 1: Moving within the same column
    if (startColumnId === endColumnId) {
      finalColumnsWithPositions = state.activeBoard.columns.map(col => {
        if (col.id === startColumnId) {
          const reorderedCards = reorder(col.cards, dragIndex, hoverIndex)
            .map((card, index) => ({ ...card, position: index }));
          return { ...col, cards: reorderedCards };
        }
        return col;
      });
    }
    // Case 2: Moving to a different column
    else {
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
      finalColumnsWithPositions = finalColumns.map(col => {
        if (col.id === startColumnId || col.id === endColumnId) {
          return {
            ...col,
            cards: col.cards.map((card, index) => ({ ...card, position: index }))
          };
        }
        return col;
      });
    }

    // --- THIS IS THE UPDATED PART ---

    // 1. Create the new state object
    const finalState = {
      activeBoard: { ...state.activeBoard, columns: finalColumnsWithPositions }
    };

    // 2. Build the API payload from the new state
    const affectedCards: { id: number, order: number, column_id: number }[] = [];
    
    finalState.activeBoard.columns.forEach(col => {
      // Only check the columns that were actually changed
      if (col.id === startColumnId || col.id === endColumnId) {
        col.cards.forEach(card => {
          affectedCards.push({
            id: card.id,
            order: card.position,
            column_id: card.column_id,
          });
        });
      }
    });
    
    // 3. Fire the API call
    if (affectedCards.length > 0) {
      console.log("SYNC: Firing moveCard API call", affectedCards); // <-- ADD THIS LOG
      api.put(
        `/api/columns/board/${state.activeBoard.id}/cards/order`,
        { cards: affectedCards }
      ).catch(err => console.error("Failed to sync card move", err));
    }
    // --- END UPDATED PART ---

    // 4. Return the new state
    return finalState;
  }),

  syncMovedColumn: (updatedColumns: { id: number, position: number }[]) => {
    set(state => {
      if (!state.activeBoard) return {};
  
      // Create a map of new positions for quick lookup
      const positionMap = new Map(updatedColumns.map(c => [c.id, c.position]));
  
      // Update the position of each column based on the map
      const newColumns = state.activeBoard.columns.map(col => {
        const newPosition = positionMap.get(col.id);
        if (newPosition !== undefined) {
          return { ...col, position: newPosition };
        }
        return col;
      });
  
      // Sort by the new position
      newColumns.sort((a, b) => a.position - b.position);
  
      return {
        activeBoard: {
          ...state.activeBoard,
          columns: newColumns
        }
      };
    });
  },
  
  syncMovedCard: (updatedCards: { id: number, position: number, column_id: number }[]) => {
    set(state => {
      if (!state.activeBoard) return {};
  
      const cardUpdateMap = new Map(updatedCards.map(c => [c.id, c]));
  
      // 1. Create a "pool" of all cards that are moving.
      const movingCards: Card[] = [];
      
      // 2. Create new columns, removing all moving cards from them.
      let newColumns = state.activeBoard.columns.map(col => {
        const remainingCards = col.cards.filter(card => {
          if (cardUpdateMap.has(card.id)) {
            // This card is moving. Update it and add to the pool.
            const update = cardUpdateMap.get(card.id)!;
            movingCards.push({ ...card, ...update });
            return false; // Remove from this column
          }
          return true; // Keep in this column
        });
        return { ...col, cards: remainingCards };
      });
  
      // 3. Re-insert all moving cards into their *new* columns.
      for (const card of movingCards) {
        const targetColumn = newColumns.find(c => c.id === card.column_id);
        if (targetColumn) {
          targetColumn.cards.push(card);
        }
      }
  
      // 4. Sort all columns by card position.
      newColumns.forEach(col => {
        col.cards.sort((a, b) => a.position - b.position);
      });
  
      return {
        activeBoard: {
          ...state.activeBoard,
          columns: newColumns
        }
      };
    });
  },

  updateCard: (updatedCard) => set((state) => {
    if (!state.activeBoard) return {};
  
    const newColumns = state.activeBoard.columns.map(col => {
      // Find the column that this card belongs to
      if (col.id === updatedCard.column_id) {
        // Map over its cards and replace the old one
        const newCards = col.cards.map(card => 
          card.id === updatedCard.id ? updatedCard : card
        );
        return { ...col, cards: newCards };
      }
      return col;
    });
  
    return {
      activeBoard: { ...state.activeBoard, columns: newColumns }
    };
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