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
      open
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: "0 12px 36px rgba(0,0,0,0.18)",
        },
      }}
    >
      <DialogTitle
        sx={{
          p: 2.5,
          pb: 2,
          background: "linear-gradient(135deg, #592B2B 0%, #3A1A1A 100%)",
          color: "#F5F5F5",
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          {initialData ? "Editar Cliente" : "Nuevo Cliente"}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
          Complete la información comercial del cliente.
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ py: 3, px: 3, bgcolor: "#FAFAFA" }}>
        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{
            bgcolor: "#FFFFFF",
            borderRadius: 2,
            p: 2.5,
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}
        >
          <Grid container spacing={2}>
            {[
              {
                field: "nit",
                label: "NIT",
                value: form.nit,
                error:
                  touched.nit &&
                  (!!nitError || !/^\d{3,15}$/.test(form.nit)),
                helper:
                  nitError ||
                  (touched.nit && !/^\d{3,15}$/.test(form.nit)
                    ? "Debe ser numérico (3 a 15 dígitos)"
                    : "Obligatorio"),
                props: {
                  inputProps: { maxLength: 15 },
                  InputProps: {
                    endAdornment: checkingNit ? (
                      <CircularProgress size={18} />
                    ) : null,
                  },
                },
              },
              {
                field: "razonSocial",
                label: "Razón Social",
                value: form.razonSocial,
                error: touched.razonSocial && !form.razonSocial,
                helper:
                  touched.razonSocial && !form.razonSocial
                    ? "Campo requerido"
                    : "Obligatorio",
              },
              {
                field: "telefono",
                label: "Teléfono",
                value: form.telefono,
                error:
                  touched.telefono && !/^\d{7,8}$/.test(form.telefono),
                helper:
                  touched.telefono && !/^\d{7,8}$/.test(form.telefono)
                    ? "Debe tener 7 u 8 dígitos"
                    : "Obligatorio",
                props: { inputProps: { maxLength: 8 } },
              },
              {
                field: "correo",
                label: "Correo electrónico",
                value: form.correo,
                type: "email",
                error:
                  touched.correo &&
                  (!form.correo ||
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)),
                helper:
                  touched.correo &&
                  (!form.correo ||
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo))
                    ? "Ingrese un correo válido"
                    : "Obligatorio",
              },
            ].map((item) => (
              <Grid item xs={12} sm={6} key={item.field}>
                <TextField
                  fullWidth
                  size="small"
                  type={item.type || "text"}
                  label={item.label}
                  value={item.value}
                  onChange={(e) => handleChange(item.field, e.target.value)}
                  error={!!item.error}
                  helperText={item.helper}
                  required
                  disabled={loading}
                  {...(item.props || {})}
                />
              </Grid>
            ))}
          </Grid>

          {formError && (
            <Alert severity="error" sx={{ mt: 3 }}>
              {formError}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2.5, gap: 1.5 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={loading}
          sx={{
            textTransform: "none",
            borderRadius: 999,
            px: 3,
            borderColor: "#e0e0e0",
            color: "rgba(0,0,0,0.7)",
            "&:hover": {
              borderColor: "#d32f2f",
              color: "#d32f2f",
              backgroundColor: "rgba(211,47,47,0.04)",
            },
          }}
        >
          Cancelar
        </Button>

        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || nitExists || checkingNit}
          sx={{
            textTransform: "none",
            borderRadius: 999,
            px: 4,
            minWidth: 140,
            fontWeight: 600,
            background: "linear-gradient(135deg, #14AE5C 0%, #0D8C47 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #0D8C47 0%, #0A6B37 100%)",
              boxShadow: "0 4px 12px rgba(20,174,92,0.4)",
            },
          }}
        >
          {loading ? "Guardando..." : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ClienteForm;
