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
  Dialog as InnerDialog,
  DialogContent as InnerContent,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ServiceMovimientoImportacion from "@/services/ServiceMovimientoImportacion";
import MovimientoImportacionForm from "./MovimientoImportacionForm";

// base para servir archivos (http://127.0.0.1:8000)
const filesBaseUrl = import.meta.env.VITE_FILES_URL || "";

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

// code ➜ label
const LABEL_BY_CODE = PASOS.reduce((acc, paso) => {
  acc[paso.code] = paso.label;
  return acc;
}, {});

export default function MovimientoImportacionDialog({
  open,
  onClose,
  importacion,
  onUpdated,
}) {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [pasoSeleccionado, setPasoSeleccionado] = useState(null);
  const [detalleMovimiento, setDetalleMovimiento] = useState(null);

  const cargarMovimientos = async () => {
    if (!importacion?.id) return;
    try {
      setLoading(true);
      const res = await ServiceMovimientoImportacion.getByImportacion(
        importacion.id
      );
      const items = Array.isArray(res) ? res : res.items || [];
      setMovimientos(items);
      console.log("🔄 Movimientos cargados:", items);
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
    () =>
      new Set(
        movimientos.map((m) => (m.tipoMovimiento || "").toUpperCase().trim())
      ),
    [movimientos]
  );

  const puedeSeleccionarPaso = (index) => {
    if (index === 0) return true;
    for (let i = 0; i < index; i++) {
      const prevCode = PASOS[i].code;
      if (!tiposCompletados.has(prevCode)) return false;
    }
    return true;
  };

  // helper: nombre del empleado
  const getNombreEmpleado = (mov) => {
    if (mov.empleadoNombre) return mov.empleadoNombre;

    if (mov.empleado_encargado) {
      const e = mov.empleado_encargado;
      return (
        e.nombreCompleto ||
        [e.nombres, e.apellidos].filter(Boolean).join(" ") ||
        e.nombre ||
        `ID ${mov.idEmpleadoEncargado}`
      );
    }

    return `ID ${mov.idEmpleadoEncargado}`;
  };

  const handleClickPaso = (paso, index) => {
    const completado = tiposCompletados.has(paso.code);

    if (completado) {
      const detalle = movimientos.find(
        (m) => (m.tipoMovimiento || "").toUpperCase().trim() === paso.code
      );
      setDetalleMovimiento(detalle || null);
      return;
    }

    if (puedeSeleccionarPaso(index)) {
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

  const handleCloseDetalle = () => setDetalleMovimiento(null);

  if (!importacion) return null;

  const fechaLlegadaTexto = importacion.fechaLlegada
    ? new Date(importacion.fechaLlegada).toLocaleDateString()
    : "-";

  // helper archivo
  const getFileInfo = (ruta) => {
    if (!ruta || !filesBaseUrl)
      return { url: null, isImage: false, isPdf: false };
    const url = `${filesBaseUrl}/archivos/${ruta}`;
    const lower = ruta.toLowerCase();
    const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(lower);
    const isPdf = /\.pdf$/i.test(lower);
    return { url, isImage, isPdf };
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: "#f4f1fa",
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={600}>
              Seguimiento de Importación
            </Typography>

            <Box textAlign="right">
              <Typography variant="caption" display="block">
                Fecha Llegada Estimada:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 999,
                  backgroundColor: "#e0d7ff",
                }}
              >
                {fechaLlegadaTexto}
              </Typography>
            </Box>
          </Box>

          <Typography variant="subtitle1" sx={{ mt: 1 }}>
            {importacion.codigo
              ? `IMP-${importacion.codigo}`
              : `IMP-${importacion.id}`}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ pt: 2, pb: 1 }}>
          {loading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              sx={{ py: 4 }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {PASOS.map((paso, index) => {
                const completado = tiposCompletados.has(paso.code);
                const habilitado = puedeSeleccionarPaso(index);

                return (
                  <Grid item xs={6} sm={3} key={paso.code}>
                    <Box
                      onClick={() => handleClickPaso(paso, index)}
                      sx={{
                        cursor: habilitado ? "pointer" : "not-allowed",
                        opacity: habilitado ? 1 : 0.4,
                        textAlign: "center",
                        transition: "0.3s",
                        "&:hover": {
                          transform: habilitado ? "scale(1.05)" : "none",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 90,
                          height: 90,
                          borderRadius: "50%",
                          border: "3px solid",
                          borderColor: completado
                            ? "success.main"
                            : "error.main",
                          mx: "auto",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: completado
                            ? "#d1fae5"
                            : "#fee2e2",
                        }}
                      >
                        {completado ? (
                          <CheckCircleOutlineIcon
                            sx={{ fontSize: 50, color: "success.main" }}
                          />
                        ) : (
                          <CancelOutlinedIcon
                            sx={{ fontSize: 50, color: "error.main" }}
                          />
                        )}
                      </Box>

                      <Typography
                        variant="body2"
                        sx={{ mt: 1, fontWeight: 500 }}
                      >
                        {paso.label}
                      </Typography>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} variant="outlined">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para registrar movimiento */}
      {showForm && pasoSeleccionado && (
        <MovimientoImportacionForm
          onClose={handleCloseForm}
          onSuccess={handleSuccessForm}
          initialData={null}
          presetTipoMovimiento={pasoSeleccionado.code}
          presetImportacion={{
            id: importacion.id,
            codigo: importacion.codigo,
          }}
        />
      )}

      {/* Modal de detalles de un movimiento completado */}
      {detalleMovimiento && (
        <InnerDialog
          open={!!detalleMovimiento}
          onClose={handleCloseDetalle}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 3, overflow: "hidden" },
          }}
        >
          <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <InfoOutlinedIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Detalles del movimiento
            </Typography>
          </DialogTitle>
          <InnerContent sx={{ py: 2 }}>
            <Typography>
              <b>Tipo:</b>{" "}
              {detalleMovimiento.tipoMovimiento}{" "}
              {LABEL_BY_CODE[
                detalleMovimiento.tipoMovimiento?.toUpperCase().trim()
              ] &&
                ` - ${
                  LABEL_BY_CODE[
                    detalleMovimiento.tipoMovimiento?.toUpperCase().trim()
                  ]
                }`}
            </Typography>

            <Typography sx={{ mt: 1 }}>
              <b>Empleado Encargado:</b>{" "}
              {getNombreEmpleado(detalleMovimiento)}
            </Typography>

            <Typography sx={{ mt: 1 }}>
              <b>Descripción:</b>{" "}
              {detalleMovimiento.descripcion || "—"}
            </Typography>
            <Typography sx={{ mt: 1 }}>
              <b>Fecha Registro:</b>{" "}
              {new Date(detalleMovimiento.fechaRegistro).toLocaleString()}
            </Typography>

            {/* Archivo adjunto: vista previa + descarga */}
            <Box sx={{ mt: 2 }}>
              <Typography>
                <b>Archivo adjunto:</b>
              </Typography>
              {detalleMovimiento.rutaArchivo ? (
                (() => {
                  const { url, isImage, isPdf } = getFileInfo(
                    detalleMovimiento.rutaArchivo
                  );
                  if (!url) {
                    return <Typography variant="body2">—</Typography>;
                  }

                  return (
                    <>
                      {isImage && (
                        <Box
                          component="img"
                          src={url}
                          alt="Vista previa archivo"
                          sx={{
                            mt: 1,
                            maxWidth: "100%",
                            maxHeight: 300,
                            borderRadius: 2,
                            boxShadow: 1,
                            objectFit: "contain",
                            backgroundColor: "#f5f5f5",
                          }}
                        />
                      )}

                      {isPdf && (
                        <Box
                          sx={{
                            mt: 1,
                            height: 300,
                            borderRadius: 2,
                            overflow: "hidden",
                            boxShadow: 1,
                            backgroundColor: "#f5f5f5",
                          }}
                        >
                          <iframe
                            src={url}
                            title="Vista previa documento"
                            style={{
                              width: "100%",
                              height: "100%",
                              border: "none",
                            }}
                          />
                        </Box>
                      )}

                      {!isImage && !isPdf && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          Vista previa no disponible para este tipo de archivo.
                        </Typography>
                      )}

                      <Button
                        component="a"
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="outlined"
                        sx={{ mt: 1 }}
                      >
                        Ver / Descargar archivo
                      </Button>
                    </>
                  );
                })()
              ) : (
                <Typography variant="body2">—</Typography>
              )}
            </Box>
          </InnerContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseDetalle} variant="contained">
              Cerrar
            </Button>
          </DialogActions>
        </InnerDialog>
      )}
    </>
  );
}
