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
  Typography,
  Button,
  Box,
  Alert,
  IconButton,
  Tooltip,
  Divider,
} from "@mui/material";
import ServiceSucursal from "@/services/ServiceSucursal";
import ServiceAlmacen from "@/services/ServiceAlmacen";
import { Add } from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";

import ServiceSeccion from "@/services/ServiceSeccion";
import AlmacenForm from "@/routes/pages/almacen/almacenForm";
import ModeloProductoForm from "@/routes/pages/modelo_producto/modeloproductoForm";

export default function SeccionForm({
  open,
  onClose,
  seccion = null,
  almacenes = [],
  modelos = [],
  sucursales = [],
  almacenContext = null,
}) {
  const {
    control,
    handleSubmit,
    reset,
    setValue,
  } = useForm({
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      nombre: "",
      almacenId: "",
      modeloId: "",
      descripcion: "",
    },
  });

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const [almacenesLocal, setAlmacenesLocal] = useState(almacenes || []);
  const [modelosLocal, setModelosLocal] = useState(modelos || []);

  const [openAlmacenForm, setOpenAlmacenForm] = useState(false);
  const [openModeloForm, setOpenModeloForm] = useState(false);
  const [sucursalesLocal, setSucursalesLocal] = useState(sucursales || []);

  useEffect(() => {
    const cargarSucursales = async () => {
      try {
        const resp = await ServiceSucursal.getAll();
        const data = resp?.items || resp || [];
        setSucursalesLocal(data);
      } catch (error) {
        console.error("Error cargando sucursales:", error);
        toast.error("Error al cargar sucursales");
      }
    };

    if (sucursales && sucursales.length > 0) {
      setSucursalesLocal(sucursales);
    } else {
      cargarSucursales();
    }
  }, [sucursales]);
  useEffect(() => {
    const cargarAlmacenes = async () => {
      try {
        const resp = await ServiceAlmacen.getCombo();

        const data =
          resp?.items ||
          resp?.data ||
          resp?.almacenes ||
          resp ||
          [];

        setAlmacenesLocal(data);
      } catch (error) {
        console.error("Error cargando almacenes:", error);
        toast.error("Error al cargar almacenes");
      }
    };

    cargarAlmacenes();
  }, []);

  useEffect(() => {
    setModelosLocal(modelos || []);
  }, [modelos]);

  useEffect(() => {
    if (seccion) {
      setValue("nombre", seccion.nombre ?? "");
      setValue("almacenId", seccion.almacenId ?? "");
      setValue("modeloId", seccion.modeloId ?? "");
      setValue("descripcion", seccion.descripcion ?? "");
    } else if (almacenContext) {
      reset({
        nombre: "",
        almacenId: almacenContext.id,
        modeloId: "",
        descripcion: "",
      });
    } else {
      reset({
        nombre: "",
        almacenId: "",
        modeloId: "",
        descripcion: "",
      });
    }

    setFormError("");
  }, [seccion, almacenContext, reset, setValue]);


  const labelAlmacen = (a) => {
    if (!a) return "";
    return a.nombre ?? `Almacén #${a.id}`;
  };

  const labelModelo = (m) =>
    m?.nombreModelo ??
    m?.modeloNombre ??
    m?.nombre ??
    m?.descripcion ??
    `Modelo #${m?.id}`;

  const handleAlmacenCreated = (nuevoAlmacen) => {
    if (!nuevoAlmacen) return;

    setAlmacenesLocal((prev) => [...prev, nuevoAlmacen]);

    if (nuevoAlmacen.id) {
      setValue("almacenId", nuevoAlmacen.id, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }

    toast.success("Almacén creado y seleccionado correctamente");
  };

  const handleModeloCreated = (nuevoModelo) => {
    if (!nuevoModelo) return;

    setModelosLocal((prev) => [...prev, nuevoModelo]);

    if (nuevoModelo.id) {
      setValue("modeloId", nuevoModelo.id, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }

    toast.success("Modelo creado y seleccionado correctamente");
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setFormError("");

      const payload = {
        nombre: data.nombre?.trim() || null,
        almacenId: Number(data.almacenId),
        modeloId: Number(data.modeloId),
        descripcion: data.descripcion?.trim() || "",
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

      onClose?.(true);
    } catch (error) {
      console.error("Error al guardar sección:", error);

      const msg =
        error?.response?.data?.detail ||
        error?.message ||
        "Error al procesar la sección";

      setFormError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={() => onClose?.(false)}
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
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  size="small"
                  label="Nombre de la sección"
                  disabled={loading}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message || "Opcional"}
                />
              )}
            />

            <Controller
              name="almacenId"
              control={control}
              rules={{
                required: "Debe seleccionar un almacén",
              }}
              render={({ field, fieldState }) => (
                <Box>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <FormControl
                      fullWidth
                      size="small"
                      error={!!fieldState.error}
                      disabled={loading || !!almacenContext}
                    >
                      <InputLabel id="almacen-label">Almacén *</InputLabel>

                      <Select
                        {...field}
                        labelId="almacen-label"
                        label="Almacén *"
                        value={field.value ?? ""}
                        renderValue={(selected) => {
                          const almacen = almacenesLocal.find(
                            (a) => Number(a.id) === Number(selected)
                          );

                          if (!almacen) return "Seleccione un almacén";

                          return labelAlmacen(almacen);
                        }}
                        MenuProps={{
                          sx: { zIndex: 2000 },
                        }}
                      >
                        {!almacenContext && (
                          <MenuItem value="">
                            <em>Seleccione un almacén</em>
                          </MenuItem>
                        )}

                        {almacenContext ? (
                          <MenuItem value={almacenContext.id}>
                            {labelAlmacen(almacenContext)}
                          </MenuItem>
                        ) : (
                          almacenesLocal.map((alm) => (
                            <MenuItem key={alm.id} value={alm.id}>
                              <Box>
                                <Typography variant="body2">
                                {alm.nombre}
                              </Typography>
                              </Box>
                            </MenuItem>
                          ))
                        )}
                      </Select>
                    </FormControl>

                    <Tooltip title="Agregar nuevo almacén">
                      <span>
                        <IconButton
                          color="primary"
                          onClick={() => setOpenAlmacenForm(true)}
                          disabled={loading || !!almacenContext}
                          sx={{
                            width: 40,
                            height: 40,
                            border: "1px solid #D0D5DD",
                            borderRadius: 1.2,
                            flexShrink: 0,
                          }}
                        >
                          <Add fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>

                  <Typography
                    variant="caption"
                    color={fieldState.error ? "error" : "text.secondary"}
                    sx={{ mt: 0.5, ml: 1.8, display: "block" }}
                  >
                    {fieldState.error?.message ||
                      "Seleccione el almacén donde estará la sección"}
                  </Typography>
                </Box>
              )}
            />

            <Controller
              name="modeloId"
              control={control}
              rules={{
                required: "Debe seleccionar un modelo",
              }}
              render={({ field, fieldState }) => (
                <Box>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <FormControl
                      fullWidth
                      size="small"
                      error={!!fieldState.error}
                      disabled={loading}
                    >
                      <InputLabel id="modelo-label">Modelo *</InputLabel>

                      <Select
                        {...field}
                        labelId="modelo-label"
                        label="Modelo *"
                        value={field.value ?? ""}
                        MenuProps={{
                          sx: { zIndex: 2000 },
                        }}
                      >
                        <MenuItem value="">
                          <em>Seleccione un modelo</em>
                        </MenuItem>

                        {modelosLocal.map((mod) => (
                          <MenuItem key={mod.id} value={mod.id}>
                            {labelModelo(mod)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Tooltip title="Agregar nuevo modelo">
                      <span>
                        <IconButton
                          color="primary"
                          onClick={() => setOpenModeloForm(true)}
                          disabled={loading}
                          sx={{
                            width: 40,
                            height: 40,
                            border: "1px solid #D0D5DD",
                            borderRadius: 1.2,
                            flexShrink: 0,
                          }}
                        >
                          <Add fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>

                  <Typography
                    variant="caption"
                    color={fieldState.error ? "error" : "text.secondary"}
                    sx={{ mt: 0.5, ml: 1.8, display: "block" }}
                  >
                    {fieldState.error?.message ||
                      "Seleccione el modelo asociado a la sección"}
                  </Typography>
                </Box>
              )}
            />

            <Controller
              name="descripcion"
              control={control}
              rules={{
                required: "La descripción es obligatoria",
                maxLength: {
                  value: 500,
                  message: "Máximo 500 caracteres",
                },
              }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  size="small"
                  multiline
                  rows={3}
                  label="Descripción"
                  disabled={loading}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message || "Obligatorio"}
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

        <Divider />

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1.5 }}>
          <Button
            onClick={() => onClose?.(false)}
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

      {openAlmacenForm && (
        <AlmacenForm
          initialData={null}
          sucursales={sucursalesLocal}
          onClose={() => setOpenAlmacenForm(false)}
          onSuccess={(nuevoAlmacen) => {
            handleAlmacenCreated(nuevoAlmacen);
            setOpenAlmacenForm(false);
          }}
        />
      )}

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