// src/theme/dataTableThemes.js
import { createTheme } from "react-data-table-component";

createTheme("customDark", {
  text: {
    primary: "#ffffff",
    secondary: "#cfcfcf",
  },
  background: {
    default: "#1e293b", // Tailwind slate-800
  },
  context: {
    background: "#1f2937", // Tailwind gray-800
    text: "#FFFFFF",
  },
  divider: {
    default: "#374151", // Tailwind gray-700
  },
  button: {
    default: "#3b82f6",
    hover: "#2563eb",
    focus: "#1d4ed8",
    disabled: "#9ca3af",
  },
  sortFocus: {
    default: "#facc15", // Tailwind yellow-400
  },
});
