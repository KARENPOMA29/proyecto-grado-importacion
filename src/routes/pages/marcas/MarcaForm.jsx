// src/pages/marcas/MarcaForm.jsx  (ajusta la ruta a tu gusto)
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Button,
  Box,
  Alert,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import ServiceMarca from "@/services/ServiceMarca";

const regexNombreMarca = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .\-]+$/;

export default function MarcaForm({
  open,
  onClose,
  marca = null,
  onSuccess,
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
    },
    mode: "onChange",
  });

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (marca) {
      setValue("nombre", marca.nombre ?? "");
    } else {
      reset({ nombre: "" });
    }
    setFormError("");
  }, [marca, reset, setValue]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setFormError("");

      const payload = {
        nombre: data.nombre.trim(),
      };

      let resp;
      if (marca?.id) {
        resp = await ServiceMarca.update(marca.id, payload);
        toast.success("Marca actualizada correctamente");
      } else {
        resp = await ServiceMarca.create(payload);
        toast.success("Marca creada correctamente");
      }

      onSuccess?.(resp); // devolvemos la marca creada/actualizada
      onClose?.();
    } catch (error) {
      console.error("Error al guardar marca:", error);
      const msg =
        error.response?.data?.detail ||
        error.message ||
        "Error al procesar la marca";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: "0 12px 36px rgba(0,0,0,0.18)",
        },
      }}
    >
      {/* HEADER estilo vino */}
      <DialogTitle
        sx={{
          background: "linear-gradient(135deg, #592B2B 0%, #3A1A1A 100%)",
          color: "#F5F5F5",
          py: 2.2,
          px: 3,
        }}
      >
        <Typography variant="h6" component="span" fontWeight={700}>
          {marca ? "Editar Marca" : "Nueva Marca"}
        </Typography>
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
              required: "El nombre de la marca es obligatorio",
              maxLength: {
                value: 150,
                message: "Máximo 150 caracteres",
              },
              pattern: {
                value: regexNombreMarca,
                message: "No se permiten caracteres especiales",
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Nombre de la marca *"
                fullWidth
                size="small"
                disabled={loading}
                error={!!errors.nombre}
                helperText={errors.nombre?.message || ""}
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
          onClick={onClose}
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
  );
}
