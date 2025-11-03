import { Response } from 'express';
import pool from '../db';
import { AuthRequest } from '../utils/types';
import { io } from '../server';
/**
 * @route   POST /api/columns/:columnId/cards
 * @desc    Create a new card in a column
 */
export const createCard = async (req: AuthRequest, res: Response) => {
  const { columnId } = req.params;
  const { title } = req.body;
  const created_by = req.user?.userId;

  try {
    // Get the highest current position in this column
    const maxPos = await pool.query(
      "SELECT MAX(position) as max_pos FROM cards WHERE column_id = $1",
      [columnId]
    );
    const newPosition = (maxPos.rows[0].max_pos || 0) + 1;

    // Insert new card
    const newCard = await pool.query(
      "INSERT INTO cards (column_id, title, position, created_by) VALUES ($1, $2, $3, $4) RETURNING id, title, position, column_id, created_by, created_at",
      [columnId, title, newPosition, created_by]
    );
    
    const cardData = newCard.rows[0];
    const boardId = (req as any).boardId;
    // We'll add socket.io emit here in Phase 4
    // const boardId = (req as any).boardId;
    // io.to(boardId).emit('card:created', cardData);
    // Format card object to match what frontend state expects
    const eventData = {
      ...cardData,
      description: null,
      due_date: null,
      labels: [],
      assigned_user: null // New cards don't have assignees
    };
    const roomId = `board:${boardId}`;
    io.to(roomId).emit('card:created', eventData);

    res.status(201).json({
      success: true,
      data: cardData,
    });
  } catch (err) {
    console.error('CreateCard Error:', (err as Error).message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @route   PUT /api/cards/:cardId
 * @desc    Update a card's details
 */
export const updateCard = async (req: AuthRequest, res: Response) => {
  const { cardId } = req.params;
  const { title, description, due_date, labels, assigned_user_id } = req.body;
  const boardId = (req as any).boardId;
  try {
    // Get current card data to selectively update
    const currentCard = await pool.query("SELECT * FROM cards WHERE id = $1", [cardId]);
    if (currentCard.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }
    const card = currentCard.rows[0];

    // Build update query
    const updatedCard = await pool.query(
      `UPDATE cards SET 
         title = $1, 
         description = $2, 
         due_date = $3, 
         labels = $4,
         assigned_user_id = $5,
         updated_at = CURRENT_TIMESTAMP 
       WHERE id = $6 
       RETURNING *`,
       [
        title ?? card.title,
        description ?? card.description,
        due_date, // Can be null
        JSON.stringify(labels ?? card.labels), //
        assigned_user_id, // Can be null
        cardId
      ]
    );
    
    const cardData = updatedCard.rows[0];

    // Fetch assigned user details for the response
    let assigned_user = null;
    if (cardData.assigned_user_id) {
       const userRes = await pool.query("SELECT id, username, avatar_color FROM users WHERE id = $1", [cardData.assigned_user_id]);
       if(userRes.rows.length > 0) {
         assigned_user = userRes.rows[0];
       }
    }

    const responseData = {
      ...cardData,
      assigned_user: assigned_user
    };

    // We'll add socket.io emit here in Phase 4
    // const boardId = (req as any).boardId;
    // io.to(boardId).emit('card:updated', responseData);
    const roomId = `board:${boardId}`;
    io.to(roomId).emit('card:updated', responseData);
    res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (err) {
    console.error('UpdateCard Error:', (err as Error).message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @route   DELETE /api/cards/:cardId
 * @desc    Delete a card
 */
export const deleteCard = async (req: AuthRequest, res: Response) => {
  const { cardId } = req.params;
  const boardId = (req as any).boardId;
  try {
    const deletedCard = await pool.query(
      "DELETE FROM cards WHERE id = $1 RETURNING id, column_id",
      [cardId]
    );

    if (deletedCard.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }

    // We'll add socket.io emit here in Phase 4
    // const boardId = (req as any).boardId;
    // io.to(boardId).emit('card:deleted', { cardId: deletedCard.rows[0].id, columnId: deletedCard.rows[0].column_id });
    const eventData = {
      cardId: deletedCard.rows[0].id,
      columnId: deletedCard.rows[0].column_id,
    };
    const roomId = `board:${boardId}`;
    io.to(roomId).emit('card:deleted', eventData);
    res.status(200).json({
      success: true,
      message: 'Card deleted successfully',
    });
  } catch (err) {
    console.error('DeleteCard Error:', (err as Error).message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @route   GET /api/cards/:cardId
 * @desc    Get full card details (as per spec)
 */
export const getCardById = async (req: AuthRequest, res: Response) => {
  const { cardId } = req.params;

  try {
    const query = `
      SELECT
        ca.*,
        json_build_object('id', u_assign.id, 'username', u_assign.username, 'avatar_color', u_assign.avatar_color) as assigned_user,
        json_build_object('id', u_creator.id, 'username', u_creator.username) as creator
      FROM cards ca
      LEFT JOIN users u_assign ON u_assign.id = ca.assigned_user_id
      LEFT JOIN users u_creator ON u_creator.id = ca.created_by
      WHERE ca.id = $1
    `;
    const cardResult = await pool.query(query, [cardId]);

    if (cardResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }

    res.status(200).json({
      success: true,
      data: cardResult.rows[0],
    });
  } catch (err) {
    console.error('GetCardById Error:', (err as Error).message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
/**
 * @route   PUT /api/cards/:cardId/move
 * @desc    Move a card to a new position (and optionally new column)
 */
export const moveCard = async (req: AuthRequest, res: Response) => {
    const { cardId } = req.params;
    const { newColumnId, newPosition } = req.body;
    const movedBy = req.user?.userId;
    // boardId is attached by the checkCardPermission middleware
    const boardId = (req as any).boardId;
  
    const client = await pool.connect();
  
    try {
      await client.query('BEGIN');
  
      // Get the card's current column and position
      const cardRes = await client.query(
        "SELECT column_id, position FROM cards WHERE id = $1",
        [cardId]
      );
      if (cardRes.rows.length === 0) {
        throw new Error('Card not found');
      }
      const { column_id: oldColumnId, position: oldPosition } = cardRes.rows[0];
  
      // ---
      // STEP 1: Remove card from old position & update other cards in OLD column
      // ---
      await client.query(
        `UPDATE cards SET position = position - 1 
         WHERE column_id = $1 AND position > $2`,
        [oldColumnId, oldPosition]
      );
  
      // ---
      // STEP 2: Add card to new position & update other cards in NEW column
      // ---
      await client.query(
        `UPDATE cards SET position = position + 1 
         WHERE column_id = $1 AND position >= $2`,
        [newColumnId, newPosition]
      );
  
      // ---
      // STEP 3: Update the target card's column and position
      // ---
      const updatedCard = await client.query(
        `UPDATE cards SET column_id = $1, position = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $3 
         RETURNING id, column_id, position`,
        [newColumnId, newPosition, cardId]
      );
  
      await client.query('COMMIT');
  
      // We'll add socket.io emit here in Phase 4
      // io.to(boardId).emit('card:moved', {
      //   cardId: updatedCard.rows[0].id,
      //   oldColumnId: oldColumnId,
      //   newColumnId: updatedCard.rows[0].column_id,
      //   newPosition: updatedCard.rows[0].position,
      //   movedBy: req.user?.userId 
      // });
      const eventData = {
        cardId: updatedCard.rows[0].id,
        oldColumnId: oldColumnId,
        newColumnId: updatedCard.rows[0].column_id,
        newPosition: updatedCard.rows[0].position,
        movedBy: movedBy,
      };
      const roomId = `board:${boardId}`;
      io.to(roomId).emit('card:moved', eventData);
      res.status(200).json({
        success: true,
        data: updatedCard.rows[0],
      });
  
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('MoveCard Error:', (err as Error).message);
      res.status(500).json({ success: false, message: 'Server error' });
    } finally {
      client.release();
    }
  };