import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  MenuItem,
  Grid,
  CircularProgress,
  Alert,
  Paper,
} from "@mui/material";
import { X, Save, ArrowRight } from "lucide-react";
import { toast } from "react-toastify";

import ServiceMovimiento from "@/services/ServiceMovimiento";
import ServiceSucursal from "@/services/ServiceSucursal";
import ServiceAlmacen from "@/services/ServiceAlmacen";
import ServiceSeccion from "@/services/ServiceSeccion";
import ServiceCategoria from "@/services/ServiceCategoria";
import ServiceImportacion from "@/services/ServiceImportacion";

const MovimientoEditDialog = ({ open, id, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detalle, setDetalle] = useState(null);

  const [sucursales, setSucursales] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [importaciones, setImportaciones] = useState([]);

const [form, setForm] = useState({
  sucursalId: "",
  almacenId: "",
  seccionId: "",
  categoriaId: "",
  importacionId: "",
  tipoMovimiento: "ENTRADA",
  productoDescripcion: "",
  productoPrecioOrigen: "",
  productoPrecio: "",
  productoObservado: 1,
  productoObsDescripcion: "",
});

  const [errors, setErrors] = useState({});

  const seccionSeleccionada = useMemo(() => {
    return secciones.find((s) => Number(s.id) === Number(form.seccionId));
  }, [secciones, form.seccionId]);

  const modeloNombre =
    seccionSeleccionada?.modeloNombre ||
    seccionSeleccionada?.modelo?.nombreModelo ||
    seccionSeleccionada?.modeloProducto?.nombreModelo ||
    detalle?.modelo?.nombreModelo ||
    "—";

  const handleChange = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "sucursalId") {
        next.almacenId = "";
        next.seccionId = "";
      }

      if (field === "almacenId") {
        next.seccionId = "";
      }

      return next;
    });

    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const cargarAlmacenes = async (sucursalId) => {
    if (!sucursalId) {
      setAlmacenes([]);
      return;
    }

    const res = await ServiceAlmacen.getAll({ sucursalId, page: 1, pageSize: 1000 });
    setAlmacenes(Array.isArray(res) ? res : res.items || []);
  };

  const cargarSecciones = async (almacenId) => {
    if (!almacenId) {
      setSecciones([]);
      return;
    }

    const res = await ServiceSeccion.getAll({ almacenId, page: 1, pageSize: 1000 });
    setSecciones(Array.isArray(res) ? res : res.items || []);
  };

  useEffect(() => {
    if (!open || !id) return;

    const load = async () => {
      try {
        setLoading(true);

        const [det, sucRes, catRes, impRes] = await Promise.all([
          ServiceMovimiento.getDetalle(id),
          ServiceSucursal.getAll({ page: 1, pageSize: 1000 }),
          ServiceCategoria.getAll({ page: 1, pageSize: 1000 }),
          ServiceImportacion.getConcluidas({ page: 1, pageSize: 1000 }),
        ]);

        setDetalle(det);

        setSucursales(Array.isArray(sucRes) ? sucRes : sucRes.items || []);
        setCategorias(Array.isArray(catRes) ? catRes : catRes.items || []);
        setImportaciones(Array.isArray(impRes) ? impRes : impRes.items || []);

        const sucursalId = det.sucursal?.id || "";
        const almacenId = det.almacen?.id || "";

        let almList = [];
        let secList = [];

        if (sucursalId) {
          const almRes = await ServiceAlmacen.getAll({
            sucursalId,
            page: 1,
            pageSize: 1000,
          });
          almList = Array.isArray(almRes) ? almRes : almRes.items || [];
          setAlmacenes(almList);
        }

        if (almacenId) {
          const secRes = await ServiceSeccion.getAll({
            almacenId,
            page: 1,
            pageSize: 1000,
          });
          secList = Array.isArray(secRes) ? secRes : secRes.items || [];
          setSecciones(secList);
        }

        const seccionActual = secList.find(
          (s) =>
            Number(s.id) === Number(det.seccion?.id) ||
            Number(s.modeloId) === Number(det.modelo?.id)
        );

        setForm({
          sucursalId,
          almacenId,
          seccionId: seccionActual?.id || det.seccion?.id || "",
          categoriaId: det.categoria?.id || "",
          importacionId: det.importacion?.id || "",
          tipoMovimiento: det.tipoMovimiento || "ENTRADA",
          productoDescripcion: det.producto?.descripcion || "",
          productoPrecioOrigen: det.producto?.precioOrigen || "",
          productoPrecio: det.producto?.precio || "",
          productoObservado: det.producto?.observado ?? 1,
          productoObsDescripcion: det.producto?.obsDescripcion || "",
        });
      } catch (error) {
        console.error(error);
        toast.error(error?.message || "No se pudo cargar el movimiento");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [open, id]);

  useEffect(() => {
    if (!form.sucursalId) return;
    cargarAlmacenes(form.sucursalId);
  }, [form.sucursalId]);

  useEffect(() => {
    if (!form.almacenId) return;
    cargarSecciones(form.almacenId);
  }, [form.almacenId]);

  const validate = () => {
    const next = {};

    if (!form.sucursalId) next.sucursalId = "Selecciona una sucursal";
    if (!form.almacenId) next.almacenId = "Selecciona un almacén";
    if (!form.seccionId) next.seccionId = "Selecciona una sección";
    if (!form.categoriaId) next.categoriaId = "Selecciona una categoría";
    if (!form.importacionId) next.importacionId = "Selecciona una importación";
    if (!form.tipoMovimiento) next.tipoMovimiento = "Selecciona el tipo";
    if (!form.productoPrecioOrigen) {
      next.productoPrecioOrigen = "Ingresa el precio base";
    }

    if (!form.productoPrecio) {
      next.productoPrecio = "Ingresa el precio de venta";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setSaving(true);

     await ServiceMovimiento.updateDetalle(id, {
      almacenId: Number(form.almacenId),
      seccionId: Number(form.seccionId),
      categoriaId: Number(form.categoriaId),
      importacionId: Number(form.importacionId),
      tipoMovimiento: form.tipoMovimiento,
      productoDescripcion: form.productoDescripcion,
      productoPrecioOrigen: Number(form.productoPrecioOrigen),
      productoPrecio: Number(form.productoPrecio),
      productoObservado: Number(form.productoObservado),
      productoObsDescripcion: form.productoObsDescripcion,
    });

      toast.success("Movimiento actualizado correctamente");
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "No se pudo actualizar el movimiento");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle
        sx={{
          bgcolor: "#592B2B",
          color: "#fff",
          px: 3,
          py: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography fontSize={20} fontWeight={900}>
            Editar movimiento
          </Typography>
          <Typography fontSize={13} sx={{ opacity: 0.85 }}>
            Selecciona sucursal, almacén, sección y actualiza los datos del producto
          </Typography>
        </Box>

        <IconButton onClick={onClose} disabled={saving} sx={{ color: "#fff" }}>
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: "#FAF8F6" }}>
        {loading ? (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <CircularProgress sx={{ color: "#592B2B" }} />
            <Typography mt={2} color="text.secondary">
              Cargando datos...
            </Typography>
          </Box>
        ) : (
          <Box>
            {detalle && (
              <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                Editando movimiento #{detalle.id} — Producto:{" "}
                {detalle.producto?.numeroSerie || "—"}
              </Alert>
            )}

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: "#fff" }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Sucursal"
                    value={form.sucursalId}
                    onChange={(e) => handleChange("sucursalId", e.target.value)}
                    error={!!errors.sucursalId}
                    helperText={errors.sucursalId}
                  >
                    {sucursales.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.nombre}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Almacén"
                    value={form.almacenId}
                    onChange={(e) => handleChange("almacenId", e.target.value)}
                    error={!!errors.almacenId}
                    helperText={errors.almacenId}
                    disabled={!form.sucursalId}
                  >
                    {almacenes.map((a) => (
                      <MenuItem key={a.id} value={a.id}>
                        {a.nombre}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "#592B2B", fontWeight: 800 }}>
                    <ArrowRight size={16} />
                    La sección define el modelo del producto.
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Sección"
                    value={form.seccionId}
                    onChange={(e) => handleChange("seccionId", e.target.value)}
                    error={!!errors.seccionId}
                    helperText={errors.seccionId}
                    disabled={!form.almacenId}
                  >
                    {secciones.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.nombre} — {s.modeloNombre || s.modelo?.nombreModelo || "Sin modelo"}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Modelo" value={modeloNombre} disabled />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Categoría"
                    value={form.categoriaId}
                    onChange={(e) => handleChange("categoriaId", e.target.value)}
                    error={!!errors.categoriaId}
                    helperText={errors.categoriaId}
                  >
                    {categorias.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.nombre}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Importación"
                    value={form.importacionId}
                    onChange={(e) => handleChange("importacionId", e.target.value)}
                    error={!!errors.importacionId}
                    helperText={errors.importacionId}
                  >
                    {importaciones.map((i) => (
                      <MenuItem key={i.id} value={i.id}>
                        {i.codigo || `Importación #${i.id}`}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    fullWidth
                    label="Tipo de movimiento"
                    value={form.tipoMovimiento}
                    onChange={(e) => handleChange("tipoMovimiento", e.target.value)}
                    error={!!errors.tipoMovimiento}
                    helperText={errors.tipoMovimiento}
                  >
                    <MenuItem value="ENTRADA">ENTRADA</MenuItem>
                  </TextField>
                </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Precio base"
                  value={form.productoPrecioOrigen}
                  onChange={(e) => handleChange("productoPrecioOrigen", e.target.value)}
                  error={!!errors.productoPrecioOrigen}
                  helperText={errors.productoPrecioOrigen}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Precio venta"
                  value={form.productoPrecio}
                  onChange={(e) => handleChange("productoPrecio", e.target.value)}
                  error={!!errors.productoPrecio}
                  helperText={errors.productoPrecio}
                />
              </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    fullWidth
                    label="Observado"
                    value={form.productoObservado}
                    onChange={(e) => handleChange("productoObservado", e.target.value)}
                  >
                    <MenuItem value={1}>No</MenuItem>
                    <MenuItem value={2}>Sí</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    label="Descripción del producto"
                    value={form.productoDescripcion}
                    onChange={(e) => handleChange("productoDescripcion", e.target.value)}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    label="Detalle de observación"
                    value={form.productoObsDescripcion}
                    onChange={(e) => handleChange("productoObsDescripcion", e.target.value)}
                    disabled={Number(form.productoObservado) !== 2}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: "#FAF8F6" }}>
        <Button onClick={onClose} disabled={saving} sx={{ color: "#592B2B", fontWeight: 700 }}>
          Cancelar
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving || loading}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save size={17} />}
          sx={{
            borderRadius: 2,
            px: 3,
            fontWeight: 800,
            bgcolor: "#592B2B",
            "&:hover": { bgcolor: "#3A1A1A" },
          }}
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MovimientoEditDialog;