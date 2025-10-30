import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();

  // Mientras cargamos el estado de autenticación, no redirigimos.
  if (loading) return <div />; // o un spinner si tienes uno

  // Si no hay usuario, redirigimos al login
  if (!user) return <Navigate to="/login" replace />;

  // Si el usuario no tiene el rol permitido, redirigimos
  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
