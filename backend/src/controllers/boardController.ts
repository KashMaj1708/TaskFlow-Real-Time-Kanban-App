import { Request, Response } from 'express';
import db from '../db';
import { getCardWithDetails } from './cardController'; // We need to import this

export const getBoards = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    const boards = await db('boards')
      .join('board_members', 'boards.id', 'board_members.board_id')
      .where('board_members.user_id', userId)
      .select('boards.*');
      
    res.json({ success: true, data: boards });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getBoardById = async (req: Request, res: Response) => {
  try {
    const { boardId } = req.params;
    
    // 1. Get board
    const board = await db('boards').where({ id: boardId }).first();
    if (!board) {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }

    // 2. Get members
    const members = await db('board_members')
      .join('users', 'board_members.user_id', 'users.id')
      .where({ board_id: boardId })
      .select('users.id', 'users.username', 'users.email', 'users.avatar_color');

    // 3. Get columns
    const columns = await db('columns')
      .where({ board_id: boardId })
      .orderBy('position');

    // 4. Get cards for each column
    const columnMap = new Map();
    for (const col of columns) {
      const cards = [];
      const cardRecords = await db('cards').where({ column_id: col.id }).orderBy('position');
      
      for (const card of cardRecords) {
        // Use the helper function to get full card details
        const cardDetails = await getCardWithDetails(card.id);
        if (cardDetails) {
          cards.push(cardDetails);
        }
      }
      
      columnMap.set(col.id, { ...col, cards });
    }

    const fullBoard = {
      ...board,
      members,
      columns: columns.map(col => columnMap.get(col.id)),
    };

    res.json({ success: true, data: fullBoard });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createBoard = async (req: Request, res: Response) => {
  try {
    const { title, description } = req.body;
    const userId = (req as any).user.id;

    const [newBoard] = await db('boards')
      .insert({ title, description, owner_id: userId })
      .returning('*');
      
    await db('board_members').insert({
      board_id: newBoard.id,
      user_id: userId,
      role: 'admin',
    });

    res.status(201).json({ success: true, data: newBoard });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error creating board' });
  }
};

// --- THIS FUNCTION IS NOW FIXED ---
export const inviteUserToBoard = async (req: Request, res: Response) => {
  try {
    const { boardId } = req.params;
    const { userId: userIdToInvite } = req.body; // <-- 1. This now correctly expects 'userId'
    const currentUserId = (req as any).user.id;

    // 2. ADDED: Check if current user is the owner
    const board = await db('boards').where({ id: boardId, owner_id: currentUserId }).first();
    if (!board) {
      return res.status(403).json({ success: false, message: 'Only the board owner can invite users' });
    }
    
    // 3. Find the user to invite (by ID, not email)
    const user = await db('users').where({ id: userIdToInvite }).first();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const existingMember = await db('board_members')
      .where({ board_id: boardId, user_id: user.id })
      .first();
      
    if (existingMember) {
      return res.status(409).json({ success: false, message: 'User is already a member' });
    }

    await db('board_members').insert({
      board_id: boardId,
      user_id: user.id,
      role: 'member',
    });
    
    // Return the new member's details
    const newMember = {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar_color: user.avatar_color,
      role: 'member' // <-- 4. ADDED: Send the role back
    };

    // Socket event
    const io = req.app.get('io');
    io.to(`board:${boardId}`).emit('board:member:added', newMember); // <-- 5. Renamed event

    res.status(201).json({ success: true, data: newMember });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error inviting user' });
  }
};

// --- ADDED THIS MISSING FUNCTION ---
export const removeUserFromBoard = async (req: Request, res: Response) => {
  try {
    const { boardId, userId: userIdToRemove } = req.params;
    const currentUserId = (req as any).user.id;

    // 1. Check if current user is the owner
    const board = await db('boards').where({ id: boardId, owner_id: currentUserId }).first();
    if (!board) {
      return res.status(403).json({ success: false, message: 'Only the board owner can remove users' });
    }

    // 2. Owner cannot remove themselves
    if (Number(userIdToRemove) === currentUserId) {
      return res.status(400).json({ success: false, message: 'Owner cannot remove themselves' });
    }

    // 3. Delete the member
    const deleted = await db('board_members')
      .where({ board_id: boardId, user_id: userIdToRemove })
      .del();

    if (deleted === 0) {
      return res.status(404).json({ success: false, message: 'Member not found on this board' });
    }

    // 4. Emit socket event
    const io = req.app.get('io');
    io.to(`board:${boardId}`).emit('board:member:removed', { userId: Number(userIdToRemove) });

    res.json({ success: true, message: 'User removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error removing user' });
  }
};