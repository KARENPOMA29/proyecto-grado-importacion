// src/routes/AdminDashboard.jsx
import * as React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Typography } from "@mui/material";
import DashboardLayout from "@/layouts/DashboardLayout";
import { adminMenu } from "./menuConfig";

import EmpleadoList from "@/routes/pages/Empleado/empleadoList";
import ClienteList from "@/routes/pages/clientes/clientelist";
import ModeloProductoList from "@/routes/pages/modelo_producto/modeloProductoList";
import ProveedorList from "@/routes/pages/proveedor/proveedorlist";
import SucursalList from "@/routes/pages/sucursal/sucursalList";
import CategoriaList from "@/routes/pages/categoria/categoriaList";
import AlmacenList from "@/routes/pages/almacen/almacenList";
import SeccionList from "@/routes/pages/seccion/seccionList";
import InventarioList from "@/routes/pages/inventario/inventarioList";
import ImportList from "@/routes/pages/importaciones/ImportacionList";
import VentasList from "@/routes/pages/ventas/ventasList";

const Reportes = () => (
  <>
    <Typography variant="h6" gutterBottom>Reportes</Typography>
    <Typography>Contenido de reportes</Typography>
  </>
);

const Configuracion = () => (
  <>
    <Typography variant="h6" gutterBottom>Configuración</Typography>
    <Typography>Opciones de configuración</Typography>
  </>
);

export default function AdminDashboard() {
  return (
    <DashboardLayout title="Panel de Administrador" menuItems={adminMenu}>
      <Routes>
        <Route
          index
          element={
            <>
              <Typography variant="h5" gutterBottom>
                Bienvenida/o
              </Typography>
              <Typography>
                Selecciona una opción del menú para comenzar.
              </Typography>
            </>
          }
        />
        <Route path="empleados" element={<EmpleadoList />} />
        <Route path="reportes" element={<Reportes />} />
        <Route path="configuracion" element={<Configuracion />} />
        <Route path="importaciones" element={<ImportList />} />
        <Route path="inventario" element={<InventarioList />} />
        <Route path="clientes" element={<ClienteList />} />
        <Route path="proveedores" element={<ProveedorList />} />
        <Route path="modelos" element={<ModeloProductoList />} />
        <Route path="sucursales" element={<SucursalList />} />
        <Route path="categorias" element={<CategoriaList />} />
        <Route path="almacenes" element={<AlmacenList />} />
        <Route path="secciones" element={<SeccionList />} />
        <Route path="ventas" element={<VentasList />} />
        {/* cualquier otra ruta dentro de /admin */}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </DashboardLayout>
  );
}
