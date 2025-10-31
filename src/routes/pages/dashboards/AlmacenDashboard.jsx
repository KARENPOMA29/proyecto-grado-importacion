// src/routes/pages/dashboards/AlmacenDashboard.jsx
import * as React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Typography } from "@mui/material";
import DashboardLayout from "@/layouts/DashboardLayout";
import { almacenMenu } from "./menuConfig";
import InventarioList from "@/routes/pages/inventario/inventarioList";
import AlmacenList from "@/routes/pages/almacen/almacenList";
import ModeloProductoList from "@/routes/pages/modelo_producto/modeloProductoList";
import SucursalList from "@/routes/pages/sucursal/sucursalList";
import CategoriaList from "@/routes/pages/categoria/categoriaList";
import SeccionList from "@/routes/pages/seccion/seccionList";
import ImportList from "@/routes/pages/importaciones/ImportacionList";




export default function AlmacenDashboard() {
  return (
    <DashboardLayout title="Panel de Almacén" menuItems={almacenMenu}>
      <Routes>
        <Route
          index
          element={
            <>
              <Typography variant="h5" gutterBottom>
                Inventario y Movimientos
              </Typography>
              <Typography>Gestiona ingresos, salidas y alertas de stock.</Typography>
            </>
          }
        />

        {/* PRINCIPAL */}
        <Route path="inventario" element={<InventarioList />} />
        <Route path="importaciones" element={<ImportList />} />

        {/* GESTIÓN */}

                <Route path="modelos" element={<ModeloProductoList />} />
                <Route path="sucursales" element={<SucursalList />} />
                <Route path="categorias" element={<CategoriaList />} />
                <Route path="almacenes" element={<AlmacenList />} />
                <Route path="secciones" element={<SeccionList />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/almacen" replace />} />
      </Routes>
    </DashboardLayout>
  );
}
