import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'normal' | 'sm';
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'normal', className = '', ...props }) => {
  const baseStyle = "font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-800 disabled:opacity-50";
  
  const variants = {
    primary: "text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
    secondary: "text-neutral-100 bg-neutral-600 hover:bg-neutral-500 focus:ring-neutral-400",
    danger: "text-white bg-red-600 hover:bg-red-700 focus:ring-red-500",
  };

  const sizes = {
    normal: "px-4 py-2",
    sm: "px-3 py-1 text-sm",
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