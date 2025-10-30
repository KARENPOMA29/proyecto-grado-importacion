// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'mui-core': ['@mui/material'],
          'mui-icons': ['@mui/icons-material'],
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      '@mui/material/TextField',
      '@mui/material/Button',
      '@mui/material/Container',
      '@mui/material/Box',
      '@mui/material/Typography',
      '@mui/material/InputAdornment',
      '@mui/material/IconButton',
      '@mui/material/Alert',
      '@mui/icons-material/Person',
      '@mui/icons-material/Lock',
      '@mui/icons-material/Visibility',
      '@mui/icons-material/VisibilityOff'
    ],
  },
  server: {
    warmup: {
      clientFiles: [
        './src/routes/loginauth/loginauth.jsx',
      ],
    },
  },
})
  