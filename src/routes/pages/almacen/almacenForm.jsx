// src/routes/pages/almacen/almacenForm.jsx
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
  Divider,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import ServiceAlmacen from "@/services/ServiceAlmacen";
const AlmacenForm = ({
  onClose,
  onSuccess,
  initialData = null,
  sucursales = [],
  sucursalContext = null,
  bloquearSucursal = false,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    setValue,
  } = useForm({
    mode: "onBlur",           // valida al salir del campo
    reValidateMode: "onChange", // revalida al escribir
    defaultValues: { nombre: "", direccion: "", sucursalId: "" },
  });
  
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  // ⏱ Cargar datos iniciales / sucursal por contexto
  useEffect(() => {
    if (initialData) {
      setValue("nombre", initialData.nombre ?? "");
      setValue("direccion", initialData.direccion ?? "");

      const sucursalFija =
        sucursalContext?.id ?? initialData.sucursalId ?? "";

      setValue("sucursalId", sucursalFija);
    } else if (sucursalContext) {
      reset({
        nombre: "",
        direccion: "",
        sucursalId: sucursalContext.id,
      });
    } else {
      reset({ nombre: "", direccion: "", sucursalId: "" });
    }

    setFormError("");
  }, [initialData, sucursalContext, setValue, reset]);
  const onSubmit = async (data) => {
    setFormError("");

    const nombreLimpio = data.nombre?.trim() || "";
    const direccionLimpia = data.direccion?.trim() || "";

    setLoading(true);
    try {
      const payload = {
        nombre: nombreLimpio,
        direccion: direccionLimpia,
        sucursalId:
          data.sucursalId === "" || data.sucursalId == null
            ? null
            : Number(data.sucursalId),
      };

      if (initialData?.id) {
        const resp = await ServiceAlmacen.update(initialData.id, payload);

        toast.success("Almacén actualizado correctamente");

        onSuccess?.(resp);
      } else {
        const resp = await ServiceAlmacen.create(payload);

        toast.success("Almacén creado correctamente");

        onSuccess?.(resp);
      }

      onClose?.();
      reset({ nombre: "", direccion: "", sucursalId: "" });
    } catch (err) {
      console.error("Error al guardar el almacén:", err);
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Error al procesar el almacén";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };


  const handleNombreChange = (e, onChangeRHForm) => {
    const value = e.target.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .-]/g, "");
    onChangeRHForm(value);
  };

  const handleDireccionChange = (e, onChangeRHForm) => {
    const value = e.target.value.replace(
      /[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .,#\-]/g,
      ""
    );
    onChangeRHForm(value);
  };
  const getCiudadSucursal = (s) => {
    return s?.ciudadNombre || "Sin ciudad registrada";
  };
  return (
    <Dialog
      open={true}
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
      {/* HEADER con gradiente vino */}
      <DialogTitle
        component="div"
        sx={{
          p: 2.5,
          pb: 2,
          background: "linear-gradient(135deg, #592B2B 0%, #3A1A1A 100%)",
          color: "#F5F5F5",
        }}
      >
        <Typography variant="h6" component="span" fontWeight={700}>
          {initialData ? "Editar Almacén" : "Nuevo Almacén"}
        </Typography>
        
        {sucursalContext && (
          <Typography
            variant="body2"
            sx={{ mt: 0.5, fontStyle: "italic", color: "#FFEFEF" }}
          >
            Sucursal: <strong>{sucursalContext.nombre}</strong>
          </Typography>
        )}
      </DialogTitle>

      <DialogContent
        sx={{
          py: 3,
          px: 3,
          bgcolor: "#FAFAFA",
        }}
      >
        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          sx={{
            bgcolor: "#FFFFFF",
            borderRadius: 2,
            p: 2.5,
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}
        >
          <Grid container spacing={2}>
            {/* NOMBRE */}
            <Grid item xs={12}>
              <Controller
                name="nombre"
                control={control}
                rules={{
                  required: "El nombre es obligatorio",
                  maxLength: { value: 100, message: "Máximo 100 caracteres" },
                  pattern: {
                    value: /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .-]+$/,
                    message: "No se permiten caracteres especiales",
                  },
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    size="small"
                    label="Nombre del almacén"
                    onChange={(e) => handleNombreChange(e, field.onChange)}
                    error={!!fieldState.error}
                    helperText={
                      fieldState.error?.message || "Obligatorio"
                    }
                    disabled={loading}
                  />
                )}
              />
            </Grid>

            {/* DIRECCIÓN */}
            <Grid item xs={12}>
              <Controller
                name="direccion"
                control={control}
                rules={{
                  required: "La dirección es obligatoria",
                  maxLength: { value: 200, message: "Máximo 200 caracteres" },
                  pattern: {
                    value: /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .,#\-]+$/,
                    message: "La dirección contiene caracteres no permitidos",
                  },
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    size="small"
                    label="Dirección"
                    onChange={(e) =>
                      handleDireccionChange(e, field.onChange)
                    }
                    error={!!fieldState.error}
                    helperText={
                      fieldState.error?.message || "Obligatorio"
                    }
                    disabled={loading}
                  />
                )}
              />
            </Grid>

            {/* SUCURSAL */}
            <Grid item xs={12}>
              <Controller
                name="sucursalId"
                control={control}
                rules={{
                  required: "Debe seleccionar una sucursal",
                }}
                render={({ field, fieldState }) => (
                  <FormControl
                    fullWidth
                    size="small"
                    error={!!fieldState.error}
                    disabled={loading || bloquearSucursal || !!sucursalContext}
                  >
                    <InputLabel id="sucursal-label">
                      Sucursal *
                    </InputLabel>

                    <Select
                    {...field}
                    labelId="sucursal-label"
                    label="Sucursal *"
                    renderValue={(selected) => {
                      const sucursal = sucursales.find(
                        (s) => Number(s.id) === Number(selected)
                      );

                      if (!sucursal) return "Seleccione una sucursal";

                      return `${sucursal.nombre} - ${getCiudadSucursal(sucursal)}`;
                    }}
                    MenuProps={{
                      sx: { zIndex: 2000 },
                    }}
                  >
                      {!sucursalContext && (
                        <MenuItem value="">
                          <em>Seleccione una sucursal</em>
                        </MenuItem>
                      )}

                      {sucursales.map((s) => (
                        <MenuItem key={s.id} value={s.id}>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {s.nombre}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {getCiudadSucursal(s)}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>

                    <Typography
                      variant="caption"
                      color={fieldState.error ? "error" : "text.secondary"}
                      sx={{ mt: 0.5, ml: 1.8 }}
                    >
                      {fieldState.error?.message ||
                        "Seleccione la sucursal donde estará el almacén"}
                    </Typography>
                  </FormControl>
                )}
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

      <Divider />

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1.5 }}>
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
          onClick={handleSubmit(onSubmit)}
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
              background:
                "linear-gradient(135deg, #0D8C47 0%, #0A6B37 100%)",
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

export default AlmacenForm;
