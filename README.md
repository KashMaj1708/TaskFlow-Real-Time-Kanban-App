TaskFlow - Real-Time Collaborative Kanban Board

Live Demo: https://task-flow-real-time-kanban-app.vercel.app/


Note: The frontend (Vercel) loads instantly, but the backend (Render) is on a free tier. If the app is inactive, the first load or action (like logging in) may take 30-50 seconds for the server to "wake up."
Overview

TaskFlow is a full-stack, real-time Kanban board application built from scratch. It's designed for seamless team collaboration, allowing multiple users to manage tasks, drag and drop cards, and see all updates instantly without a page refresh.

This project was built to demonstrate a modern, full-stack architecture using React, Node.js, TypeScript, PostgreSQL, and WebSockets.

Features (How to Use)

  User Authentication: Register for a new account and log in. The app uses a secure, token-based authentication system.

  Board Dashboard: After logging in, you'll see your dashboard. You can create new boards, which will appear on this page.

  Column & Card Creation: Click on a board to enter the board view. From here, you can add new columns ("To Do", "In Progress", etc.) and add new       task cards to any column.

  Drag & Drop:

    Cards: Drag and drop cards to re-order them within a column or move them to a different column.

    Columns: Drag and drop entire columns to re-order the board's layout.

  Real-Time Sync (The Core Feature):

    Open the same board in two different browsers (or invite a friend).

    All changes—creating cards, editing tasks, dragging and dropping—will appear on the other user's screen instantly.

  Collaboration & Invites:

    Click the "Members" button in the board header.

    You can search for other registered users by their username or email.

    Invite them to your board. They will see the board appear on their dashboard in real-time.

  Task Details: Click any card to open a modal. From here, you can:

    Edit the card's title.

    Add a detailed description.

    Assign the card to any member of the board.

    Set a due date using the date picker.

Tech Stack Overview

  This project is a full-stack application with separate frontend and backend services.

  Frontend (Deployed on Vercel)

    Framework: React 18 with TypeScript

    Build Tool: Vite

    Styling: Tailwind CSS

    State Management: Zustand (for simple, powerful global state)

    Real-Time: Socket.IO Client

    Drag & Drop: @dnd-kit

    Routing: React Router

    Forms: React Hook Form

    Date Picker: react-datepicker

Backend (Deployed on Render)

    Framework: Node.js with Express
  
    Language: TypeScript
  
    Database: PostgreSQL
  
    Query Builder: Knex.js
  
    Real-Time: Socket.IO
  
    Authentication: JSON Web Tokens (JWT)
  
    Schema Validation: Zod
