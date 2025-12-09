// src/pages/productos/BuscarProductoModal.jsx
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
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";
import { toast } from "react-toastify";

import ServiceProducto from "@/services/ServiceProducto";
import ServiceCiudad from "@/services/ServiceCiudad";
import ServiceSucursal from "@/services/ServiceSucursal";
import ServiceAlmacen from "@/services/ServiceAlmacen";
import ServiceSeccion from "@/services/ServiceSeccion";

const BuscarProductoModal = ({ open, onClose, onSaved }) => {
  const [serie, setSerie] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [productoId, setProductoId] = useState(null);

  // combos
  const [ciudades, setCiudades] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [secciones, setSecciones] = useState([]);

  const [loadingSucursales, setLoadingSucursales] = useState(false);
  const [loadingAlmacenes, setLoadingAlmacenes] = useState(false);
  const [loadingSecciones, setLoadingSecciones] = useState(false);

  const [form, setForm] = useState({
    numeroSerie: "",
    descripcion: "",
    precioOrigen: "",
    precio: "",
    categoriaId: "",
    modeloId: "",
    importacionId: "",
    ciudadId: "",
    sucursalId: "",
    almacenId: "",
    seccionId: "",
  });

  // cargar ciudades al abrir el modal
  useEffect(() => {
    if (!open) return;

    (async () => {
      try {
        const data = await ServiceCiudad.getAll();
        const list = Array.isArray(data) ? data : data.items || [];
        setCiudades(list);
      } catch (err) {
        console.error(err);
        toast.error("Error al cargar ciudades");
      }
    })();
  }, [open]);

  // ciudad -> sucursales
  useEffect(() => {
    if (!form.ciudadId) {
      setSucursales([]);
      setForm((prev) => ({
        ...prev,
        sucursalId: "",
        almacenId: "",
        seccionId: "",
      }));
      return;
    }

    (async () => {
      setLoadingSucursales(true);
      try {
        const res = await ServiceSucursal.getAll({ ciudadId: form.ciudadId });
        const list = Array.isArray(res) ? res : res.items || [];
        setSucursales(list);
        setForm((prev) => ({
          ...prev,
          sucursalId: "",
          almacenId: "",
          seccionId: "",
        }));
        setAlmacenes([]);
        setSecciones([]);
      } catch (err) {
        console.error(err);
        toast.error("Error al cargar sucursales");
      } finally {
        setLoadingSucursales(false);
      }
    })();
  }, [form.ciudadId]);

  // sucursal -> almacenes
  useEffect(() => {
    if (!form.sucursalId) {
      setAlmacenes([]);
      setForm((prev) => ({
        ...prev,
        almacenId: "",
        seccionId: "",
      }));
      return;
    }

    (async () => {
      setLoadingAlmacenes(true);
      try {
        const res = await ServiceAlmacen.getAll({ sucursalId: form.sucursalId });
        const list = Array.isArray(res) ? res : res.items || [];
        setAlmacenes(list);
        setForm((prev) => ({
          ...prev,
          almacenId: "",
          seccionId: "",
        }));
        setSecciones([]);
      } catch (err) {
        console.error(err);
        toast.error("Error al cargar almacenes");
      } finally {
        setLoadingAlmacenes(false);
      }
    })();
  }, [form.sucursalId]);

  // almacén -> secciones
  useEffect(() => {
    if (!form.almacenId) {
      setSecciones([]);
      setForm((prev) => ({
        ...prev,
        seccionId: "",
      }));
      return;
    }

    (async () => {
      setLoadingSecciones(true);
      try {
        const res = await ServiceSeccion.getAll({ almacenId: form.almacenId });
        const list = Array.isArray(res) ? res : res.items || [];
        setSecciones(list);
        setForm((prev) => ({
          ...prev,
          seccionId: "",
        }));
      } catch (err) {
        console.error(err);
        toast.error("Error al cargar secciones");
      } finally {
        setLoadingSecciones(false);
      }
    })();
  }, [form.almacenId]);

  const resetState = () => {
    setSerie("");
    setProductoId(null);
    setForm({
      numeroSerie: "",
      descripcion: "",
      precioOrigen: "",
      precio: "",
      categoriaId: "",
      modeloId: "",
      importacionId: "",
      ciudadId: "",
      sucursalId: "",
      almacenId: "",
      seccionId: "",
    });
    setSucursales([]);
    setAlmacenes([]);
    setSecciones([]);
  };

  const handleClose = () => {
    resetState();
    onClose?.();
  };

  const handleBuscar = async () => {
    if (!serie.trim()) {
      toast.warning("Ingresa un número de serie");
      return;
    }

    setBuscando(true);
    setProductoId(null);

    try {
      const data = await ServiceProducto.getDetalleBySerie(serie.trim());
      if (!data) {
        toast.info("No se encontró ningún producto con esa serie");
        return;
      }

      setProductoId(data.id);

      const seccion = data.seccion || null;
      const almacen = seccion?.almacen || null;
      const sucursal = almacen?.sucursal || null;
      const ciudad = sucursal?.ciudad || null;

      // cargar combos según la ubicación actual
      if (ciudad?.id) {
        const resSuc = await ServiceSucursal.getAll({ ciudadId: ciudad.id });
        const listSuc = Array.isArray(resSuc) ? resSuc : resSuc.items || [];
        setSucursales(listSuc);
      }
      if (sucursal?.id) {
        const resAlm = await ServiceAlmacen.getAll({
          sucursalId: sucursal.id,
        });
        const listAlm = Array.isArray(resAlm) ? resAlm : resAlm.items || [];
        setAlmacenes(listAlm);
      }
      if (almacen?.id) {
        const resSec = await ServiceSeccion.getAll({ almacenId: almacen.id });
        const listSec = Array.isArray(resSec) ? resSec : resSec.items || [];
        setSecciones(listSec);
      }

      setForm({
        numeroSerie: data.numeroSerie || "",
        descripcion: data.descripcion || "",
        precioOrigen: data.precioOrigen ?? "",
        precio: data.precio ?? "",
        categoriaId: data.categoriaId || "",
        modeloId: data.modeloId || "",
        importacionId: data.importacionId || "",
        ciudadId: ciudad?.id || "",
        sucursalId: sucursal?.id || "",
        almacenId: almacen?.id || "",
        seccionId: seccion?.id || "",
      });
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.detail ||
          "Error al buscar el producto por número de serie"
      );
    } finally {
      setBuscando(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGuardar = async () => {
    if (!productoId) {
      toast.warning("Primero busca un producto");
      return;
    }

    try {
      setGuardando(true);

      const payload = {
        numeroSerie: form.numeroSerie.trim(),
        descripcion: form.descripcion.trim(),
        precioOrigen: form.precioOrigen
          ? Number(form.precioOrigen)
          : undefined,
        precio: form.precio ? Number(form.precio) : undefined,
        categoriaId: form.categoriaId
          ? Number(form.categoriaId)
          : undefined,
        modeloId: form.modeloId ? Number(form.modeloId) : undefined,
        importacionId: form.importacionId
          ? Number(form.importacionId)
          : undefined,
        seccionId: form.seccionId ? Number(form.seccionId) : undefined,
      };

      // limpiar undefined para no mandarlos
      Object.keys(payload).forEach((k) => {
        if (payload[k] === undefined) delete payload[k];
      });

      await ServiceProducto.update(productoId, payload);
      toast.success("Producto actualizado correctamente");

      onSaved?.();
      handleClose();
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.detail || "Error al actualizar el producto"
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Buscar y editar producto por N° de serie</DialogTitle>

      <DialogContent dividers>
        {/* Búsqueda */}
        <Box sx={{ mb: 2, display: "flex", gap: 1 }}>
          <TextField
            label="N° de Serie"
            value={serie}
            onChange={(e) => setSerie(e.target.value)}
            fullWidth
            size="small"
          />
          <Button
            onClick={handleBuscar}
            variant="contained"
            disabled={buscando}
          >
            {buscando ? "Buscando..." : "Buscar"}
          </Button>
        </Box>

        {!productoId && !buscando && (
          <Typography variant="body2" color="text.secondary">
            Ingresa un número de serie y presiona <strong>Buscar</strong> para
            cargar el producto y su ubicación.
          </Typography>
        )}

        {buscando && (
          <Box sx={{ textAlign: "center", py: 3 }}>
            <CircularProgress sx={{ mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Buscando producto...
            </Typography>
          </Box>
        )}

        {/* Formulario de edición */}
        {productoId && !buscando && (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {/* Datos básicos */}
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
                  label="Precio origen"
                  name="precioOrigen"
                  type="number"
                  value={form.precioOrigen}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  inputProps={{ step: "0.01" }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Precio"
                  name="precio"
                  type="number"
                  value={form.precio}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  inputProps={{ step: "0.01" }}
                />
              </Grid>

              {/* Ubicación */}
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Ciudad"
                  name="ciudadId"
                  value={form.ciudadId}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                >
                  <MenuItem value="">-- Seleccionar --</MenuItem>
                  {ciudades.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.nombre}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Sucursal"
                  name="sucursalId"
                  value={form.sucursalId}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  disabled={!form.ciudadId || loadingSucursales}
                >
                  <MenuItem value="">-- Seleccionar --</MenuItem>
                  {sucursales.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.nombre}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Almacén"
                  name="almacenId"
                  value={form.almacenId}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  disabled={!form.sucursalId || loadingAlmacenes}
                >
                  <MenuItem value="">-- Seleccionar --</MenuItem>
                  {almacenes.map((a) => (
                    <MenuItem key={a.id} value={a.id}>
                      {a.nombre}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Sección"
                  name="seccionId"
                  value={form.seccionId}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  disabled={!form.almacenId || loadingSecciones}
                >
                  <MenuItem value="">-- Seleccionar --</MenuItem>
                  {secciones.map((sec) => (
                    <MenuItem key={sec.id} value={sec.id}>
                      {sec.nombre}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} color="secondary">
          Cerrar
        </Button>
        <Button
          onClick={handleGuardar}
          variant="contained"
          disabled={!productoId || guardando}
        >
          {guardando ? "Guardando..." : "Guardar cambios"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BuscarProductoModal;
