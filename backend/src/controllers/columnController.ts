import { Request, Response } from 'express';
import db from '../db';
import { getCardWithDetails } from './cardController'; // Import helper

export const createColumn = async (req: Request, res: Response) => {
  try {
    const { boardId } = req.params;
    const { title } = req.body;

    // Get the max position for this board
    const maxOrderResult = await db('columns')
      .where({ board_id: boardId })
      .max('position as maxOrder') // <-- FIXED
      .first();
      
    const newOrder = maxOrderResult ? (maxOrderResult.maxOrder || 0) + 1 : 0;

    const [newColumn] = await db('columns')
      .insert({
        board_id: boardId,
        title,
        position: newOrder, // <-- FIXED
      })
      .returning('*');
      
    const columnWithCards = { ...newColumn, cards: [] };

    // Socket event
    const io = req.app.get('io');
    io.to(`board:${boardId}`).emit('column:created', columnWithCards);

    res.status(201).json({ success: true, data: columnWithCards });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error creating column' });
  }
};

export const deleteColumn = async (req: Request, res: Response) => {
  try {
    const { columnId } = req.params;

    // We need the boardId for the socket event
    const column = await db('columns').where({ id: columnId }).first();
    if (!column) {
      return res.status(404).json({ success: false, message: 'Column not found' });
    }

    await db('columns').where({ id: columnId }).del();

    // Socket event
    const io = req.app.get('io');
    io.to(`board:${column.board_id}`).emit('column:deleted', { columnId });

    res.json({ success: true, message: 'Column deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error deleting column' });
  }
};

export const updateColumnOrder = async (req: Request, res: Response) => {
  try {
    const { boardId } = req.params;
    const { columns } = req.body; // Expects an array of { id: number, order: number }

    await db.transaction(async (trx) => {
      for (const col of columns) {
        await trx('columns')
          .where({ id: col.id, board_id: boardId })
          .update({ position: col.order }); // <-- FIXED
      }
    });

    res.json({ success: true, message: 'Column order updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error updating column order' });
  }
};

// We also need to add getCardWithDetails to cardController exports
// and update updateCardOrder
export const updateCardOrder = async (req: Request, res: Response) => {
  try {
    const { boardId } = req.params;
    const { cards } = req.body; // Expects array of { id: number, order: number, column_id: number }

    await db.transaction(async (trx) => {
      for (const card of cards) {
        await trx('cards')
          .where({ id: card.id })
          .update({
            position: card.order, // <-- FIXED
            column_id: card.column_id,
          });
      }
    });
    
    res.json({ success: true, message: 'Card order updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error updating card order' });
  }
};