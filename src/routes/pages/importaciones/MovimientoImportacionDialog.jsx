// src/pages/importaciones/MovimientoImportacionDialog.jsx
import { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Box,
  Typography,
  Button,
  CircularProgress,
  Chip,
  Divider,
  Paper,
  Alert,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";

// Íconos - SIN DUPLICADOS
import DescriptionIcon from "@mui/icons-material/Description";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import RouteIcon from "@mui/icons-material/Route";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BadgeIcon from "@mui/icons-material/Badge";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DownloadIcon from "@mui/icons-material/Download";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import AssignmentIcon from "@mui/icons-material/Assignment";
import TimelineIcon from "@mui/icons-material/Timeline";
import EventIcon from "@mui/icons-material/Event";
import FlagIcon from "@mui/icons-material/Flag";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ImageIcon from "@mui/icons-material/Image";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

// Servicios y otros imports
import ServiceMovimientoImportacion from "@/services/ServiceMovimientoImportacion";
import MovimientoImportacionForm from "./MovimientoImportacionForm";

const filesBaseUrl = import.meta.env.VITE_FILES_URL || "";

// Constantes
const PASOS = [
  { code: "PEDIDO", label: "Pedido confirmado" },
  { code: "PRODUCCION", label: "En producción" },
  { code: "TRANS_INT", label: "En tránsito internacional" },
  { code: "PUERTO", label: "Llegada a puerto" },
  { code: "LISTO_ENV", label: "Listo para envío" },
  { code: "ADUANA_BO", label: "Despacho aduanero Bolivia" },
  { code: "TRANS_NAC", label: "En tránsito nacional" },
  { code: "ENTREGADO", label: "Entregado" },
];

const LABEL_BY_CODE = PASOS.reduce((acc, paso) => {
  acc[paso.code] = paso.label;
  return acc;
}, {});

// Utilidades
const formatDateOnly = (value) => {
  if (!value) return "—";
  if (typeof value === "string") {
    const clean = value.substring(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
      const [yyyy, mm, dd] = clean.split("-");
      return `${dd}/${mm}/${yyyy}`;
    }
  }
  return new Date(value).toLocaleDateString("es-BO");
};

const getNombreEmpleado = (mov) => {
  if (!mov) return "—";
  if (mov.empleadoNombre) return mov.empleadoNombre;
  if (mov.nombreEmpleado) return mov.nombreEmpleado;
  if (mov.empleadoEncargadoNombre) return mov.empleadoEncargadoNombre;

  const empleado = mov.empleado_encargado || mov.empleadoEncargado || mov.empleado || mov.empleadoAsignado;
  
  if (empleado) {
    const nombreCompleto = empleado.nombreCompleto ||
      empleado.fullName ||
      [empleado.nombre, empleado.apellido].filter(Boolean).join(" ") ||
      [empleado.nombres, empleado.apellidos].filter(Boolean).join(" ");
    
    if (nombreCompleto?.trim()) return nombreCompleto.trim();
  }
  
  return "Empleado no disponible";
};

const getSituacionColor = (situacion) => {
  const s = (situacion || "").toLowerCase();
  if (s.includes("retrasada")) return "error";
  if (s.includes("hoy")) return "warning";
  if (s.includes("próxima") || s.includes("proxima")) return "info";
  if (s.includes("concluida")) return "success";
  return "default";
};

const getFileInfo = (ruta) => {
  if (!ruta || !filesBaseUrl) return { url: null, isImage: false, isPdf: false };
  const url = `${filesBaseUrl}/archivos/${ruta}`;
  const lower = ruta.toLowerCase();
  return {
    url,
    isImage: /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(lower),
    isPdf: /\.pdf$/i.test(lower),
    fileName: ruta.split('/').pop() || ruta,
  };
};

// Función para descargar archivo
const downloadFile = async (url, fileName) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Error descargando archivo:', error);
    // Fallback: abrir en nueva pestaña
    window.open(url, '_blank');
  }
};

// Componente de detalle del movimiento
const MovimientoDetalleDialog = ({ open, onClose, movimiento, importacion }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [downloading, setDownloading] = useState(false);

  if (!movimiento) return null;

  const tipoCode = movimiento.tipoMovimiento?.toUpperCase().trim() || "—";
  const tipoLabel = LABEL_BY_CODE[tipoCode] || movimiento.tipoMovimiento || "—";
  const archivoInfo = movimiento.rutaArchivo ? getFileInfo(movimiento.rutaArchivo) : { url: null, isImage: false, isPdf: false, fileName: "" };
  const empleadoNombre = getNombreEmpleado(movimiento);
  const situacionTexto = importacion?.situacion || "En proceso";

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDownload = async () => {
    if (!archivoInfo.url) return;
    setDownloading(true);
    await downloadFile(archivoInfo.url, archivoInfo.fileName);
    setDownloading(false);
    handleMenuClose();
  };

  const getFileIcon = () => {
    if (archivoInfo.isImage) return <ImageIcon sx={{ fontSize: 20 }} />;
    if (archivoInfo.isPdf) return <PictureAsPdfIcon sx={{ fontSize: 20 }} />;
    return <DescriptionIcon sx={{ fontSize: 20 }} />;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ p: 0 }}>
        <Box sx={{ 
          background: "linear-gradient(135deg, #0f766e 0%, #155e75 100%)", 
          color: "#fff",
          px: 3,
          py: 2.5
        }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box sx={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                bgcolor: "rgba(255,255,255,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <InfoOutlinedIcon />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={900}>Detalles del movimiento</Typography>
                <Typography variant="body2" sx={{ opacity: 0.92 }}>
                  Información registrada en el seguimiento
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={onClose} sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.16)" }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: "#f8fafc" }}>
        {/* Información principal */}
        <Paper 
          sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 3,
            background: "linear-gradient(135deg, #fff 0%, #f8fafc 100%)",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
          }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Box>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <AssignmentIcon sx={{ fontSize: 18, color: "#0f766e" }} />
                  <Typography variant="caption" fontWeight={600} color="text.secondary" textTransform="uppercase">
                    Importación
                  </Typography>
                </Box>
                <Typography variant="h5" fontWeight={800} color="#0f766e" sx={{ letterSpacing: "-0.5px" }}>
                  {importacion?.codigo || `IMP-${importacion?.id}`}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <TimelineIcon sx={{ fontSize: 18, color: "#f59e0b" }} />
                  <Typography variant="caption" fontWeight={600} color="text.secondary" textTransform="uppercase">
                    Paso actual
                  </Typography>
                </Box>
                <Typography variant="h5" fontWeight={800} color="#1e293b" sx={{ letterSpacing: "-0.5px", mb: 0.5 }}>
                  {tipoLabel}
                </Typography>
                <Chip 
                  label={tipoCode} 
                  size="small" 
                  sx={{ 
                    bgcolor: "#fef3c7", 
                    color: "#d97706",
                    fontWeight: 700,
                    fontSize: "0.7rem",
                    height: 22
                  }} 
                />
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <EventIcon sx={{ fontSize: 18, color: "#3b82f6" }} />
                  <Typography variant="caption" fontWeight={600} color="text.secondary" textTransform="uppercase">
                    Fecha de registro
                  </Typography>
                </Box>
                <Typography variant="h5" fontWeight={800} color="#1e293b" sx={{ letterSpacing: "-0.5px" }}>
                  {formatDateOnly(movimiento.fechaRegistro)}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <FlagIcon sx={{ fontSize: 18, color: "#ef4444" }} />
                  <Typography variant="caption" fontWeight={600} color="text.secondary" textTransform="uppercase">
                    Situación general
                  </Typography>
                </Box>
                <Chip 
                  label={situacionTexto} 
                  color={getSituacionColor(situacionTexto)}
                  sx={{ 
                    fontWeight: 800, 
                    fontSize: "0.85rem",
                    py: 2,
                    "& .MuiChip-label": { px: 2 }
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={2.5}>
          {/* Información lateral */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2.5, borderRadius: 2, height: "100%" }}>
              <Typography variant="subtitle1" fontWeight={900} mb={2}>Información</Typography>
              
              <Box display="flex" gap={1.5} alignItems="center" mb={2}>
                <PersonIcon sx={{ color: "#0f766e" }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">Empleado encargado</Typography>
                  <Typography fontWeight={900}>{empleadoNombre}</Typography>
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box display="flex" gap={1.5} alignItems="center" mb={2}>
                <AccessTimeIcon sx={{ color: "#0284c7" }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">Fecha de registro</Typography>
                  <Typography fontWeight={900}>{formatDateOnly(movimiento.fechaRegistro)}</Typography>
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box display="flex" gap={1.5} alignItems="flex-start">
                <InsertDriveFileIcon sx={{ color: "#7c3aed" }} />
                <Box flex={1}>
                  <Typography variant="caption" color="text.secondary">Archivo adjunto</Typography>
                  <Typography variant="body2" noWrap>
                    {movimiento.rutaArchivo || "Sin archivo"}
                  </Typography>
                  
                  {archivoInfo.url && (
                    <Box display="flex" gap={1} mt={1}>
                      <Button
                        component="a"
                        href={archivoInfo.url}
                        target="_blank"
                        size="small"
                        startIcon={<OpenInNewIcon />}
                        sx={{ p: 0, color: "#0f766e" }}
                      >
                        Abrir
                      </Button>
                      <Button
                        onClick={handleDownload}
                        disabled={downloading}
                        size="small"
                        startIcon={<CloudDownloadIcon />}
                        sx={{ p: 0, color: "#0f766e" }}
                      >
                        {downloading ? "Descargando..." : "Descargar"}
                      </Button>
                    </Box>
                  )}
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Descripción y archivo */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={2.5} direction="column">
              <Grid item>
                <Paper sx={{ p: 2.5, borderRadius: 2 }}>
                  <Typography variant="subtitle1" fontWeight={900} mb={1.5}>
                    Descripción
                  </Typography>
                  <Box sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: "#f0fdfa",
                    borderLeft: "4px solid #0f766e"
                  }}>
                    <Typography color="#334155">
                      {movimiento.descripcion || "—"}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item>
                <Paper sx={{ p: 2.5, borderRadius: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <Typography variant="subtitle1" fontWeight={900}>Vista previa</Typography>
                    {archivoInfo.url && (
                      <Box>
                        <IconButton onClick={handleMenuOpen} size="small">
                          <MoreVertIcon />
                        </IconButton>
                        <Menu
                          anchorEl={anchorEl}
                          open={Boolean(anchorEl)}
                          onClose={handleMenuClose}
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        >
                          <MenuItem onClick={() => window.open(archivoInfo.url, '_blank')}>
                            <ListItemIcon>{getFileIcon()}</ListItemIcon>
                            <ListItemText>Abrir en nueva pestaña</ListItemText>
                          </MenuItem>
                          <MenuItem onClick={handleDownload} disabled={downloading}>
                            <ListItemIcon><CloudDownloadIcon fontSize="small" /></ListItemIcon>
                            <ListItemText>{downloading ? "Descargando..." : "Descargar archivo"}</ListItemText>
                          </MenuItem>
                        </Menu>
                      </Box>
                    )}
                  </Box>
                  
                  {archivoInfo.url ? (
                    <>
                      {archivoInfo.isImage ? (
                        <Box>
                          <Box component="img" src={archivoInfo.url} sx={{ width: "100%", maxHeight: 400, objectFit: "contain", borderRadius: 1 }} />
                          <Box display="flex" justifyContent="center" gap={2} mt={2}>
                            <Button
                              variant="contained"
                              startIcon={<DownloadIcon />}
                              onClick={handleDownload}
                              disabled={downloading}
                              sx={{ bgcolor: "#0f766e", "&:hover": { bgcolor: "#155e75" } }}
                            >
                              {downloading ? "Descargando..." : "Descargar imagen"}
                            </Button>
                            <Button
                              variant="outlined"
                              startIcon={<OpenInNewIcon />}
                              onClick={() => window.open(archivoInfo.url, '_blank')}
                              sx={{ borderColor: "#0f766e", color: "#0f766e" }}
                            >
                              Abrir en nueva ventana
                            </Button>
                          </Box>
                        </Box>
                      ) : archivoInfo.isPdf ? (
                        <Box>
                          <Box sx={{ height: 400 }}>
                            <iframe src={archivoInfo.url} title="Documento" style={{ width: "100%", height: "100%", border: "none" }} />
                          </Box>
                          <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
                            <Button
                              variant="contained"
                              startIcon={<DownloadIcon />}
                              onClick={handleDownload}
                              disabled={downloading}
                              sx={{ bgcolor: "#0f766e", "&:hover": { bgcolor: "#155e75" } }}
                            >
                              {downloading ? "Descargando..." : "Descargar PDF"}
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        <Alert 
                          severity="info" 
                          action={
                            <Button color="inherit" size="small" startIcon={<DownloadIcon />} onClick={handleDownload} disabled={downloading}>
                              Descargar
                            </Button>
                          }
                        >
                          Este archivo no permite vista previa directa.
                        </Alert>
                      )}
                    </>
                  ) : (
                    <Alert severity="warning">No hay archivo adjunto.</Alert>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, borderTop: "1px solid #e2e8f0" }}>
        <Button onClick={onClose} variant="outlined" sx={{ color: "#0f766e", borderColor: "#0f766e" }}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Componente principal
export default function MovimientoImportacionDialog({ open, onClose, importacion, onUpdated }) {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [pasoSeleccionado, setPasoSeleccionado] = useState(null);
  const [detalleMovimiento, setDetalleMovimiento] = useState(null);

  const cargarMovimientos = async () => {
    if (!importacion?.id) return;
    try {
      setLoading(true);
      const res = await ServiceMovimientoImportacion.getByImportacion(importacion.id);
      setMovimientos(Array.isArray(res) ? res : res.items || []);
    } catch (e) {
      console.error("Error cargando movimientos:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && importacion?.id) cargarMovimientos();
  }, [open, importacion?.id]);

  const tiposCompletados = useMemo(
    () => new Set(movimientos.map((m) => (m.tipoMovimiento || "").toUpperCase().trim())),
    [movimientos]
  );

  const puedeSeleccionarPaso = (index) => {
    if (index === 0) return true;
    for (let i = 0; i < index; i++) {
      if (!tiposCompletados.has(PASOS[i].code)) return false;
    }
    return true;
  };

  const handleClickPaso = (paso, index) => {
    const completado = tiposCompletados.has(paso.code);
    if (completado) {
      const detalle = movimientos.find((m) => (m.tipoMovimiento || "").toUpperCase().trim() === paso.code);
      setDetalleMovimiento(detalle || null);
    } else if (puedeSeleccionarPaso(index)) {
      setPasoSeleccionado(paso);
      setShowForm(true);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setPasoSeleccionado(null);
  };

  const handleSuccessForm = async () => {
    setShowForm(false);
    setPasoSeleccionado(null);
    await cargarMovimientos();
    onUpdated?.();
  };

  if (!importacion) return null;

  const fechaLlegadaTexto = formatDateOnly(importacion.fechaLlegada);
  const situacionTexto = importacion.situacion || "En proceso";
  const progreso = movimientos.length;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        {/* Header */}
        <DialogTitle sx={{
          background: "linear-gradient(135deg, #3A1A1A 0%, #592B2B 100%)",
          color: "#fff",
          px: 3,
          py: 2
        }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box>
              <Box display="flex" alignItems="center" gap={1}>
                <RouteIcon />
                <Typography variant="h6" fontWeight={800}>Seguimiento de Importación</Typography>
              </Box>
              <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>
                {importacion.codigo ? `Código: ${importacion.codigo}` : `Importación #${importacion.id}`}
              </Typography>
            </Box>
            <Box display="flex" gap={1}>
              <Chip icon={<CalendarMonthIcon />} label={`Llegada: ${fechaLlegadaTexto}`} sx={{ bgcolor: "#fff", color: "#3A1A1A", fontWeight: 700 }} />
              <Chip label={`Situación: ${situacionTexto}`} color={getSituacionColor(situacionTexto)} sx={{ fontWeight: 700 }} />
            </Box>
          </Box>
        </DialogTitle>

        {/* Contenido */}
        <DialogContent sx={{ p: 3 }}>
          {/* Resumen */}
          <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary">Fecha llegada estimada</Typography>
                <Typography fontWeight={800}>{fechaLlegadaTexto}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary">Situación</Typography>
                <Chip label={situacionTexto} color={getSituacionColor(situacionTexto)} size="small" sx={{ mt: 0.5 }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary">Avance</Typography>
                <Typography fontWeight={800}>{progreso} de {PASOS.length} pasos</Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Timeline de pasos */}
          {loading ? (
            <Box display="flex" justifyContent="center" py={5}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2}>
              {PASOS.map((paso, index) => {
                const completado = tiposCompletados.has(paso.code);
                const habilitado = puedeSeleccionarPaso(index);
                
                return (
                  <Grid item xs={12} sm={6} md={3} key={paso.code}>
                    <Box
                      onClick={() => handleClickPaso(paso, index)}
                      sx={{
                        cursor: habilitado ? "pointer" : "not-allowed",
                        opacity: habilitado ? 1 : 0.5,
                        p: 2,
                        minHeight: 140,
                        borderRadius: 2,
                        textAlign: "center",
                        bgcolor: "#fff",
                        border: "1px solid",
                        borderColor: completado ? "#22c55e" : "#e5e7eb",
                        transition: "0.2s",
                        "&:hover": {
                          transform: habilitado ? "translateY(-4px)" : "none",
                          boxShadow: habilitado ? 2 : 0
                        }
                      }}
                    >
                      <Box sx={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        mx: "auto",
                        mb: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: completado ? "#dcfce7" : "#fee2e2"
                      }}>
                        {completado ? (
                          <CheckCircleOutlineIcon sx={{ color: "#16a34a", fontSize: 32 }} />
                        ) : (
                          <CancelOutlinedIcon sx={{ color: "#dc2626", fontSize: 32 }} />
                        )}
                      </Box>
                      <Typography fontWeight={800} fontSize={14}>{paso.label}</Typography>
                      <Chip label={completado ? "Completado" : "Pendiente"} size="small" color={completado ? "success" : "default"} sx={{ mt: 1 }} />
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </DialogContent>

        {/* Footer */}
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} variant="outlined">Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Formulario */}
      {showForm && pasoSeleccionado && (
        <MovimientoImportacionForm
          onClose={handleCloseForm}
          onSuccess={handleSuccessForm}
          initialData={null}
          presetTipoMovimiento={pasoSeleccionado.code}
          presetImportacion={{ id: importacion.id, codigo: importacion.codigo }}
        />
      )}

      {/* Detalle del movimiento */}
      <MovimientoDetalleDialog
        open={!!detalleMovimiento}
        onClose={() => setDetalleMovimiento(null)}
        movimiento={detalleMovimiento}
        importacion={importacion}
      />
    </>
  );
}