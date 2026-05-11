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
import ServiceCategoria from "@/services/ServiceCategoria";

const CategoriaForm = ({ onClose, onSuccess, initialData = null }) => {
  const [form, setForm] = useState({
    nombre: "",
  });

  const [touched, setTouched] = useState({
    nombre: false,
  });

  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const regexNombre = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .-]+$/;

  const handleChange = (field, value) => {
    let newVal = value;

    if (field === "nombre") {
      newVal = newVal.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .-]/g, "");
    }

    setForm((prev) => ({ ...prev, [field]: newVal }));
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFormError("");
  };

  const validateForm = () => {
    if (!form.nombre?.trim()) {
      setFormError("Por favor complete el nombre de la categoría.");
      return false;
    }

    if (form.nombre.trim().length < 3) {
      setFormError("El nombre de la categoría debe tener al menos 3 caracteres.");
      return false;
    }

    if (!regexNombre.test(form.nombre)) {
      setFormError("El nombre no debe tener caracteres especiales.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    setFormError("");
    setTouched({ nombre: true });

    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = { nombre: form.nombre.trim() };

      if (initialData?.id) {
        await ServiceCategoria.update(initialData.id, payload);
        toast.success("Categoría actualizada correctamente");
      } else {
        await ServiceCategoria.create(payload);
        toast.success("Categoría creada correctamente");
      }

      onSuccess?.();
      onClose?.();
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Error al procesar la categoría";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setForm({
      nombre: initialData?.nombre || "",
    });
    setFormError("");
    setTouched({ nombre: false });
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
        <Typography component="div" variant="h6" fontWeight={700}>
          {initialData ? "Editar Categoría" : "Nueva Categoría"}
        </Typography>

        <Typography component="div" variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
          Complete la información de la categoría.
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
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                label="Nombre de la categoría"
                placeholder="Ej: Refrigeradoras"
                value={form.nombre}
                onChange={(e) => handleChange("nombre", e.target.value)}
                error={
                  touched.nombre &&
                  (!form.nombre?.trim() || !regexNombre.test(form.nombre))
                }
                helperText={
                  touched.nombre && !form.nombre?.trim()
                    ? "Campo requerido"
                    : touched.nombre && !regexNombre.test(form.nombre)
                    ? "No se permiten caracteres especiales"
                    : "Obligatorio"
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

export default CategoriaForm;