import { Request, Response } from 'express';
import db from '../db';

// --- CREATE CARD ---
export const createCard = async (req: Request, res: Response) => {
  try {
    const { columnId } = req.params;
    const { title } = req.body;

    // Get boardId for socket event
    const column = await db('columns').where({ id: columnId }).first();
    if (!column) {
      return res.status(404).json({ success: false, message: "Column not found" });
    }

    // Get max position
    const maxOrderResult = await db('cards')
      .where({ column_id: columnId })
      .max('position as maxOrder') // <-- This was already correct
      .first();
      
    const newOrder = maxOrderResult ? (maxOrderResult.maxOrder || 0) + 1 : 0;

    const [newCard] = await db('cards')
      .insert({
        column_id: columnId,
      //  board_id: column.board_id,
        title,
        position: newOrder, // <-- THIS IS THE FIX
        created_by: (req as any).user.id,
      })
      .returning('*');
      
    const cardWithDetails = await getCardWithDetails(newCard.id);

    // Socket event
    const io = req.app.get('io');
    io.to(`board:${column.board_id}`).emit('card:created', cardWithDetails);

    res.status(201).json({ success: true, data: cardWithDetails });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error creating card' });
  }
};

// --- UPDATE CARD ---
export const updateCard = async (req: Request, res: Response) => {
  try {
    const { cardId } = req.params;
    const { title, description, due_date, assigned_user_id } = req.body;
    const { id: userId } = (req as any).user!;

    const updateData: {
      title?: string;
      description?: string;
      due_date?: string | null;
      assigned_user_id?: number | null;
    } = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (due_date !== undefined) updateData.due_date = due_date;
    if (assigned_user_id !== undefined) updateData.assigned_user_id = assigned_user_id;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: "No update fields provided." });
    }

    const [updatedCard] = await db('cards')
      .where({ id: cardId })
      .update(updateData)
      .returning('*');

    if (!updatedCard) {
      return res.status(404).json({ success: false, message: "Card not found" });
    }

    const cardWithDetails = await getCardWithDetails(updatedCard.id);
    const io = req.app.get('io');
    io.to(`board:${cardWithDetails.board_id}`).emit('card:updated', cardWithDetails);

    res.json({ success: true, data: cardWithDetails });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error updating card" });
  }
};

// --- DELETE CARD ---
export const deleteCard = async (req: Request, res: Response) => {
  try {
    const { cardId } = req.params;

    const [card] = await db('cards').where({ id: cardId }).returning('*');
    if (!card) {
      return res.status(404).json({ success: false, message: "Card not found" });
    }

    await db('cards').where({ id: cardId }).del();

    // Socket event
    const io = req.app.get('io');
    io.to(`board:${card.board_id}`).emit('card:deleted', { cardId, columnId: card.column_id });

    res.json({ success: true, message: 'Card deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error deleting card' });
  }
};

// --- HELPER FUNCTION ---
export const getCardWithDetails = async (cardId: number) => {
  const [card] = await db('cards')
    .where('cards.id', cardId)
    .select(
      'cards.*',
      'columns.board_id', // <-- ADD THIS
      'users.username as assigned_username',
      'users.avatar_color as assigned_avatar_color'
    )
    .leftJoin('columns', 'cards.column_id', 'columns.id') // <-- ADD THIS JOIN
    .leftJoin('users', 'cards.assigned_user_id', 'users.id');

  if (!card) return null;

  // Labels are stored as JSONB on the card (schema: cards.labels), not in separate tables
  let labels: { id?: number; text?: string; color?: string }[] = [];
  if (Array.isArray(card.labels)) {
    labels = card.labels;
  } else if (typeof card.labels === 'string') {
    try {
      labels = JSON.parse(card.labels) || [];
    } catch {
      labels = [];
    }
  }

  const assigned_user = card.assigned_user_id
    ? {
        id: card.assigned_user_id,
        username: card.assigned_username,
        avatar_color: card.assigned_avatar_color,
      }
    : null;

  delete card.assigned_username;
  delete card.assigned_avatar_color;

  return {
    ...card,
    labels,
    assigned_user,
  };
};