import React from 'react'

const CancelButton = ({children, ...props}) => {
    return (
        <button
            {...props}
            type="button"
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
            {children}
        </button>
    )
}

export default CancelButton