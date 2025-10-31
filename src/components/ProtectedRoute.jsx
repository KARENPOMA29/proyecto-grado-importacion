// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const toKey = (role = "") =>
  role.trim().toLowerCase(); // "Almacen" -> "almacen"

export const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div />;

  if (!user) return <Navigate to="/login" replace />;

  const userRoleRaw = user.rol || "";
  const userRoleKey = toKey(userRoleRaw); // ej. "almacen"

  // mapeo fijo de tus 4 roles
  const ROLE_MAP = {
    administrador: "Administrador",
    ventas: "Ventas",
    pilotero: "Pilotero",
    almacen: "Almacen",
  };

  const normalizedUserRole = ROLE_MAP[userRoleKey];

  // si no mandaste allowedRoles, pasa
  if (!allowedRoles.length) return children;

  // normalizamos los permitidos a key
  const allowedKeys = allowedRoles.map((r) => toKey(r));

  const isAllowed = allowedKeys.includes(userRoleKey);

  if (!isAllowed) {
    // redirigimos según el role normalizado
    if (normalizedUserRole === "Administrador") return <Navigate to="/admin" replace />;
    if (normalizedUserRole === "Almacen") return <Navigate to="/almacen" replace />;
    if (normalizedUserRole === "Ventas") return <Navigate to="/ventas" replace />;
    if (normalizedUserRole === "Pilotero") return <Navigate to="/pilotero" replace />;

    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};
