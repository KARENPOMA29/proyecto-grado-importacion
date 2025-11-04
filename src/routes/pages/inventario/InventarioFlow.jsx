import { useEffect, useState, useMemo, useRef } from "react";
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
} from "@mui/material";
import { Check, X, Camera, Trash2, ChevronRight } from "lucide-react";

import ServiceSucursal from "@/services/ServiceSucursal";
import ServiceAlmacen from "@/services/ServiceAlmacen";
import ServiceCategoria from "@/services/ServiceCategoria";
import ServiceModeloProducto from "@/services/ServiceModeloProducto";
import ServiceImportacion from "@/services/ServiceImportacion";
import ServiceProducto from "@/services/ServiceProducto";
import ServiceMovimiento from "@/services/ServiceMovimiento";
import { toast } from "react-toastify";
import BarcodeListener from "@/components/BarcodeListener";
import "./InventarioFlowMod.css";

const STEP_TITLES = ["Sucursal", "Almacén", "Detalle", "Resumen"];

export default function InventarioFlow({ isOpen, onClose, usuarioId = null }) {
  const [step, setStep] = useState(0);
  const [sucursales, setSucursales] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [importaciones, setImportaciones] = useState([]);
  const [selSucursal, setSelSucursal] = useState(null);
  const [selAlmacen, setSelAlmacen] = useState(null);
  const [tipoMov] = useState("ENTRADA");
  const [selCategoria, setSelCategoria] = useState(null);
  const [selModelo, setSelModelo] = useState(null);
  const [selImportacion, setSelImportacion] = useState(null);
  const [items, setItems] = useState([]);
  const [nuevo, setNuevo] = useState({
    numeroSerie: "",
    descripcion: "",
    precio: "",
    color: "",
    duracionGarantia: "",
    tipoGarantia: "MES",
  });
  const [serieValidando, setSerieValidando] = useState(false);
  const [serieOcupada, setSerieOcupada] = useState(false);
  const [mensajeSerie, setMensajeSerie] = useState("");
  const [serieBloqueada, setSerieBloqueada] = useState(false);
  const serieInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const [s, c, m, imps] = await Promise.all([
          ServiceSucursal.getAll(),
          ServiceCategoria.getAll(),
          ServiceModeloProducto.getAll(),
          ServiceImportacion.getAll(),
        ]);

        setSucursales(Array.isArray(s) ? s : s.items ?? []);
        setCategorias(Array.isArray(c) ? c : c.items ?? []);
        const mods = Array.isArray(m) ? m : m.items ?? [];
        setModelos(
          mods.map((mm) => ({
            ...mm,
            _nombre: mm.nombre ?? mm.nombreModelo ?? `Modelo #${mm.id}`,
          }))
        );
        setImportaciones(Array.isArray(imps) ? imps : imps.items ?? []);
      } catch (err) {
        console.warn("Error cargando catálogos:", err);
      }
    })();
  }, [isOpen]);

  useEffect(() => {
    (async () => {
      setSelAlmacen(null);
      if (!selSucursal) {
        setAlmacenes([]);
        return;
      }
      const res = await ServiceAlmacen.getAll();
      const list = Array.isArray(res) ? res : res.items ?? [];
      const filtrados = list.filter((a) => a.sucursalId === selSucursal.id);
      setAlmacenes(filtrados);
    })();
  }, [selSucursal]);

  const step0OK = !!selSucursal;
  const step1OK = step0OK && !!selAlmacen;
  const canGuardarEntrada = useMemo(
    () => step1OK && items.length > 0,
    [step1OK, items]
  );

  const validarSerieEnServidor = async (serie) => {
    if (!serie) {
      setSerieOcupada(false);
      setMensajeSerie("");
      setSerieBloqueada(false);
      return;
    }
    try {
      setSerieValidando(true);
      const prod = await ServiceProducto.getBySerie(serie);
      if (prod && (prod.estado === 1 || prod.estado === 2)) {
        setSerieOcupada(true);
        setMensajeSerie(
          `La serie ya existe en el sistema (estado: ${
            prod.estado === 1 ? "DISPONIBLE" : "VENDIDO"
          }).`
        );
        setSerieBloqueada(true);
        toast.warn("Ya existe un producto con ese número de serie.");
        setNuevo((prev) => ({ ...prev, numeroSerie: "" }));
        setTimeout(() => {
          setSerieOcupada(false);
          setMensajeSerie("");
          setSerieBloqueada(false);
        }, 3000);
      } else {
        setSerieOcupada(false);
        setMensajeSerie("");
        setSerieBloqueada(false);
      }
    } catch (err) {
      console.warn("Error validando serie:", err);
      setMensajeSerie("No se pudo validar la serie en el servidor.");
      setSerieOcupada(true);
      setSerieBloqueada(true);
      setTimeout(() => {
        setSerieOcupada(false);
        setMensajeSerie("");
        setSerieBloqueada(false);
      }, 5000);
    } finally {
      setSerieValidando(false);
    }
  };

  const resetAll = () => {
    setStep(0);
    setSelSucursal(null);
    setSelAlmacen(null);
    setSelCategoria(null);
    setSelModelo(null);
    setSelImportacion(null);
    setItems([]);
    setNuevo({
      numeroSerie: "",
      descripcion: "",
      precio: "",
      color: "",
      duracionGarantia: "",
      tipoGarantia: "MES",
    });
  };

  const handleClose = () => {
    resetAll();
    onClose?.();
  };

  const next = () => {
    if (step === 0 && !step0OK) return;
    if (step === 1 && !step1OK) return;
    setStep((s) => Math.min(s + 1, STEP_TITLES.length - 1));
  };

  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const iniciarEscaner = () => {
    toast.info("Modo escáner activado. Usa tu lector de código de barras.");
    const numeroSerieSimulado = `SN${Date.now().toString().slice(-6)}`;
    setNuevo((prev) => ({ ...prev, numeroSerie: numeroSerieSimulado }));
    if (serieInputRef.current) {
      serieInputRef.current.focus();
      serieInputRef.current.select?.();
    }
  };

  const handleBarcodeScan = (code) => {
    setNuevo((prev) => ({
      ...prev,
      numeroSerie: code,
    }));
    validarSerieEnServidor(code);

    if (serieInputRef.current) {
      serieInputRef.current.focus();
      serieInputRef.current.select?.();
    }

    toast.success(`Código escaneado: ${code}`);
  };

  const addItem = () => {
    if (serieValidando) {
      toast.info("Espera un momento, estoy validando la serie.");
      return;
    }
    if (serieBloqueada || serieOcupada) {
      toast.error("No puedes agregar esta serie porque ya existe.");
      return;
    }
    if (!nuevo.numeroSerie) {
      toast.warn("Ingresa número de serie");
      return;
    }

    const existeEnLista = items.some(
      (it) =>
        it.numeroSerie?.toString().trim() ===
        nuevo.numeroSerie?.toString().trim()
    );
    if (existeEnLista) {
      toast.error("Esta serie ya la agregaste en este movimiento.");
      setSerieOcupada(true);
      setMensajeSerie("Ya agregaste esta serie en este movimiento.");
      setSerieBloqueada(true);
      setNuevo((prev) => ({ ...prev, numeroSerie: "" }));
      setTimeout(() => {
        setSerieOcupada(false);
        setMensajeSerie("");
        setSerieBloqueada(false);
      }, 3000);
      return;
    }
    if (!selCategoria || !selModelo || !selImportacion) {
      toast.warn("Selecciona categoría, modelo e importación primero");
      return;
    }
    setItems((old) => [
      ...old,
      {
        ...nuevo,
        categoriaId: selCategoria.id,
        categoriaNombre: selCategoria.nombre,
        modeloId: selModelo.id,
        modeloNombre: selModelo._nombre ?? selModelo.nombre ?? "",
        importacionId: selImportacion.id,
        importacionCodigo: selImportacion.codigo,
      },
    ]);
    setNuevo({
      numeroSerie: "",
      descripcion: "",
      precio: "",
      color: "",
      duracionGarantia: "",
      tipoGarantia: "MES",
    });
    setSerieOcupada(false);
    setMensajeSerie("");
    setSerieBloqueada(false);

    if (serieInputRef.current) {
      serieInputRef.current.focus();
    }
  };

  const removeItem = (i) =>
    setItems((old) => old.filter((_, idx) => idx !== i));

  const guardarEntrada = async () => {
    try {
      for (const it of items) {
        const categoriaId = it.categoriaId ?? selCategoria?.id;
        const modeloId = it.modeloId ?? selModelo?.id;
        const importacionId = it.importacionId ?? selImportacion?.id;
        const series = items.map((i) => i.numeroSerie?.toString().trim());
        const setSeries = new Set(series);
        if (setSeries.size !== series.length) {
          toast.error("Hay series duplicadas en la lista. Revisa antes de guardar.");
          return;
        }
        if (!categoriaId || !modeloId || !importacionId) {
          console.warn("Item sin contexto completo:", it);
          continue;
        }
        const productoData = {
          numeroSerie: it.numeroSerie,
          descripcion: it.descripcion || it.numeroSerie,
          precio: Number(it.precio || 0),
          color: it.color || "N/A",
          duracionGarantia: Number(it.duracionGarantia || 0),
          tipoGarantia: it.tipoGarantia || "MES",
          categoriaId,
          modeloId,
          importacionId,
        };
        const prod = await ServiceProducto.create(productoData);
        await ServiceMovimiento.create({
          productoId: prod.id,
          almacenId: selAlmacen.id,
          tipoMovimiento: "ENTRADA",
          usuarioId: usuarioId ?? null,
        });
      }

      toast.success(`${items.length} producto(s) registrado(s) correctamente`);
      handleClose();
    } catch (err) {
      console.error("Error detallado:", err);
      toast.error(
        `Error al registrar el movimiento: ${
          err.response?.data?.message || err.message
        }`
      );
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ className: "dialog-paper" }}
    >
      {isOpen && step === 2 && (
        <BarcodeListener
          onScan={handleBarcodeScan}
          enabled
          debug
          targetRef={serieInputRef}
          gapMs={120}
          autoLength={13}
        />
      )}
      <DialogTitle className="dialog-title">
        <Box>
          <Typography variant="h6" fontWeight={600}>
            Registrar movimiento
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Completa los pasos para registrar una entrada.
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
          const canNavigate = done || (idx === step + 1 && step0OK && step1OK);
          
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
                <Typography
                  className={`
                    step-number
                    ${active ? "step-number-active" : ""}
                    ${done ? "step-number-done" : ""}
                    ${!active && !done ? "step-number-inactive" : ""}
                  `}
                >
                  Paso {idx + 1}
                </Typography>
                <Typography
                  className={`
                    step-title
                    ${active ? "step-title-active" : ""}
                    ${done ? "step-title-done" : ""}
                    ${!active && !done ? "step-title-inactive" : ""}
                  `}
                >
                  {title}
                </Typography>
              </Box>

              {idx < STEP_TITLES.length - 1 && (
                <ChevronRight 
                  size={20} 
                  color="#667eea" 
                  style={{ opacity: 0.6, margin: "0 8px" }} 
                />
              )}
            </Box>
          );
        })}
      </Box>
      <Divider />
      <DialogContent className="dialog-content">
        {step === 0 && (
          <Box>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Selecciona la sucursal donde se realiza el movimiento.
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {sucursales.map((s) => (
                <Card
                  key={s.id}
                  variant="outlined"
                  className={`
                    location-card 
                    ${selSucursal?.id === s.id ? "location-card-selected" : ""}
                  `}
                  onClick={() => setSelSucursal(s)}
                >
                  <Box sx={{ p: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Box sx={{ textAlign: "left" }}>
                        <Typography fontSize={14} fontWeight={600}>
                          {s.nombre}
                        </Typography>
                        {s.telefono && (
                          <Typography fontSize={11} color="text.secondary">
                            {s.telefono}
                          </Typography>
                        )}
                      </Box>
                      {selSucursal?.id === s.id && (
                        <Box className="selection-check">
                          <Check size={12} color="white" />
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Card>
              ))}
              {sucursales.length === 0 && (
                <Typography variant="caption" color="text.disabled">
                  No hay sucursales registradas.
                </Typography>
              )}
            </Box>
          </Box>
        )}
        {step === 1 && (
          <Box>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Ahora elige el almacén donde impactará el stock.
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {almacenes.map((a) => (
                <Card
                  key={a.id}
                  variant="outlined"
                  className={`
                    location-card 
                    ${selAlmacen?.id === a.id ? "location-card-selected" : ""}
                  `}
                  onClick={() => setSelAlmacen(a)}
                >
                  <Box sx={{ p: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Box sx={{ textAlign: "left" }}>
                        <Typography fontSize={14} fontWeight={600}>
                          {a.nombre}
                        </Typography>
                        {a.descripcion && (
                          <Typography fontSize={11} color="text.secondary">
                            {a.descripcion}
                          </Typography>
                        )}
                      </Box>
                      {selAlmacen?.id === a.id && (
                        <Box className="selection-check">
                          <Check size={12} color="white" />
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Card>
              ))}
              {almacenes.length === 0 && (
                <Typography variant="caption" color="text.disabled">
                  No hay almacenes para esta sucursal.
                </Typography>
              )}
            </Box>
          </Box>
        )}
        {step === 2 && (
          <Box display="flex" flexDirection="column" gap={2}>
            <Box className="movement-type-banner">
              <Typography variant="body2" color="text.secondary">
                Tipo de movimiento: <strong style={{ color: "#667eea" }}>ENTRADA</strong> (fijo)
              </Typography>
            </Box>
            <Box display="flex" gap={2} flexWrap="wrap">
              <TextField
                select
                label="Categoría"
                size="small"
                sx={{ minWidth: 150 }}
                value={selCategoria?.id ?? ""}
                onChange={(e) =>
                  setSelCategoria(
                    categorias.find((c) => c.id === Number(e.target.value))
                  )
                }
              >
                <MenuItem value="">-- Selecciona --</MenuItem>
                {categorias.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.nombre}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Modelo"
                size="small"
                sx={{ minWidth: 150 }}
                value={selModelo?.id ?? ""}
                onChange={(e) =>
                  setSelModelo(
                    modelos.find((m) => m.id === Number(e.target.value))
                  )
                }
              >
                <MenuItem value="">-- Selecciona --</MenuItem>
                {modelos.map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m._nombre}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Importación"
                size="small"
                sx={{ minWidth: 150 }}
                value={selImportacion?.id ?? ""}
                onChange={(e) =>
                  setSelImportacion(
                    importaciones.find((i) => i.id === Number(e.target.value))
                  )
                }
              >
                <MenuItem value="">-- Selecciona --</MenuItem>
                {importaciones.map((i) => (
                  <MenuItem key={i.id} value={i.id}>
                    {i.codigo}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <Card variant="outlined" className="product-form-card">
              <Box display="flex" gap={1} flexWrap="wrap" alignItems="flex-end">
                <TextField
                  inputRef={serieInputRef}
                  label="N° serie"
                  size="small"
                  value={nuevo.numeroSerie}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNuevo((p) => ({ ...p, numeroSerie: value }));
                    setSerieOcupada(false);
                    setMensajeSerie("");
                    setSerieBloqueada(false);
                  }}
                  onBlur={() => validarSerieEnServidor(nuevo.numeroSerie)}
                  error={Boolean(serieOcupada)}
                  helperText={
                    serieValidando
                      ? "Validando serie..."
                      : serieOcupada
                      ? mensajeSerie
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
                  onChange={(e) =>
                    setNuevo((p) => ({ ...p, descripcion: e.target.value }))
                  }
                  sx={{ flex: 1, minWidth: 140 }}
                />
                <TextField
                  label="Precio"
                  size="small"
                  type="number"
                  value={nuevo.precio}
                  onChange={(e) =>
                    setNuevo((p) => ({ ...p, precio: e.target.value }))
                  }
                  sx={{ width: 90 }}
                />
                <TextField
                  label="Color"
                  size="small"
                  value={nuevo.color}
                  onChange={(e) =>
                    setNuevo((p) => ({ ...p, color: e.target.value }))
                  }
                  sx={{ width: 90 }}
                />
                <TextField
                  label="Garantía"
                  size="small"
                  type="number"
                  value={nuevo.duracionGarantia}
                  onChange={(e) =>
                    setNuevo((p) => ({ ...p, duracionGarantia: e.target.value }))
                  }
                  sx={{ width: 90 }}
                />
                <TextField
                  select
                  label="Tipo"
                  size="small"
                  value={nuevo.tipoGarantia}
                  onChange={(e) =>
                    setNuevo((p) => ({ ...p, tipoGarantia: e.target.value }))
                  }
                  sx={{ width: 90 }}
                >
                  <MenuItem value="MES">MES</MenuItem>
                  <MenuItem value="AÑO">AÑO</MenuItem>
                </TextField>
                <Button 
                  variant="contained" 
                  onClick={addItem}
                  className="next-button"
                >
                  Agregar producto
                </Button>
              </Box>
            </Card>
            <Card variant="outlined">
              <Box className="products-header">
                <Box sx={{ flex: 1 }}>Serie</Box>
                <Box sx={{ flex: 1 }}>Descripción</Box>
                <Box sx={{ width: 70 }}>Precio</Box>
                <Box sx={{ width: 70 }}>Color</Box>
                <Box sx={{ width: 110 }}>Garantía</Box>
                <Box sx={{ flex: 1 }}>Modelo</Box>
                <Box sx={{ width: 60 }}></Box>
              </Box>
              {items.length === 0 ? (
                <Box className="empty-state">
                  Sin productos aún. Agrega el primer producto usando el formulario superior.
                </Box>
              ) : (
                items.map((it, idx) => (
                  <Box
                    key={idx}
                    className={`
                      product-row 
                      ${idx % 2 === 0 ? "product-row-even" : ""}
                    `}
                  >
                    <Box sx={{ flex: 1 }}>{it.numeroSerie}</Box>
                    <Box sx={{ flex: 1 }}>{it.descripcion}</Box>
                    <Box sx={{ width: 70 }}>${it.precio}</Box>
                    <Box sx={{ width: 70 }}>{it.color}</Box>
                    <Box sx={{ width: 110 }}>
                      {it.duracionGarantia} {it.tipoGarantia}
                    </Box>
                    <Box sx={{ flex: 1, color: "text.secondary" }}>
                      {it.modeloNombre || "—"}
                    </Box>
                    <Box sx={{ width: 60, textAlign: "right" }}>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => removeItem(idx)}
                        sx={{
                          "&:hover": {
                            bgcolor: "error.light",
                            color: "white",
                          }
                        }}
                      >
                        <Trash2 size={14} />
                      </IconButton>
                    </Box>
                  </Box>
                ))
              )}
            </Card>
          </Box>
        )}
        {step === 3 && (
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
                <Box sx={{ width: 70 }}>Precio</Box>
                <Box sx={{ width: 70 }}>Color</Box>
                <Box sx={{ width: 110 }}>Garantía</Box>
                <Box sx={{ flex: 1 }}>Modelo</Box>
              </Box>
              {items.length === 0 ? (
                <Box className="empty-state">
                  No agregaste productos.
                </Box>
              ) : (
                items.map((it, idx) => (
                  <Box
                    key={idx}
                    className={`
                      product-row 
                      ${idx % 2 === 0 ? "product-row-even" : ""}
                    `}
                  >
                    <Box sx={{ flex: 1 }}>{it.numeroSerie}</Box>
                    <Box sx={{ flex: 1 }}>{it.descripcion}</Box>
                    <Box sx={{ width: 70 }}>${it.precio}</Box>
                    <Box sx={{ width: 70 }}>{it.color}</Box>
                    <Box sx={{ width: 110 }}>
                      {it.duracionGarantia} {it.tipoGarantia}
                    </Box>
                    <Box sx={{ flex: 1, color: "text.secondary" }}>
                      {it.modeloNombre || "—"}
                    </Box>
                  </Box>
                ))
              )}
            </Card>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button 
          onClick={handleClose}
          variant="outlined"
          className="cancel-button"
        >
          Cancelar
        </Button>
        {step > 0 && (
          <Button 
            onClick={prev}
            variant="outlined"
            className="back-button"
          >
            Atrás
          </Button>
        )}
        {step < STEP_TITLES.length - 1 ? (
          <Button
            variant="contained"
            onClick={next}
            disabled={
              (step === 0 && !step0OK) ||
              (step === 1 && !step1OK)
            }
            className="next-button"
          >
            Siguiente
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={guardarEntrada}
            disabled={!canGuardarEntrada}
            className={canGuardarEntrada ? "save-button" : "save-button:disabled"}
          >
            Guardar movimiento
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}