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

const initialTouched = {
  razonSocial: false,
  telefono: false,
  encargado: false,
  direccion: false,
  ci: false,
};

const regex = {
  razonSocial: /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .,-]+$/,
  encargado: /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/,
  direccion: /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 #.,\-\/]+$/,
  ci: /^\d{7,8}$/,
  telefono: /^\d{7,10}$/,
};

const ProveedorForm = ({ onClose, onSuccess, initialData = null }) => {
  const [form, setForm] = useState({
    razonSocial: "",
    telefono: "",
    encargado: "",
    direccion: "",
    ci: "",
  });

  const [touched, setTouched] = useState(initialTouched);
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    let newValue = value;

    const cleaners = {
      razonSocial: /[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .,-]/g,
      encargado: /[^A-Za-zÁÉÍÓÚáéíóúÑñ ]/g,
      direccion: /[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9 #.,\-\/]/g,
      ci: /\D/g,
      telefono: /\D/g,
    };

    newValue = newValue.replace(cleaners[field], "");

    setForm((prev) => ({ ...prev, [field]: newValue }));
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFormError("");
  };

  const validateForm = () => {
    if (
      !form.razonSocial ||
      !form.telefono ||
      !form.encargado ||
      !form.direccion ||
      !form.ci
    ) {
      setFormError("Por favor complete todos los campos obligatorios");
      return false;
    }

    if (!regex.razonSocial.test(form.razonSocial)) {
      setFormError("La razón social no debe contener caracteres especiales");
      return false;
    }

    if (!regex.encargado.test(form.encargado)) {
      setFormError("El nombre del encargado solo debe tener letras y espacios");
      return false;
    }

    if (!regex.ci.test(form.ci)) {
      setFormError("El CI debe tener 7 u 8 dígitos");
      return false;
    }

    if (!regex.telefono.test(form.telefono)) {
      setFormError("El teléfono debe tener entre 7 y 10 dígitos");
      return false;
    }

    if (!regex.direccion.test(form.direccion)) {
      setFormError("La dirección contiene caracteres no permitidos");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    setFormError("");
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
      const payload = {
        razonSocial: form.razonSocial.trim(),
        telefono: form.telefono.trim(),
        encargado: form.encargado.trim(),
        direccion: form.direccion.trim(),
        ci: form.ci.trim(),
      };

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
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Error al procesar el proveedor";

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
    setTouched(initialTouched);
  }, [initialData]);

  const campos = [
    {
      field: "razonSocial",
      label: "Razón Social",
      value: form.razonSocial,
      error: touched.razonSocial && (!form.razonSocial || !regex.razonSocial.test(form.razonSocial)),
      helper:
        touched.razonSocial && !form.razonSocial
          ? "Campo requerido"
          : touched.razonSocial && !regex.razonSocial.test(form.razonSocial)
          ? "No se permiten caracteres especiales"
          : "Obligatorio",
    },
    {
      field: "encargado",
      label: "Encargado",
      value: form.encargado,
      error: touched.encargado && (!form.encargado || !regex.encargado.test(form.encargado)),
      helper:
        touched.encargado && !form.encargado
          ? "Campo requerido"
          : touched.encargado && !regex.encargado.test(form.encargado)
          ? "Solo letras y espacios"
          : "Obligatorio",
    },
    {
      field: "ci",
      label: "CI",
      value: form.ci,
      error: touched.ci && (!form.ci || !regex.ci.test(form.ci)),
      helper:
        touched.ci && (!form.ci || !regex.ci.test(form.ci))
          ? "Debe tener 7 u 8 dígitos"
          : "Obligatorio",
      props: { inputProps: { maxLength: 8 } },
    },
    {
      field: "telefono",
      label: "Teléfono",
      value: form.telefono,
      error: touched.telefono && (!form.telefono || !regex.telefono.test(form.telefono)),
      helper:
        touched.telefono && (!form.telefono || !regex.telefono.test(form.telefono))
          ? "Ingrese un teléfono válido"
          : "Obligatorio",
      props: { inputProps: { maxLength: 10 } },
    },
    {
      field: "direccion",
      label: "Dirección",
      value: form.direccion,
      error: touched.direccion && (!form.direccion || !regex.direccion.test(form.direccion)),
      helper:
        touched.direccion && !form.direccion
          ? "Campo requerido"
          : touched.direccion && !regex.direccion.test(form.direccion)
          ? "Carácter no permitido"
          : "Obligatorio",
      full: true,
    },
  ];

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
        <Typography component="div" variant="h6" fontWeight={700}>
          {initialData ? "Editar Proveedor" : "Nuevo Proveedor"}
        </Typography>

        <Typography component="div" variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
          Complete la información del proveedor.
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
            {campos.map((item) => (
              <Grid
                size={{ xs: 12, sm: item.full ? 12 : 6 }}
                key={item.field}
              >
                <TextField
                  fullWidth
                  size="small"
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
          disabled={loading}
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

export default ProveedorForm;