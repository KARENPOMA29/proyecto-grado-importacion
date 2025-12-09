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
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Add } from "@mui/icons-material"; // 🆕
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import ServiceSeccion from "@/services/ServiceSeccion";
import ModeloProductoForm from "@/routes/pages/modelo_producto/modeloproductoForm"; // 🆕 ajusta la ruta si hace falta

export default function SeccionForm({
  open,
  onClose,
  seccion,
  almacenes = [],
  modelos = [],
  // 👇 opcional: cuando abres desde un almacén específico
  almacenContext = null,
}) {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    defaultValues: {
      nombre: "",
      almacenId: "",
      modeloId: "",
      descripcion: "",
    },
    mode: "onChange", // 👉 valida en tiempo real
  });

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // 🆕 modelos locales para que se pueda agregar uno nuevo sin depender del padre
  const [modelosLocal, setModelosLocal] = useState(modelos || []);

  // 🆕 control del modal de ModeloProductoForm
  const [openModeloForm, setOpenModeloForm] = useState(false);

  useEffect(() => {
    setModelosLocal(modelos || []);
  }, [modelos]);

  useEffect(() => {
    if (seccion) {
      // 🟢 Editar
      setValue("nombre", seccion.nombre ?? "");
      setValue("almacenId", seccion.almacenId ?? "");
      setValue("modeloId", seccion.modeloId ?? "");
      setValue("descripcion", seccion.descripcion ?? "");
    } else if (almacenContext) {
      // 🟢 Crear desde un almacén específico
      reset({
        nombre: "",
        almacenId: almacenContext.id,
        modeloId: "",
        descripcion: "",
      });
    } else {
      // 🟢 Crear normal
      reset({
        nombre: "",
        almacenId: "",
        modeloId: "",
        descripcion: "",
      });
    }
    setFormError("");
  }, [seccion, almacenContext, reset, setValue]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setFormError("");

      const payload = {
        nombre: data.nombre?.trim() || null,
        almacenId: Number(data.almacenId),
        modeloId: Number(data.modeloId),
        descripcion: data.descripcion.trim(),
      };

      if (seccion?.id) {
        await ServiceSeccion.update(seccion.id, payload);
        toast.success("Sección actualizada correctamente");
      } else {
        await ServiceSeccion.create(payload);
        toast.success("Sección creada correctamente");
      }

      reset({
        nombre: "",
        almacenId: "",
        modeloId: "",
        descripcion: "",
      });
      onClose(true);
    } catch (error) {
      console.error("Error al guardar sección:", error);
      const msg =
        error.response?.data?.detail ||
        error.message ||
        "Error al procesar la sección";
      setFormError(msg); // ej: duplicado de nombre en el mismo almacén
      toast.error(msg);
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

  // 🆕 cuando se crea un modelo desde el modal de modelos
  const handleModeloCreated = (nuevoModelo) => {
    if (!nuevoModelo) return;

    // Agregar al combo local
    setModelosLocal((prev) => [...prev, nuevoModelo]);

    // Seleccionar automáticamente el nuevo modelo en el formulario
    if (nuevoModelo.id) {
      setValue("modeloId", nuevoModelo.id);
    }

    toast.success("Modelo creado y seleccionado correctamente");
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={() => onClose(false)}
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
        {/* HEADER estilo vino, igual que los otros forms */}
        <DialogTitle
          sx={{
            background: "linear-gradient(135deg, #592B2B 0%, #3A1A1A 100%)",
            color: "#F5F5F5",
            py: 2.5,
            px: 3,
          }}
        >
          <Typography variant="h6" component="span" fontWeight={700}>
            {seccion ? "Editar Sección" : "Nueva Sección"}
          </Typography>

          {almacenContext && (
            <Typography
              variant="body2"
              sx={{ mt: 0.5, fontStyle: "italic", color: "#FFEFEF" }}
            >
              Almacén: <strong>{almacenContext.nombre}</strong>
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
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {/* NOMBRE (opcional, pero validado) */}
            <Controller
              name="nombre"
              control={control}
              rules={{
                maxLength: {
                  value: 150,
                  message: "Máximo 150 caracteres",
                },
                pattern: {
                  value: /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .\-]+$/,
                  message: "No se permiten caracteres especiales",
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Nombre de la sección (opcional)"
                  fullWidth
                  size="small"
                  disabled={loading}
                  error={!!errors.nombre}
                  helperText={errors.nombre?.message || ""}
                />
              )}
            />

            {/* ALMACÉN */}
            <Controller
              name="almacenId"
              control={control}
              rules={{ required: "El almacén es requerido" }}
              render={({ field }) => (
                <FormControl
                  fullWidth
                  size="small"
                  margin="dense"
                  error={!!errors.almacenId}
                  disabled={loading || !!almacenContext}
                >
                  <InputLabel id="almacen-label">Almacén</InputLabel>
                  <Select
                    {...field}
                    labelId="almacen-label"
                    label="Almacén"
                    value={field.value ?? ""}
                  >
                    {!almacenContext &&
                      almacenes.map((alm) => (
                        <MenuItem key={alm.id} value={alm.id}>
                          {labelAlmacen(alm)}
                        </MenuItem>
                      ))}
                    {almacenContext && (
                      <MenuItem value={almacenContext.id}>
                        {almacenContext.nombre}
                      </MenuItem>
                    )}
                  </Select>
                  {errors.almacenId && (
                    <FormHelperText>{errors.almacenId.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />

            {/* MODELO + botón agregar modelo 🆕 */}
            <Controller
              name="modeloId"
              control={control}
              rules={{ required: "El modelo es requerido" }}
              render={({ field }) => (
                <>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mt: 1,
                    }}
                  >
                    <FormControl
                      fullWidth
                      size="small"
                      margin="dense"
                      error={!!errors.modeloId}
                      disabled={loading}
                    >
                      <InputLabel id="modelo-label">Modelo</InputLabel>
                      <Select
                        {...field}
                        labelId="modelo-label"
                        label="Modelo"
                        value={field.value ?? ""}
                      >
                        {modelosLocal.map((mod) => (
                          <MenuItem key={mod.id} value={mod.id}>
                            {labelModelo(mod)}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.modeloId && (
                        <FormHelperText>
                          {errors.modeloId.message}
                        </FormHelperText>
                      )}
                    </FormControl>

                    <Tooltip title="Agregar nuevo modelo">
                      <span>
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => setOpenModeloForm(true)}
                          disabled={loading}
                          sx={{
                            border: "1px solid",
                            borderColor: "divider",
                            ml: 0.5,
                          }}
                        >
                          <Add fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                </>
              )}
            />

            {/* DESCRIPCIÓN */}
            <Controller
              name="descripcion"
              control={control}
              rules={{
                required: "La descripción es requerida",
                maxLength: {
                  value: 500,
                  message: "Máximo 500 caracteres",
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="dense"
                  label="Descripción"
                  fullWidth
                  size="small"
                  multiline
                  rows={3}
                  disabled={loading}
                  error={!!errors.descripcion}
                  helperText={errors.descripcion?.message || "Obligatorio"}
                />
              )}
            />

            {formError && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {formError}
              </Alert>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1.5 }}>
          <Button
            onClick={() => onClose(false)}
            variant="outlined"
            disabled={loading}
            sx={{
              textTransform: "none",
              borderRadius: 999,
              px: 3,
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
              },
            }}
          >
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 🆕 Modal para crear un nuevo modelo */}
      {openModeloForm && (
        <ModeloProductoForm
          initialData={null}
          onClose={() => setOpenModeloForm(false)}
          onSuccess={(nuevoModelo) => {
            handleModeloCreated(nuevoModelo);
            setOpenModeloForm(false);
          }}
        />
      )}
    </>
  );
}
