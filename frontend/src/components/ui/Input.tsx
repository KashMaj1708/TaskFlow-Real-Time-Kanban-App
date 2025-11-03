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
      className="w-full px-3 py-2 text-white bg-neutral-700 border border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
    />
  );
};

export default Input;