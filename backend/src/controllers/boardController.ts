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

export const inviteUserToBoard = async (req: Request, res: Response) => {
  try {
    const { boardId } = req.params;
    const { email } = req.body;
    
    const user = await db('users').where({ email }).first();
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
    };

    // Socket event
    const io = req.app.get('io');
    io.to(`board:${boardId}`).emit('member:joined', newMember);

    res.status(201).json({ success: true, data: newMember });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error inviting user' });
  }
};