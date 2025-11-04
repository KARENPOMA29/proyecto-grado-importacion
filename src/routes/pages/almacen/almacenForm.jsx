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
  } = useForm({
    defaultValues: { nombre: "", sucursalId: "" },
  });

  const [formError, setFormError] = useState("");
  const [touched, setTouched] = useState({
    nombre: false,
    sucursalId: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setValue("nombre", initialData.nombre ?? "");
      setValue("sucursalId", initialData.sucursalId ?? "");
    } else {
      reset({ nombre: "", sucursalId: "" });
    }
    setFormError("");
    setTouched({
      nombre: false,
      sucursalId: false,
    });
  }, [initialData, setValue, reset]);

  const onSubmit = async (data) => {
    setFormError("");
    // marcar los campos
    setTouched({
      nombre: true,
      sucursalId: true,
    });

    // validación extra: nombre sin caracteres raros
    const nombreLimpio = data.nombre?.trim() || "";
    const regexNombre = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .-]+$/;

    if (!nombreLimpio) {
      setFormError("Por favor complete el nombre del almacén");
      return;
    }
    if (!regexNombre.test(nombreLimpio)) {
      setFormError("El nombre no debe tener caracteres especiales");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        nombre: nombreLimpio,
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
      const msg =
        err.response?.data?.detail || err.message || "Error al procesar el almacén";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // para limpiar mientras escribe
  const handleNombreChange = (e, onChangeRHForm) => {
    const value = e.target.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .-]/g, "");
    onChangeRHForm(value);
    setTouched((prev) => ({ ...prev, nombre: true }));
  };

  return (
    <Dialog
      open={true} // en tu lista real cambia a open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: "visible", // 👈 para que no se corte el select / autosuggest
        },
      }}
    >
      <DialogTitle
        component="div"
        sx={{ borderBottom: "1px solid", borderColor: "divider", pb: 2 }}
      >
        <Typography variant="h6" component="span" fontWeight={600}>
          {initialData ? "Editar Almacén" : "Nuevo Almacén"}
        </Typography>
      </DialogTitle>

      <DialogContent
        sx={{
          py: 3,
          overflow: "visible", // 👈 importantísimo
          maxHeight: "60vh", // si hay poco alto, que scrollee adentro
        }}
      >
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Grid container spacing={2}>
            {/* NOMBRE */}
            <Grid item xs={12}>
              <Controller
                name="nombre"
                control={control}
                rules={{
                  required: "Campo requerido",
                  maxLength: { value: 100, message: "Máximo 100 caracteres" },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Nombre"
                    onChange={(e) => handleNombreChange(e, field.onChange)}
                    error={
                      (touched.nombre && !!errors.nombre) ||
                      (touched.nombre &&
                        field.value &&
                        !/^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .-]+$/.test(field.value))
                    }
                    helperText={
                      touched.nombre && errors.nombre
                        ? errors.nombre.message
                        : touched.nombre &&
                          field.value &&
                          !/^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .-]+$/.test(field.value)
                        ? "No se permiten caracteres especiales"
                        : ""
                    }
                    disabled={loading}
                  />
                )}
              />
            </Grid>

            {/* SUCURSAL */}
            <Grid item xs={12}>
              <FormControl fullWidth disabled={loading}>
                <InputLabel id="sucursal-label">Sucursal</InputLabel>
                <Controller
                  name="sucursalId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      labelId="sucursal-label"
                      label="Sucursal"
                      MenuProps={{
                        sx: { zIndex: 2000 }, // 👈 para que quede por encima del dialog
                      }}
                      onOpen={() =>
                        setTouched((prev) => ({ ...prev, sucursalId: true }))
                      }
                    >
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
          onClick={handleSubmit(onSubmit)}
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

export default AlmacenForm;
