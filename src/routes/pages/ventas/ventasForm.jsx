import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  TextField,
  Typography,
  Autocomplete,
} from "@mui/material";
import {
  Dialog as MuiDialog,
  DialogTitle as MuiDialogTitle,
  DialogContent as MuiDialogContent,
  DialogActions as MuiDialogActions,
} from "@mui/material";
import { createFilterOptions } from "@mui/material/Autocomplete";
import { toast } from "react-toastify";
import {
  AlertCircle,
  Barcode,
  Phone,
  Plus,
  Receipt,
  Store,
  User,
  Package,
} from "lucide-react";

import ServiceProducto from "@/services/ServiceProducto";
import ServiceVentas from "@/services/ServiceVentas";
import ServiceCliente from "@/services/ServiceCliente";
import ServiceSucursal from "@/services/ServiceSucursal";
import ClienteForm from "@/routes/pages/clientes/ClienteForm";
import { useAuth } from "@/context/AuthContext";
import BarcodeListener from "@/components/BarcodeListener";
import SuccessDialog from "@/components/SuccessDialog";

import {
  Badge,
  MotionCard,
  ProductRow,
  VentaResumen,
  brand,
  comboSx,
  readonlyInputSx,
  sxCard,
  sxLabel,
  sxSectionTitle,
} from "./VentaFormUI";

const VentasForm = ({
  onClose,
  onSuccess,
  initialData = null,
  sucursalPreseleccionada = null,
}) => {
  const { user } = useAuth();

  const empleadoId = user?.id || 1;
  const roleKey = (
    user?.rol ||
    user?.role ||
    user?.perfil?.rol ||
    user?.perfil?.nombre ||
    ""
  )
    .toString()
    .trim()
    .toLowerCase();

  const isAdmin = roleKey === "administrador";
  const empleadoSucursalId = user?.idSucursal ?? null;

  const [form, setForm] = useState({
    empleadoId,
    clienteId: "",
    sucursalId:
      initialData?.sucursalId ??
      sucursalPreseleccionada?.id ??
      (isAdmin ? "" : empleadoSucursalId || ""),
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

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");
  const [activeDetalle, setActiveDetalle] = useState(0);

  const [showClienteForm, setShowClienteForm] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);
  const [showVentaForm, setShowVentaForm] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const productoInputRef = useRef(null);

  const filterClientes = createFilterOptions({
    stringify: (option) =>
      `${option.nit || ""} ${option.razonSocial || ""} ${
        option.telefono || option.celular || ""
      } ${option.correo || ""}`,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);

        const [cliRes, sucRes] = await Promise.all([
          ServiceCliente.getAll({ page: 1, pageSize: 1000 }),
          ServiceSucursal.getAll(),
        ]);

        setClientes(Array.isArray(cliRes) ? cliRes : cliRes.items || []);
        setSucursales(Array.isArray(sucRes) ? sucRes : sucRes.items || []);
      } catch (err) {
        toast.error("Error al cargar datos: " + (err.message || err));
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const cargarProductos = async () => {
      const sucursalId =
        sucursalPreseleccionada?.id || form.sucursalId || empleadoSucursalId;

      if (!sucursalId) {
        setProductos([]);
        setDetalles([{ productoId: "", subtotal: 0 }]);
        return;
      }

      try {
        setLoadingData(true);
        setProductos([]);
        setDetalles([{ productoId: "", subtotal: 0 }]);
        setActiveDetalle(0);

        const data = await ServiceProducto.getDisponiblesPorSucursal(sucursalId);
        setProductos(Array.isArray(data) ? data : data.items || []);
      } catch {
        toast.error("Error al cargar productos");
        setProductos([]);
      } finally {
        setLoadingData(false);
      }
    };

    cargarProductos();
  }, [sucursalPreseleccionada?.id, form.sucursalId, empleadoSucursalId]);

  const sucursalActual = useMemo(() => {
    return (
      sucursalPreseleccionada ||
      sucursales.find((s) => Number(s.id) === Number(form.sucursalId || 0)) ||
      sucursales.find((s) => Number(s.id) === Number(empleadoSucursalId || 0)) ||
      null
    );
  }, [sucursalPreseleccionada, sucursales, form.sucursalId, empleadoSucursalId]);

  const clienteSeleccionado = useMemo(
    () => clientes.find((c) => Number(c.id) === Number(form.clienteId)) || null,
    [clientes, form.clienteId]
  );

  const total = useMemo(
    () => detalles.reduce((acc, d) => acc + (Number(d.subtotal) || 0), 0),
    [detalles]
  );

  const detallesResumen = useMemo(
    () =>
      detalles
        .filter((d) => d.productoId && Number(d.subtotal) > 0)
        .map((d) => {
          const prod = productos.find(
            (p) => Number(p.id) === Number(d.productoId)
          );

          if (!prod) return null;

          return {
            prod,
            det: d,
            base: Number(prod.precioOrigen ?? prod.precio ?? 0),
          };
        })
        .filter(Boolean),
    [detalles, productos]
  );

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormError("");
  };

  const addDetalle = () => {
    if (detalles.filter((d) => d.productoId).length >= productos.length) {
      toast.info("Ya seleccionaste todos los productos disponibles.");
      return;
    }

    setDetalles((prev) => [...prev, { productoId: "", subtotal: 0 }]);
    setActiveDetalle(detalles.length);
  };

  const removeDetalle = (idx) => {
    setDetalles((prev) => prev.filter((_, i) => i !== idx));
    if (activeDetalle === idx) setActiveDetalle(0);
  };

  const validateForm = () => {
    if (!form.clienteId) return "Seleccione un cliente";

    const sucursalIdActual =
      sucursalPreseleccionada?.id || form.sucursalId || empleadoSucursalId;

    if (!sucursalIdActual) return "No se encontró una sucursal seleccionada.";

    const ok = detalles.filter(
      (d) => d.productoId !== "" && Number(d.subtotal) > 0
    );

    if (!ok.length) return "Agregue al menos un producto";

    const ids = ok.map((d) => d.productoId);

    if (new Set(ids).size !== ids.length) {
      return "Hay productos repetidos en el detalle.";
    }

    for (const d of ok) {
      const prod = productos.find(
        (p) => Number(p.id) === Number(d.productoId)
      );

      if (!prod) continue;

      const base = Number(prod.precioOrigen ?? prod.precio ?? 0);
      const precio = Number(d.subtotal || 0);
      const etiqueta = prod.numeroSerie || prod.descripcion || "producto";

      if (precio <= 0) {
        return `El producto ${etiqueta} no puede tener precio 0 o negativo.`;
      }

      if (precio <= base) {
        return `El producto ${etiqueta} debe superar el precio origen (Bs ${base.toFixed(
          2
        )}).`;
      }

      if (precio > (base > 0 ? base * 10 : 100000)) {
        return `El precio de ${etiqueta} es demasiado alto.`;
      }
    }

    return "";
  };

const handleSubmit = async () => {
  if (loading) return;

  setLoading(true);
  setFormError("");

  const err = validateForm();
  if (err) {
    setFormError(err);
    toast.error(err);
    setShowConfirm(false);
    setLoading(false);
    return;
  }

  const sucursalIdToSend =
    sucursalPreseleccionada?.id || form.sucursalId || empleadoSucursalId;

  const payload = {
    ...form,
    empleadoId: Number(empleadoId),
    clienteId: Number(form.clienteId),
    sucursalId: Number(sucursalIdToSend),
    detalles: detalles
      .filter((d) => d.productoId !== "" && Number(d.subtotal) > 0)
      .map((d) => ({
        productoId: Number(d.productoId),
        subtotal: Number(d.subtotal),
      })),
  };

  try {
    setShowConfirm(false);

    const response = await ServiceVentas.create(payload);

    let ventaDetallada = response;

    if (response?.id) {
      ventaDetallada = await ServiceVentas.getById(response.id);
    }

    const ventaParaComprobante = {
      ...ventaDetallada,
      empleado: ventaDetallada?.empleado || user,
      cliente: ventaDetallada?.cliente || clienteSeleccionado,
      sucursal: ventaDetallada?.sucursal || sucursalActual,
      detalles: Array.isArray(ventaDetallada?.detalles)
        ? ventaDetallada.detalles
        : payload.detalles,
    };

    setShowSuccess(true);

    setTimeout(() => {
      setShowSuccess(false);
      onSuccess?.(ventaParaComprobante);
    }, 1400);
  } catch (err) {
    const msg =
      err?.response?.data?.detail ||
      err?.message ||
      "Error al registrar la venta";

    setFormError(msg);
    toast.error(msg);
    setShowConfirm(false);
  } finally {
    setLoading(false);
  }
};
  const handleScan = (code) => {
    if (!code) return;

    const producto = productos.find(
      (p) => String(p.numeroSerie) === String(code)
    );

    if (!producto) {
      toast.error("Producto no encontrado");
      return;
    }

    if (detalles.some((d) => Number(d.productoId) === Number(producto.id))) {
      toast.error("Producto ya seleccionado");
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

  const renderClienteOption = (props, option) => {
    const { key, ...optionProps } = props;

    return (
      <Box
        component="li"
        key={key}
        {...optionProps}
        sx={{
          py: 1.1,
          px: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 1.4,
        }}
      >
        <Avatar
          sx={{
            width: 34,
            height: 34,
            bgcolor: brand[600],
            fontSize: 13,
            fontWeight: 900,
            flexShrink: 0,
          }}
        >
          {(option.razonSocial || "C")[0]}
        </Avatar>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontWeight: 900,
              fontSize: 13.5,
              color: "#1F2937",
            }}
            noWrap
          >
            {option.razonSocial || "Cliente"}
          </Typography>

          <Typography sx={{ fontSize: 12, color: "#6B7280" }} noWrap>
            NIT: {option.nit || "—"} · Tel:{" "}
            {option.telefono || option.celular || "—"}
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <>
      <Dialog
        open={showVentaForm}
        onClose={onClose}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: { xs: 0, sm: 4 },
            overflow: "hidden",
            bgcolor: "#F8F3F3",
            backgroundImage:
              "radial-gradient(circle at 100% 0%, #F5EAEA 0%, transparent 45%)",
            height: { xs: "100dvh", sm: "92vh" },
            maxHeight: { xs: "100dvh", sm: "92vh" },
          },
        }}
      >
        <BarcodeListener
          onScan={handleScan}
          targetRef={productoInputRef}
          minLength={3}
          enabled={true}
          debug={false}
          autoLength={13}
        />

        <DialogTitle
          sx={{
            px: { xs: 2, md: 3.5 },
            py: 0,
            background: `linear-gradient(135deg, ${brand[900]} 0%, ${brand[600]} 100%)`,
            color: "white",
            position: "relative",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: -45,
              right: -35,
              width: 160,
              height: 160,
              borderRadius: "50%",
              bgcolor: "rgba(255,255,255,0.06)",
              pointerEvents: "none",
            }}
          />

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              py: 2,
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.7 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2.5,
                  bgcolor: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backdropFilter: "blur(4px)",
                  flexShrink: 0,
                }}
              >
                <Receipt size={23} />
              </Box>

              <Box>
                <Typography
                  sx={{
                    fontWeight: 900,
                    fontSize: { xs: 18, md: 21 },
                    lineHeight: 1.1,
                  }}
                >
                  Nueva Venta
                </Typography>

                <Typography sx={{ fontSize: 12.5, opacity: 0.75, mt: 0.2 }}>
                  Registro de venta ·{" "}
                  {sucursalActual?.nombre || "Selecciona sucursal"}
                </Typography>
              </Box>
            </Box>

            {sucursalActual && (
              <Box
                sx={{
                  display: { xs: "none", sm: "flex" },
                  alignItems: "center",
                  gap: 0.8,
                  px: 2,
                  py: 0.8,
                  borderRadius: 99,
                  bgcolor: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  fontSize: 12.5,
                  fontWeight: 800,
                  maxWidth: 430,
                }}
              >
                <Store size={14} />

                <Box component="span" sx={{ whiteSpace: "nowrap" }}>
                  {sucursalActual.nombre}
                </Box>

                {sucursalActual.direccion && (
                  <Typography
                    component="span"
                    sx={{
                      fontSize: 11,
                      opacity: 0.78,
                      ml: 0.5,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    · {sucursalActual.direccion}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </DialogTitle>

        <DialogContent
          sx={{
            p: { xs: 2, md: 3 },
            bgcolor: "transparent",
            overflowY: "auto",
            pb: { xs: 12, md: 3 },
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                lg: "minmax(0, 1fr) 370px",
              },
              gap: 3,
              alignItems: "start",
            }}
          >
            <Box sx={{ display: "grid", gap: 2.5, minWidth: 0 }}>
              <MotionCard
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                sx={sxCard}
              >
                <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 2.5,
                      gap: 1,
                    }}
                  >
                    <Typography sx={sxSectionTitle}>
                      <User size={16} />
                      Información de la venta
                    </Typography>

                    <Badge color={brand[500]}>Paso 1</Badge>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Typography sx={sxLabel}>Empleado</Typography>

                      <TextField
                        value={
                          user?.nombreCompleto || user?.nombre || "Empleado"
                        }
                        fullWidth
                        size="small"
                        InputProps={{
                          readOnly: true,
                          startAdornment: (
                            <Box sx={{ mr: 1, color: "#9CA3AF" }}>
                              <User size={14} />
                            </Box>
                          ),
                        }}
                        sx={readonlyInputSx}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                      <Typography sx={sxLabel}>Sucursal</Typography>

                      <TextField
                        value={sucursalActual?.nombre || "Sin sucursal"}
                        fullWidth
                        size="small"
                        InputProps={{
                          readOnly: true,
                          startAdornment: (
                            <Box sx={{ mr: 1, color: "#9CA3AF" }}>
                              <Store size={14} />
                            </Box>
                          ),
                        }}
                        sx={readonlyInputSx}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4.2 }}>
                      <Typography sx={sxLabel}>Cliente *</Typography>

                      <Autocomplete
                        options={clientes}
                        value={clienteSeleccionado}
                        getOptionLabel={(c) =>
                          c
                            ? `${c.nit || "S/N"} · ${
                                c.razonSocial || "Sin nombre"
                              }`
                            : ""
                        }
                        filterOptions={filterClientes}
                        onChange={(_, value) =>
                          handleChange("clienteId", value?.id || "")
                        }
                        isOptionEqualToValue={(opt, val) =>
                          Number(opt.id) === Number(val.id)
                        }
                        renderOption={renderClienteOption}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Buscar cliente..."
                            size="small"
                            error={submitted && !form.clienteId}
                            helperText={
                              submitted && !form.clienteId
                                ? "Seleccione un cliente"
                                : ""
                            }
                            sx={comboSx}
                          />
                        )}
                        loading={loadingData}
                        loadingText="Cargando clientes..."
                        noOptionsText="No se encontraron clientes"
                        fullWidth
                      />
                    </Grid>

                    <Grid
                      size={{ xs: 12, md: 1.8 }}
                      sx={{ display: "flex", alignItems: "flex-end" }}
                    >
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => setShowClienteForm(true)}
                        startIcon={<Plus size={14} />}
                        sx={{
                          height: 50,
                          textTransform: "none",
                          borderRadius: "16px",
                          borderColor: brand[400],
                          color: brand[600],
                          fontWeight: 900,
                          fontSize: 13,
                          "&:hover": {
                            borderColor: brand[700],
                            bgcolor: brand[50],
                          },
                        }}
                      >
                        Nuevo
                      </Button>
                    </Grid>

                    {clienteSeleccionado && (
                      <Grid size={{ xs: 12 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.6,
                            p: 1.6,
                            borderRadius: 3,
                            bgcolor: brand[50],
                            border: `1px solid ${brand[100]}`,
                          }}
                        >
                          <Avatar
                            sx={{
                              width: 40,
                              height: 40,
                              bgcolor: brand[600],
                              fontSize: 14,
                              fontWeight: 900,
                            }}
                          >
                            {(clienteSeleccionado.razonSocial || "C")[0]}
                          </Avatar>

                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              sx={{
                                fontWeight: 900,
                                fontSize: 14,
                                color: brand[800],
                              }}
                              noWrap
                            >
                              {clienteSeleccionado.razonSocial || "Cliente"}
                            </Typography>

                            <Box
                              sx={{
                                display: "flex",
                                gap: 1.5,
                                flexWrap: "wrap",
                                mt: 0.3,
                              }}
                            >
                              {clienteSeleccionado.nit && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  NIT: <strong>{clienteSeleccionado.nit}</strong>
                                </Typography>
                              )}

                              {clienteSeleccionado.telefono && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.4,
                                  }}
                                >
                                  <Phone size={11} />
                                  {clienteSeleccionado.telefono}
                                </Typography>
                              )}

                              {clienteSeleccionado.correo && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {clienteSeleccionado.correo}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </MotionCard>

              <MotionCard
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: 0.04 }}
                sx={sxCard}
              >
                <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: { xs: "flex-start", sm: "center" },
                      justifyContent: "space-between",
                      gap: 1.5,
                      mb: 0.8,
                      flexDirection: { xs: "column", sm: "row" },
                    }}
                  >
                    <Typography sx={sxSectionTitle}>
                      <Package size={16} />
                      Productos
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        width: { xs: "100%", sm: "auto" },
                      }}
                    >
                      <Badge color={brand[500]}>Paso 2</Badge>

                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<Plus size={14} />}
                        onClick={addDetalle}
                        sx={{
                          textTransform: "none",
                          fontWeight: 900,
                          fontSize: 13,
                          borderRadius: "13px",
                          bgcolor: brand[600],
                          minHeight: 38,
                          ml: { xs: "auto", sm: 0 },
                          "&:hover": { bgcolor: brand[800] },
                          boxShadow: `0 6px 14px ${brand[600]}44`,
                        }}
                      >
                        Agregar
                      </Button>
                    </Box>
                  </Box>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 2, display: "block" }}
                  >
                    <Box
                      component="span"
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.6,
                      }}
                    >
                      <Barcode size={13} />
                      Escanea el código de barras o busca manualmente. Solo
                      productos disponibles en esta sucursal.
                    </Box>
                  </Typography>

                  <Divider sx={{ mb: 2, borderColor: "#EEE5E5" }} />

                  <Box sx={{ display: "grid", gap: 1.7 }}>
                    {detalles.map((d, idx) => (
                      <ProductRow
                        key={idx}
                        d={d}
                        idx={idx}
                        activeDetalle={activeDetalle}
                        productos={productos}
                        detalles={detalles}
                        loadingData={loadingData}
                        submitted={submitted}
                        productoInputRef={productoInputRef}
                        setActiveDetalle={setActiveDetalle}
                        setDetalles={setDetalles}
                        removeDetalle={removeDetalle}
                      />
                    ))}
                  </Box>

                  {formError && (
                    <Alert
                      severity="error"
                      icon={<AlertCircle size={18} />}
                      sx={{ mt: 2, borderRadius: 2 }}
                    >
                      {formError}
                    </Alert>
                  )}
                </CardContent>
              </MotionCard>
            </Box>

            <VentaResumen
              sucursalActual={sucursalActual}
              clienteSeleccionado={clienteSeleccionado}
              detallesResumen={detallesResumen}
              total={total}
            />
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: { xs: 2, md: 3 },
            py: 2,
            bgcolor: "#FFF",
            borderTop: "1px solid #EEE5E5",
            gap: 1.5,
            justifyContent: "flex-end",
            flexShrink: 0,
            position: { xs: "sticky", md: "static" },
            bottom: 0,
            zIndex: 2,
          }}
        >
          <Button
            onClick={onClose}
            variant="outlined"
            disabled={loading}
            sx={{
              borderRadius: "14px",
              borderColor: "#D1D5DB",
              color: "#6B7280",
              textTransform: "none",
              fontWeight: 800,
              px: 3,
              height: 44,
              "&:hover": {
                borderColor: brand[400],
                color: brand[600],
                bgcolor: brand[50],
              },
            }}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={() => {
              setSubmitted(true);

              const err = validateForm();
              if (err) {
                setFormError(err);
                return;
              }

              setShowConfirm(true);
            }}
            variant="contained"
            disabled={loading}
            sx={{
              minWidth: { xs: 150, sm: 190 },
              borderRadius: "14px",
              textTransform: "none",
              fontWeight: 900,
              fontSize: 14,
              px: 3,
              height: 44,
              background: `linear-gradient(135deg, ${brand[600]} 0%, ${brand[900]} 100%)`,
            }}
          >
            {loading ? "Guardando..." : "Guardar venta"}
          </Button>
        </DialogActions>
      </Dialog>
      <MuiDialog
        open={showConfirm}
        onClose={() => {
          if (!loading) setShowConfirm(false);
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 1,
          },
        }}
      >
        <MuiDialogTitle
          sx={{
            fontWeight: 900,
            color: brand[800],
            pb: 1,
          }}
        >
          Confirmar venta
        </MuiDialogTitle>

        <MuiDialogContent>
          <Typography sx={{ color: "#4B5563", fontSize: 14 }}>
            ¿Está segura de registrar esta venta por un total de{" "}
            <strong>Bs {total.toFixed(2)}</strong>?
          </Typography>
        </MuiDialogContent>

        <MuiDialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={() => setShowConfirm(false)}
            disabled={loading}
            variant="outlined"
            sx={{
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 800,
            }}
          >
            No, revisar
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={loading}
            variant="contained"
            sx={{
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 900,
              bgcolor: brand[600],
              "&:hover": { bgcolor: brand[800] },
            }}
          >
            {loading ? "Guardando..." : "Sí, confirmar"}
          </Button>
        </MuiDialogActions>
      </MuiDialog>
      {showClienteForm && (
        <ClienteForm
          onClose={() => setShowClienteForm(false)}
          onSuccess={async () => {
            const res = await ServiceCliente.getAll({
              page: 1,
              pageSize: 1000,
            });

            setClientes(Array.isArray(res) ? res : res.items || []);
            setShowClienteForm(false);
            toast.success("Cliente agregado correctamente");
          }}
        />
        
      )}
      <SuccessDialog
        open={showSuccess}
        message="La venta se registró correctamente"
      />
    </>
    
  );
};

export default VentasForm;