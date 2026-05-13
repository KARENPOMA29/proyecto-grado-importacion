import { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  MenuItem,
  Divider,
  Card,
  IconButton,
  InputAdornment,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { Check, X, Camera, Trash2, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";
import SuccessDialog from "@/components/SuccessDialog";
import ErrorDialog from "@/components/ErrorDialog";
import ServiceCategoria from "@/services/ServiceCategoria";
import ServiceImportacion from "@/services/ServiceImportacion";
import ServiceProducto from "@/services/ServiceProducto";
import ServiceMovimiento from "@/services/ServiceMovimiento";
import ServiceSeccion from "@/services/ServiceSeccion";
import ServiceModeloProducto from "@/services/ServiceModeloProducto";

import CategoriaForm from "@/routes/pages/categoria/CategoriaForm";
import SeccionForm from "@/routes/pages/seccion/SeccionForm";
import BarcodeListener from "@/components/BarcodeListener";
import "./InventarioFlowMod.css";

const STEP_TITLES = ["Detalle", "Resumen"];
const MAX_PRECIO = 9999999;

export default function InventarioFlow({
  isOpen,
  onClose,
  usuarioId = null,
  sucursalSeleccionada = null,
  almacenSeleccionado = null,
}) {
  const [step, setStep] = useState(0);

  const [categorias, setCategorias] = useState([]);
  const [importaciones, setImportaciones] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [modelos, setModelos] = useState([]);

  const [selSucursal, setSelSucursal] = useState(null);
  const [selAlmacen, setSelAlmacen] = useState(null);
  const [selCategoria, setSelCategoria] = useState(null);
  const [selImportacion, setSelImportacion] = useState(null);
  const [selSeccion, setSelSeccion] = useState(null);
  const [selModelo, setSelModelo] = useState(null);

  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");

  const [precioOrigenLote, setPrecioOrigenLote] = useState("");
  const [precioVentaLote, setPrecioVentaLote] = useState("");

  const [items, setItems] = useState([]);
  const [formError, setFormError] = useState("");
  const [touched, setTouched] = useState(false);

  const [showCategoriaForm, setShowCategoriaForm] = useState(false);
  const [showSeccionForm, setShowSeccionForm] = useState(false);

  const [nuevo, setNuevo] = useState({
    numeroSerie: "",
    descripcion: "",
    precioOrigen: "",
    precio: "",
    observado: 1,
    obsDescripcion: "",
  });

  const [serieValidando, setSerieValidando] = useState(false);
  const [serieOcupada, setSerieOcupada] = useState(false);
  const [mensajeSerie, setMensajeSerie] = useState("");
  const [serieBloqueada, setSerieBloqueada] = useState(false);

  const serieInputRef = useRef(null);

  const canGuardarEntrada = items.length > 0;

  const precioOrigenActual = Number(nuevo.precioOrigen || precioOrigenLote);
  const precioVentaActual = Number(nuevo.precio || precioVentaLote);

  const precioBaseValido =
    precioOrigenActual > 0 && precioOrigenActual <= MAX_PRECIO && isFinite(precioOrigenActual);

  const precioVentaValido =
    precioVentaActual > 0 && precioVentaActual <= MAX_PRECIO && isFinite(precioVentaActual);

  const diferenciaPrecio =
    precioBaseValido && precioVentaValido
      ? ((precioVentaActual - precioOrigenActual) / precioOrigenActual) * 100
      : null;

  const getPrecioStatus = () => {
    if (!precioBaseValido || !precioVentaValido || diferenciaPrecio === null) {
      return null;
    }

    if (precioVentaActual < precioOrigenActual) {
      return {
        severity: "warning",
        color: "#B7791F",
        bg: "#FFF7E6",
        border: "#F6C56D",
        text: "El precio de venta es menor al precio base. Confirma que deseas vender con pérdida.",
      };
    }

    if (diferenciaPrecio > 80) {
      return {
        severity: "warning",
        color: "#B7791F",
        bg: "#FFF7E6",
        border: "#F6C56D",
        text: "El precio de venta es muy superior al precio base. Verifica que sea correcto.",
      };
    }

    return {
      severity: "success",
      color: "#0D8C47",
      bg: "#EAF8F0",
      border: "#8AD7A8",
      text: "Precio razonable para el producto.",
    };
  };

  const precioStatus = getPrecioStatus();

  const cargarCategorias = async () => {
    const res = await ServiceCategoria.getAll({
      page: 1,
      pageSize: 1000,
    });
    setCategorias(Array.isArray(res) ? res : res.items ?? []);
  };

  const cargarImportaciones = async () => {
    const res = await ServiceImportacion.getConcluidas({
      page: 1,
      pageSize: 1000,
    });
    setImportaciones(Array.isArray(res) ? res : res.items ?? []);
  };

  const cargarSecciones = async () => {
    const almacenId = selAlmacen?.id || almacenSeleccionado?.id;
    if (!almacenId) return;

    const res = await ServiceSeccion.getByAlmacen(almacenId, {
      page: 1,
      pageSize: 1000,
    });

    setSecciones(Array.isArray(res) ? res : res.items || []);
  };

  const cargarModelos = async () => {
    const res = await ServiceModeloProducto.getAll({
      page: 1,
      pageSize: 1000,
    });

    setModelos(Array.isArray(res) ? res : res.items || []);
  };

  const abrirNuevaSeccion = async () => {
    if (!selAlmacen?.id && !almacenSeleccionado?.id) {
      setFormError("Primero debe seleccionar un almacén.");
      return;
    }

    await cargarModelos();
    setShowSeccionForm(true);
  };

  useEffect(() => {
    if (!isOpen) return;

    setStep(0);
    setTouched(false);
    setFormError("");
    setSelSucursal(sucursalSeleccionada);
    setSelAlmacen(almacenSeleccionado);
  }, [isOpen, sucursalSeleccionada, almacenSeleccionado]);

  useEffect(() => {
    if (!isOpen) return;

    const cargarDatos = async () => {
      try {
        await Promise.all([cargarCategorias(), cargarImportaciones()]);
      } catch (err) {
        console.error("Error cargando catálogos:", err);
        setFormError("No se pudieron cargar las categorías o importaciones.");
      }
    };

    cargarDatos();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !almacenSeleccionado?.id) return;

    cargarSecciones().catch((err) => {
      console.error("Error cargando secciones:", err);
      setSecciones([]);
      setFormError("No se pudieron cargar las secciones del almacén.");
    });
  }, [isOpen, almacenSeleccionado?.id]);

  const getModeloDesdeSeccion = (seccion) => {
    if (!seccion?.modeloId) return null;

    return {
      id: Number(seccion.modeloId),
      nombre:
        seccion.modeloNombre ||
        seccion.modelo?.nombreModelo ||
        seccion.modelo?.nombre ||
        "Modelo asignado",
    };
  };

  const validarSerieEnServidor = async (serie) => {
    const value = serie?.trim();

    if (!value) {
      setSerieOcupada(false);
      setMensajeSerie("");
      setSerieBloqueada(false);
      return;
    }

    try {
      setSerieValidando(true);
      setFormError("");

      const prod = await ServiceProducto.getBySerie(value);

      if (prod && (prod.estado === 1 || prod.estado === 2)) {
        const msg = `La serie ${value} ya existe en el sistema.`;
        setSerieOcupada(true);
        setMensajeSerie(msg);
        setSerieBloqueada(true);
        setFormError(msg);
        return;
      }

      setSerieOcupada(false);
      setMensajeSerie("");
      setSerieBloqueada(false);
    } catch {
      setSerieOcupada(false);
      setMensajeSerie("");
      setSerieBloqueada(false);
    } finally {
      setSerieValidando(false);
    }
  };

  const resetAll = () => {
    setStep(0);
    setTouched(false);
    setSelCategoria(null);
    setSelImportacion(null);
    setSelSeccion(null);
    setSelModelo(null);
    setPrecioOrigenLote("");
    setPrecioVentaLote("");
    setItems([]);
    setFormError("");
    setNuevo({
      numeroSerie: "",
      descripcion: "",
      precioOrigen: "",
      precio: "",
      observado: 1,
      obsDescripcion: "",
    });
    setSerieOcupada(false);
    setMensajeSerie("");
    setSerieBloqueada(false);
  };

  const handleClose = () => {
    resetAll();
    onClose?.();
  };

  const validarProducto = () => {
    const serie = nuevo.numeroSerie.trim();
    const modeloSeleccionado = selModelo || getModeloDesdeSeccion(selSeccion);

    if (serieValidando) return "Espera un momento, se está validando la serie.";
    if (serieBloqueada || serieOcupada) return mensajeSerie || "No puedes agregar esta serie porque ya existe.";
    if (!serie) return "Ingresa el número de serie del producto.";

    const existeEnLista = items.some(
      (it) => it.numeroSerie?.trim().toLowerCase() === serie.toLowerCase()
    );

    if (existeEnLista) return "Esta serie ya fue agregada en este movimiento.";
    if (!selCategoria) return "Selecciona una categoría.";
    if (!selSeccion) return "Selecciona una sección del almacén.";
    if (!modeloSeleccionado?.id) return "La sección seleccionada no tiene un modelo asignado.";
    if (!selImportacion) return "Selecciona una importación concluida.";

    if (!precioBaseValido) {
      return "El precio base debe ser mayor a 0 y menor a 9,999,999.";
    }

    if (!precioVentaValido) {
      return "El precio de venta debe ser mayor a 0 y menor a 9,999,999.";
    }

    if (nuevo.observado === 2 && !nuevo.obsDescripcion.trim()) {
      return "Ingresa el detalle de la observación del producto.";
    }

    return "";
  };

  const addItem = () => {
    setTouched(true);
    setFormError("");

    const error = validarProducto();
    if (error) {
      setFormError(error);
      return;
    }

    const serie = nuevo.numeroSerie.trim();
    const modeloSeleccionado = selModelo || getModeloDesdeSeccion(selSeccion);

    setItems((old) => [
      ...old,
      {
        numeroSerie: serie,
        descripcion: nuevo.descripcion.trim(),
        precioOrigen: precioOrigenActual,
        precio: precioVentaActual,
        observado: Number(nuevo.observado ?? 1),
        obsDescripcion: nuevo.obsDescripcion?.trim() || null,
        categoriaId: selCategoria.id,
        categoriaNombre: selCategoria.nombre,
        modeloId: modeloSeleccionado.id,
        modeloNombre: modeloSeleccionado.nombre,
        importacionId: selImportacion.id,
        importacionCodigo: selImportacion.codigo,
      },
    ]);

    setNuevo({
      numeroSerie: "",
      descripcion: "",
      precioOrigen: precioOrigenLote,
      precio: precioVentaLote,
      observado: 1,
      obsDescripcion: "",
    });

    setTouched(false);
    setSerieOcupada(false);
    setMensajeSerie("");
    setSerieBloqueada(false);
    setFormError("");
    serieInputRef.current?.focus();
  };

  const removeItem = (index) => {
    setItems((old) => old.filter((_, idx) => idx !== index));
  };

  const next = () => {
    if (step === 0 && items.length === 0) {
      setFormError("Agrega al menos un producto antes de continuar.");
      return;
    }

    setFormError("");
    setStep((s) => Math.min(s + 1, STEP_TITLES.length - 1));
  };

  const prev = () => {
    setFormError("");
    setStep((s) => Math.max(s - 1, 0));
  };

  const iniciarEscaner = () => {
    toast.info("Modo escáner activado. Usa tu lector de código de barras.");
    serieInputRef.current?.focus();
    serieInputRef.current?.select?.();
  };

  const handleBarcodeScan = (code) => {
    const value = code?.trim();
    if (!value) return;

    setNuevo((prev) => ({
      ...prev,
      numeroSerie: value,
    }));

    validarSerieEnServidor(value);
    serieInputRef.current?.focus();
    serieInputRef.current?.select?.();
    toast.success(`Código escaneado: ${value}`);
  };

  const guardarEntrada = async () => {
    if (items.length === 0) {
      setFormError("Agrega al menos un producto antes de guardar.");
      return;
    }

    try {
      for (const it of items) {
        const prod = await ServiceProducto.create({
          numeroSerie: it.numeroSerie,
          descripcion: it.descripcion,
          precioOrigen: Number(it.precioOrigen),
          precio: Number(it.precio),
          categoriaId: it.categoriaId,
          modeloId: it.modeloId,
          importacionId: it.importacionId,
          observado: Number(it.observado ?? 1),
          obsDescripcion: it.obsDescripcion || null,
        });

        await ServiceMovimiento.create({
          productoId: prod.id,
          almacenId: selAlmacen.id,
          tipoMovimiento: "ENTRADA",
          usuarioId: usuarioId ?? null,
        });
      }


      setDialogMessage(`${items.length} producto(s) registrado(s) correctamente.`);
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        handleClose();
      }, 1400);
   } catch (err) {
      console.error("Error detallado:", err);

      const msg = err.message || "No se pudo registrar el movimiento.";
      setFormError(msg);
      setDialogMessage(msg);
      setShowError(true);

      setTimeout(() => {
        setShowError(false);
      }, 1800);
    }
  };

  const selectError = (value) => touched && !value;

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{ className: "dialog-paper" }}
      >
        <BarcodeListener
          onScan={handleBarcodeScan}
          enabled={isOpen && step === 0}
          debug={false}
          targetRef={serieInputRef}
          gapMs={120}
          autoLength={13}
        />

        <DialogTitle className="dialog-title">
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Registrar movimiento
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Completa los datos para registrar una entrada.
            </Typography>
          </Box>

          <IconButton onClick={handleClose} size="small" sx={{ color: "white" }}>
            <X size={18} />
          </IconButton>
        </DialogTitle>

        <Box className="step-container">
          {STEP_TITLES.map((title, idx) => {
            const active = step === idx;
            const done = step > idx;
            const canNavigate = done;

            return (
              <Box key={title} className="step-item">
                <Box
                  className={`
                    step-circle 
                    ${active ? "step-circle-active" : ""}
                    ${done ? "step-circle-done" : ""}
                    ${!active && !done ? "step-circle-inactive" : ""}
                    ${canNavigate ? "step-circle-navigable" : ""}
                  `}
                  onClick={() => canNavigate && setStep(idx)}
                >
                  {done ? <Check size={20} /> : idx + 1}
                </Box>

                <Box className="step-label">
                  <Typography className={`step-number ${active ? "step-number-active" : ""}`}>
                    Paso {idx + 1}
                  </Typography>
                  <Typography className={`step-title ${active ? "step-title-active" : ""}`}>
                    {title}
                  </Typography>
                </Box>

                {idx < STEP_TITLES.length - 1 && (
                  <ChevronRight size={20} color="#667eea" style={{ opacity: 0.6, margin: "0 8px" }} />
                )}
              </Box>
            );
          })}
        </Box>

        <Divider />

        <DialogContent className="dialog-content">
          <Card
            variant="outlined"
            sx={{
              mb: 2,
              borderRadius: 3,
              bgcolor: "#592B2B08",
              borderColor: "#592B2B20",
            }}
          >
            <Box sx={{ p: 2 }}>
              <Typography fontWeight={700} color="#3A1A1A">
                {selAlmacen?.nombre || "Almacén no seleccionado"}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Sucursal: {selSucursal?.nombre || "—"}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Dirección: {selAlmacen?.direccion || selAlmacen?.descripcion || "Sin dirección"}
              </Typography>
            </Box>
          </Card>

          {formError && (
            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
              {formError}
            </Alert>
          )}

          {step === 0 && (
            <Box display="flex" flexDirection="column" gap={2}>
              <Box className="movement-type-banner">
                <Typography variant="body2" color="text.secondary">
                  Tipo de movimiento:{" "}
                  <strong style={{ color: "#667eea" }}>ENTRADA</strong>
                </Typography>
              </Box>

              <Box display="flex" gap={2} flexWrap="wrap" alignItems="flex-start">


                <Box display="flex" gap={1} alignItems="flex-start">
                  <TextField
                    select
                    label="Sección"
                    size="small"
                    sx={{ minWidth: 220 }}
                    value={selSeccion?.id ?? ""}
                    error={selectError(selSeccion)}
                    helperText={selectError(selSeccion) ? "Seleccione sección" : " "}
                    onChange={(e) => {
                      const seccion = secciones.find(
                        (s) => Number(s.id) === Number(e.target.value)
                      );
                      const modelo = getModeloDesdeSeccion(seccion);

                      setSelSeccion(seccion || null);
                      setSelModelo(modelo);
                      setFormError("");
                    }}
                  >
                    <MenuItem value="">-- Selecciona --</MenuItem>
                    {secciones.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.nombre} - {s.modeloNombre || "Sin modelo"}
                      </MenuItem>
                    ))}
                  </TextField>

                  <Button
                    variant="outlined"
                    size="small"
                    onClick={abrirNuevaSeccion}
                    startIcon={<AddIcon />}
                    sx={{
                      textTransform: "none",
                      borderRadius: 999,
                      height: 40,
                      color: "#592B2B",
                      borderColor: "#592B2B",
                      fontWeight: 700,
                    }}
                  >
                    Sección
                  </Button>
                </Box>
                                <Box display="flex" gap={1} alignItems="flex-start">
                  <TextField
                    select
                    label="Categoría"
                    size="small"
                    sx={{ minWidth: 170 }}
                    value={selCategoria?.id ?? ""}
                    error={selectError(selCategoria)}
                    helperText={selectError(selCategoria) ? "Seleccione categoría" : " "}
                    onChange={(e) => {
                      const categoria = categorias.find(
                        (c) => Number(c.id) === Number(e.target.value)
                      );
                      setSelCategoria(categoria || null);
                      setFormError("");
                    }}
                  >
                    <MenuItem value="">-- Selecciona --</MenuItem>
                    {categorias.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.nombre}
                      </MenuItem>
                    ))}
                  </TextField>

                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setShowCategoriaForm(true)}
                    startIcon={<AddIcon />}
                    sx={{
                      mt: 0,
                      textTransform: "none",
                      borderRadius: 999,
                      height: 40,
                      color: "#592B2B",
                      borderColor: "#592B2B",
                      fontWeight: 700,
                    }}
                  >
                    Categoría
                  </Button>
                </Box>

                <TextField
                  select
                  label="Importación"
                  size="small"
                  sx={{ minWidth: 170 }}
                  value={selImportacion?.id ?? ""}
                  error={selectError(selImportacion)}
                  helperText={selectError(selImportacion) ? "Seleccione importación" : " "}
                  onChange={(e) => {
                    const imp = importaciones.find(
                      (i) => Number(i.id) === Number(e.target.value)
                    );
                    setSelImportacion(imp || null);
                    setFormError("");
                  }}
                >
                  <MenuItem value="">-- Selecciona --</MenuItem>
                  {importaciones.map((i) => (
                    <MenuItem key={i.id} value={i.id}>
                      {i.codigo}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="Precio base (Bs)"
                  size="small"
                  type="number"
                  sx={{ width: 150 }}
                  value={precioOrigenLote}
                  error={touched && (!precioBaseValido || precioOrigenActual <= 0)}
                  helperText={
                    touched && (!precioBaseValido || precioOrigenActual <= 0)
                      ? "El precio base debe ser mayor a 0"
                      : " "
                  }
                  onChange={(e) => {
                    setPrecioOrigenLote(e.target.value);
                    setNuevo((p) => ({ ...p, precioOrigen: e.target.value }));
                    setFormError("");
                  }}
                />

                <TextField
                  label="Precio venta (Bs)"
                  size="small"
                  type="number"
                  sx={{ width: 150 }}
                  value={precioVentaLote}
                  error={touched && (!precioVentaValido || precioVentaActual <= 0)}
                  helperText={
                    touched && (!precioVentaValido || precioVentaActual <= 0)
                      ? "El precio de venta debe ser mayor a 0"
                      : " "
                  }
                  onChange={(e) => {
                    setPrecioVentaLote(e.target.value);
                    setNuevo((p) => ({ ...p, precio: e.target.value }));
                    setFormError("");
                  }}
                />
              </Box>

              {precioStatus && (
                <Alert
                  severity={precioStatus.severity}
                  sx={{
                    borderRadius: 2,
                    bgcolor: precioStatus.bg,
                    border: `1px solid ${precioStatus.border}`,
                    color: precioStatus.color,
                    "& .MuiAlert-icon": {
                      color: precioStatus.color,
                    },
                  }}
                >
                  {precioStatus.text}
                </Alert>
              )}

              <Card variant="outlined" className="product-form-card">
                <Box display="flex" gap={1} flexWrap="wrap" alignItems="flex-end">
                  <TextField
                    inputRef={serieInputRef}
                    label="N° serie"
                    size="small"
                    value={nuevo.numeroSerie}
                    onChange={(e) => {
                      setNuevo((p) => ({ ...p, numeroSerie: e.target.value.trimStart() }));
                      setSerieOcupada(false);
                      setMensajeSerie("");
                      setSerieBloqueada(false);
                      setFormError("");
                    }}
                    onBlur={() => validarSerieEnServidor(nuevo.numeroSerie)}
                    error={Boolean(serieOcupada) || (touched && !nuevo.numeroSerie.trim())}
                    helperText={
                      serieValidando
                        ? "Validando serie..."
                        : serieOcupada
                        ? mensajeSerie
                        : touched && !nuevo.numeroSerie.trim()
                        ? "Ingrese número de serie"
                        : ""
                    }
                    sx={{ flex: 1, minWidth: 120 }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={iniciarEscaner}
                            title="Escanear código de barras"
                            className="scan-button"
                          >
                            <Camera size={16} />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    label="Descripción"
                    size="small"
                    value={nuevo.descripcion}
                    onChange={(e) => {
                      setNuevo((p) => ({ ...p, descripcion: e.target.value }));
                      setFormError("");
                    }}
                    sx={{ flex: 1, minWidth: 140 }}
                  />

                  <FormControl component="fieldset" sx={{ minWidth: 200, mt: 1 }}>
                    <FormLabel component="legend" sx={{ fontSize: 12, mb: -0.5 }}>
                      Estado del producto
                    </FormLabel>
                    <RadioGroup
                      row
                      value={nuevo.observado}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        setNuevo((p) => ({
                          ...p,
                          observado: value,
                          ...(value === 1 ? { obsDescripcion: "" } : {}),
                        }));
                        setFormError("");
                      }}
                    >
                      <FormControlLabel value={1} control={<Radio size="small" />} label="Normal" />
                      <FormControlLabel value={2} control={<Radio size="small" />} label="Observado" />
                    </RadioGroup>
                  </FormControl>

                  <TextField
                    label="Detalle observación"
                    size="small"
                    value={nuevo.obsDescripcion}
                    onChange={(e) => {
                      setNuevo((p) => ({ ...p, obsDescripcion: e.target.value }));
                      setFormError("");
                    }}
                    error={touched && nuevo.observado === 2 && !nuevo.obsDescripcion.trim()}
                    helperText={
                      touched && nuevo.observado === 2 && !nuevo.obsDescripcion.trim()
                        ? "Detalle requerido"
                        : ""
                    }
                    sx={{ flex: 1, minWidth: 200 }}
                    disabled={nuevo.observado !== 2}
                  />

                  <Button
                    variant="contained"
                    onClick={addItem}
                    disabled={serieValidando || serieBloqueada}
                    className="next-button"
                  >
                    {serieValidando ? "Validando..." : "Agregar producto"}
                  </Button>
                </Box>
              </Card>

              <Card variant="outlined">
                <Box className="products-header">
                  <Box sx={{ flex: 1 }}>Serie</Box>
                  <Box sx={{ flex: 1 }}>Descripción</Box>
                  <Box sx={{ width: 100 }}>Base</Box>
                  <Box sx={{ width: 100 }}>Venta</Box>
                  <Box sx={{ flex: 1 }}>Modelo</Box>
                  <Box sx={{ width: 70 }}></Box>
                </Box>

                {items.length === 0 ? (
                  <Box className="empty-state">
                    Sin productos aún. Agrega el primer producto usando el formulario superior.
                  </Box>
                ) : (
                  items.map((it, idx) => (
                    <Box
                      key={`${it.numeroSerie}-${idx}`}
                      className={`product-row ${idx % 2 === 0 ? "product-row-even" : ""}`}
                    >
                      <Box sx={{ flex: 1 }}>{it.numeroSerie}</Box>
                      <Box sx={{ flex: 1 }}>{it.descripcion || "—"}</Box>
                      <Box sx={{ width: 100 }}>Bs {it.precioOrigen}</Box>
                      <Box sx={{ width: 100 }}>Bs {it.precio}</Box>
                      <Box sx={{ flex: 1, color: "text.secondary" }}>
                        {it.modeloNombre || "—"}
                      </Box>
                      <Box sx={{ width: 70, textAlign: "right" }}>
                        <IconButton size="small" color="error" onClick={() => removeItem(idx)}>
                          <Trash2 size={14} />
                        </IconButton>
                      </Box>
                    </Box>
                  ))
                )}
              </Card>
            </Box>
          )}

          {step === 1 && (
            <Box display="flex" flexDirection="column" gap={2}>
              <Typography variant="body2" color="text.secondary">
                Revisa los datos antes de guardar.
              </Typography>

              <Card variant="outlined" className="summary-card">
                <Typography fontWeight={700} mb={1} color="#1976d2">
                  Datos generales
                </Typography>

                <Box display="flex" flexDirection="column" gap={0.5}>
                  <Typography variant="body2">
                    <strong>Sucursal:</strong> {selSucursal?.nombre || "—"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Almacén:</strong> {selAlmacen?.nombre || "—"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Tipo movimiento:</strong> ENTRADA
                  </Typography>
                  <Typography variant="body2">
                    <strong>Total productos:</strong> {items.length}
                  </Typography>
                </Box>
              </Card>

              <Card variant="outlined">
                <Box className="products-header">
                  <Box sx={{ flex: 1 }}>Serie</Box>
                  <Box sx={{ flex: 1 }}>Descripción</Box>
                  <Box sx={{ width: 100 }}>Base</Box>
                  <Box sx={{ width: 100 }}>Venta</Box>
                  <Box sx={{ flex: 1 }}>Modelo</Box>
                  <Box sx={{ width: 100 }}>Estado</Box>
                </Box>

                {items.map((it, idx) => {
                  const diff = ((Number(it.precio) - Number(it.precioOrigen)) / Number(it.precioOrigen)) * 100;
                  const estado =
                    Number(it.precio) < Number(it.precioOrigen)
                      ? "Menor"
                      : diff > 80
                      ? "Alto"
                      : "Normal";

                  return (
                    <Box
                      key={`${it.numeroSerie}-resumen-${idx}`}
                      className={`product-row ${idx % 2 === 0 ? "product-row-even" : ""}`}
                    >
                      <Box sx={{ flex: 1 }}>{it.numeroSerie}</Box>
                      <Box sx={{ flex: 1 }}>{it.descripcion || "—"}</Box>
                      <Box sx={{ width: 100 }}>Bs {it.precioOrigen}</Box>
                      <Box sx={{ width: 100 }}>Bs {it.precio}</Box>
                      <Box sx={{ flex: 1, color: "text.secondary" }}>
                        {it.modeloNombre || "—"}
                      </Box>
                      <Box sx={{ width: 100 }}>
                        <Chip
                          size="small"
                          label={estado}
                          color={estado === "Normal" ? "success" : "warning"}
                        />
                      </Box>
                    </Box>
                  );
                })}
              </Card>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={handleClose} variant="outlined" className="cancel-button">
            Cancelar
          </Button>

          {step > 0 && (
            <Button onClick={prev} variant="outlined" className="back-button">
              Atrás
            </Button>
          )}

          {step < STEP_TITLES.length - 1 ? (
            <Button
              variant="contained"
              onClick={next}
              disabled={items.length === 0}
              className="next-button"
            >
              Siguiente
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={guardarEntrada}
              disabled={!canGuardarEntrada}
              className={canGuardarEntrada ? "save-button" : "save-button-disabled"}
            >
              Guardar movimiento
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {showCategoriaForm && (
        <CategoriaForm
          onClose={() => setShowCategoriaForm(false)}
          onSuccess={async () => {
            await cargarCategorias();
            setShowCategoriaForm(false);
          }}
        />
      )}

      {showSeccionForm && (
        <SeccionForm
          open={showSeccionForm}
          onClose={async (ok) => {
            setShowSeccionForm(false);

            if (ok) {
              await cargarSecciones();
            }
          }}
          seccion={null}
          almacenes={[selAlmacen || almacenSeleccionado]}
          modelos={modelos}
          almacenContext={selAlmacen || almacenSeleccionado}
        />
      )}
      <SuccessDialog
        open={showSuccess}
        message={dialogMessage}
      />

      <ErrorDialog
        open={showError}
        message={dialogMessage}
      />
    </>
  );
}