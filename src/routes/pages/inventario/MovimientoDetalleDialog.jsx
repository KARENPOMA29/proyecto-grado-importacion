import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Grid,
  Paper,
  Chip,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  X,
  Package,
  Building2,
  Warehouse,
  Layers,
  User,
  Tags,
  Boxes,
  Truck,
} from "lucide-react";
import { useEffect, useState } from "react";
import ServiceMovimiento from "@/services/ServiceMovimiento";

const InfoItem = ({ label, value }) => (
  <Box>
    <Typography fontSize={12} color="text.secondary" fontWeight={700}>
      {label}
    </Typography>
    <Typography fontSize={14} color="#2B1A1A" fontWeight={600}>
      {value ?? "—"}
    </Typography>
  </Box>
);

const SectionCard = ({ icon, title, children }) => (
  <Paper
    variant="outlined"
    sx={{
      p: 2,
      borderRadius: 3,
      height: "100%",
      borderColor: "#E5E0DC",
      bgcolor: "#fff",
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 2 }}>
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: "12px",
          bgcolor: "#592B2B12",
          color: "#592B2B",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </Box>
      <Typography fontWeight={800} color="#3A1A1A">
        {title}
      </Typography>
    </Box>

    <Grid container spacing={1.6}>
      {children}
    </Grid>
  </Paper>
);

const MovimientoDetalleDialog = ({ open, id, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const estadoProductoLabel = (estado) => {
    const value = Number(estado);
    if (value === 1) return "Disponible";
    if (value === 2) return "Vendido";
    if (value === 0) return "Inactivo";
    return "—";
  };

  const observadoLabel = (observado) => {
    const value = Number(observado);
    if (value === 1) return "No";
    if (value === 2) return "Sí";
    return "—";
  };

  const formatFecha = (value) => {
    if (!value) return "—";
    const fecha = String(value).split("T")[0];
    const [yyyy, mm, dd] = fecha.split("-");
    if (!yyyy || !mm || !dd) return value;
    return `${dd}/${mm}/${yyyy}`;
  };

  useEffect(() => {
    if (!open || !id) return;

    const load = async () => {
      try {
        setLoading(true);
        const res = await ServiceMovimiento.getDetalle(id);
        setData(res);
      } catch (error) {
        console.error("Error al cargar detalle del movimiento:", error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [open, id]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 3,
          py: 2.2,
          bgcolor: "#592B2B",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography fontSize={20} fontWeight={900}>
            Detalle completo del movimiento
          </Typography>
          <Typography fontSize={13} sx={{ opacity: 0.85 }}>
            Información de sucursal, almacén, sección, producto y responsable
          </Typography>
        </Box>

        <IconButton onClick={onClose} sx={{ color: "#fff" }}>
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: "#FAF8F6" }}>
        {loading ? (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <CircularProgress sx={{ color: "#592B2B" }} />
            <Typography mt={2} color="text.secondary">
              Cargando detalle...
            </Typography>
          </Box>
        ) : !data ? (
          <Typography color="text.secondary">
            No se pudo cargar el detalle del movimiento.
          </Typography>
        ) : (
          <Box>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 2.5,
                borderRadius: 3,
                border: "1px solid #E5E0DC",
                display: "flex",
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", sm: "center" },
                flexDirection: { xs: "column", sm: "row" },
                gap: 1.5,
              }}
            >
              <Box>
                <Typography fontSize={13} color="text.secondary" fontWeight={700}>
                  Movimiento 
                </Typography>
                <Typography fontSize={20} fontWeight={900} color="#3A1A1A">
                  {data.tipoMovimiento || "—"}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Chip
                  label={`Fecha: ${formatFecha(data.fecha)}`}
                  sx={{ fontWeight: 800, bgcolor: "#F3EEE9", color: "#592B2B" }}
                />
                <Chip
                  label={estadoProductoLabel(data.producto?.estado)}
                  sx={{ fontWeight: 800 }}
                  color={Number(data.producto?.estado) === 1 ? "success" : "default"}
                />
              </Box>
            </Paper>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <SectionCard icon={<Building2 size={18} />} title="Sucursal">
                  <Grid item xs={12} sm={6}>
                    <InfoItem label="Nombre" value={data.sucursal?.nombre} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoItem label="Ciudad" value={data.sucursal?.ciudad} />
                  </Grid>
                  <Grid item xs={12}>
                    <InfoItem label="Dirección" value={data.sucursal?.direccion} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoItem label="Teléfono" value={data.sucursal?.telefono} />
                  </Grid>
                </SectionCard>
              </Grid>

              <Grid item xs={12} md={6}>
                <SectionCard icon={<Warehouse size={18} />} title="Almacén">
                  <Grid item xs={12} sm={6}>
                    <InfoItem label="Nombre" value={data.almacen?.nombre} />
                  </Grid>
                  <Grid item xs={12}>
                    <InfoItem label="Dirección" value={data.almacen?.direccion} />
                  </Grid>
                </SectionCard>
              </Grid>

              <Grid item xs={12} md={6}>
                <SectionCard icon={<Layers size={18} />} title="Sección">
                  <Grid item xs={12} sm={6}>
                    <InfoItem label="Nombre" value={data.seccion?.nombre} />
                  </Grid>
                  
                </SectionCard>
              </Grid>

              <Grid item xs={12} md={6}>
                <SectionCard icon={<User size={18} />} title="Empleado responsable">
                  <Grid item xs={12} sm={6}>
                    <InfoItem
                      label="Nombre"
                      value={`${data.empleado?.nombre ?? ""} ${data.empleado?.apellido ?? ""}`.trim() || "—"}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoItem label="CI" value={data.empleado?.ci} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoItem label="Rol" value={data.empleado?.rol} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoItem label="Correo" value={data.empleado?.correo} />
                  </Grid>
                </SectionCard>
              </Grid>

              <Grid item xs={12}>
                <SectionCard icon={<Package size={18} />} title="Producto">
                  <Grid item xs={12} sm={4}>
                    <InfoItem label="Número de serie" value={data.producto?.numeroSerie} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <InfoItem label="Precio" value={data.producto?.precio != null ? `${data.producto.precio} Bs` : "—"} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <InfoItem label="Estado" value={estadoProductoLabel(data.producto?.estado)} />
                  </Grid>
                  <Grid item xs={12}>
                    <InfoItem label="Descripción" value={data.producto?.descripcion} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <InfoItem label="Observado" value={observadoLabel(data.producto?.observado)} />
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <InfoItem label="Detalle observación" value={data.producto?.obsDescripcion} />
                  </Grid>
                </SectionCard>
              </Grid>

              <Grid item xs={12} md={4}>
                <SectionCard icon={<Boxes size={18} />} title="Modelo">
                  <Grid item xs={12}>
                    <InfoItem label="Modelo" value={data.modelo?.nombreModelo} />
                  </Grid>
                  
                </SectionCard>
              </Grid>

              <Grid item xs={12} md={4}>
                <SectionCard icon={<Tags size={18} />} title="Categoría">
                  <Grid item xs={12}>
                    <InfoItem label="Nombre" value={data.categoria?.nombre} />
                  </Grid>
                </SectionCard>
              </Grid>

              <Grid item xs={12} md={4}>
                <SectionCard icon={<Truck size={18} />} title="Importación">
                  <Grid item xs={12}>
                    <InfoItem label="Código" value={data.importacion?.codigo} />
                  </Grid>
                  <Grid item xs={12}>
                    <InfoItem label="Fecha llegada" value={formatFecha(data.importacion?.fechaLlegada)} />
                  </Grid>
                 
                </SectionCard>
              </Grid>
            </Grid>

            <Divider sx={{ mt: 3 }} />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MovimientoDetalleDialog;