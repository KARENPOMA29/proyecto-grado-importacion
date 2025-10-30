// src/pages/inventario/InventarioFlow.jsx
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

// ahora son 4 pasos visibles: 0 Sucursal, 1 Almacén, 2 Detalle, 3 Resumen
const STEP_TITLES = ["Sucursal", "Almacén", "Detalle", "Resumen"];

export default function InventarioFlow({ isOpen, onClose, usuarioId = null }) {
  const [step, setStep] = useState(0);

  // catálogos
  const [sucursales, setSucursales] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [importaciones, setImportaciones] = useState([]);

  // selecciones
  const [selSucursal, setSelSucursal] = useState(null);
  const [selAlmacen, setSelAlmacen] = useState(null);

  // tipo movimiento fijo
  const [tipoMov] = useState("ENTRADA");

  const [selCategoria, setSelCategoria] = useState(null);
  const [selModelo, setSelModelo] = useState(null);
  const [selImportacion, setSelImportacion] = useState(null);

  // items
  const [items, setItems] = useState([]);
  const [nuevo, setNuevo] = useState({
    numeroSerie: "",
    descripcion: "",
    precio: "",
    color: "",
    duracionGarantia: "",
    tipoGarantia: "MES",
  });

  // ref para el input de serie
  const serieInputRef = useRef(null);

  // ========== cargar catálogos ==========
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

  // ========== almacenes dependientes (filtrar en front) ==========
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

  // ========== validaciones ==========
  const step0OK = !!selSucursal;
  const step1OK = step0OK && !!selAlmacen;
  // como el tipo es fijo, no hay que validar ese paso
  const canGuardarEntrada = useMemo(
    () => step1OK && items.length > 0,
    [step1OK, items]
  );

  // ========== helpers ==========
  const resetAll = () => {
    setStep(0);
    setSelSucursal(null);
    setSelAlmacen(null);
    // tipoMov queda por defecto "ENTRADA"
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
    // step 2 es el detalle, ahí no hay validación estricta, puedes avanzar aunque no haya items
    setStep((s) => Math.min(s + 1, STEP_TITLES.length - 1));
  };

  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const iniciarEscaner = () => {
    toast.info("Modo escáner activado. Usa tu lector de código de barras.");
    const numeroSerieSimulado = `SN${Date.now().toString().slice(-6)}`;
    setNuevo((prev) => ({ ...prev, numeroSerie: numeroSerieSimulado }));
    // foco al input
    if (serieInputRef.current) {
      serieInputRef.current.focus();
      serieInputRef.current.select?.();
    }
  };

  // cuando escanee el lector real
  const handleBarcodeScan = (code) => {
    setNuevo((prev) => ({
      ...prev,
      numeroSerie: code,
    }));

    // enfocar y seleccionar
    if (serieInputRef.current) {
      serieInputRef.current.focus();
      serieInputRef.current.select?.();
    }

    toast.success(`Código escaneado: ${code}`);
  };

  // ========== agregar item ==========
  const addItem = () => {
    if (!nuevo.numeroSerie) {
      toast.warn("Ingresa número de serie");
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

    // volver a enfocar para el próximo escaneo
    if (serieInputRef.current) {
      serieInputRef.current.focus();
    }
  };

  const removeItem = (i) =>
    setItems((old) => old.filter((_, idx) => idx !== i));

  // ========== guardar ==========
  const guardarEntrada = async () => {
    try {
      for (const it of items) {
        const categoriaId = it.categoriaId ?? selCategoria?.id;
        const modeloId = it.modeloId ?? selModelo?.id;
        const importacionId = it.importacionId ?? selImportacion?.id;

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

      toast.success(`✅ ${items.length} producto(s) registrado(s) correctamente`);
      handleClose();
    } catch (err) {
      console.error("Error detallado:", err);
      toast.error(
        `❌ Error al registrar el movimiento: ${
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
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
        },
      }}
    >
      {/* listener para el lector de barras */}
      
      {isOpen && step === 2 && (
        <BarcodeListener
          onScan={handleBarcodeScan}
          enabled
          debug
          targetRef={serieInputRef}  // 👈 ahora el listener sabe cuál input usar
          gapMs={120}
          autoLength={13}
        />
      )}


      {/* HEADER */}
      <DialogTitle
        sx={{
          pb: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
        }}
      >
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

      {/* WIZARD STEPS - MEJORADO */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          px: 3,
          py: 3,
          background: "linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%)",
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            top: "50%",
            left: "20%",
            right: "20%",
            height: "2px",
            background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
            transform: "translateY(-50%)",
            zIndex: 1,
          }
        }}
      >
        {STEP_TITLES.map((title, idx) => {
          const active = step === idx;
          const done = step > idx;
          const canNavigate = done || (idx === step + 1 && step0OK && step1OK);
          
          return (
            <Box
              key={title}
              sx={{
                display: "flex",
                alignItems: "center",
                position: "relative",
                zIndex: 2,
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: done 
                    ? "linear-gradient(135deg, #4CAF50 0%, #45a049 100%)"
                    : active
                    ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    : "linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)",
                  color: "white",
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: canNavigate ? "pointer" : "default",
                  boxShadow: active 
                    ? "0 4px 12px rgba(102, 126, 234, 0.4)"
                    : done
                    ? "0 4px 12px rgba(76, 175, 80, 0.4)"
                    : "0 2px 6px rgba(0,0,0,0.1)",
                  transition: "all 0.3s ease",
                  transform: active ? "scale(1.1)" : "scale(1)",
                  "&:hover": canNavigate ? {
                    transform: "scale(1.05)",
                    boxShadow: "0 6px 16px rgba(102, 126, 234, 0.3)"
                  } : {},
                }}
                onClick={() => canNavigate && setStep(idx)}
              >
                {done ? <Check size={20} /> : idx + 1}
              </Box>
              
              <Box
                sx={{
                  ml: 2,
                  mr: idx < STEP_TITLES.length - 1 ? 2 : 0,
                  textAlign: "center",
                  minWidth: 80,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    fontWeight: 600,
                    color: active ? "#667eea" : done ? "#4CAF50" : "text.disabled",
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Paso {idx + 1}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: active ? 700 : 500,
                    color: active ? "text.primary" : done ? "text.primary" : "text.disabled",
                    fontSize: "0.85rem",
                  }}
                >
                  {title}
                </Typography>
              </Box>

              {idx < STEP_TITLES.length - 1 && (
                <ChevronRight 
                  size={20} 
                  color="#667eea" 
                  style={{ 
                    opacity: 0.6,
                    margin: "0 8px"
                  }} 
                />
              )}
            </Box>
          );
        })}
      </Box>

      <Divider />

      {/* CONTENT */}
      <DialogContent
        sx={{
          pt: 3,
          pb: 1,
          maxHeight: "55vh",
        }}
      >
        {/* STEP 0: sucursal */}
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
                  sx={{
                    cursor: "pointer",
                    border: selSucursal?.id === s.id ? "2px solid" : "1px solid",
                    borderColor: selSucursal?.id === s.id ? "#667eea" : "divider",
                    bgcolor:
                      selSucursal?.id === s.id ? "rgba(102, 126, 234, 0.05)" : "background.paper",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: selSucursal?.id === s.id ? "#667eea" : "#c5cae9",
                      bgcolor: selSucursal?.id === s.id ? "rgba(102, 126, 234, 0.08)" : "grey.50",
                    },
                  }}
                  onClick={() => setSelSucursal(s)}
                >
                  <Box sx={{ p: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
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
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            bgcolor: "#4CAF50",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
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

        {/* STEP 1: almacén */}
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
                  sx={{
                    cursor: "pointer",
                    border: selAlmacen?.id === a.id ? "2px solid" : "1px solid",
                    borderColor: selAlmacen?.id === a.id ? "#667eea" : "divider",
                    bgcolor:
                      selAlmacen?.id === a.id ? "rgba(102, 126, 234, 0.05)" : "background.paper",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: selAlmacen?.id === a.id ? "#667eea" : "#c5cae9",
                      bgcolor: selAlmacen?.id === a.id ? "rgba(102, 126, 234, 0.08)" : "grey.50",
                    },
                  }}
                  onClick={() => setSelAlmacen(a)}
                >
                  <Box sx={{ p: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
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
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            bgcolor: "#4CAF50",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
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

        {/* STEP 2: detalle (entrada) */}
        {step === 2 && (
          <Box display="flex" flexDirection="column" gap={2}>
            {/* mostramos el tipo fijo */}
            <Box 
              sx={{ 
                p: 2, 
                bgcolor: "rgba(102, 126, 234, 0.05)", 
                borderRadius: 2,
                border: "1px solid rgba(102, 126, 234, 0.1)"
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Tipo de movimiento: <strong style={{ color: "#667eea" }}>ENTRADA</strong> (fijo)
              </Typography>
            </Box>

            {/* filtros */}
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

            {/* item nuevo */}
            <Card 
              variant="outlined" 
              sx={{ 
                p: 2,
                border: "2px dashed #c5cae9",
                bgcolor: "rgba(245, 247, 250, 0.5)"
              }}
            >
              <Box display="flex" gap={1} flexWrap="wrap" alignItems="flex-end">
                <TextField
                  inputRef={serieInputRef}
                  label="N° serie"
                  size="small"
                  value={nuevo.numeroSerie}
                  onChange={(e) =>
                    setNuevo((p) => ({ ...p, numeroSerie: e.target.value }))
                  }
                  sx={{ flex: 1, minWidth: 120 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={iniciarEscaner}
                          title="Escanear código de barras"
                          sx={{
                            bgcolor: "#667eea",
                            color: "white",
                            "&:hover": {
                              bgcolor: "#5a6fd8",
                            }
                          }}
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
                  sx={{
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)",
                    }
                  }}
                >
                  Agregar producto
                </Button>
              </Box>
            </Card>

            {/* tabla mini */}
            <Card variant="outlined">
              <Box
                sx={{
                  display: "flex",
                  px: 2,
                  py: 1.5,
                  fontSize: 12,
                  fontWeight: 600,
                  borderBottom: "2px solid",
                  borderColor: "#667eea",
                  color: "white",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                }}
              >
                <Box sx={{ flex: 1 }}>Serie</Box>
                <Box sx={{ flex: 1 }}>Descripción</Box>
                <Box sx={{ width: 70 }}>Precio</Box>
                <Box sx={{ width: 70 }}>Color</Box>
                <Box sx={{ width: 110 }}>Garantía</Box>
                <Box sx={{ flex: 1 }}>Modelo</Box>
                <Box sx={{ width: 60 }}></Box>
              </Box>
              {items.length === 0 ? (
                <Box
                  sx={{
                    p: 3,
                    fontSize: 12,
                    color: "text.disabled",
                    textAlign: "center",
                    bgcolor: "grey.50",
                  }}
                >
                  Sin productos aún. Agrega el primer producto usando el formulario superior.
                </Box>
              ) : (
                items.map((it, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: "flex",
                      px: 2,
                      py: 1.5,
                      fontSize: 12,
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      alignItems: "center",
                      bgcolor: idx % 2 === 0 ? "white" : "grey.50",
                      transition: "background-color 0.2s ease",
                      "&:hover": {
                        bgcolor: "rgba(102, 126, 234, 0.05)",
                      },
                      "&:last-child": { borderBottom: "none" },
                    }}
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

        {/* STEP 3: resumen */}
        {step === 3 && (
          <Box display="flex" flexDirection="column" gap={2}>
            <Typography variant="body2" color="text.secondary">
              Revisa los datos antes de guardar.
            </Typography>

            <Card 
              variant="outlined" 
              sx={{ 
                p: 2,
                border: "2px solid #e3f2fd",
                bgcolor: "rgba(227, 242, 253, 0.3)"
              }}
            >
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
              <Box
                sx={{
                  display: "flex",
                  px: 2,
                  py: 1.5,
                  fontSize: 12,
                  fontWeight: 600,
                  borderBottom: "2px solid",
                  borderColor: "#667eea",
                  color: "white",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                }}
              >
                <Box sx={{ flex: 1 }}>Serie</Box>
                <Box sx={{ flex: 1 }}>Descripción</Box>
                <Box sx={{ width: 70 }}>Precio</Box>
                <Box sx={{ width: 70 }}>Color</Box>
                <Box sx={{ width: 110 }}>Garantía</Box>
                <Box sx={{ flex: 1 }}>Modelo</Box>
              </Box>
              {items.length === 0 ? (
                <Box
                  sx={{
                    p: 3,
                    fontSize: 12,
                    color: "text.disabled",
                    textAlign: "center",
                    bgcolor: "grey.50",
                  }}
                >
                  No agregaste productos.
                </Box>
              ) : (
                items.map((it, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: "flex",
                      px: 2,
                      py: 1.5,
                      fontSize: 12,
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      bgcolor: idx % 2 === 0 ? "white" : "grey.50",
                      "&:last-child": { borderBottom: "none" },
                    }}
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

      {/* FOOTER - MEJORADO */}
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button 
          onClick={handleClose}
          variant="outlined"
          sx={{
            borderColor: "#e0e0e0",
            color: "text.secondary",
            "&:hover": {
              borderColor: "#d32f2f",
              color: "#d32f2f",
              bgcolor: "rgba(211, 47, 47, 0.04)"
            }
          }}
        >
          Cancelar
        </Button>
        {step > 0 && (
          <Button 
            onClick={prev}
            variant="outlined"
            sx={{
              borderColor: "#667eea",
              color: "#667eea",
              "&:hover": {
                borderColor: "#5a6fd8",
                bgcolor: "rgba(102, 126, 234, 0.04)"
              }
            }}
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
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)",
                boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)"
              },
              "&:disabled": {
                background: "grey.300",
                color: "grey.500"
              }
            }}
          >
            Siguiente
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={guardarEntrada}
            disabled={!canGuardarEntrada}
            sx={{
              background: canGuardarEntrada 
                ? "linear-gradient(135deg, #4CAF50 0%, #45a049 100%)"
                : "grey.300",
              color: "white",
              "&:hover": canGuardarEntrada ? {
                background: "linear-gradient(135deg, #45a049 0%, #3d8b40 100%)",
                boxShadow: "0 4px 12px rgba(76, 175, 80, 0.4)"
              } : {},
              minWidth: 160,
              fontWeight: 600,
            }}
          >
            ✅ Guardar movimiento
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
