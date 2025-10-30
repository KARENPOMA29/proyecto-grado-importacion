import React from 'react';

const SummintButton = ({ children, className = "", ...props }) => {
  return (
    <button
      type="submit"
      className={`text-white bg-blue-700 flex items-center justify-center hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg 
                  text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default SummintButton;
