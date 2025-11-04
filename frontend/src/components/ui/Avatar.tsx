import React from 'react';
import { type User } from '../../types'; // We'll need this import

interface AvatarProps {
  // This accepts any object with at least a username and avatar_color
  user: { username: string | null; avatar_color: string | null; [key: string]: any };
  size?: 'sm' | 'md' | 'lg';
}

const Avatar: React.FC<AvatarProps> = ({ user, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  if (!user || !user.username) {
    return null; // Don't render if user is invalid
  }

  const initial = user.username.charAt(0).toUpperCase();

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold text-white ${sizeClasses[size]}`}
      style={{ backgroundColor: user.avatar_color || '#3B82F6' }}
      title={user.username}
    >
      {initial}
    </div>
  );
};

export default Avatar;