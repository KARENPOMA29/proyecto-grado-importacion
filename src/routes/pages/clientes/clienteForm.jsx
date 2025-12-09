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
  CircularProgress,
} from "@mui/material";
import ServiceCliente from "@/services/ServiceCliente";

const ClienteForm = ({ onClose, onSuccess, initialData = null }) => {
  const [form, setForm] = useState({
    razonSocial: "",
    nit: "",
    correo: "",
    telefono: "",
  });

  const [touched, setTouched] = useState({
    razonSocial: false,
    nit: false,
    correo: false,
    telefono: false,
  });

  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  // 👇 estados específicos para NIT
  const [checkingNit, setCheckingNit] = useState(false);
  const [nitError, setNitError] = useState("");
  const [nitExists, setNitExists] = useState(false);

  const handleChange = (field, value) => {
    let newValue = value;

    if (field === "nit" || field === "telefono") {
      newValue = newValue.replace(/\D/g, ""); // solo números
    }

    setForm((prev) => ({ ...prev, [field]: newValue }));
    setTouched((prev) => ({ ...prev, [field]: true }));

    // Si cambia algo, limpiamos el error global
    setFormError("");
  };

  // 🧠 Debounce para verificar NIT en tiempo real sin parpadeo
  useEffect(() => {
    const nitValue = form.nit?.trim();

    // reset rápido si está vacío o muy corto
    if (!nitValue || nitValue.length < 3) {
      setNitExists(false);
      setNitError("");
      setCheckingNit(false);
      return;
    }

    // si estamos editando y el NIT no cambió, no verificar
    if (initialData?.nit && nitValue === String(initialData.nit).trim()) {
      setNitExists(false);
      setNitError("");
      setCheckingNit(false);
      return;
    }

    let cancelado = false;

    const timer = setTimeout(async () => {
      try {
        setCheckingNit(true);
        // No tocamos formError aquí, solo nitError
        const allClientes = await ServiceCliente.getAll();
        const items = Array.isArray(allClientes)
          ? allClientes
          : allClientes.items || [];

        const existe = items.some(
          (cli) =>
            String(cli.nit).trim() === nitValue &&
            cli.estado === 1 &&
            (!initialData || cli.id !== initialData.id)
        );

        if (!cancelado) {
          setNitExists(existe);
          setNitError(existe ? "Ya existe un cliente activo con este NIT" : "");
        }
      } catch (err) {
        console.error("Error verificando NIT:", err);
        if (!cancelado) {
          setNitExists(false);
          setNitError("");
        }
      } finally {
        if (!cancelado) {
          setCheckingNit(false);
        }
      }
    }, 500); // ⏱ espera 500ms después de dejar de tipear

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [form.nit, initialData]);

  const validateForm = () => {
    if (!form.razonSocial || !form.nit || !form.correo || !form.telefono) {
      setFormError("Por favor complete todos los campos obligatorios");
      return false;
    }

    if (form.razonSocial.trim().length < 3) {
      setFormError("La razón social debe tener al menos 3 caracteres");
      return false;
    }

    if (!/^\d{3,15}$/.test(form.nit)) {
      setFormError("El NIT debe ser numérico (3 a 15 dígitos)");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.correo)) {
      setFormError("Ingrese un correo electrónico válido");
      return false;
    }

    if (!/^\d{7,8}$/.test(form.telefono)) {
      setFormError("El teléfono debe tener 7 u 8 dígitos");
      return false;
    }

    if (nitExists) {
      setFormError("Ya existe un cliente activo con ese NIT.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setFormError("");

    setTouched({
      razonSocial: true,
      nit: true,
      correo: true,
      telefono: true,
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
      razonSocial: initialData?.razonSocial || "",
      nit: initialData?.nit ? String(initialData.nit) : "",
      correo: initialData?.correo || "",
      telefono: initialData?.telefono || "",
    });
    setFormError("");
    setNitError("");
    setNitExists(false);
    setTouched({
      razonSocial: false,
      nit: false,
      correo: false,
      telefono: false,
    });
  }, [initialData]);

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
          {initialData ? "Editar Cliente" : "Nuevo Cliente"}
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
            {/* NIT primero */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="NIT"
                value={form.nit}
                onChange={(e) => handleChange("nit", e.target.value)}
                error={
                  touched.nit &&
                  (!!nitError || !/^\d{3,15}$/.test(form.nit))
                }
                helperText={
                  nitError
                    ? nitError
                    : touched.nit && !/^\d{3,15}$/.test(form.nit)
                    ? "Debe ser numérico (3 a 15 dígitos)"
                    : ""
                }
                required
                disabled={loading}
                InputProps={{
                  endAdornment: checkingNit ? (
                    <CircularProgress size={20} />
                  ) : null,
                }}
                inputProps={{ maxLength: 15 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Razón Social"
                value={form.razonSocial}
                onChange={(e) => handleChange("razonSocial", e.target.value)}
                error={touched.razonSocial && !form.razonSocial}
                helperText={
                  touched.razonSocial && !form.razonSocial
                    ? "Campo requerido"
                    : ""
                }
                required
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Teléfono"
                value={form.telefono}
                onChange={(e) => handleChange("telefono", e.target.value)}
                error={touched.telefono && !/^\d{7,8}$/.test(form.telefono)}
                helperText={
                  touched.telefono && !/^\d{7,8}$/.test(form.telefono)
                    ? "Debe tener 7 u 8 dígitos"
                    : ""
                }
                required
                disabled={loading}
                inputProps={{ maxLength: 8 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
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
                  touched.correo &&
                  (!form.correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo))
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
          disabled={loading || nitExists || checkingNit}
          sx={{ minWidth: 100 }}
        >
          {loading ? "Guardando..." : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ClienteForm;
