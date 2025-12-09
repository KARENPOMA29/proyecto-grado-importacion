import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import { toast } from "react-toastify";
import ServiceCiudad from "@/services/ServiceCiudad";

const CiudadForm = ({ onClose, onSuccess, initialData = null }) => {
  const [nombre, setNombre] = useState("");
  const [touched, setTouched] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Cargar datos si es edición
  useEffect(() => {
    setNombre(initialData?.nombre || "");
    setTouched(false);
    setErrorMsg("");
  }, [initialData]);

  const validate = () => {
    const value = nombre.trim();

    if (!value) {
      setErrorMsg("El nombre de la ciudad es obligatorio");
      return false;
    }

    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ .-]+$/.test(value)) {
      setErrorMsg("El nombre contiene caracteres no permitidos");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setTouched(true);
    setErrorMsg("");

    if (!validate()) return;

    setLoading(true);
    try {
      const payload = { nombre: nombre.trim() };
      let result;

      if (initialData?.id) {
        result = await ServiceCiudad.update(initialData.id, payload);
        toast.success("Ciudad actualizada correctamente");
      } else {
        result = await ServiceCiudad.create(payload);
        toast.success("Ciudad creada correctamente");
      }

      // avisar al padre (puede usar o ignorar result)
      onSuccess?.(result);
      onClose?.();
    } catch (err) {
      console.error("Error en CiudadForm:", err);
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Error al guardar ciudad";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (value) => {
    const v = value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ .-]/g, "");
    setNombre(v);
    setTouched(true);
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle
        sx={{ borderBottom: "1px solid", borderColor: "divider", pb: 2 }}
      >
        <Typography variant="h6" fontWeight={600}>
          {initialData ? "Editar Ciudad" : "Nueva Ciudad"}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            fullWidth
            label="Nombre de la ciudad"
            value={nombre}
            onChange={(e) => handleChange(e.target.value)}
            disabled={loading}
            error={touched && !!errorMsg}
            helperText={
              touched && errorMsg
                ? errorMsg
                : "Ej: Cochabamba, La Paz, Santa Cruz..."
            }
          />

          {errorMsg && (
            <Alert severity="error" sx={{ mt: 3 }}>
              {errorMsg}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" disabled={loading}>
          CANCELAR
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{ minWidth: 100 }}
        >
          {loading ? "Guardando..." : "GUARDAR"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CiudadForm;