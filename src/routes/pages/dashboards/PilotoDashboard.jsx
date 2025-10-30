import * as React from "react";
import { Typography } from "@mui/material";
import DashboardLayout from "@/layouts/DashboardLayout";
import { pilotoMenu } from "./menuConfig";

export default function PilotoDashboard() {
  return (
    <DashboardLayout title="Panel de Pilotero" menuItems={pilotoMenu}>
      <Typography variant="h5" gutterBottom>Rutas y Envíos</Typography>
      <Typography>Consulta entregas asignadas y estado en tiempo real.</Typography>
    </DashboardLayout>
  );
}
