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
import ServiceModeloProducto from "@/services/ServiceModeloProducto";

const ModeloProductoForm = ({ onClose, onSuccess, initialData = null }) => {
  const [form, setForm] = useState({
    nombreModelo: initialData?.nombreModelo || "",
    marca: initialData?.marca || "",
    capacidadOTamano: initialData?.capacidadOTamano ?? "",
    unidadMedida: initialData?.unidadMedida || "",
    stockMinimo: initialData?.stockMinimo ?? 0,
    stockActual: initialData?.stockActual ?? 0,
  });

  const [formError, setFormError] = useState("");
  const [formTouched, setFormTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setFormTouched(true);
  };

  const validateForm = () => {
    if (!form.nombreModelo || !form.marca) {
      setFormError("Por favor complete los campos requeridos: Nombre y Marca");
      return false;
    }
    if (form.stockMinimo === "" || isNaN(Number(form.stockMinimo))) {
      setFormError("Stock mínimo debe ser un número");
      return false;
    }
    if (form.stockActual === "" || isNaN(Number(form.stockActual))) {
      setFormError("Stock actual debe ser un número");
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
      const payload = {
        ...form,
        capacidadOTamano: form.capacidadOTamano === "" ? null : Number(form.capacidadOTamano),
        stockMinimo: Number(form.stockMinimo),
        stockActual: Number(form.stockActual),
      };

      if (initialData?.id) {
        await ServiceModeloProducto.update(initialData.id, payload);
        toast.success("Modelo actualizado correctamente");
      } else {
        await ServiceModeloProducto.create(payload);
        toast.success("Modelo creado correctamente");
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error submitting modelo form:', err);
      const msg = err.response?.data?.detail || err.message || "Error al procesar el modelo";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setForm({
      nombreModelo: initialData?.nombreModelo || "",
      marca: initialData?.marca || "",
      capacidadOTamano: initialData?.capacidadOTamano ?? "",
      unidadMedida: initialData?.unidadMedida || "",
      stockMinimo: initialData?.stockMinimo ?? 0,
      stockActual: initialData?.stockActual ?? 0,
    });
    setFormError("");
    setFormTouched(false);
  }, [initialData]);

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2, maxHeight: '90vh' } }}>
      <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
        <Typography variant="h6" fontWeight={600}>{initialData ? 'Editar Modelo' : 'Nuevo Modelo'}</Typography>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Nombre del Modelo" value={form.nombreModelo} onChange={(e) => handleChange('nombreModelo', e.target.value)} error={formTouched && !form.nombreModelo} helperText={formTouched && !form.nombreModelo ? 'Campo requerido' : ''} required disabled={loading} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Marca" value={form.marca} onChange={(e) => handleChange('marca', e.target.value)} error={formTouched && !form.marca} helperText={formTouched && !form.marca ? 'Campo requerido' : ''} required disabled={loading} />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Capacidad/Tamaño" value={form.capacidadOTamano} onChange={(e) => handleChange('capacidadOTamano', e.target.value.replace(/[^0-9]/g, ''))} helperText="Opcional - solo números" disabled={loading} />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Unidad de medida" value={form.unidadMedida} onChange={(e) => handleChange('unidadMedida', e.target.value)} helperText="Opcional" disabled={loading} />
            </Grid>

            <Grid item xs={12} md={2}>
              <TextField fullWidth label="Stock Mínimo" value={form.stockMinimo} onChange={(e) => handleChange('stockMinimo', e.target.value.replace(/[^0-9]/g, ''))} error={formTouched && (form.stockMinimo === '' || isNaN(Number(form.stockMinimo)))} helperText={formTouched && (form.stockMinimo === '' || isNaN(Number(form.stockMinimo))) ? 'Número requerido' : ''} required disabled={loading} />
            </Grid>

            <Grid item xs={12} md={2}>
              <TextField fullWidth label="Stock Actual" value={form.stockActual} onChange={(e) => handleChange('stockActual', e.target.value.replace(/[^0-9]/g, ''))} error={formTouched && (form.stockActual === '' || isNaN(Number(form.stockActual)))} helperText={formTouched && (form.stockActual === '' || isNaN(Number(form.stockActual))) ? 'Número requerido' : ''} required disabled={loading} />
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

export default ModeloProductoForm;
