// From our auth setup. `id` is the Firebase UID (a string).
export interface User {
  id: string;
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
  
  // User who created the card (Firebase UID)
  created_by: string;
  
  // This is the full user object from the JOIN
  assigned_user: BoardMember | null; // <-- CHANGED from AssignedUser

  // This is the raw ID we use for updates (Firebase UID)
  assigned_user_id: string | null;
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
  owner_id: string;
  members: BoardMember[];
  columns: Column[];
}