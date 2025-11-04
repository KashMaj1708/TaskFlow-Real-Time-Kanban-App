import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import './index.css'
import 'react-datepicker/dist/react-datepicker.css'
// --- Page Imports ---
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import ProtectedRoute from './components/layout/ProtectedRoute'
import BoardPage from './pages/board/BoardPage'
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      // Public Routes
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },

      // Protected Routes
      {
        path: '/',
        element: <ProtectedRoute />,
        children: [
          { index: true, element: <DashboardPage /> },
          // We will add /board/:boardId here later
          { path: 'board/:boardId', element: <BoardPage /> }
        ],
      },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)