// src/pages/importaciones/MovimientoImportacionForm.jsx
import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  Grid,
  Paper,
  Divider,
  Chip,
  IconButton,
  Zoom,
  Fade,
  Collapse,
} from "@mui/material";

// Íconos
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DescriptionIcon from "@mui/icons-material/Description";
import RouteIcon from "@mui/icons-material/Route";
import PersonIcon from "@mui/icons-material/Person";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditNoteIcon from "@mui/icons-material/EditNote";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";

import ServiceMovimientoImportacion from "@/services/ServiceMovimientoImportacion";
import { useAuth } from "@/context/AuthContext";

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
const getFileType = (name = "") => {
  const lower = name.toLowerCase();
  return {
    isImage: /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(lower),
    isPdf: /\.pdf$/i.test(lower),
    isDocument: /\.(doc|docx)$/i.test(lower),
    isExcel: /\.(xls|xlsx)$/i.test(lower),
  };
};

const getFileIcon = (fileName) => {
  const { isImage, isPdf, isDocument, isExcel } = getFileType(fileName);
  if (isImage) return <ImageIcon sx={{ fontSize: 40, color: "#4caf50" }} />;
  if (isPdf) return <PictureAsPdfIcon sx={{ fontSize: 40, color: "#f44336" }} />;
  if (isDocument) return <DescriptionIcon sx={{ fontSize: 40, color: "#2196f3" }} />;
  if (isExcel) return <DescriptionIcon sx={{ fontSize: 40, color: "#4caf50" }} />;
  return <InsertDriveFileIcon sx={{ fontSize: 40, color: "#9e9e9e" }} />;
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const isValidDescription = (text) => {
  return /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s.,;:()¿?¡!°ºª%/-]+$/.test(text);
};

const MovimientoImportacionForm = ({
  onClose,
  onSuccess,
  initialData = null,
  presetTipoMovimiento = "",
  presetImportacion = null,
}) => {
  const { user } = useAuth();

  const empleadoLogueado = useMemo(() => {
    if (!user) return { id: "", nombre: "" };
    const id = user.empleadoId ?? user.idEmpleado ?? user.id ?? user.empleado?.id ?? "";
    const nombre = user.nombreCompleto ?? user.nombre ?? 
      ([user.nombres, user.apellidos].filter(Boolean).join(" ") || user.email || "");
    return { id, nombre };
  }, [user]);

  const [form, setForm] = useState({
    importacionId: "",
    tipoMovimiento: "",
    descripcion: "",
    rutaArchivo: "",
    idEmpleadoEncargado: "",
  });

  const [archivoFile, setArchivoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fileInfo, setFileInfo] = useState({ name: "", size: 0, type: "" });

  const regexTipoMovimiento = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 ._-]{1,20}$/;
  const regexNumero = /^[0-9]+$/;

  useEffect(() => {
    const importacionIdBase = presetImportacion?.id ?? initialData?.importacionId ?? "";
    const tipoMovimientoBase = (presetTipoMovimiento || initialData?.tipoMovimiento || "").trim();
    const idEmpleadoBase = initialData?.idEmpleadoEncargado ?? empleadoLogueado.id ?? "";

    setForm({
      importacionId: importacionIdBase ? String(importacionIdBase) : "",
      tipoMovimiento: tipoMovimientoBase,
      descripcion: initialData?.descripcion || "",
      rutaArchivo: initialData?.rutaArchivo || "",
      idEmpleadoEncargado: idEmpleadoBase ? String(idEmpleadoBase) : "",
    });

    setArchivoFile(null);
    setPreviewUrl(null);
    setShowPreview(false);
    setFormError("");
    setFieldErrors({});
  }, [initialData, presetTipoMovimiento, presetImportacion, empleadoLogueado.id]);

  useEffect(() => {
    if (!archivoFile) {
      setPreviewUrl(null);
      setFileInfo({ name: "", size: 0, type: "" });
      return;
    }
    const url = URL.createObjectURL(archivoFile);
    setPreviewUrl(url);
    setFileInfo({
      name: archivoFile.name,
      size: archivoFile.size,
      type: archivoFile.type,
    });
    return () => URL.revokeObjectURL(url);
  }, [archivoFile]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setFieldErrors(prev => ({ ...prev, [field]: "" }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    const allowedExtensions = /\.(jpg|jpeg|png|webp|pdf|doc|docx|xls|xlsx)$/i;
    
    if (!allowedExtensions.test(file.name)) {
      setFieldErrors(prev => ({
        ...prev,
        archivo: "Formato no permitido. Adjunte PDF, imagen, Word o Excel.",
      }));
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors(prev => ({
        ...prev,
        archivo: "El archivo no puede superar los 5MB.",
      }));
      e.target.value = "";
      return;
    }

    setArchivoFile(file);
    setShowPreview(true);
    setFieldErrors(prev => ({ ...prev, archivo: "" }));
    e.target.value = "";
  };

  const handleRemoveFile = () => {
    setArchivoFile(null);
    if (!initialData?.rutaArchivo) {
      setForm(prev => ({ ...prev, rutaArchivo: "" }));
    }
    setPreviewUrl(null);
    setShowPreview(false);
    setFileInfo({ name: "", size: 0, type: "" });
    setFieldErrors(prev => ({ ...prev, archivo: "" }));
  };

  const validateForm = () => {
    const errors = {};

    if (!form.importacionId?.trim()) {
      errors.importacionId = "Debe seleccionar una importación.";
    } else if (!regexNumero.test(form.importacionId)) {
      errors.importacionId = "El ID de importación debe ser numérico.";
    }

    if (!form.tipoMovimiento?.trim()) {
      errors.tipoMovimiento = "Debe indicar el tipo de movimiento.";
    } else if (!regexTipoMovimiento.test(form.tipoMovimiento)) {
      errors.tipoMovimiento = "El tipo de movimiento no es válido.";
    }

    if (!form.idEmpleadoEncargado?.trim()) {
      errors.idEmpleadoEncargado = "No se pudo identificar el empleado encargado.";
    } else if (!regexNumero.test(form.idEmpleadoEncargado)) {
      errors.idEmpleadoEncargado = "El ID de empleado debe ser numérico.";
    }

    const descripcion = form.descripcion.trim();
    if (!descripcion) {
      errors.descripcion = "La descripción es obligatoria.";
    } else if (descripcion.length < 8) {
      errors.descripcion = "La descripción debe tener al menos 8 caracteres.";
    } else if (!isValidDescription(descripcion)) {
      errors.descripcion = "La descripción solo debe contener texto formal, números y signos básicos.";
    }

    const tieneArchivoActual = Boolean(form.rutaArchivo);
    const tieneArchivoNuevo = Boolean(archivoFile);

    if (!tieneArchivoActual && !tieneArchivoNuevo) {
      errors.archivo = "Debe adjuntar una imagen o documento.";
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setFormError("Complete correctamente los campos obligatorios.");
      return false;
    }

    setFormError("");
    return true;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("importacionId", String(Number(form.importacionId)));
      fd.append("tipoMovimiento", form.tipoMovimiento.trim().toUpperCase());
      fd.append("descripcion", form.descripcion.trim());
      fd.append("idEmpleadoEncargado", String(Number(form.idEmpleadoEncargado)));

      if (archivoFile) {
        fd.append("archivo", archivoFile);
      }

      if (initialData?.id) {
        await ServiceMovimientoImportacion.update(initialData.id, fd);
        toast.success("Movimiento actualizado correctamente");
      } else {
        await ServiceMovimientoImportacion.create(fd);
        toast.success("Movimiento registrado correctamente");
      }

      onSuccess?.();
      onClose?.();
    } catch (err) {
      const rawDetail = err?.response?.data?.detail || err?.response?.data || err.message || "Error al procesar el movimiento";
      const msg = typeof rawDetail === "string" ? rawDetail : JSON.stringify(rawDetail, null, 2);
      setFormError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const displayCodigoImportacion = presetImportacion?.codigo || (form.importacionId ? `IMP-${form.importacionId}` : "");
  const displayEmpleado = empleadoLogueado.nombre || (form.idEmpleadoEncargado ? `ID ${form.idEmpleadoEncargado}` : "");
  const existingFileUrl = form.rutaArchivo && filesBaseUrl ? `${filesBaseUrl}/archivos/${form.rutaArchivo}` : null;
  const tipoMovimientoCode = form.tipoMovimiento?.toUpperCase().trim();
  const tipoMovimientoDisplay = LABEL_BY_CODE[tipoMovimientoCode] || form.tipoMovimiento;
  const currentFileName = archivoFile?.name || form.rutaArchivo || "";
  const hasSelectedFile = Boolean(archivoFile || form.rutaArchivo);
  const currentPreviewUrl = previewUrl || existingFileUrl;
  const { isImage, isPdf } = getFileType(currentFileName);

  return (
    <Dialog
      open={true}
      onClose={loading ? undefined : onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
          backgroundColor: "#f8f7fb",
        },
      }}
    >
      {/* Header */}
      <DialogTitle sx={{
        background: "linear-gradient(135deg, #3A1A1A 0%, #592B2B 100%)",
        color: "#fff",
        px: 3,
        py: 2.5
      }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <RouteIcon sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h6" fontWeight={800}>
              {initialData ? "Editar Movimiento" : "Nuevo Movimiento"}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              Complete la información del movimiento y adjunte el documento de respaldo
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ px: 3, py: 3, bgcolor: "#f8f7fb" }}>
        <Box component="form" noValidate>
          <Grid container spacing={3}>
            {/* Tarjeta de información */}
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: "1px solid #e4dfe8", bgcolor: "#fff" }}>
                <Box display="flex" alignItems="center" gap={1} mb={2.5}>
                  <Inventory2Icon sx={{ color: "#592B2B" }} />
                  <Typography fontWeight={800} fontSize={16}>Información del movimiento</Typography>
                  <Chip label="Obligatorio" size="small" sx={{ ml: "auto", fontWeight: 700, color: "#592B2B", bgcolor: "#f3e5e5" }} />
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Importación"
                      value={displayCodigoImportacion}
                      disabled
                      size="small"
                      error={Boolean(fieldErrors.importacionId)}
                      helperText={fieldErrors.importacionId || "Importación seleccionada automáticamente"}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Paso / Tipo de movimiento"
                      value={tipoMovimientoDisplay}
                      disabled
                      size="small"
                      error={Boolean(fieldErrors.tipoMovimiento)}
                      helperText={fieldErrors.tipoMovimiento || `Código: ${tipoMovimientoCode || "—"}`}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Empleado encargado"
                      value={displayEmpleado}
                      disabled
                      size="small"
                      error={Boolean(fieldErrors.idEmpleadoEncargado)}
                      helperText={fieldErrors.idEmpleadoEncargado || "Empleado que inició sesión"}
                      InputProps={{ startAdornment: <PersonIcon sx={{ mr: 1, color: "text.secondary", fontSize: 18 }} /> }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Descripción */}
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: "1px solid #e4dfe8", bgcolor: "#fff", height: "100%" }}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <EditNoteIcon sx={{ color: "#592B2B" }} />
                  <Typography fontWeight={800}>Descripción del movimiento</Typography>
                </Box>
                <TextField
                  fullWidth
                  required
                  multiline
                  rows={8}
                  placeholder="Ejemplo: La importación llegó a puerto y se adjunta el documento de respaldo correspondiente..."
                  value={form.descripcion}
                  onChange={(e) => handleChange("descripcion", e.target.value)}
                  disabled={loading}
                  error={Boolean(fieldErrors.descripcion)}
                  helperText={fieldErrors.descripcion || "Mínimo 8 caracteres. Use redacción formal."}
                />
              </Paper>
            </Grid>

            {/* Documento con vista previa dinámica */}
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: "1px solid #e4dfe8", bgcolor: "#fff", height: "100%" }}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <AttachFileIcon sx={{ color: "#592B2B" }} />
                  <Typography fontWeight={800}>Documento de respaldo</Typography>
                  <Chip label="Obligatorio" size="small" sx={{ ml: "auto", fontWeight: 700, color: "#592B2B", bgcolor: "#f3e5e5" }} />
                </Box>

                {/* Área de carga */}
                <Box sx={{
                  p: 2.5,
                  borderRadius: 2,
                  textAlign: "center",
                  border: fieldErrors.archivo ? "2px solid #d32f2f" : "2px dashed #c9b6b6",
                  bgcolor: hasSelectedFile ? "#fef9f9" : "#faf8f8",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                  "&:hover": { bgcolor: "#f5f0f0" }
                }}>
                  <Fade in={!hasSelectedFile}>
                    <Box>
                      <CloudUploadIcon sx={{ fontSize: 48, color: "#592B2B", opacity: 0.7 }} />
                      <Typography fontWeight={700} sx={{ mt: 1.5, mb: 0.5 }}>
                        Adjunte documento
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                        PDF, JPG, PNG, Word o Excel (máx. 5MB)
                      </Typography>
                      <Button
                        component="label"
                        variant="contained"
                        disabled={loading || hasSelectedFile}
                        size="small"
                        sx={{
                          borderRadius: 2,
                          textTransform: "none",
                          fontWeight: 700,
                          backgroundColor: "#592B2B",
                          "&:hover": { backgroundColor: "#3A1A1A" }
                        }}
                      >
                        Seleccionar archivo
                        <input hidden type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx" onChange={handleFileChange} />
                      </Button>
                    </Box>
                  </Fade>

                  <Collapse in={hasSelectedFile}>
                    <Box>
                      <Zoom in={hasSelectedFile}>
                        <Box>
                          {getFileIcon(currentFileName)}
                          <Typography fontWeight={700} sx={{ mt: 1 }}>
                            {currentFileName.length > 30 ? currentFileName.substring(0, 30) + "..." : currentFileName}
                          </Typography>
                          {fileInfo.size > 0 && (
                            <Typography variant="caption" color="text.secondary">
                              {formatFileSize(fileInfo.size)}
                            </Typography>
                          )}
                          <Box display="flex" gap={1} justifyContent="center" mt={2}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<VisibilityIcon />}
                              onClick={() => setShowPreview(!showPreview)}
                              sx={{ borderRadius: 2, textTransform: "none" }}
                            >
                              {showPreview ? "Ocultar vista" : "Ver vista previa"}
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<DeleteOutlineIcon />}
                              onClick={handleRemoveFile}
                              disabled={loading}
                              sx={{ borderRadius: 2, textTransform: "none" }}
                            >
                              Eliminar
                            </Button>
                          </Box>
                        </Box>
                      </Zoom>
                    </Box>
                  </Collapse>
                </Box>

                {/* Vista previa dinámica */}
                <Collapse in={showPreview && hasSelectedFile && currentPreviewUrl}>
                  <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: "#f5f5f5", border: "1px solid #e0e0e0" }}>
                    <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
                      Vista previa del documento
                    </Typography>
                    {isImage && (
                      <Box
                        component="img"
                        src={currentPreviewUrl}
                        alt="Vista previa"
                        sx={{
                          width: "100%",
                          maxHeight: 250,
                          objectFit: "contain",
                          borderRadius: 1,
                          border: "1px solid #ddd"
                        }}
                      />
                    )}
                    {isPdf && (
                      <Box sx={{ height: 300 }}>
                        <iframe
                          src={currentPreviewUrl}
                          title="Vista previa PDF"
                          style={{ width: "100%", height: "100%", border: "none", borderRadius: 8 }}
                        />
                      </Box>
                    )}
                    {!isImage && !isPdf && (
                      <Box textAlign="center" py={4}>
                        <DescriptionIcon sx={{ fontSize: 60, color: "#999" }} />
                        <Typography color="text.secondary" mt={1}>
                          Vista previa no disponible para este tipo de archivo
                        </Typography>
                        <Button
                          component="a"
                          href={currentPreviewUrl}
                          target="_blank"
                          variant="contained"
                          size="small"
                          sx={{ mt: 2, backgroundColor: "#592B2B" }}
                        >
                          Abrir archivo
                        </Button>
                      </Box>
                    )}
                  </Box>
                </Collapse>
              </Paper>
            </Grid>
          </Grid>

          {formError && (
            <Fade in={!!formError}>
              <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
                {formError}
              </Alert>
            </Fade>
          )}
        </Box>
      </DialogContent>

      <Divider />

      {/* Footer */}
      <DialogActions sx={{ px: 3, py: 2, gap: 1.5, bgcolor: "#fff" }}>
        <Button 
          onClick={onClose} 
          variant="outlined" 
          disabled={loading}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{
            minWidth: 140,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 700,
            backgroundColor: "#592B2B",
            "&:hover": { backgroundColor: "#3A1A1A" }
          }}
        >
          {loading ? "Guardando..." : "Guardar movimiento"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MovimientoImportacionForm;