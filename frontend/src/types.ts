// From our auth setup
export interface User {
  id: number;
  username: string;
  email: string;
  avatar_color: string;
}

// From our auth setup, but for board members
export interface BoardMember extends User {
  role: string;
}

// Card label
export interface Label {
  id: number; // <-- ADDED
  color: string;
  text: string;
}

export interface Card {
  id: number;
  title: string;
  description: string | null;
  position: number;
  column_id: number;
  due_date: string | null; // ISO string
  labels: Label[];
  created_at: string; // <-- ADDED
  board_id: number;   // <-- ADDED
  
  // This is the property name from your original file
  created_by: number; // <-- RENAMED from created_by
  
  // This is the full user object from the JOIN
  assigned_user: BoardMember | null; // <-- CHANGED from AssignedUser

  // This is the raw ID we use for updates
  assigned_user_id: number | null; // <-- ADDED
}

export interface Column {
  id: number;
  title: string;
  position: number;
  cards: Card[];
}

export interface Board {
  id: number;
  title: string;
  description: string | null;
  owner_id: number;
  members: BoardMember[];
  columns: Column[];
}