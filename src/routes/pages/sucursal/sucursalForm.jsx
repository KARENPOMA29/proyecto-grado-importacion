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
  MenuItem,
  IconButton,
  Tooltip,
  Divider,
} from "@mui/material";
import { Plus } from "lucide-react";

import ServiceSucursal from "@/services/ServiceSucursal";
import ServiceCiudad from "@/services/ServiceCiudad";
import CiudadForm from "@/routes/pages/ciudad/ciudadForm";

// 👇 nuevos componentes reutilizables
import LoadingOverlay from "@/components/LoadingOverlay";
import SuccessDialog from "@/components/SuccessDialog";

const SucursalForm = ({ onClose, onSuccess, initialData = null }) => {
  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    direccion: "",
    idCiudad: "",
  });

  const [ciudades, setCiudades] = useState([]);
  const [formError, setFormError] = useState("");
  const [touched, setTouched] = useState({
    nombre: false,
    telefono: false,
    direccion: false,
    idCiudad: false,
  });

  const [loading, setLoading] = useState(false);           // para overlay + botón
  const [loadingCiudades, setLoadingCiudades] = useState(false);
  const [showCiudadForm, setShowCiudadForm] = useState(false);

  const [successOpen, setSuccessOpen] = useState(false);   // para SuccessDialog
  const [successMessage, setSuccessMessage] = useState(""); // texto dinámico

  // ---------------------------- Cargar ciudades ----------------------------
  const fetchCiudades = async () => {
    try {
      setLoadingCiudades(true);
      const res = await ServiceCiudad.getAll();
      setCiudades(res.items || []);
    } catch (err) {
      console.error("Error cargando ciudades:", err);
      toast.error(err.message || "Error al cargar ciudades");
    } finally {
      setLoadingCiudades(false);
    }
  };

  useEffect(() => {
    fetchCiudades();
  }, []);

  // ---------------------- Cargar datos iniciales (editar) ------------------
  useEffect(() => {
    setForm({
      nombre: initialData?.nombre || "",
      telefono: initialData?.telefono || "",
      direccion: initialData?.direccion || "",
      idCiudad: initialData?.idCiudad ?? "",
    });
    setFormError("");
    setTouched({
      nombre: false,
      telefono: false,
      direccion: false,
      idCiudad: false,
    });
  }, [initialData]);

  // ------------------------------ Handlers ---------------------------------
  const handleChange = (field, value) => {
    let v = value;

    if (field === "nombre") {
      v = v.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .-]/g, "");
    }

    if (field === "telefono") {
      v = v.replace(/\D/g, "");
    }

    if (field === "direccion") {
      v = v.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .,#\-]/g, "");
    }

    if (field === "idCiudad") {
      v = v === "" ? "" : Number(v);
    }

    setForm((prev) => ({ ...prev, [field]: v }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const validateForm = () => {
    if (!form.nombre) {
      setFormError("Por favor complete el nombre de la sucursal");
      return false;
    }

    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .-]+$/.test(form.nombre)) {
      setFormError("El nombre no debe tener caracteres especiales");
      return false;
    }

    if (form.telefono && !/^\d{7,10}$/.test(form.telefono)) {
      setFormError("El teléfono debe tener entre 7 y 10 dígitos");
      return false;
    }

    if (form.direccion && !/^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .,#\-]+$/.test(form.direccion)) {
      setFormError("La dirección contiene caracteres no permitidos");
      return false;
    }

    if (!form.idCiudad) {
      setFormError("Seleccione la ciudad de la sucursal");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setFormError("");

    setTouched({
      nombre: true,
      telefono: true,
      direccion: true,
      idCiudad: true,
    });

    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        telefono: form.telefono || null,
        direccion: form.direccion || null,
        idCiudad: form.idCiudad || null,
      };

      if (initialData?.id) {
        await ServiceSucursal.update(initialData.id, payload);
        toast.success("Sucursal actualizada correctamente");
        setSuccessMessage("Sucursal actualizada correctamente");
      } else {
        await ServiceSucursal.create(payload);
        toast.success("Sucursal creada correctamente");
        setSuccessMessage("Sucursal creada correctamente");
      }

      // mostramos modal de éxito
      setSuccessOpen(true);

      // pequeño delay para que el usuario vea la confirmación
      setTimeout(() => {
        setSuccessOpen(false);
        onSuccess?.();
        onClose?.();
      }, 1200);
    } catch (err) {
      console.error("Error submitting sucursal form:", err);
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Error al procesar la sucursal";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // cuando se crea una ciudad desde el modal
  const handleCiudadCreated = (nuevaCiudad) => {
    if (nuevaCiudad) {
      setCiudades((prev) => [...prev, nuevaCiudad]);
      setForm((prev) => ({ ...prev, idCiudad: nuevaCiudad.id }));
    }
    setShowCiudadForm(false);
  };

  // ------------------------------ Render -----------------------------------
  return (
    <>
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
          sx={{
            p: 2.5,
            pb: 2,
            background: "linear-gradient(135deg, #592B2B 0%, #3A1A1A 100%)",
            color: "#F5F5F5",
          }}
        >
          <Typography variant="h6" fontWeight={700}>
            {initialData ? "Editar Sucursal" : "Nueva Sucursal"}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            Define los datos básicos de la sucursal y su ciudad de operación.
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
            onSubmit={handleSubmit}
            noValidate
            sx={{
              bgcolor: "#FFFFFF",
              borderRadius: 2,
              p: 2.5,
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}
          >
            <Grid container spacing={2}>
              {/* Nombre y Teléfono */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Nombre de la sucursal"
                  value={form.nombre}
                  onChange={(e) => handleChange("nombre", e.target.value)}
                  error={touched.nombre && !form.nombre}
                  helperText={
                    touched.nombre && !form.nombre
                      ? "Campo requerido"
                      : touched.nombre &&
                        !/^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .-]+$/.test(form.nombre)
                      ? "No se permiten caracteres especiales"
                      : "Obligatorio"
                  }
                  required
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
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
                      ? "Ingrese un teléfono válido (7-10 dígitos)"
                      : "Opcional"
                  }
                  disabled={loading}
                  inputProps={{ maxLength: 10 }}
                />
              </Grid>

              {/* Dirección */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Dirección"
                  value={form.direccion}
                  onChange={(e) => handleChange("direccion", e.target.value)}
                  disabled={loading}
                  error={
                    touched.direccion &&
                    !!form.direccion &&
                    !/^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .,#\-]+$/.test(form.direccion)
                  }
                  helperText={
                    touched.direccion &&
                    !!form.direccion &&
                    !/^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .,#\-]+$/.test(form.direccion)
                      ? "La dirección contiene caracteres no permitidos"
                      : "Opcional"
                  }
                />
              </Grid>

              {/* Ciudad + botón agregar ciudad */}
              <Grid item xs={9} sm={8}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Ciudad"
                  value={form.idCiudad === "" ? "" : form.idCiudad}
                  onChange={(e) => handleChange("idCiudad", e.target.value)}
                  required
                  disabled={loading || loadingCiudades}
                  error={touched.idCiudad && !form.idCiudad}
                  helperText={
                    touched.idCiudad && !form.idCiudad
                      ? "Seleccione una ciudad"
                      : loadingCiudades
                      ? "Cargando ciudades..."
                      : "Obligatorio"
                  }
                >
                  <MenuItem value="">Seleccione una ciudad</MenuItem>
                  {ciudades.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.nombre}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid
                item
                xs={3}
                sm={4}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: { xs: "flex-end", sm: "flex-start" },
                }}
              >
                <Tooltip title="Agregar nueva ciudad">
                  <span>
                    <IconButton
                      onClick={() => setShowCiudadForm(true)}
                      disabled={loading}
                      sx={{
                        borderRadius: 2,
                        border: "1px dashed #D6C6C6",
                        bgcolor: "#F5F5F5",
                        "&:hover": {
                          bgcolor: "#EEE0E0",
                          borderColor: "#592B2B",
                        },
                      }}
                    >
                      <Plus size={20} color="#592B2B" />
                    </IconButton>
                  </span>
                </Tooltip>
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

        <DialogActions sx={{ px: 3, py: 2.5, gap: 1.5 }}>
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
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            sx={{
              textTransform: "none",
              borderRadius: 999,
              px: 4,
              minWidth: 140,
              fontWeight: 600,
              background:
                "linear-gradient(135deg, #14AE5C 0%, #0D8C47 100%)",
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

      {/* Modal para crear ciudad desde aquí */}
      {showCiudadForm && (
        <CiudadForm
          onClose={() => setShowCiudadForm(false)}
          onSuccess={handleCiudadCreated}
        />
      )}

      {/* Overlay de carga global */}
      <LoadingOverlay open={loading} />

      {/* Dialog de éxito */}
      <SuccessDialog open={successOpen} message={successMessage} />
    </>
  );
};

export default SucursalForm;
