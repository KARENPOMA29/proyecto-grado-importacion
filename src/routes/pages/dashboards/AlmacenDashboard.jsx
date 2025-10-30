import * as React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Typography } from "@mui/material";
import DashboardLayout from "@/layouts/DashboardLayout";
import { almacenMenu } from "./menuConfig";
import InventarioList from "@/routes/pages/almacen/almacenList";

// Placeholders for other almacen pages
const Ingresos = () => (
  <div>
    <Typography variant="h6">Ingresos</Typography>
    <Typography>Registrar y ver ingresos de stock.</Typography>
  </div>
);

const Salidas = () => (
  <div>
    <Typography variant="h6">Salidas</Typography>
    <Typography>Registrar y ver salidas de stock.</Typography>
  </div>
);

const Alertas = () => (
  <div>
    <Typography variant="h6">Alertas</Typography>
    <Typography>Ver alertas de stock bajo.</Typography>
  </div>
);

export default function AlmacenDashboard() {
  return (
    <DashboardLayout title="Panel de Almacén" menuItems={almacenMenu}>
      <Routes>
        <Route
          index
          element={
            <>
              <Typography variant="h5" gutterBottom>Inventario y Movimientos</Typography>
              <Typography>Gestiona ingresos, salidas y alertas de stock.</Typography>
            </>
          }
        />

        <Route path="inventario" element={<InventarioList />} />
        <Route path="ingresos" element={<Ingresos />} />
        <Route path="salidas" element={<Salidas />} />
        <Route path="alertas" element={<Alertas />} />

        {/* Redirect unknown almacen subpaths back to almacen root */}
        <Route path="*" element={<Navigate to="/almacen" replace />} />
      </Routes>
    </DashboardLayout>
  );
}
