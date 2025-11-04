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
import ServiceSucursal from "@/services/ServiceSucursal";

const SucursalForm = ({ onClose, onSuccess, initialData = null }) => {
  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
  });

  const [formError, setFormError] = useState("");
  const [touched, setTouched] = useState({
    nombre: false,
    telefono: false,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    let v = value;

    if (field === "nombre") {
      // letras, números, espacios y .-
      v = v.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .-]/g, "");
    }

    if (field === "telefono") {
      v = v.replace(/\D/g, "");
    }

    setForm((prev) => ({ ...prev, [field]: v }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const validateForm = () => {
    if (!form.nombre) {
      setFormError("Por favor complete el nombre de la sucursal");
      return false;
    }

    // por si meten algo raro por consola
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .-]+$/.test(form.nombre)) {
      setFormError("El nombre no debe tener caracteres especiales");
      return false;
    }

    if (form.telefono && !/^\d{7,10}$/.test(form.telefono)) {
      setFormError("El teléfono debe tener entre 7 y 10 dígitos");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setFormError("");
    // marcar todos
    setTouched({
      nombre: true,
      telefono: true,
    });

    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = { ...form };
      if (initialData?.id) {
        await ServiceSucursal.update(initialData.id, payload);
        toast.success("Sucursal actualizada correctamente");
      } else {
        await ServiceSucursal.create(payload);
        toast.success("Sucursal creada correctamente");
      }
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error("Error submitting sucursal form:", err);
      const msg =
        err.response?.data?.detail || err.message || "Error al procesar la sucursal";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setForm({
      nombre: initialData?.nombre || "",
      telefono: initialData?.telefono || "",
    });
    setFormError("");
    setTouched({
      nombre: false,
      telefono: false,
    });
  }, [initialData]);

  return (
    <Dialog
      open={true} // en tu lista ponés open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: "visible", // 👈 evita el recorte
        },
      }}
    >
      <DialogTitle
        sx={{ borderBottom: "1px solid", borderColor: "divider", pb: 2 }}
      >
        <Typography variant="h6" fontWeight={600}>
          {initialData ? "Editar Sucursal" : "Nueva Sucursal"}
        </Typography>
      </DialogTitle>

      <DialogContent
        sx={{
          py: 3,
          overflow: "visible",
          maxHeight: "60vh", // 👈 si hay poco alto, scroll interno
        }}
      >
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre"
                value={form.nombre}
                onChange={(e) => handleChange("nombre", e.target.value)}
                error={touched.nombre && !form.nombre}
                helperText={
                  touched.nombre && !form.nombre
                    ? "Campo requerido"
                    : touched.nombre &&
                      !/^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .-]+$/.test(form.nombre)
                    ? "No se permiten caracteres especiales"
                    : ""
                }
                required
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Teléfono"
                value={form.telefono}
                onChange={(e) => handleChange("telefono", e.target.value)}
                error={
                  touched.telefono &&
                  form.telefono &&
                  !/^\d{7,10}$/.test(form.telefono)
                }
                helperText={
                  touched.telefono &&
                  form.telefono &&
                  !/^\d{7,10}$/.test(form.telefono)
                    ? "Ingrese un teléfono válido"
                    : "Opcional"
                }
                disabled={loading}
                inputProps={{ maxLength: 10 }}
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

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
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

export default SucursalForm;
