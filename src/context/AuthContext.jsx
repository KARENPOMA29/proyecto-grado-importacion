import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // indica si estamos cargando el usuario desde localStorage
  const navigate = useNavigate();

  // 🔁 Cargar usuario si está guardado en localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
    } catch (err) {
      // ignore parse errors
      console.error("Error reading stored user:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Login: guarda usuario
  const login = (userData) => {
    try {
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (err) {
      console.error("Error saving user to localStorage:", err);
    }
    setUser(userData);
  };

  // 🚪 Logout: borra usuario y redirige al login
  const logout = () => {
    try {
      localStorage.removeItem("user");
    } catch (err) {
      console.error("Error removing user from localStorage:", err);
    }
    setUser(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar el contexto
export const useAuth = () => useContext(AuthContext);
