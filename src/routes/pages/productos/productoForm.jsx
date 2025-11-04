import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
} from "@mui/material";
import { toast } from "react-toastify";
import ServiceProducto from "@/services/ServiceProducto";
import ServiceModeloProducto from "@/services/ServiceModeloProducto";
import ServiceCategoria from "@/services/ServiceCategoria";
import ServiceImportacion from "@/services/ServiceImportacion";

const ProductoForm = ({ initialData = null, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    numeroSerie: initialData?.numeroSerie || "",
    descripcion: initialData?.descripcion || "",
    precio: initialData?.precio || "",
    color: initialData?.color || "",
    duracionGarantia: initialData?.duracionGarantia || "",
    tipoGarantia: initialData?.tipoGarantia || "",
    categoriaId: initialData?.categoriaId || "",
    modeloId: initialData?.modeloId || "",
    importacionId: initialData?.importacionId || "",
  });

  // catálogos
  const [modelos, setModelos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [importaciones, setImportaciones] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const m = await ServiceModeloProducto.getAll();
        setModelos(Array.isArray(m) ? m : m?.items || []);
      } catch {
        setModelos([]);
      }
      try {
        const c = await ServiceCategoria.getAll();
        setCategorias(Array.isArray(c) ? c : c?.items || []);
      } catch {
        setCategorias([]);
      }
      try {
        const i = await ServiceImportacion.getAll();
        setImportaciones(Array.isArray(i) ? i : i?.items || []);
      } catch {
        setImportaciones([]);
      }
    })();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      // opcional: convertir precio a número
      const payload = {
        ...form,
        precio: form.precio === "" ? null : Number(form.precio),
        duracionGarantia:
          form.duracionGarantia === "" ? null : Number(form.duracionGarantia),
        categoriaId: form.categoriaId === "" ? null : Number(form.categoriaId),
        modeloId: form.modeloId === "" ? null : Number(form.modeloId),
        importacionId:
          form.importacionId === "" ? null : Number(form.importacionId),
      };

      if (initialData) {
        await ServiceProducto.update(initialData.id, payload);
        toast.success("Producto actualizado correctamente");
      } else {
        await ServiceProducto.create(payload);
        toast.success("Producto creado correctamente");
      }
      onSuccess?.();
      onClose?.();
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.detail || "Error al guardar el producto"
      );
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {initialData ? "Editar Producto" : "Nuevo Producto"}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Número de Serie"
              name="numeroSerie"
              value={form.numeroSerie}
              onChange={handleChange}
              fullWidth
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Descripción"
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              fullWidth
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Precio"
              name="precio"
              value={form.precio}
              onChange={handleChange}
              type="number"
              fullWidth
              size="small"
              inputProps={{ step: "0.01" }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Color"
              name="color"
              value={form.color}
              onChange={handleChange}
              fullWidth
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Duración Garantía"
              name="duracionGarantia"
              value={form.duracionGarantia}
              onChange={handleChange}
              type="number"
              fullWidth
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Tipo de Garantía"
              name="tipoGarantia"
              value={form.tipoGarantia}
              onChange={handleChange}
              fullWidth
              size="small"
            />
          </Grid>

          {/* 👇 CATEGORÍA COMO COMBO */}
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Categoría"
              name="categoriaId"
              value={form.categoriaId}
              onChange={handleChange}
              fullWidth
              size="small"
            >
              <MenuItem value="">-- Seleccionar --</MenuItem>
              {categorias.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {/* ajusta a cat.nombreCategoria si tu API devuelve así */}
                  {cat.nombre || cat.nombreCategoria || `Cat ${cat.id}`}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* 👇 MODELO COMO COMBO */}
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Modelo"
              name="modeloId"
              value={form.modeloId}
              onChange={handleChange}
              fullWidth
              size="small"
            >
              <MenuItem value="">-- Seleccionar --</MenuItem>
              {modelos.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.nombreModelo || m.nombre || `Modelo ${m.id}`}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* 👇 IMPORTACIÓN COMO COMBO */}
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Importación"
              name="importacionId"
              value={form.importacionId}
              onChange={handleChange}
              fullWidth
              size="small"
            >
              <MenuItem value="">-- Seleccionar --</MenuItem>
              {importaciones.map((imp) => (
                <MenuItem key={imp.id} value={imp.id}>
                  {/* cambia a imp.codigoImportacion si tu API lo manda así */}
                  {imp.codigo || imp.codigoImportacion || `IMP-${imp.id}`}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="secondary">
          Cancelar
        </Button>
        <Button onClick={handleSubmit} variant="contained">
          {initialData ? "Actualizar" : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductoForm;
