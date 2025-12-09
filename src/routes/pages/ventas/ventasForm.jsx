// src/routes/pages/ventas/VentaForm.jsx
import { useEffect, useState, useRef, useMemo } from "react";
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
import { Plus, Trash2, ShoppingCart, MapPin, Phone } from "lucide-react";

import ServiceVentas from "@/services/ServiceVentas";
import ServiceProducto from "@/services/ServiceProducto";
import ServiceCliente from "@/services/ServiceCliente";
import ServiceSucursal from "@/services/ServiceSucursal";
import { useAuth } from "@/context/AuthContext";
import BarcodeListener from "@/components/BarcodeListener";
import { createFilterOptions } from "@mui/material/Autocomplete";

import Comprobante from "./Comprobante";

const VentasForm = ({
  onClose,
  onSuccess,
  initialData = null,
  // 👇 opcional: la sucursal seleccionada en el wizard de VentasList
  sucursalPreseleccionada = null,
}) => {
  const { user } = useAuth();
  const empleadoId = user?.id || 1;

  // ===== ROL DEL USUARIO =====
  const rawRoleKey =
    user?.rol ||
    user?.role ||
    user?.perfil?.rol ||
    user?.perfil?.nombre ||
    "";
  const roleKey = rawRoleKey.toString().trim().toLowerCase();
  const isAdmin = roleKey === "administrador";
  const isVentas = roleKey === "ventas";
  const empleadoSucursalId = user?.idSucursal ?? null;

  // ===== STATE PRINCIPAL =====
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
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [activeDetalle, setActiveDetalle] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const [showResumen, setShowResumen] = useState(false);
  const [ventaResumen, setVentaResumen] = useState(null);

  const productoInputRef = useRef(null);

  const filterClientes = createFilterOptions({
    stringify: (option) => {
      const nit = option.nit || "";
      const razonSocial = option.razonSocial || "";
      const telefono = option.telefono || option.celular || "";
      return `${nit} ${razonSocial} ${telefono}`;
    },
  });

  // ===== CARGAR DATOS BASE =====
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

  // ===== SUCURSAL DEL EMPLEADO (OBJETO) =====
  const sucursalEmpleado = useMemo(
    () =>
      sucursales.find(
        (s) => Number(s.id) === Number(empleadoSucursalId || 0)
      ) || null,
    [sucursales, empleadoSucursalId]
  );

  // 👇 Sucursal actual mostrada en cabecera y resumen (admin o ventas)
  const sucursalActual = useMemo(() => {
    if (isAdmin) {
      return (
        sucursales.find(
          (s) => Number(s.id) === Number(form.sucursalId || 0)
        ) || sucursalPreseleccionada || null
      );
    }
    return sucursalEmpleado;
  }, [isAdmin, sucursales, form.sucursalId, sucursalEmpleado, sucursalPreseleccionada]);

  // ===== Auto-seleccionar sucursal al cargar (sin pisar cambios manuales) =====
  useEffect(() => {
    // solo si aún no hay sucursal en el form
    if (form.sucursalId) return;

    if (initialData?.sucursalId) {
      setForm((prev) => ({ ...prev, sucursalId: initialData.sucursalId }));
      return;
    }

    if (isAdmin && sucursalPreseleccionada?.id) {
      setForm((prev) => ({ ...prev, sucursalId: sucursalPreseleccionada.id }));
      return;
    }

    if (!isAdmin && empleadoSucursalId) {
      setForm((prev) => ({ ...prev, sucursalId: empleadoSucursalId }));
    }
  }, [
    form.sucursalId,
    initialData?.sucursalId,
    isAdmin,
    sucursalPreseleccionada,
    empleadoSucursalId,
  ]);

  // TOTAL siempre numérico
  const total = useMemo(
    () =>
      detalles.reduce(
        (acc, d) => acc + (Number(d.subtotal) || 0),
        0
      ),
    [detalles]
  );

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addDetalle = () => {
    const cantidadSeleccionados = detalles.filter((d) => d.productoId).length;
    if (cantidadSeleccionados >= productos.length) {
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

  // ===== VALIDACIÓN =====
  const validateForm = () => {
    if (!form.clienteId) return "Seleccione un cliente";

    if (isAdmin) {
      if (!form.sucursalId) return "Seleccione una sucursal";
    } else if (isVentas) {
      if (!empleadoSucursalId) {
        return "Su usuario no tiene una sucursal asignada. Contacte al administrador.";
      }
    }

    const ok = detalles.filter(
      (d) => d.productoId !== "" && Number(d.subtotal) > 0
    );
    if (!ok.length) return "Agregue al menos un producto";

    // ⭐ Validar que no haya productos repetidos
    const ids = ok.map((d) => d.productoId);
    const unique = new Set(ids);
    if (unique.size !== ids.length) {
      return "Hay productos repetidos en el detalle. Cada producto solo puede venderse una vez por venta.";
    }

    // ⭐ Validar que el precio sea mayor al origen, no cero, no negativo y no exagerado
  for (const d of ok) {
    const prod = productos.find(
      (p) => Number(p.id) === Number(d.productoId)
    );
    if (!prod) continue;

    const base = Number(prod.precioOrigen ?? prod.precio ?? 0);
    const precio = Number(d.subtotal || 0);
    const etiquetaProd = prod.numeroSerie || prod.descripcion || "producto";

    if (precio <= 0) {
      return `El producto ${etiquetaProd} no puede tener precio 0 ni negativo.`;
    }

    if (precio <= base) {
      return `El producto ${etiquetaProd} debe tener un precio mayor al precio de origen (Bs ${base.toFixed(
        2
      )}).`;
    }

    const maxRazonable = base > 0 ? base * 10 : 100000;

    if (precio > maxRazonable) {
      return `El precio del producto ${etiquetaProd} es demasiado alto. Verifique el monto ingresado.`;
    }
  }




    return "";
  };

  const handleSubmit = async () => {
    // 👇 si ya está guardando, no hagas nada
    if (loading) return;

    setSubmitted(true);

    const err = validateForm();
    if (err) {
      setFormError(err);
      return;
    }

    setLoading(true);
    setFormError("");

    const sucursalIdToSend = isAdmin ? form.sucursalId : empleadoSucursalId;

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
      const response = await ServiceVentas.create(payload);
      const ventaDetallada = await ServiceVentas.getById(response.id);

      setVentaResumen({
        ...ventaDetallada,
        empleado: user,
      });

      setShowResumen(true);
      toast.success("Venta registrada correctamente");
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


  const handleCloseResumen = () => {
    setShowResumen(false);
    onSuccess?.();
    onClose();
  };

  // ===== SCANNER =====
  const handleScan = (code) => {
    if (!code) return;
    const producto = productos.find(
      (p) => String(p.numeroSerie) === String(code)
    );
    if (!producto) {
      toast.error("Producto no encontrado");
      return;
    }

    const yaSeleccionado = detalles.some(
      (d) => Number(d.productoId) === Number(producto.id)
    );
    if (yaSeleccionado) {
      toast.error("Este producto ya está seleccionado en la venta.");
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

  const clienteSeleccionado = clientes.find(
    (c) => Number(c.id) === Number(form.clienteId)
  );

  // ===== precio editable con validación (no < precio base) =====
  const handlePrecioChange = (idx, value) => {
    const num = Number(value);
    setDetalles((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, subtotal: isNaN(num) ? 0 : num } : item
      )
    );
  };

  const handlePrecioBlur = (idx) => {
    setDetalles((prev) => {
      const copy = [...prev];
      const det = copy[idx];
      if (!det || !det.productoId) return prev;

      const prod = productos.find(
        (p) => Number(p.id) === Number(det.productoId)
      );
      if (!prod) return prev;

      const base = Number(prod.precioOrigen ?? prod.precio ?? 0);
      let valor = Number(det.subtotal);

      // Caso 1: precio vacío, NaN, negativo o cero → corregir a base
      if (!valor || valor <= 0) {
        toast.warn(
          `El precio no puede ser 0 o negativo. Se ajustó al mínimo permitido Bs ${(
            base + 0.01
          ).toFixed(2)}`
        );
        valor = base + 0.01; // siempre mayor al origen
      }

      // Caso 2: precio <= base → corregir
      if (valor <= base) {
        toast.warn(
          `Debe ser mayor al precio de origen (Bs ${base.toFixed(2)}).`
        );
        valor = base + 0.01;
      }

      const maxRazonable = base > 0 ? base * 10 : 100000;

      // Caso 3: demasiado alto
      if (valor > maxRazonable) {
        toast.warn(
          `El precio es muy alto. Se ajustó al máximo Bs ${maxRazonable.toFixed(
            2
          )}.`
        );
        valor = maxRazonable;
      }

      copy[idx] = { ...det, subtotal: valor };
      return copy;
    });
  };



  // ===== producto destacado para el resumen lateral =====
  const detallesResumen = useMemo(
    () =>
      detalles
        .filter((d) => d.productoId && Number(d.subtotal) > 0)
        .map((d) => {
          const prod = productos.find(
            (p) => Number(p.id) === Number(d.productoId)
          );
          if (!prod) return null;
          const base = Number(prod.precioOrigen ?? prod.precio ?? 0);
          return { prod, det: d, base };
        })
        .filter(Boolean),
    [detalles, productos]
  );
  return (
    <>
      <Dialog open={true} onClose={onClose} maxWidth="xl" fullWidth>
        <BarcodeListener
          onScan={handleScan}
          targetRef={productoInputRef}
          minLength={3}
          enabled={true}
          debug={false}
          autoLength={13}
        />

        <DialogTitle sx={{ fontWeight: 600, fontSize: 18, pb: 1 }}>
          Nueva venta
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          {/* CABECERA SUCURSAL */}
          <Card
            variant="outlined"
            sx={{
              mb: 3,
              borderRadius: 3,
              borderColor: "#f1d2d2",
              bgcolor: "#fdf5f5",
            }}
          >
            <CardContent
              sx={{
                py: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  bgcolor: "#592B2B15",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#592B2B",
                }}
              >
                <ShoppingCart size={22} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700, color: "#3A1A1A" }}
                >
                  {sucursalActual?.nombre || "Sucursal no seleccionada"}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    color: "text.secondary",
                    mt: 0.5,
                  }}
                >
                  <MapPin size={14} />
                  {sucursalActual?.direccion || "Sin dirección"}
                  {sucursalActual?.telefono && (
                    <>
                      <span>•</span>
                      <span style={{ display: "flex", alignItems: "center" }}>
                        <Phone size={14} style={{ marginRight: 4 }} />
                        {sucursalActual.telefono}
                      </span>
                    </>
                  )}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* LAYOUT 2 COLUMNAS: IZQ FORM, DER RESUMEN */}
          <Grid container spacing={3}>
            {/* COLUMNA IZQUIERDA */}
            <Grid item xs={12} md={8.5}>
              {/* INFORMACIÓN DE LA VENTA */}
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
                          user?.nombreCompleto || user?.nombre || "Empleado"
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
                          const nit = c.nit || "";
                          const razonSocial = c.razonSocial || "Sin nombre";
                          const tel = c.telefono || c.celular || "";
                          return `${nit} - ${razonSocial}${
                            tel ? " - " + tel : ""
                          }`;
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
                            error={submitted && !form.clienteId}
                            helperText={
                              submitted && !form.clienteId
                                ? "Seleccione un cliente"
                                : ""
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
                      {isAdmin ? (
                        <Autocomplete
                          options={sucursales}
                          getOptionLabel={(s) => s.nombre || "Sin nombre"}
                          value={
                            sucursales.find(
                              (s) =>
                                Number(s.id) ===
                                Number(form.sucursalId || 0)
                            ) || null
                          }
                          onChange={(_, value) =>
                            handleChange("sucursalId", value?.id || "")
                          }
                          isOptionEqualToValue={(opt, val) =>
                            opt.id === val.id
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Sucursal *"
                              size="small"
                              error={submitted && isAdmin && !form.sucursalId}
                              helperText={
                                submitted && isAdmin && !form.sucursalId
                                  ? "Seleccione una sucursal"
                                  : ""
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
                      ) : (
                        <TextField
                          label="Sucursal"
                          value={
                            sucursalEmpleado?.nombre ||
                            (empleadoSucursalId
                              ? `Sucursal ID ${empleadoSucursalId}`
                              : "Sucursal no configurada")
                          }
                          fullWidth
                          size="small"
                          InputProps={{ readOnly: true }}
                          helperText={
                            sucursalEmpleado
                              ? "Sucursal asignada según el empleado"
                              : "Su usuario no tiene sucursal asignada"
                          }
                        />
                      )}
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

                  {/* ENCABEZADO */}
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
                  {detalles.map((d, idx) => {
                    const productosDisponibles = productos.filter((p) => {
                      const yaUsadoEnOtraFila = detalles.some(
                        (det, i) =>
                          i !== idx && Number(det.productoId) === Number(p.id)
                      );
                      return !yaUsadoEnOtraFila;
                    });

                    const prodSeleccionado = productos.find(
                      (p) => Number(p.id) === Number(d.productoId)
                    );

                    // mínimo permitido = precioOrigen, si no viene usamos precio
                    const precioBase = Number(
                      prodSeleccionado?.precioOrigen ?? prodSeleccionado?.precio ?? 0
                    );

                    // precio de lista (referencia) = precio
                    const precioLista = Number(prodSeleccionado?.precio ?? 0);

                    // 👇 IMPORTANTE: primero declaramos precioActual
                    const precioActual = Number(d.subtotal || 0);

                    const esCero =
                      prodSeleccionado && precioActual === 0;

                    const esNegativo =
                      prodSeleccionado && precioActual < 0;

                    const esMenorOIgualBase =
                      prodSeleccionado &&
                      precioActual > 0 &&
                      precioActual <= precioBase;

                    const maxRazonable =
                      precioBase > 0 ? precioBase * 10 : 100000;

                    const esDemasiadoAlto =
                      prodSeleccionado && precioActual > maxRazonable;

                    const mostrarErrorPrecio =
                      esCero || esNegativo || esMenorOIgualBase || esDemasiadoAlto;

                    return (
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
                            options={productosDisponibles}
                            getOptionLabel={(p) =>
                              p.numeroSerie && p.descripcion && p.precio
                                ? `${p.numeroSerie} - ${p.descripcion} - Bs ${Number(
                                    p.precio
                                  ).toFixed(2)}`
                                : p.numeroSerie ||
                                  p.descripcion ||
                                  "Producto sin información"
                            }
                            value={
                              productos.find(
                                (p) => Number(p.id) === Number(d.productoId)
                              ) || null
                            }
                            onChange={(_, val) => {
                              if (val) {
                                setDetalles((prev) =>
                                  prev.map((item, i) =>
                                    i === idx
                                      ? {
                                          productoId: val.id,
                                          subtotal: Number(
                                            val.precio ?? val.precioOrigen ?? 0
                                          ),
                                        }
                                      : item
                                  )
                                );
                              } else {
                                setDetalles((prev) =>
                                  prev.map((item, i) =>
                                    i === idx
                                      ? { productoId: "", subtotal: 0 }
                                      : item
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
                                error={submitted && !d.productoId}
                                helperText={
                                  submitted && !d.productoId
                                    ? "Seleccione un producto"
                                    : ""
                                }
                                fullWidth
                              />
                            )}
                            loading={loadingData}
                            loadingText="Cargando productos..."
                            noOptionsText={
                              productosDisponibles.length === 0
                                ? "No hay productos disponibles"
                                : "Sin coincidencias"
                            }
                            fullWidth
                            sx={{
                              minWidth: 240,
                              "& .MuiOutlinedInput-root": {
                                borderRadius: "12px",
                                paddingRight: "36px !important",
                                backgroundColor: "#fff",
                                height: 44,
                                "& fieldset": {
                                  borderColor: "#d8d8d8",
                                },
                                "&:hover fieldset": {
                                  borderColor: "#a66",
                                },
                                "&.Mui-focused fieldset": {
                                  borderColor: "#592B2B",
                                  borderWidth: 2,
                                },
                              },
                              "& .MuiOutlinedInput-input": {
                                padding: "10px 12px",
                                fontSize: "0.95rem",
                              },
                            }}
                          />
                        </Grid>

                        {/* FICHA DEL PRODUCTO */}
                        <Grid item xs={12} md={3}>
                          {prodSeleccionado ? (
                            <Card variant="outlined" sx={{ p: 1.5 }}>
                              <Typography
                                variant="subtitle2"
                                fontWeight={600}
                                noWrap
                              >
                                {prodSeleccionado.descripcion ||
                                  prodSeleccionado.numeroSerie ||
                                  "Producto"}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Código: {prodSeleccionado.numeroSerie || "N/A"}
                              </Typography>
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 0.2,
                                  mt: 0.5,
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                  sx={{ color: "#592B2B" }}
                                >
                                  Precio Venta: Bs {precioLista.toFixed(2)}
                                </Typography>
                                
                              </Box>
                            </Card>
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
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Seleccione un producto para ver información
                              </Typography>
                            </Box>
                          )}
                        </Grid>

                        {/* PRECIO EDITABLE */}
                        <Grid item xs={10} md={2}>
                          <TextField
                            label="Precio (Bs)"
                            fullWidth
                            size="small"
                            type="number"
                            value={
                              d.subtotal === 0 || d.subtotal === ""
                                ? ""
                                : Number(d.subtotal).toString()
                            }
                            onChange={(e) => handlePrecioChange(idx, e.target.value)}
                            onBlur={() => handlePrecioBlur(idx)}
                            error={mostrarErrorPrecio}
                            helperText={
                              !prodSeleccionado
                                ? ""
                                : esCero
                                ? "El precio no puede ser 0."
                                : esNegativo
                                ? "El precio no puede ser negativo."
                                : esMenorOIgualBase
                                ? `Debe ser mayor a Bs ${precioBase.toFixed(
                                    2
                                  )} (precio origen).`
                                : esDemasiadoAlto
                                ? "El precio ingresado es demasiado alto."
                                : `Precio base: Bs ${precioBase.toFixed(2)}`
                            }
                            inputProps={{
                              min: 1,
                              max: maxRazonable,
                              step: "0.01",
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
                    );
                  })}

                  {formError && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {formError}
                    </Alert>
                  )}

                  <Button
                    variant="outlined"
                    startIcon={<Plus size={16} />}
                    onClick={addDetalle}
                    sx={{
                      mt: 2,
                      borderColor: "#592B2B",
                      color: "#592B2B",
                      "&:hover": {
                        borderColor: "#3A1A1A",
                        backgroundColor: "#592B2B08",
                      },
                    }}
                  >
                    Agregar producto
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* COLUMNA DERECHA: RESUMEN */}
            <Grid item xs={12} md={3.5}>
              <Card
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  borderColor: "#f1d2d2",
                  bgcolor: "white",
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mb: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        bgcolor: "#592B2B15",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#592B2B",
                      }}
                    >
                      <ShoppingCart size={20} />
                    </Box>
                    <Box>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 700, color: "#3A1A1A" }}
                      >
                        Resumen de venta
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        Actualizado al agregar productos
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 700, color: "#777" }}
                  >
                    Sucursal
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ mb: 1.5, fontWeight: 500 }}
                  >
                    {sucursalActual?.nombre || "No seleccionada"}
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 700, color: "#777" }}
                  >
                    Cliente
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ mb: 1.5, fontWeight: 500 }}
                  >
                    {clienteSeleccionado?.razonSocial || "Sin cliente"}
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  {detallesResumen.length ? (
                    <Box
                      sx={{
                        maxHeight: 260,
                        overflowY: "auto",
                        mb: 1.5,
                        pr: 0.5,
                      }}
                    >
                      {detallesResumen.map(({ prod, det, base }, index) => (
                        <Box
                          key={prod.id}
                          sx={{
                            mb: 1.2,
                            pb: 1,
                            borderBottom:
                              index === detallesResumen.length - 1
                                ? "none"
                                : "1px dashed #eee",
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 700 }}
                            noWrap
                          >
                            {prod.numeroSerie || prod.descripcion || "Producto"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Código: {prod.numeroSerie || "N/A"}
                          </Typography>
                          <Box
                            sx={{
                              mt: 0.4,
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: 12,
                            }}
                          >
                            <span>Base: Bs {base.toFixed(2)}</span>
                            <span style={{ fontWeight: 600, color: "#592B2B" }}>
                              Venta: Bs {Number(det.subtotal || 0).toFixed(2)}
                            </span>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1.5 }}
                    >
                      Agrega productos para ver el detalle aquí.
                    </Typography>
                  )}


                  <Divider sx={{ my: 2 }} />

                  <Box
                    sx={{
                      borderRadius: 2.5,
                      py: 2,
                      textAlign: "center",
                      background:
                        "linear-gradient(135deg, #592B2B 0%, #3A1A1A 100%)",
                      color: "white",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ opacity: 0.85, mb: 0.5 }}
                    >
                      Total estimado
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 800, letterSpacing: 0.5 }}
                    >
                      Bs {total.toFixed(2)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>

        {/* FOOTER: SOLO BOTONES (ya quitamos el TOTAL de abajo) */}
        <DialogActions
          sx={{
            p: 2.5,
            gap: 1,
            justifyContent: "flex-end",
          }}
        >
          <Button
            onClick={onClose}
            variant="outlined"
            disabled={loading}
            sx={{
              borderRadius: 2,
              borderColor: "#592B2B",
              color: "#592B2B",
              textTransform: "none",
              "&:hover": {
                borderColor: "#3A1A1A",
                backgroundColor: "#592B2B08",
              },
            }}
          >
            Cancelar
          </Button>
          <Button
            type="button"          // 👈 importante
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            sx={{
              minWidth: 160,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              background: "linear-gradient(135deg, #592B2B 0%, #3A1A1A 100%)",
              boxShadow: "0 4px 10px rgba(89,43,43,0.25)",
              "&:hover": {
                background:
                  "linear-gradient(135deg, #3A1A1A 0%, #592B2B 100%)",
                boxShadow: "0 6px 16px rgba(89,43,43,0.35)",
              },
            }}
          >
            {loading ? "Guardando..." : "Guardar venta"}
          </Button>

        </DialogActions>
      </Dialog>

      {/* Comprobante */}
      <Comprobante
        open={showResumen}
        onClose={handleCloseResumen}
        ventaResumen={ventaResumen}
      />
    </>
  );
};

export default VentasForm;
