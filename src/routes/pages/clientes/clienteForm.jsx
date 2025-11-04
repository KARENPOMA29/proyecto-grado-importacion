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
import ServiceCliente from "@/services/ServiceCliente";

const ClienteForm = ({ onClose, onSuccess, initialData = null }) => {
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    segundoApellido: "",
    ci: "",
    correo: "",
  });

  // 👇 touched por campo
  const [touched, setTouched] = useState({
    nombre: false,
    apellido: false,
    segundoApellido: false,
    ci: false,
    correo: false,
  });

  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  // regex para nombres (letras, espacios, tildes)
  const regexNombre = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/;

  const handleChange = (field, value) => {
    let newValue = value;

    if (field === "nombre" || field === "apellido" || field === "segundoApellido") {
      // solo letras y espacios
      newValue = newValue.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ ]/g, "");
    }

    if (field === "ci") {
      newValue = newValue.replace(/\D/g, "");
    }

    setForm((prev) => ({ ...prev, [field]: newValue }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const validateForm = () => {
    if (!form.nombre || !form.apellido || !form.ci || !form.correo) {
      setFormError("Por favor complete todos los campos obligatorios");
      return false;
    }

    if (!regexNombre.test(form.nombre)) {
      setFormError("El nombre no debe tener caracteres especiales");
      return false;
    }

    if (!regexNombre.test(form.apellido)) {
      setFormError("El apellido no debe tener caracteres especiales");
      return false;
    }

    if (form.segundoApellido && !regexNombre.test(form.segundoApellido)) {
      setFormError("El segundo apellido no debe tener caracteres especiales");
      return false;
    }

    if (!/^\d{7,8}$/.test(form.ci)) {
      setFormError("El CI debe tener 7 u 8 dígitos");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.correo)) {
      setFormError("Ingrese un correo electrónico válido");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setFormError("");

    // marcar todos tocados al enviar
    setTouched({
      nombre: true,
      apellido: true,
      segundoApellido: true,
      ci: true,
      correo: true,
    });

    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = { ...form };
      if (initialData?.id) {
        await ServiceCliente.update(initialData.id, payload);
        toast.success("Cliente actualizado correctamente");
      } else {
        await ServiceCliente.create(payload);
        toast.success("Cliente creado correctamente");
      }
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error("Error submitting cliente form:", err);
      const msg =
        err.response?.data?.detail || err.message || "Error al procesar el cliente";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setForm({
      nombre: initialData?.nombre || "",
      apellido: initialData?.apellido || "",
      segundoApellido: initialData?.segundoApellido || "",
      ci: initialData?.ci || "",
      correo: initialData?.correo || "",
    });
    setFormError("");
    setTouched({
      nombre: false,
      apellido: false,
      segundoApellido: false,
      ci: false,
      correo: false,
    });
  }, [initialData]);

  return (
    <Dialog
      open={true} // en tu listado lo cambias por open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: "visible", // 👈 evita que se recorte el contenido
        },
      }}
    >
      <DialogTitle
        sx={{ borderBottom: "1px solid", borderColor: "divider", pb: 2 }}
      >
        <Typography variant="h6" fontWeight={600}>
          {initialData ? "Editar Cliente" : "Nuevo Cliente"}
        </Typography>
      </DialogTitle>

      <DialogContent
        sx={{
          py: 3,
          overflow: "visible",
          maxHeight: "65vh", // 👈 si hay poco alto, que haga scroll adentro
        }}
      >
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre"
                value={form.nombre}
                onChange={(e) => handleChange("nombre", e.target.value)}
                error={touched.nombre && (!form.nombre || !regexNombre.test(form.nombre))}
                helperText={
                  touched.nombre && !form.nombre
                    ? "Campo requerido"
                    : touched.nombre && !regexNombre.test(form.nombre)
                    ? "Solo letras y espacios"
                    : ""
                }
                required
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Apellido"
                value={form.apellido}
                onChange={(e) => handleChange("apellido", e.target.value)}
                error={
                  touched.apellido && (!form.apellido || !regexNombre.test(form.apellido))
                }
                helperText={
                  touched.apellido && !form.apellido
                    ? "Campo requerido"
                    : touched.apellido && !regexNombre.test(form.apellido)
                    ? "Solo letras y espacios"
                    : ""
                }
                required
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Segundo Apellido"
                value={form.segundoApellido}
                onChange={(e) => handleChange("segundoApellido", e.target.value)}
                error={
                  touched.segundoApellido &&
                  form.segundoApellido &&
                  !regexNombre.test(form.segundoApellido)
                }
                helperText={
                  touched.segundoApellido &&
                  form.segundoApellido &&
                  !regexNombre.test(form.segundoApellido)
                    ? "Solo letras y espacios"
                    : "Opcional"
                }
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} md={6}>
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

            <Grid item xs={12}>
              <TextField
                fullWidth
                type="email"
                label="Correo electrónico"
                value={form.correo}
                onChange={(e) => handleChange("correo", e.target.value)}
                error={
                  touched.correo &&
                  (!form.correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo))
                }
                helperText={
                  touched.correo && (!form.correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo))
                    ? "Ingrese un correo válido"
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

export default ClienteForm;
