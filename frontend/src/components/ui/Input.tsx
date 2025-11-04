// Input component

import React from 'react';
import { type UseFormRegisterReturn } from 'react-hook-form';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  registration?: UseFormRegisterReturn;
}

const Input: React.FC<InputProps> = ({ registration, ...props }) => {
  return (
    <input
      {...registration}
      {...props}
      className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 ${className}"
    />
  );
};

export default Input;