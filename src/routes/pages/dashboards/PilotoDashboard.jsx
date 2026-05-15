// src/routes/pages/dashboards/PilotoDashboard.jsx
import * as React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Typography } from "@mui/material";
import DashboardLayout from "@/layouts/DashboardLayout";
import { pilotoMenu } from "./menuConfig";
import ImportList from "@/routes/pages/importaciones/ImportacionList";
import ProveedorList from "@/routes/pages/proveedor/proveedorlist";
import EmpleadoInicioDashboard from "./EmpleadoInicioDashboard";
const Envios = () => (
  <>
    <Typography variant="h6" gutterBottom>
      Rutas y Envíos
    </Typography>
    <Typography>
      Consulta las rutas asignadas y los envíos en curso.
    </Typography>
  </>
);

const Estado = () => (
  <>
    <Typography variant="h6" gutterBottom>
      Estado de Entregas
    </Typography>
    <Typography>
      Visualiza el progreso y confirmaciones de entrega.
    </Typography>
  </>
);

export default function PilotoDashboard() {
  return (
    <DashboardLayout title="Panel de Pilotero" menuItems={pilotoMenu}>
      <Routes>
        <Route index element={<EmpleadoInicioDashboard />} />
        <Route path="importaciones" element={<ImportList />} />
        <Route path="proveedores" element={<ProveedorList />} />

        <Route path="envios" element={<Envios />} />
        <Route path="estado" element={<Estado />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/pilotero" replace />} />
      </Routes>
    </DashboardLayout>
  );
}
