// src/routes/pages/dashboards/VentasDashboard.jsx
import * as React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Typography } from "@mui/material";
import DashboardLayout from "@/layouts/DashboardLayout";
import { ventasMenu } from "./menuConfig";
import VentasList from "@/routes/pages/ventas/ventasList";
import ClienteList from "@/routes/pages/clientes/clientelist";
import EmpleadoInicioDashboard from "./EmpleadoInicioDashboard";
const Reportes = () => (
  <>
    <Typography variant="h6" gutterBottom>
      Reportes de Ventas
    </Typography>
    <Typography>Visualiza estadísticas y análisis de ventas.</Typography>
  </>
);

export default function VentasDashboard() {
  return (
    <DashboardLayout title="Panel de Ventas" menuItems={ventasMenu}>
      <Routes>
        <Route index element={<EmpleadoInicioDashboard />} />
        <Route path="ventas" element={<VentasList />} />
        <Route path="clientes" element={<ClienteList />} />
        <Route path="reportes" element={<Reportes />} />

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/ventas" replace />} />
      </Routes>
    </DashboardLayout>
  );
}
