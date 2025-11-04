import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; // <-- ADD 'ghost'
  size?: 'normal' | 'sm' | 'icon'; // <-- ADD 'icon'
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'normal', className = '', ...props }) => {
  const baseStyle = "font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-800 disabled:opacity-50";
  
  const variants = {
    primary: "text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
    secondary: "text-gray-800 bg-gray-300 hover:bg-gray-400 focus:ring-gray-400",
    danger: "text-white bg-red-600 hover:bg-red-700 focus:ring-red-500",
    ghost: "text-neutral-400 hover:bg-neutral-700 hover:text-white focus:ring-neutral-500", // <-- ADD THIS
  };

  const sizes = {
    normal: "px-4 py-2",
    sm: "px-3 py-1 text-sm",
    icon: "p-2", // <-- ADD THIS for icon buttons
  };

  return (
    <button
      {...props}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;