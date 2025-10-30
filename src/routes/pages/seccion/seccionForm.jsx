import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Typography,
  Button,
  Box,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import ServiceSeccion from "@/services/ServiceSeccion";

export default function SeccionForm({ open, onClose, seccion, almacenes = [], modelos = [] }) {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    defaultValues: { almacenId: "", modeloId: "", descripcion: "" },
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (seccion) {
      setValue("almacenId", seccion.almacenId ?? "");
      setValue("modeloId", seccion.modeloId ?? "");
      setValue("descripcion", seccion.descripcion ?? "");
    } else {
      reset({ almacenId: "", modeloId: "", descripcion: "" });
    }
  }, [seccion, setValue, reset]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const payload = {
        almacenId: Number(data.almacenId),
        modeloId: Number(data.modeloId),
        descripcion: data.descripcion,
      }; // coincide con tu POST

      if (seccion?.id) {
        await ServiceSeccion.update(seccion.id, payload);
      } else {
        await ServiceSeccion.create(payload);
      }
      onClose(true);
      reset({ almacenId: "", modeloId: "", descripcion: "" });
    } catch (error) {
      console.error("Error al guardar sección:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helpers para nombres robustos
  const labelAlmacen = (a) => a?.nombre ?? a?.descripcion ?? `Almacén #${a?.id}`;
  const labelModelo = (m) =>
    m?._nombre ??
    m?.nombre ??
    m?.nombreModelo ??
    m?.modeloNombre ??
    m?.descripcion ??
    `Modelo #${m?.id}`;

  return (
    <Dialog
      open={open}
      onClose={() => onClose(false)}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2, maxHeight: "90vh" } }}
    >
      {/* MISMO ESTILO QUE PROVEEDOR: título con borde inferior */}
      <DialogTitle sx={{ borderBottom: "1px solid", borderColor: "divider", pb: 2 }}>
        {/* Evitar h6 dentro de h2 */}
        <Typography variant="h6" component="span" fontWeight={600}>
          {seccion ? "Editar Sección" : "Nueva Sección"}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Almacén */}
          <Controller
            name="almacenId"
            control={control}
            rules={{ required: "El almacén es requerido" }}
            defaultValue=""
            render={({ field }) => (
              <FormControl fullWidth margin="dense" error={!!errors.almacenId}>
                <InputLabel id="almacen-label">Almacén</InputLabel>
                <Select
                  {...field}
                  labelId="almacen-label"
                  label="Almacén"
                  value={field.value ?? ""}
                  disabled={loading}
                >
                  {almacenes.map((alm) => (
                    <MenuItem key={alm.id} value={alm.id}>
                      {labelAlmacen(alm)}
                    </MenuItem>
                  ))}
                </Select>
                {errors.almacenId && (
                  <FormHelperText>{errors.almacenId.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />

          {/* Modelo */}
          <Controller
            name="modeloId"
            control={control}
            rules={{ required: "El modelo es requerido" }}
            defaultValue=""
            render={({ field }) => (
              <FormControl fullWidth margin="dense" error={!!errors.modeloId}>
                <InputLabel id="modelo-label">Modelo</InputLabel>
                <Select
                  {...field}
                  labelId="modelo-label"
                  label="Modelo"
                  value={field.value ?? ""}
                  disabled={loading}
                >
                  {modelos.map((mod) => (
                    <MenuItem key={mod.id} value={mod.id}>
                      {labelModelo(mod)}
                    </MenuItem>
                  ))}
                </Select>
                {errors.modeloId && (
                  <FormHelperText>{errors.modeloId.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />

          {/* Descripción */}
          <Controller
            name="descripcion"
            control={control}
            rules={{
              required: "La descripción es requerida",
              maxLength: { value: 500, message: "La descripción no puede tener más de 500 caracteres" },
            }}
            defaultValue=""
            render={({ field }) => (
              <TextField
                {...field}
                margin="dense"
                label="Descripción"
                fullWidth
                multiline
                rows={4}
                error={!!errors.descripcion}
                helperText={errors.descripcion?.message}
                disabled={loading}
              />
            )}
          />
        </Box>
      </DialogContent>

      {/* MISMAS ACCIONES QUE PROVEEDOR */}
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={() => onClose(false)} variant="outlined" disabled={loading}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={loading} sx={{ minWidth: 100 }}>
          {loading ? "Guardando..." : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
