import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';
import { LayoutDashboard } from 'lucide-react'; // You'll need this icon

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="w-full bg-white/80 backdrop-blur-md shadow-sm p-4 flex justify-between items-center sticky top-0 z-30">
      {/* Left Side - Logo/Title */}
      <Link to="/" className="flex items-center gap-2">
        <LayoutDashboard className="text-blue-600" />
        <span className="text-xl font-bold text-gray-800">My Task Board</span>
      </Link>

      {/* Right Side - User/Auth */}
      <div className="flex items-center gap-4">
        {user && (
          <>
            {/* Hides text on small screens */}
            <span className="text-gray-700 hidden sm:block">
              Welcome, <strong>{user.username}</strong>!
            </span>
            <Button variant="secondary" size="sm" onClick={logout}>
              Log Out
            </Button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;