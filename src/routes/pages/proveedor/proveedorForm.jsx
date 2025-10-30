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

  const [formError, setFormError] = useState("");
  const [formTouched, setFormTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setFormTouched(true);
  };

  const validateForm = () => {
    if (!form.razonSocial || !form.telefono || !form.encargado || !form.direccion || !form.ci) {
      setFormError("Por favor complete todos los campos obligatorios");
      return false;
    }
    if (!/^\d{7,8}$/.test(form.ci)) {
      setFormError("El CI debe tener 7 u 8 dígitos");
      return false;
    }
    if (!/^\d{7,8}$/.test(form.telefono)) {
      // telefono length can vary; backend expects string, but we ensure digits
      // We'll accept 7 to 10 digits for telefono
      // If stricter rules exist, adapt accordingly
      // For now, ensure at least 7 digits
      if (!/^\d{7,10}$/.test(form.telefono)) {
        setFormError("El teléfono debe tener entre 7 y 10 dígitos");
        return false;
      }
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
        await ServiceProveedor.update(initialData.id, payload);
        toast.success("Proveedor actualizado correctamente");
      } else {
        await ServiceProveedor.create(payload);
        toast.success("Proveedor creado correctamente");
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error submitting proveedor form:', err);
      const msg = err.response?.data?.detail || err.message || "Error al procesar el proveedor";
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
    setFormTouched(false);
  }, [initialData]);

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2, maxHeight: '90vh' } }}>
      <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
        <Typography variant="h6" fontWeight={600}>{initialData ? 'Editar Proveedor' : 'Nuevo Proveedor'}</Typography>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Razón Social" value={form.razonSocial} onChange={(e) => handleChange('razonSocial', e.target.value)} error={formTouched && !form.razonSocial} helperText={formTouched && !form.razonSocial ? 'Campo requerido' : ''} required disabled={loading} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Encargado" value={form.encargado} onChange={(e) => handleChange('encargado', e.target.value)} error={formTouched && !form.encargado} helperText={formTouched && !form.encargado ? 'Campo requerido' : ''} required disabled={loading} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField fullWidth label="CI" value={form.ci} onChange={(e) => handleChange('ci', e.target.value.replace(/\D/g, ''))} error={formTouched && (!form.ci || !/^\d{7,8}$/.test(form.ci))} helperText={formTouched && (!form.ci || !/^\d{7,8}$/.test(form.ci)) ? 'Debe tener 7 u 8 dígitos' : ''} required disabled={loading} inputProps={{ maxLength: 8 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Teléfono" value={form.telefono} onChange={(e) => handleChange('telefono', e.target.value.replace(/\D/g, ''))} error={formTouched && (!form.telefono || !/^\d{7,10}$/.test(form.telefono))} helperText={formTouched && (!form.telefono || !/^\d{7,10}$/.test(form.telefono)) ? 'Ingrese un teléfono válido' : ''} required disabled={loading} inputProps={{ maxLength: 10 }} />
            </Grid>

            <Grid item xs={12}>
              <TextField fullWidth label="Dirección" value={form.direccion} onChange={(e) => handleChange('direccion', e.target.value)} error={formTouched && !form.direccion} helperText={formTouched && !form.direccion ? 'Campo requerido' : ''} required disabled={loading} />
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

export default ProveedorForm;
