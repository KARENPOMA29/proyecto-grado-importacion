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
      // solo letras, números, espacios y .-
      newVal = newVal.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .-]/g, "");
    }

    setForm((prev) => ({ ...prev, [field]: newVal }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const validateForm = () => {
    if (!form.nombre?.trim()) {
      setFormError("Por favor complete el nombre de la categoría");
      return false;
    }

    if (!regexNombre.test(form.nombre)) {
      setFormError("El nombre no debe tener caracteres especiales");
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
      console.error("Error submitting categoría form:", err);
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
      open={true} // en tu lista real cambialo a open={open}
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
          {initialData ? "Editar Categoría" : "Nueva Categoría"}
        </Typography>
      </DialogTitle>

      <DialogContent
        sx={{
          py: 3,
          overflow: "visible",
          maxHeight: "60vh", // 👈 si el modal crece, scroll interno
        }}
      >
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre"
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

export default CategoriaForm;
