// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 🔁 Cargar usuario desde localStorage al iniciar
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);

        // nos aseguramos de que tenga la misma forma que usamos en el app
        const normalizedUser = {
          ...parsed,
          nombreCompleto:
            parsed.nombreCompleto ||
            `${parsed.nombre || ""} ${parsed.apellido || ""}`.trim(),
        };

        setUser(normalizedUser);
      }
    } catch (err) {
      console.error("Error reading stored user:", err);
    } finally {
      setLoading(false);
    }
  }, []);


  const login = (apiUser) => {
    // apiUser viene de FASTAPI: {id, nombre, apellido, rol, correo, usuario, idSucursal}

    const userData = {
      id: apiUser.id,
      nombre: apiUser.nombre,
      apellido: apiUser.apellido,
      nombreCompleto: `${apiUser.nombre} ${apiUser.apellido}`.trim(),
      rol: apiUser.rol,
      correo: apiUser.correo,
      usuario: apiUser.usuario,
      idSucursal: apiUser.idSucursal,   // 👈👈👈 IMPORTANTE
    };

    try {
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (err) {
      console.error("Error saving user to localStorage:", err);
    }

    setUser(userData);
  };


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

export const useAuth = () => useContext(AuthContext);
