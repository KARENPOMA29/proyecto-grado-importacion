import * as React from "react";
import { Typography } from "@mui/material";
import DashboardLayout from "@/layouts/DashboardLayout";
import { ventasMenu } from "./menuConfig";

export default function VentasDashboard() {
  return (
    <DashboardLayout title="Panel de Ventas" menuItems={ventasMenu}>
      <Typography variant="h5" gutterBottom>Resumen Ventas</Typography>
      <Typography>Accesos rápidos a venta nueva, clientes y reportes.</Typography>
    </DashboardLayout>
  );
}
