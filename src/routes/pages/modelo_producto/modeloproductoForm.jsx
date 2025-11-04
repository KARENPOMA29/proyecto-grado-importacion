import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { toast } from "react-toastify";
import ServiceModeloProducto from "@/services/ServiceModeloProducto";

const UNIDADES = ["Unidades", "Litros", "Kg", "Metros", "Pies³", "BTU"];

const ModeloProductoForm = ({ onClose, onSuccess, initialData = null }) => {
  const [form, setForm] = useState({
    nombreModelo: "",
    marca: "",
    capacidadOTamano: "",
    unidadMedida: "",
    stockMinimo: 0,
    stockActual: 0,
  });

  const [touched, setTouched] = useState({
    nombreModelo: false,
    marca: false,
    capacidadOTamano: false,
    unidadMedida: false,
    stockMinimo: false,
    stockActual: false,
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // regex
  const regexNombreModelo = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .\-\/]+$/;
  const regexMarca = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .\-]+$/;

  useEffect(() => {
    setForm({
      nombreModelo: initialData?.nombreModelo || "",
      marca: initialData?.marca || "",
      capacidadOTamano: initialData?.capacidadOTamano ?? "",
      unidadMedida: initialData?.unidadMedida || "",
      stockMinimo: initialData?.stockMinimo ?? 0,
      stockActual: initialData?.stockActual ?? 0,
    });
    setErrorMsg("");
    setTouched({
      nombreModelo: false,
      marca: false,
      capacidadOTamano: false,
      unidadMedida: false,
      stockMinimo: false,
      stockActual: false,
    });
  }, [initialData]);

  const handleChange = (field, value) => {
    let newVal = value;

    if (field === "nombreModelo") {
      newVal = newVal.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .\-\/]/g, "");
    }
    if (field === "marca") {
      newVal = newVal.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .\-]/g, "");
    }
    if (field === "capacidadOTamano") {
      newVal = newVal.replace(/\D/g, ""); // solo números
    }
    if (field === "stockMinimo" || field === "stockActual") {
      newVal = newVal.replace(/\D/g, "");
    }

    setForm((prev) => ({ ...prev, [field]: newVal }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const validate = () => {
    // nombre
    if (!form.nombreModelo) {
      setErrorMsg("El nombre del modelo es obligatorio");
      return false;
    }
    if (!regexNombreModelo.test(form.nombreModelo)) {
      setErrorMsg("El nombre del modelo no debe tener caracteres especiales");
      return false;
    }

    // marca
    if (!form.marca) {
      setErrorMsg("La marca es obligatoria");
      return false;
    }
    if (!regexMarca.test(form.marca)) {
      setErrorMsg("La marca no debe tener caracteres especiales");
      return false;
    }

    // stock mínimo
    const stockMin = Number(form.stockMinimo);
    if (Number.isNaN(stockMin) || stockMin < 0) {
      setErrorMsg("El stock mínimo debe ser un número mayor o igual a 0");
      return false;
    }

    // stock actual
    const stockAct = Number(form.stockActual);
    if (Number.isNaN(stockAct) || stockAct < 0) {
      setErrorMsg("El stock actual debe ser un número mayor o igual a 0");
      return false;
    }

    // unidad de medida opcional: si viene, que sea de la lista
    if (form.unidadMedida && !UNIDADES.includes(form.unidadMedida)) {
      setErrorMsg("Seleccione una unidad de medida válida");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    // marcar todos
    setTouched({
      nombreModelo: true,
      marca: true,
      capacidadOTamano: true,
      unidadMedida: true,
      stockMinimo: true,
      stockActual: true,
    });

    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        ...form,
        stockMinimo: Number(form.stockMinimo) || 0,
        stockActual: Number(form.stockActual) || 0,
        capacidadOTamano: form.capacidadOTamano
          ? Number(form.capacidadOTamano)
          : null,
      };

      let resp;
      if (initialData?.id) {
        resp = await ServiceModeloProducto.update(initialData.id, payload);
        toast.success("Modelo actualizado correctamente");
      } else {
        resp = await ServiceModeloProducto.create(payload);
        toast.success("Modelo creado correctamente");
      }

      onSuccess?.(resp);
      onClose?.();
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "Error al guardar el modelo";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={true} // en tu lista lo cambias por open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: "visible", // 👈 evita el corte
        },
      }}
    >
      <DialogTitle sx={{ borderBottom: "1px solid", borderColor: "divider", pb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          {initialData ? "Editar Modelo" : "Nuevo Modelo"}
        </Typography>
      </DialogTitle>

      <DialogContent
        sx={{
          py: 3,
          overflow: "visible",
          maxHeight: "65vh", // si la pantalla es chica, scroll interno
        }}
      >
        <form onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            {/* NOMBRE MODELO */}
            <Grid item xs={12} md={4}>
              <TextField
                label="Nombre del Modelo *"
                fullWidth
                value={form.nombreModelo}
                onChange={(e) => handleChange("nombreModelo", e.target.value)}
                error={
                  touched.nombreModelo &&
                  (!form.nombreModelo || !regexNombreModelo.test(form.nombreModelo))
                }
                helperText={
                  touched.nombreModelo && !form.nombreModelo
                    ? "Campo obligatorio"
                    : touched.nombreModelo &&
                      !regexNombreModelo.test(form.nombreModelo)
                    ? "No se permiten caracteres especiales"
                    : ""
                }
                disabled={loading}
                required
              />
            </Grid>

            {/* MARCA */}
            <Grid item xs={12} md={4}>
              <TextField
                label="Marca *"
                fullWidth
                value={form.marca}
                onChange={(e) => handleChange("marca", e.target.value)}
                error={touched.marca && (!form.marca || !regexMarca.test(form.marca))}
                helperText={
                  touched.marca && !form.marca
                    ? "Campo obligatorio"
                    : touched.marca && !regexMarca.test(form.marca)
                    ? "No se permiten caracteres especiales"
                    : ""
                }
                disabled={loading}
                required
              />
            </Grid>

            {/* CAPACIDAD / TAMAÑO */}
            <Grid item xs={12} md={4}>
              <TextField
                label="Capacidad/Tamaño"
                fullWidth
                value={form.capacidadOTamano}
                onChange={(e) => handleChange("capacidadOTamano", e.target.value)}
                helperText="Opcional - solo números"
                disabled={loading}
              />
            </Grid>

            {/* UNIDAD DE MEDIDA (combo) */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth disabled={loading}>
                <InputLabel id="unidad-label">Unidad de medida</InputLabel>
                <Select
                  labelId="unidad-label"
                  label="Unidad de medida"
                  value={form.unidadMedida || ""}
                  onChange={(e) => handleChange("unidadMedida", e.target.value)}
                  MenuProps={{ sx: { zIndex: 2000 } }}
                >
                  <MenuItem value="">
                    <em>Sin unidad</em>
                  </MenuItem>
                  {UNIDADES.map((u) => (
                    <MenuItem key={u} value={u}>
                      {u}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary">
                Opcional
              </Typography>
            </Grid>

            {/* STOCK MINIMO */}
            <Grid item xs={12} md={4}>
              <TextField
                label="Stock Mínimo *"
                fullWidth
                value={form.stockMinimo}
                onChange={(e) => handleChange("stockMinimo", e.target.value)}
                error={
                  touched.stockMinimo &&
                  (form.stockMinimo === "" || Number(form.stockMinimo) < 0)
                }
                helperText={
                  touched.stockMinimo &&
                  (form.stockMinimo === "" || Number(form.stockMinimo) < 0)
                    ? "Debe ser un número >= 0"
                    : ""
                }
                disabled={loading}
                required
              />
            </Grid>

            {/* STOCK REAL */}
            <Grid item xs={12} md={4}>
              <TextField
                label="Stock real"
                fullWidth
                value={form.stockActual}
                onChange={(e) => handleChange("stockActual", e.target.value)}
                error={
                  touched.stockActual &&
                  (form.stockActual === "" || Number(form.stockActual) < 0)
                }
                helperText={
                  touched.stockActual &&
                  (form.stockActual === "" || Number(form.stockActual) < 0)
                    ? "Debe ser un número >= 0"
                    : "Se creará en 0"
                }
                disabled={loading}
              />
            </Grid>
          </Grid>

          {errorMsg && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {errorMsg}
            </Alert>
          )}
        </form>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{ minWidth: 110 }}
        >
          {loading ? "Guardando..." : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModeloProductoForm;
