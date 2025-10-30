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
    nombre: initialData?.nombre || "",
  });

  const [formError, setFormError] = useState("");
  const [formTouched, setFormTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormTouched(true);
  };

  const validateForm = () => {
    if (!form.nombre?.trim()) {
      setFormError("Por favor complete el nombre de la categoría");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setFormError("");
    setFormTouched(true);

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
      const msg = err.response?.data?.detail || err.message || "Error al procesar la categoría";
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
    setFormTouched(false);
  }, [initialData]);

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ borderBottom: "1px solid", borderColor: "divider", pb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          {initialData ? "Editar Categoría" : "Nueva Categoría"}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre"
                value={form.nombre}
                onChange={(e) => handleChange("nombre", e.target.value)}
                error={formTouched && !form.nombre?.trim()}
                helperText={formTouched && !form.nombre?.trim() ? "Campo requerido" : ""}
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
