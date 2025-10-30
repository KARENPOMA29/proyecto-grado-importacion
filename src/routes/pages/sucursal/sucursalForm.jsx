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
import ServiceSucursal from "@/services/ServiceSucursal";

const SucursalForm = ({ onClose, onSuccess, initialData = null }) => {
  const [form, setForm] = useState({
    nombre: initialData?.nombre || "",
    telefono: initialData?.telefono || "",
  });

  const [formError, setFormError] = useState("");
  const [formTouched, setFormTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setFormTouched(true);
  };

  const validateForm = () => {
    if (!form.nombre) {
      setFormError("Por favor complete el nombre de la sucursal");
      return false;
    }
    if (form.telefono && !/^\d{7,10}$/.test(form.telefono)) {
      setFormError("El teléfono debe tener entre 7 y 10 dígitos");
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
      const payload = { ...form };
      if (initialData?.id) {
        await ServiceSucursal.update(initialData.id, payload);
        toast.success("Sucursal actualizada correctamente");
      } else {
        await ServiceSucursal.create(payload);
        toast.success("Sucursal creada correctamente");
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error submitting sucursal form:', err);
      const msg = err.response?.data?.detail || err.message || "Error al procesar la sucursal";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setForm({
      nombre: initialData?.nombre || "",
      telefono: initialData?.telefono || "",
    });
    setFormError("");
    setFormTouched(false);
  }, [initialData]);

  return (
    <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
        <Typography variant="h6" fontWeight={600}>{initialData ? 'Editar Sucursal' : 'Nueva Sucursal'}</Typography>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField fullWidth label="Nombre" value={form.nombre} onChange={(e) => handleChange('nombre', e.target.value)} error={formTouched && !form.nombre} helperText={formTouched && !form.nombre ? 'Campo requerido' : ''} required disabled={loading} />
            </Grid>

            <Grid item xs={12}>
              <TextField fullWidth label="Teléfono" value={form.telefono} onChange={(e) => handleChange('telefono', e.target.value.replace(/\D/g, ''))} error={formTouched && form.telefono && !/^\d{7,10}$/.test(form.telefono)} helperText={formTouched && form.telefono && !/^\d{7,10}$/.test(form.telefono) ? 'Ingrese un teléfono válido' : 'Opcional'} disabled={loading} inputProps={{ maxLength: 10 }} />
            </Grid>
          </Grid>

          {formError && (
            <Alert severity="error" sx={{ mt: 3 }}>{formError}</Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" disabled={loading}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading} sx={{ minWidth: 100 }}>{loading ? 'Guardando...' : 'Guardar'}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SucursalForm;
