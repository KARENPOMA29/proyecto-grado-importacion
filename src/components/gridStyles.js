export const customStylesLight = {
  table: {
    style: {
      backgroundColor: 'transparent',
    },
  },
  headRow: {
    style: {
      backgroundColor: '#f8fafc',
      color: '#374151',
      fontSize: '0.875rem',
      fontWeight: '600',
      minHeight: '3rem',
      borderBottomWidth: '1px',
      borderBottomColor: '#e5e7eb',
    },
  },
  headCells: {
    style: {
      paddingLeft: '1rem',
      paddingRight: '1rem',
      '&:first-of-type': {
        paddingLeft: '1.5rem',
      },
      '&:last-of-type': {
        paddingRight: '1.5rem',
      },
    },
  },
  cells: {
    style: {
      paddingLeft: '1rem',
      paddingRight: '1rem',
      fontSize: '0.875rem',
      color: '#374151',
      minHeight: '3.5rem',
      '&:first-of-type': {
        paddingLeft: '1.5rem',
      },
      '&:last-of-type': {
        paddingRight: '1.5rem',
      },
    },
  },
  rows: {
    style: {
      backgroundColor: '#ffffff',
      borderBottomColor: '#f3f4f6',
      minHeight: '3.5rem',
      '&:not(:last-of-type)': {
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid',
      },
      '&:hover': {
        backgroundColor: '#f9fafb',
      },
    },
    stripedStyle: {
      backgroundColor: '#f8fafc',
    },
  },
  pagination: {
    style: {
      backgroundColor: 'transparent',
      borderTopWidth: '1px',
      borderTopColor: '#e5e7eb',
      borderTopStyle: 'solid',
      padding: '1rem 1.5rem',
      fontSize: '0.875rem',
      color: '#6b7280',
    },
    pageButtonsStyle: {
      borderRadius: '0.375rem',
      height: '2.25rem',
      width: '2.25rem',
      padding: '0.5rem',
      margin: '0.125rem',
      fill: '#374151',
      backgroundColor: 'transparent',
      '&:disabled': {
        opacity: 0.5,
        cursor: 'not-allowed',
      },
      '&:hover:not(:disabled)': {
        backgroundColor: '#f3f4f6',
      },
      '&:focus': {
        outline: '2px solid #3b82f6',
        outlineOffset: '2px',
      },
    },
  },
};

export const customStylesDark = {
  ...customStylesLight,
  headRow: {
    style: {
      ...customStylesLight.headRow.style,
      backgroundColor: '#1f2937',
      color: '#f9fafb',
      borderBottomColor: '#374151',
    },
  },
  cells: {
    style: {
      ...customStylesLight.cells.style,
      color: '#e5e7eb',
    },
  },
  rows: {
    style: {
      ...customStylesLight.rows.style,
      backgroundColor: '#111827',
      borderBottomColor: '#1f2937',
      '&:hover': {
        backgroundColor: '#1f2937',
      },
    },
    stripedStyle: {
      backgroundColor: '#1a1f2e',
    },
  },
  pagination: {
    style: {
      ...customStylesLight.pagination.style,
      backgroundColor: 'transparent',
      borderTopColor: '#374151',
      color: '#9ca3af',
    },
    pageButtonsStyle: {
      ...customStylesLight.pagination.pageButtonsStyle,
      fill: '#d1d5db',
      '&:hover:not(:disabled)': {
        backgroundColor: '#374151',
      },
    },
  },
};