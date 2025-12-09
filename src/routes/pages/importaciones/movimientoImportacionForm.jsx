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
  Link,
} from "@mui/material";
import ServiceMovimientoImportacion from "@/services/ServiceMovimientoImportacion";
import { useAuth } from "@/context/AuthContext";

const filesBaseUrl = import.meta.env.VITE_FILES_URL || ""; // http://127.0.0.1:8000

// 📌 Catálogo de pasos (mismo que en el Dialog)
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

const MovimientoImportacionForm = ({
  onClose,
  onSuccess,
  initialData = null,
  presetTipoMovimiento = "",
  presetImportacion = null, // { id, codigo }
}) => {
  const { user } = useAuth();

  const empleadoLogueado = useMemo(() => {
    if (!user) return { id: "", nombre: "" };

    const id =
      user.empleadoId ??
      user.idEmpleado ??
      user.id ??
      user.empleado?.id ??
      "";

    const nombre =
      user.nombreCompleto ??
      user.nombre ??
      ([user.nombres, user.apellidos].filter(Boolean).join(" ") ||
        user.email ||
        "");

    return { id, nombre };
  }, [user]);

  const [form, setForm] = useState({
    importacionId: "",
    tipoMovimiento: "",
    descripcion: "",
    rutaArchivo: "",
    idEmpleadoEncargado: "",
  });

  const [archivoFile, setArchivoFile] = useState(null); // archivo seleccionado

  const [touched, setTouched] = useState({
    importacionId: false,
    tipoMovimiento: false,
    descripcion: false,
    rutaArchivo: false,
    idEmpleadoEncargado: false,
  });

  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  // ahora permite "_" por los códigos TRANS_INT, ADUANA_BO, etc.
  const regexTipoMovimiento = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 ._-]{1,10}$/;
  const regexNumero = /^[0-9]+$/;

  useEffect(() => {
    const importacionIdBase =
      presetImportacion?.id ?? initialData?.importacionId ?? "";

    const tipoMovimientoBase = (
      presetTipoMovimiento || initialData?.tipoMovimiento || ""
    ).trim();

    const idEmpleadoBase =
      initialData?.idEmpleadoEncargado ?? empleadoLogueado.id ?? "";

    setForm({
      importacionId: importacionIdBase ? String(importacionIdBase) : "",
      tipoMovimiento: tipoMovimientoBase, // aquí guardamos el CODE
      descripcion: initialData?.descripcion || "",
      rutaArchivo: initialData?.rutaArchivo || "",
      idEmpleadoEncargado: idEmpleadoBase ? String(idEmpleadoBase) : "",
    });

    setArchivoFile(null); // al editar, no hay archivo nuevo aún

    setFormError("");
    setTouched({
      importacionId: false,
      tipoMovimiento: false,
      descripcion: false,
      rutaArchivo: false,
      idEmpleadoEncargado: false,
    });
  }, [initialData, presetTipoMovimiento, presetImportacion, empleadoLogueado.id]);

  const handleChange = (field, value) => {
    let newVal = value;

    if (field === "importacionId") {
      newVal = newVal.replace(/[^0-9]/g, "");
    }

    if (field === "tipoMovimiento") {
      newVal = newVal.slice(0, 10);
    }

    setForm((prev) => ({ ...prev, [field]: newVal }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setArchivoFile(file);
    setTouched((prev) => ({ ...prev, rutaArchivo: true }));
  };

  const validateForm = () => {
    if (!form.importacionId?.trim()) {
      setFormError("Debe seleccionar una importación.");
      return false;
    }
    if (!regexNumero.test(form.importacionId)) {
      setFormError("El ID de importación debe ser numérico.");
      return false;
    }

    if (!form.tipoMovimiento?.trim()) {
      setFormError("Por favor indique el tipo de movimiento.");
      return false;
    }
    if (!regexTipoMovimiento.test(form.tipoMovimiento)) {
      setFormError("El tipo de movimiento no es válido.");
      return false;
    }

    if (!form.idEmpleadoEncargado?.trim()) {
      setFormError("No se pudo identificar el empleado encargado.");
      return false;
    }
    if (!regexNumero.test(form.idEmpleadoEncargado)) {
      setFormError("El ID de empleado debe ser numérico.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setFormError("");
    setTouched({
      importacionId: true,
      tipoMovimiento: true,
      descripcion: true,
      rutaArchivo: true,
      idEmpleadoEncargado: true,
    });

    if (!validateForm()) return;

    setLoading(true);
    try {
      // Normalizamos valores
      const payload = {
        importacionId: Number(form.importacionId),
        // 👉 aquí va el CODE al backend (PEDIDO, TRANS_INT, etc.)
        tipoMovimiento: form.tipoMovimiento.trim().toUpperCase(),
        descripcion: form.descripcion?.trim() || "",
        idEmpleadoEncargado: Number(form.idEmpleadoEncargado),
      };

      // Armamos FormData para enviar multipart/form-data
      const fd = new FormData();
      fd.append("importacionId", String(payload.importacionId));
      fd.append("tipoMovimiento", payload.tipoMovimiento);
      fd.append("idEmpleadoEncargado", String(payload.idEmpleadoEncargado));
      if (payload.descripcion) {
        fd.append("descripcion", payload.descripcion);
      }
      if (archivoFile) {
        fd.append("archivo", archivoFile);
      }

      console.log("📦 FormData movimiento:", {
        ...payload,
        archivo: archivoFile?.name,
      });

      if (initialData?.id) {
        await ServiceMovimientoImportacion.update(initialData.id, fd);
        toast.success("Movimiento de importación actualizado correctamente");
      } else {
        await ServiceMovimientoImportacion.create(fd);
        toast.success("Movimiento de importación registrado correctamente");
      }

      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error("Error submitting movimiento importación:", err);

      const rawDetail =
        err?.response?.data?.detail ||
        err?.response?.data ||
        err.message ||
        "Error al procesar el movimiento de importación";

      const msg =
        typeof rawDetail === "string"
          ? rawDetail
          : JSON.stringify(rawDetail, null, 2);

      setFormError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const displayCodigoImportacion =
    presetImportacion?.codigo ||
    (form.importacionId ? `IMP- ${form.importacionId}` : "");

  const displayEmpleado =
    empleadoLogueado.nombre ||
    (form.idEmpleadoEncargado ? `ID ${form.idEmpleadoEncargado}` : "");

  const existingFileUrl =
    form.rutaArchivo && filesBaseUrl
      ? `${filesBaseUrl}/archivos/${form.rutaArchivo}`
      : null;

  // 👉 Lo que muestra el input: LABEL si existe, si no el code crudo
  const tipoMovimientoDisplay =
    LABEL_BY_CODE[form.tipoMovimiento?.toUpperCase().trim()] ||
    form.tipoMovimiento;

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: "visible",
        },
      }}
    >
      <DialogTitle
        sx={{ borderBottom: "1px solid", borderColor: "divider", pb: 2 }}
      >
        <Typography variant="h6" fontWeight={600}>
          {initialData
            ? "Editar Movimiento de Importación"
            : "Nuevo Movimiento de Importación"}
        </Typography>
      </DialogTitle>

      <DialogContent
        sx={{
          py: 3,
          overflow: "visible",
          maxHeight: "70vh",
        }}
      >
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Importación"
                value={displayCodigoImportacion}
                disabled
                helperText="Se usará la importación seleccionada"
              />
            </Grid>

            <input
              type="hidden"
              value={form.importacionId}
              onChange={() => {}}
            />

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tipo de Movimiento"
                value={tipoMovimientoDisplay}
                disabled
                helperText="Se usará el paso seleccionado en la línea de tiempo"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Empleado encargado"
                value={displayEmpleado}
                disabled
                helperText="Se utilizará automáticamente el empleado que está logueado"
              />
            </Grid>

            <input
              type="hidden"
              value={form.idEmpleadoEncargado}
              onChange={() => {}}
            />

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Descripción"
                value={form.descripcion}
                onChange={(e) => handleChange("descripcion", e.target.value)}
                disabled={loading}
              />
            </Grid>

            {/* 📎 Archivo adjunto */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                Archivo (opcional)
              </Typography>
              <input
                type="file"
                onChange={handleFileChange}
                disabled={loading}
              />
              {archivoFile && (
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  Archivo seleccionado: <strong>{archivoFile.name}</strong>
                </Typography>
              )}

              {/* Si estamos editando y ya hay archivo guardado, mostramos enlace */}
              {existingFileUrl && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Archivo actual:{" "}
                  <Link
                    href={existingFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ver / descargar
                  </Link>
                </Typography>
              )}
            </Grid>
          </Grid>

          {formError && (
            <Alert severity="error" sx={{ mt: 3 }}>
              {formError}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{ minWidth: 120 }}
        >
          {loading ? "Guardando..." : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MovimientoImportacionForm;
