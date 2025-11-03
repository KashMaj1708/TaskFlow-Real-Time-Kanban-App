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
  
  // Card assigned user (can be null)
  export interface AssignedUser {
    id: number | null;
    username: string | null;
    avatar_color: string | null;
  }
  
  // Card label
  export interface Label {
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
    created_by: number;
    assigned_user: AssignedUser | null;
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