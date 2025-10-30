import { useEffect, useState } from "react";
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import ServiceAlmacen from "@/services/ServiceAlmacen";

const AlmacenForm = ({ onClose, onSuccess, initialData = null, sucursales = [] }) => {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({ defaultValues: { nombre: "", sucursalId: "" } });

  const [formError, setFormError] = useState("");
  const [formTouched, setFormTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setValue("nombre", initialData.nombre ?? "");
      setValue("sucursalId", initialData.sucursalId ?? "");
    } else {
      reset({ nombre: "", sucursalId: "" });
    }
    setFormError("");
    setFormTouched(false);
  }, [initialData, setValue, reset]);

  const onSubmit = async (data) => {
    setFormError("");
    setFormTouched(true);

    if (!data.nombre?.trim()) {
      setFormError("Por favor complete el nombre del almacén");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        nombre: data.nombre.trim(),
        sucursalId: data.sucursalId === "" ? null : Number(data.sucursalId),
      };

      if (initialData?.id) {
        await ServiceAlmacen.update(initialData.id, payload);
        toast.success("Almacén actualizado correctamente");
      } else {
        await ServiceAlmacen.create(payload);
        toast.success("Almacén creado correctamente");
      }
      onSuccess?.();
      onClose?.();
      reset({ nombre: "", sucursalId: "" });
    } catch (err) {
      console.error("Error al guardar el almacén:", err);
      const msg = err.response?.data?.detail || err.message || "Error al procesar el almacén";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      {/* FIX: no anidar h6 dentro de h2 */}
      <DialogTitle component="div" sx={{ borderBottom: "1px solid", borderColor: "divider", pb: 2 }}>
        <Typography variant="h6" component="span" fontWeight={600}>
          {initialData ? "Editar Almacén" : "Nuevo Almacén"}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre"
                {...register("nombre", {
                  required: "Campo requerido",
                  maxLength: { value: 100, message: "Máximo 100 caracteres" },
                })}
                error={formTouched && !!errors.nombre}
                helperText={formTouched && errors.nombre ? errors.nombre.message : ""}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth disabled={loading}>
                <InputLabel id="sucursal-label">Sucursal</InputLabel>
                <Controller
                  name="sucursalId"
                  control={control}
                  render={({ field }) => (
                    <Select labelId="sucursal-label" label="Sucursal" {...field}>
                      <MenuItem value="">— Ninguna —</MenuItem>
                      {sucursales.map((s) => (
                        <MenuItem key={s.id} value={s.id}>
                          {s.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>
          </Grid>

          {formError && <Alert severity="error" sx={{ mt: 3 }}>{formError}</Alert>}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" disabled={loading}>Cancelar</Button>
        <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={loading} sx={{ minWidth: 100 }}>
          {loading ? "Guardando..." : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AlmacenForm;
