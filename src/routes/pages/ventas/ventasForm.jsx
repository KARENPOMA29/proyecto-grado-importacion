// src/routes/pages/ventas/VentaForm.jsx
import { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Alert,
  Typography,
  IconButton,
  Autocomplete,
  Box,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import { toast } from "react-toastify";
import { Plus, Trash2 } from "lucide-react";
import ServiceVentas from "@/services/ServiceVentas";
import ServiceProducto from "@/services/ServiceProducto";
import ServiceCliente from "@/services/ServiceCliente";
import ServiceSucursal from "@/services/ServiceSucursal";
import { useAuth } from "@/context/AuthContext";
import BarcodeListener from "@/components/BarcodeListener";
import { createFilterOptions } from "@mui/material/Autocomplete";

const VentasForm = ({ onClose, onSuccess, initialData = null }) => {
  const { user } = useAuth();
  const empleadoId = user?.id || 1;

  const [form, setForm] = useState({
    empleadoId,
    clienteId: "",
    sucursalId: "",
    codigoVenta: initialData?.codigoVenta || "",
  });

  const [detalles, setDetalles] = useState(
    initialData?.detalles?.length
      ? initialData.detalles.map((d) => ({
          productoId: d.productoId,
          subtotal: Number(d.subtotal),
        }))
      : [{ productoId: "", subtotal: 0 }]
  );

  const [clientes, setClientes] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [productos, setProductos] = useState([]);
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [activeDetalle, setActiveDetalle] = useState(0);

  const productoInputRef = useRef(null);

  // Para buscar cliente por CI o por nombre
  const filterClientes = createFilterOptions({
    stringify: (option) => {
      const ci = option.identificacion || option.ci || "";
      const nombre = option.nombre || "";
      const telefono = option.telefono || option.celular || "";
      return `${ci} ${nombre} ${telefono}`;
    },
  });

  // CARGAR DATOS
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        const [cliRes, sucRes, prodRes] = await Promise.all([
          ServiceCliente.getAll(),
          ServiceSucursal.getAll(),
          ServiceProducto.getDisponibles(),
        ]);

        const cliData = Array.isArray(cliRes) ? cliRes : cliRes.items || [];
        const sucData = Array.isArray(sucRes) ? sucRes : sucRes.items || [];
        const prodData = Array.isArray(prodRes) ? prodRes : prodRes.items || [];

        setClientes(cliData);
        setSucursales(sucData);
        setProductos(prodData);
      } catch (err) {
        console.error(err);
        toast.error("Error al cargar datos iniciales: " + (err.message || err));
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, []);

  // 👀 TOTAL siempre numérico
  const total = detalles.reduce(
    (acc, d) => acc + (Number(d.subtotal) || 0),
    0
  );

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addDetalle = () => {
    setDetalles((prev) => [...prev, { productoId: "", subtotal: 0 }]);
    setActiveDetalle(detalles.length);
  };

  const removeDetalle = (idx) => {
    setDetalles((prev) => prev.filter((_, i) => i !== idx));
    if (activeDetalle === idx) setActiveDetalle(0);
  };

  const validateForm = () => {
    if (!form.clienteId) return "Seleccione un cliente";
    if (!form.sucursalId) return "Seleccione una sucursal";
    const ok = detalles.filter(
      (d) => d.productoId !== "" && Number(d.subtotal) > 0
    );
    if (!ok.length) return "Agregue al menos un producto";
    return "";
  };

  const handleSubmit = async () => {
    const err = validateForm();
    if (err) {
      setFormError(err);
      return;
    }

    setLoading(true);
    setFormError("");

    const payload = {
      ...form,
      empleadoId: Number(form.empleadoId),
      clienteId: Number(form.clienteId),
      sucursalId: Number(form.sucursalId),
      detalles: detalles
        .filter((d) => d.productoId !== "" && Number(d.subtotal) > 0)
        .map((d) => ({
          productoId: Number(d.productoId),
          subtotal: Number(d.subtotal),
        })),
    };

    try {
      await ServiceVentas.create(payload);
      toast.success("Venta registrada correctamente");
      onSuccess?.();
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Error al registrar la venta";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // 📦 SCANNER
  const handleScan = (code) => {
    if (!code) return;
    const producto = productos.find(
      (p) => String(p.numeroSerie) === String(code)
    );
    if (!producto) {
      toast.error("Producto no encontrado");
      return;
    }

    setDetalles((prev) => {
      const copy = [...prev];
      if (activeDetalle !== null && copy[activeDetalle]) {
        copy[activeDetalle] = {
          productoId: producto.id,
          subtotal: Number(producto.precio),
        };
      } else {
        copy.push({
          productoId: producto.id,
          subtotal: Number(producto.precio),
        });
      }
      return copy;
    });

    toast.success(`Producto ${producto.numeroSerie} agregado`);
  };

  // Cliente seleccionado para mostrar detalles
  const clienteSeleccionado = clientes.find(
    (c) => Number(c.id) === Number(form.clienteId)
  );

  return (
    <Dialog open={true} onClose={onClose} maxWidth="lg" fullWidth>
      <BarcodeListener
        onScan={handleScan}
        targetRef={productoInputRef}
        minLength={3}
        enabled={true}
        debug={false}
        autoLength={13}
      />

      <DialogTitle sx={{ fontWeight: 600, fontSize: 18, pb: 1 }}>
        {initialData ? "Editar venta" : "Nueva venta"}
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {/* INFORMACIÓN BÁSICA */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Información de la venta
            </Typography>
            <Grid container spacing={2}>
              {/* EMPLEADO */}
              <Grid item xs={12} md={4}>
                <TextField
                  label="Empleado"
                  value={
                    user?.nombreCompleto ||
                    user?.nombre ||
                    "Empleado"
                  }
                  fullWidth
                  size="small"
                  InputProps={{ readOnly: true }}
                />
              </Grid>

              {/* CLIENTE */}
              <Grid item xs={12} md={4}>
                <Autocomplete
                  options={clientes}
                  getOptionLabel={(c) => {
                    const ci = c.identificacion || c.ci || "";
                    const nombre = c.nombre || "Sin nombre";
                    const tel = c.telefono || c.celular || "";
                    return `${ci} - ${nombre}${tel ? " - " + tel : ""}`;
                  }}
                  filterOptions={filterClientes}
                  onChange={(_, value) =>
                    handleChange("clienteId", value?.id || "")
                  }
                  isOptionEqualToValue={(opt, val) => opt.id === val.id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Cliente (buscar por CI o nombre) *"
                      size="small"
                      error={!form.clienteId}
                      helperText={
                        !form.clienteId ? "Seleccione un cliente" : ""
                      }
                    />
                  )}
                  loading={loadingData}
                  loadingText="Cargando clientes..."
                  noOptionsText={
                    clientes.length === 0
                      ? "No hay clientes disponibles"
                      : "Sin coincidencias"
                  }
                  sx={{ minWidth: 240 }}
                  fullWidth
                />
              </Grid>

              {/* SUCURSAL */}
              <Grid item xs={12} md={4}>
                <Autocomplete
                  options={sucursales}
                  getOptionLabel={(s) => s.nombre || "Sin nombre"}
                  onChange={(_, value) =>
                    handleChange("sucursalId", value?.id || "")
                  }
                  isOptionEqualToValue={(opt, val) => opt.id === val.id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Sucursal *"
                      size="small"
                      error={!form.sucursalId}
                      helperText={
                        !form.sucursalId ? "Seleccione una sucursal" : ""
                      }
                    />
                  )}
                  loading={loadingData}
                  loadingText="Cargando sucursales..."
                  noOptionsText={
                    sucursales.length === 0
                      ? "No hay sucursales disponibles"
                      : "Sin coincidencias"
                  }
                  sx={{ minWidth: 240 }}
                  fullWidth
                />
              </Grid>

              {/* PANEL DE CLIENTE SELECCIONADO */}
              {clienteSeleccionado && (
                <Grid item xs={12}>
                  <Card
                    variant="outlined"
                    sx={{
                      backgroundColor: "grey.50",
                      borderStyle: "dashed",
                    }}
                  >
                    <CardContent sx={{ py: 1.5 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Datos del cliente
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={12} md={3}>
                          <Typography variant="body2">
                            <strong>Nombre:</strong>{" "}
                            {clienteSeleccionado.nombre}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <Typography variant="body2">
                            <strong>CI:</strong>{" "}
                            {clienteSeleccionado.identificacion ||
                              clienteSeleccionado.ci ||
                              "—"}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <Typography variant="body2">
                            <strong>Teléfono:</strong>{" "}
                            {clienteSeleccionado.telefono ||
                              clienteSeleccionado.celular ||
                              "—"}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <Typography variant="body2">
                            <strong>Dirección:</strong>{" "}
                            {clienteSeleccionado.direccion || "—"}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* DETALLE DE PRODUCTOS */}
        <Card variant="outlined">
          <CardContent>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
                gap: 1,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Productos
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Usa lector de código de barras o selección manual
              </Typography>
            </Box>

            {/* ENCABEZADO DE TABLA */}
            <Grid container spacing={2} sx={{ mb: 1, px: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" fontWeight={600}>
                  Producto *
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="subtitle2" fontWeight={600}>
                  Información
                </Typography>
              </Grid>
              <Grid item xs={10} md={2}>
                <Typography variant="subtitle2" fontWeight={600}>
                  Precio (Bs)
                </Typography>
              </Grid>
              <Grid item xs={2} md={1}></Grid>
            </Grid>

            <Divider sx={{ mb: 2 }} />

            {/* LISTA DE PRODUCTOS */}
            {detalles.map((d, idx) => (
              <Grid
                container
                spacing={2}
                key={idx}
                alignItems="center"
                sx={{
                  mb: 2,
                  p: 1,
                  borderRadius: 1,
                  backgroundColor:
                    idx === activeDetalle ? "action.hover" : "transparent",
                  transition: "background-color 0.2s",
                }}
              >
                {/* AUTOCOMPLETE PRODUCTO */}
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    options={productos}
                    getOptionLabel={(p) =>
                      p.numeroSerie && p.descripcion && p.precio
                        ? `${p.numeroSerie} - ${p.descripcion} - Bs ${Number(
                            p.precio
                          ).toFixed(2)}`
                        : p.numeroSerie ||
                          p.descripcion ||
                          "Producto sin información"
                    }
                    value={productos.find((p) => p.id === d.productoId) || null}
                    onChange={(_, val) => {
                      if (val) {
                        setDetalles((prev) =>
                          prev.map((item, i) =>
                            i === idx
                              ? {
                                  productoId: val.id,
                                  subtotal: Number(val.precio) || 0,
                                }
                              : item
                          )
                        );
                      } else {
                        setDetalles((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { productoId: "", subtotal: 0 } : item
                          )
                        );
                      }
                    }}
                    onFocus={() => setActiveDetalle(idx)}
                    isOptionEqualToValue={(opt, val) => opt.id === val.id}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        inputRef={idx === activeDetalle ? productoInputRef : null}
                        label={
                          loadingData
                            ? "Cargando productos..."
                            : "Seleccionar producto"
                        }
                        size="small"
                        error={!d.productoId}
                        helperText={
                          !d.productoId ? "Seleccione un producto" : ""
                        }
                        fullWidth
                      />
                    )}
                    loading={loadingData}
                    loadingText="Cargando productos..."
                    noOptionsText={
                      productos.length === 0
                        ? "No hay productos disponibles"
                        : "Sin coincidencias"
                    }
                    fullWidth
                  />
                </Grid>

                {/* FICHA DEL PRODUCTO */}
                <Grid item xs={12} md={3}>
                  {d.productoId ? (
                    (() => {
                      const prod = productos.find((p) => p.id === d.productoId);
                      if (!prod) return null;
                      return (
                        <Card variant="outlined" sx={{ p: 1.5 }}>
                          <Typography variant="subtitle2" fontWeight={600} noWrap>
                            {prod.descripcion || prod.numeroSerie || "Producto"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Código: {prod.numeroSerie || "N/A"}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              mt: 0.5,
                              gap: 1,
                            }}
                          >
                            <Typography variant="body2" fontWeight={600}>
                              Bs {Number(prod.precio || 0).toFixed(2)}
                            </Typography>
                            {prod.stock !== undefined && (
                              <Typography
                                variant="caption"
                                color={
                                  prod.stock > 0 ? "success.main" : "error.main"
                                }
                                fontWeight={600}
                              >
                                Stock: {prod.stock}
                              </Typography>
                            )}
                          </Box>
                        </Card>
                      );
                    })()
                  ) : (
                    <Box
                      sx={{
                        border: "1px dashed",
                        borderColor: "divider",
                        borderRadius: 1,
                        p: 2,
                        textAlign: "center",
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Seleccione un producto para ver información
                      </Typography>
                    </Box>
                  )}
                </Grid>

                {/* PRECIO / SUBTOTAL */}
                <Grid item xs={10} md={2}>
                  <TextField
                    label="Precio (Bs)"
                    fullWidth
                    size="small"
                    value={Number(d.subtotal || 0).toFixed(2)}
                    InputProps={{
                      readOnly: true,
                      sx: {
                        fontWeight: 600,
                        backgroundColor:
                          d.subtotal > 0 ? "success.light" : "grey.50",
                      },
                    }}
                  />
                </Grid>

                {/* BOTÓN ELIMINAR */}
                <Grid item xs={2} md={1} sx={{ textAlign: "center" }}>
                  {detalles.length > 1 && (
                    <IconButton
                      color="error"
                      onClick={() => removeDetalle(idx)}
                      size="small"
                    >
                      <Trash2 size={18} />
                    </IconButton>
                  )}
                </Grid>
              </Grid>
            ))}

            <Button
              variant="outlined"
              startIcon={<Plus size={16} />}
              onClick={addDetalle}
              sx={{ mt: 1 }}
            >
              Agregar producto
            </Button>

            {formError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {formError}
              </Alert>
            )}
          </CardContent>
        </Card>
      </DialogContent>

      {/* FOOTER: TOTAL + BOTONES */}
      <DialogActions
        sx={{
          p: 2,
          gap: 1,
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}
      >
        <Box
          sx={{
            px: 2.5,
            py: 1.2,
            backgroundColor: "primary.main",
            borderRadius: 1,
            minWidth: 220,
            textAlign: "center",
          }}
        >
          <Typography variant="body2" sx={{ color: "white", opacity: 0.8 }}>
            TOTAL
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "white" }}>
            Bs {total.toFixed(2)}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button onClick={onClose} variant="outlined" disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            sx={{ minWidth: 140 }}
          >
            {loading ? "Guardando..." : "Guardar Venta"}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default VentasForm;
