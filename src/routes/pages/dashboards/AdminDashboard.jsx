// src/routes/pages/dashboards/AdminDashboard.jsx
import * as React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
// src/routes/pages/dashboards/AdminDashboard.jsx
import {
  Typography,
  Snackbar,
  Alert,
  Box,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,            // 👈 agregado
} from "@mui/material";


import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";

import DashboardLayout from "@/layouts/DashboardLayout";
import { adminMenu } from "./menuConfig";
import ServiceAlerta from "@/services/ServiceAlerta";

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
import ProductList from "@/routes/pages/productos/productoList";
import ReportesPage from "@/routes/pages/reportes/ReportesPage";

const Reportes = () => (
  <>
    <Typography variant="h6" gutterBottom>
      Reportes
    </Typography>
    <Typography>Contenido de reportes</Typography>
  </>
);

const Configuracion = () => (
  <>
    <Typography variant="h6" gutterBottom>
      Configuración
    </Typography>
    <Typography>Opciones de configuración</Typography>
  </>
);

export default function AdminDashboard() {
  const [alertas, setAlertas] = React.useState([]);
  const [openNotif, setOpenNotif] = React.useState(false);

  React.useEffect(() => {
    const loadAlertas = async () => {
      try {
        const data = await ServiceAlerta.getDashboard(5);
        if (data && data.length > 0) {
          setAlertas(data);
          setOpenNotif(true);
        }
      } catch (error) {
        console.error("Error cargando alertas:", error);
      }
    };

    loadAlertas();
  }, []);

  const handleCloseNotif = (_, reason) => {
    if (reason === "clickaway") return;
    setOpenNotif(false);
  };
  const handleMarcarLeida = async (id) => {
    try {
      await ServiceAlerta.marcarLeida(id);

      setAlertas((prev) => {
        const updated = prev.filter((a) => a.id !== id);
        if (updated.length === 0) {
          setOpenNotif(false);
        }
        return updated;
      });
    } catch (error) {
      console.error("Error marcando alerta como leída:", error);
    }
  };
  return (
    <DashboardLayout title="Panel de Administrador" menuItems={adminMenu}>
      {/* 🔔 Notificación flotante */}
      {alertas.length > 0 && (
        <Snackbar
          open={openNotif}
          autoHideDuration={8000}
          onClose={handleCloseNotif}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert
            onClose={handleCloseNotif}
            severity="info"
            sx={{ width: "100%" }}
          >
            {alertas[0].mensaje}
          </Alert>
        </Snackbar>
      )}

      <Routes>
        {/* ================== HOME / RESUMEN ================== */}
        <Route
          index
          element={
            <Box sx={{ p: 1 }}>
              <Typography variant="h4" gutterBottom>
                Bienvenida/o
              </Typography>
              <Typography sx={{ mb: 3 }} color="text.secondary">
                Usa el menú lateral para navegar. Aquí verás un resumen rápido
                de los últimos movimientos.
              </Typography>

              <Grid container spacing={2}>
                {/* Últimas alertas */}
                <Grid item xs={12} md={7}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      border: 1,
                      borderColor: "divider",
                      bgcolor: "background.paper",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        mb: 1.5,
                        gap: 1,
                      }}
                    >
                      <NotificationsActiveOutlinedIcon fontSize="small" />
                      <Typography variant="subtitle1" fontWeight={600}>
                        Últimos movimientos de importación
                      </Typography>
                    </Box>

                    <Divider sx={{ mb: 1.5 }} />

                      {alertas.length === 0 ? (
                        <Typography color="text.secondary" variant="body2">
                          No hay nuevas alertas por ahora.
                        </Typography>
                      ) : (
                        <List dense sx={{ mt: 0.5 }}>
                          {alertas.map((a, index) => {
                            const fechaFormato = new Date(a.fecha).toLocaleString("es-BO", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            });

                            const esMasReciente = index === 0;

                            return (
                              <ListItem
                                key={a.id}
                                alignItems="flex-start"
                                sx={{
                                  mb: 1,
                                  px: 1.5,
                                  py: 1.1,
                                  borderRadius: 1.5,
                                  bgcolor: esMasReciente ? "action.hover" : "transparent",
                                  "&:hover": {
                                    bgcolor: "action.hover",
                                  },
                                  transition: "background-color 0.2s ease",
                                }}
                              >
                                <ListItemIcon sx={{ minWidth: 32, mt: 0.2 }}>
                                  <NotificationsActiveOutlinedIcon
                                    fontSize="small"
                                    sx={{ color: "text.secondary" }}
                                  />
                                </ListItemIcon>
                               <ListItemText
                                  primary={
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                        flexWrap: "wrap",
                                      }}
                                    >
                                      <Typography
                                        variant="body2"
                                        sx={{ fontWeight: esMasReciente ? 600 : 500 }}
                                      >
                                        {a.mensaje}
                                      </Typography>

                                      {esMasReciente && (
                                        <Box
                                          component="span"
                                          sx={{
                                            fontSize: 11,
                                            px: 1,
                                            py: 0.2,
                                            borderRadius: 999,
                                            bgcolor: "primary.soft",
                                            color: "primary.main",
                                            border: "1px solid",
                                            borderColor: "primary.light",
                                          }}
                                        >
                                          Nuevo
                                        </Box>
                                      )}
                                    </Box>
                                  }
                                  secondary={
                                    <Box
                                      component="span"
                                      sx={{
                                        mt: 0.5,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 1,
                                      }}
                                    >
                                      <Typography
                                        component="span"
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ display: "block" }}
                                      >
                                        {fechaFormato}
                                      </Typography>

                                      <Button
                                        size="small"
                                        variant="text"
                                        onClick={() => handleMarcarLeida(a.id)}
                                      >
                                        Marcar como leída
                                      </Button>
                                    </Box>
                                  }

                                />
                              </ListItem>
                            );
                          })}
                        </List>
                      )}

                  </Paper>
                </Grid>

              </Grid>
            </Box>
          }
        />

        {/* ================== RESTO DE RUTAS ================== */}
        <Route path="empleados" element={<EmpleadoList />} />
        <Route path="reportes" element={<ReportesPage />} />
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
        <Route path="productos" element={<ProductList />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </DashboardLayout>
  );
}
