import { useState, useEffect } from "react";
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
} from "@mui/material";
import ServiceProveedor from "@/services/ServiceProveedor";

const ProveedorForm = ({ onClose, onSuccess, initialData = null }) => {
  const [form, setForm] = useState({
    razonSocial: initialData?.razonSocial || "",
    telefono: initialData?.telefono || "",
    encargado: initialData?.encargado || "",
    direccion: initialData?.direccion || "",
    ci: initialData?.ci || "",
  });

  // 👇 ahora touched por campo
  const [touched, setTouched] = useState({
    razonSocial: false,
    telefono: false,
    encargado: false,
    direccion: false,
    ci: false,
  });

  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  // regex permitidos
  const regexRazon = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .,-]+$/; // sin símbolos raros
  const regexEncargado = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/; // solo nombre
  const regexDireccion = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 #.,\-\/]+$/; // un poco más permisiva

  const handleChange = (field, value) => {
    // limpieza por campo
    let newValue = value;

    if (field === "razonSocial") {
      // no dejar caracteres raros pero sí espacios y ., -
      newValue = newValue.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .,-]/g, "");
    }

    if (field === "encargado") {
      // solo letras y espacios
      newValue = newValue.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ ]/g, "");
    }

    if (field === "ci") {
      newValue = newValue.replace(/\D/g, "");
    }

    if (field === "telefono") {
      newValue = newValue.replace(/\D/g, "");
    }

    if (field === "direccion") {
      // permitimos algunos
      newValue = newValue.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9 #.,\-\/]/g, "");
    }

    setForm((prev) => ({ ...prev, [field]: newValue }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const validateForm = () => {
    if (!form.razonSocial || !form.telefono || !form.encargado || !form.direccion || !form.ci) {
      setFormError("Por favor complete todos los campos obligatorios");
      return false;
    }

    if (!regexRazon.test(form.razonSocial)) {
      setFormError("La razón social no debe contener caracteres especiales");
      return false;
    }

    if (!regexEncargado.test(form.encargado)) {
      setFormError("El nombre del encargado solo debe tener letras y espacios");
      return false;
    }

    if (!/^\d{7,8}$/.test(form.ci)) {
      setFormError("El CI debe tener 7 u 8 dígitos");
      return false;
    }

    if (!/^\d{7,10}$/.test(form.telefono)) {
      setFormError("El teléfono debe tener entre 7 y 10 dígitos");
      return false;
    }

    if (!regexDireccion.test(form.direccion)) {
      setFormError("La dirección contiene caracteres no permitidos");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setFormError("");

    // marcar todos como tocados al enviar
    setTouched({
      razonSocial: true,
      telefono: true,
      encargado: true,
      direccion: true,
      ci: true,
    });

    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = { ...form };
      if (initialData?.id) {
        await ServiceProveedor.update(initialData.id, payload);
        toast.success("Proveedor actualizado correctamente");
      } else {
        await ServiceProveedor.create(payload);
        toast.success("Proveedor creado correctamente");
      }
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error("Error submitting proveedor form:", err);
      const msg =
        err.response?.data?.detail || err.message || "Error al procesar el proveedor";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setForm({
      razonSocial: initialData?.razonSocial || "",
      telefono: initialData?.telefono || "",
      encargado: initialData?.encargado || "",
      direccion: initialData?.direccion || "",
      ci: initialData?.ci || "",
    });
    setFormError("");
    // reset touched
    setTouched({
      razonSocial: false,
      telefono: false,
      encargado: false,
      direccion: false,
      ci: false,
    });
  }, [initialData]);

  return (
    <Dialog
      open={true} // si lo controlas desde afuera, cambia esto
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
        sx={{
          borderBottom: "1px solid",
          borderColor: "divider",
          pb: 2,
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          {initialData ? "Editar Proveedor" : "Nuevo Proveedor"}
        </Typography>
      </DialogTitle>

      <DialogContent
        sx={{
          py: 3,
          overflow: "visible",
          maxHeight: "65vh",
        }}
      >
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Razón Social"
                value={form.razonSocial}
                onChange={(e) => handleChange("razonSocial", e.target.value)}
                error={
                  touched.razonSocial &&
                  (!form.razonSocial || !regexRazon.test(form.razonSocial))
                }
                helperText={
                  touched.razonSocial && !form.razonSocial
                    ? "Campo requerido"
                    : touched.razonSocial && !regexRazon.test(form.razonSocial)
                    ? "No se permiten caracteres especiales"
                    : ""
                }
                required
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Encargado"
                value={form.encargado}
                onChange={(e) => handleChange("encargado", e.target.value)}
                error={
                  touched.encargado &&
                  (!form.encargado || !regexEncargado.test(form.encargado))
                }
                helperText={
                  touched.encargado && !form.encargado
                    ? "Campo requerido"
                    : touched.encargado && !regexEncargado.test(form.encargado)
                    ? "Solo letras y espacios"
                    : ""
                }
                required
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="CI"
                value={form.ci}
                onChange={(e) => handleChange("ci", e.target.value)}
                error={touched.ci && (!form.ci || !/^\d{7,8}$/.test(form.ci))}
                helperText={
                  touched.ci && (!form.ci || !/^\d{7,8}$/.test(form.ci))
                    ? "Debe tener 7 u 8 dígitos"
                    : ""
                }
                required
                disabled={loading}
                inputProps={{ maxLength: 8 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Teléfono"
                value={form.telefono}
                onChange={(e) => handleChange("telefono", e.target.value)}
                error={
                  touched.telefono && (!form.telefono || !/^\d{7,10}$/.test(form.telefono))
                }
                helperText={
                  touched.telefono && (!form.telefono || !/^\d{7,10}$/.test(form.telefono))
                    ? "Ingrese un teléfono válido"
                    : ""
                }
                required
                disabled={loading}
                inputProps={{ maxLength: 10 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dirección"
                value={form.direccion}
                onChange={(e) => handleChange("direccion", e.target.value)}
                error={
                  touched.direccion &&
                  (!form.direccion || !regexDireccion.test(form.direccion))
                }
                helperText={
                  touched.direccion && !form.direccion
                    ? "Campo requerido"
                    : touched.direccion && !regexDireccion.test(form.direccion)
                    ? "Caracter no permitido"
                    : ""
                }
                required
                disabled={loading}
              />
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
          sx={{ minWidth: 100 }}
        >
          {loading ? "Guardando..." : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProveedorForm;
