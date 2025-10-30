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
    nombre: initialData?.nombre || "",
    apellido: initialData?.apellido || "",
    segundoApellido: initialData?.segundoApellido || "",
    ci: initialData?.ci || "",
    correo: initialData?.correo || "",
  });

  const [formError, setFormError] = useState("");
  const [formTouched, setFormTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setFormTouched(true);
  };

  const validateForm = () => {
    if (!form.nombre || !form.apellido || !form.ci || !form.correo) {
      setFormError("Por favor complete todos los campos obligatorios");
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
    setFormTouched(true);

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
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error submitting cliente form:', err);
      const msg = err.response?.data?.detail || err.message || "Error al procesar el cliente";
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
    setFormTouched(false);
  }, [initialData]);

  return (
    <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
        <Typography variant="h6" fontWeight={600}>{initialData ? 'Editar Cliente' : 'Nuevo Cliente'}</Typography>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Nombre" value={form.nombre} onChange={(e) => handleChange('nombre', e.target.value)} error={formTouched && !form.nombre} helperText={formTouched && !form.nombre ? 'Campo requerido' : ''} required disabled={loading} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Apellido" value={form.apellido} onChange={(e) => handleChange('apellido', e.target.value)} error={formTouched && !form.apellido} helperText={formTouched && !form.apellido ? 'Campo requerido' : ''} required disabled={loading} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Segundo Apellido" value={form.segundoApellido} onChange={(e) => handleChange('segundoApellido', e.target.value)} disabled={loading} helperText="Opcional" />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField fullWidth label="CI" value={form.ci} onChange={(e) => handleChange('ci', e.target.value.replace(/\D/g, ''))} error={formTouched && (!form.ci || !/^\d{7,8}$/.test(form.ci))} helperText={formTouched && (!form.ci || !/^\d{7,8}$/.test(form.ci)) ? 'Debe tener 7 u 8 dígitos' : ''} required disabled={loading} inputProps={{ maxLength: 8 }} />
            </Grid>

            <Grid item xs={12}>
              <TextField fullWidth type="email" label="Correo electrónico" value={form.correo} onChange={(e) => handleChange('correo', e.target.value)} error={formTouched && (!form.correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo))} helperText={formTouched && (!form.correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) ? 'Ingrese un correo válido' : ''} required disabled={loading} />
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

export default ClienteForm;
