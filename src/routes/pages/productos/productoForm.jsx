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
  Divider,
  IconButton,
  Card,
  CardContent,
} from "@mui/material";
import { X, Check, Package, Tag, BarChart3 } from "lucide-react";
import { toast } from "react-toastify";
import ServiceProducto from "@/services/ServiceProducto";
import ServiceModeloProducto from "@/services/ServiceModeloProducto";
import ServiceCategoria from "@/services/ServiceCategoria";
import ServiceImportacion from "@/services/ServiceImportacion";

const ProductoForm = ({ initialData = null, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    numeroSerie: initialData?.numeroSerie || "",
    descripcion: initialData?.descripcion || "",
    observado:
      typeof initialData?.observado === "number"
        ? String(initialData.observado)
        : "1",
    obsDescripcion: initialData?.obsDescripcion || "",
    precioOrigen: initialData?.precioOrigen || "",
    precio: initialData?.precio || "",
    categoriaId: initialData?.categoriaId || "",
    modeloId: initialData?.modeloId || "",
    importacionId: initialData?.importacionId || "",
    estado:
      typeof initialData?.estado === "number"
        ? String(initialData.estado)
        : "1",
  });
  
  const [errors, setErrors] = useState({});
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
      ...(name === "observado" && value === "1" ? { obsDescripcion: "" } : {}),
    }));

    setErrors((prev) => ({ ...prev, [name]: "" }));
    if (name === "observado") {
      setErrors((prev) => ({ ...prev, obsDescripcion: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    const numeroSerie = form.numeroSerie.trim();
    const descripcion = form.descripcion.trim();
    const precioOrigenNum = form.precioOrigen ? Number(form.precioOrigen) : 0;
    const precioNum = form.precio ? Number(form.precio) : 0;
    const observadoNum = Number(form.observado);

    if (!numeroSerie) {
      newErrors.numeroSerie = "El número de serie es obligatorio.";
    } else if (numeroSerie.length > 50) {
      newErrors.numeroSerie = "Máximo 50 caracteres.";
    }

    if (!descripcion) {
      newErrors.descripcion = "La descripción es obligatoria.";
    }

    if (!form.precioOrigen) {
      newErrors.precioOrigen = "El precio de origen es obligatorio.";
    } else if (!Number.isFinite(precioOrigenNum)) {
      newErrors.precioOrigen = "El precio de origen no es válido.";
    } else if (precioOrigenNum <= 0) {
      newErrors.precioOrigen = "Debe ser mayor a 0.";
    }

    if (!form.precio) {
      newErrors.precio = "El precio de venta es obligatorio.";
    } else if (!Number.isFinite(precioNum)) {
      newErrors.precio = "El precio de venta no es válido.";
    } else if (precioNum <= 0) {
      newErrors.precio = "Debe ser mayor a 0.";
    } else if (precioNum < precioOrigenNum) {
      newErrors.precio =
        "El precio de venta no puede ser menor al precio de origen.";
    }

    if (!form.categoriaId) {
      newErrors.categoriaId = "Seleccione una categoría.";
    }
    if (!form.modeloId) {
      newErrors.modeloId = "Seleccione un modelo.";
    }

    if (!form.observado) {
      newErrors.observado = "Seleccione si está observado.";
    }

    if (observadoNum === 2) {
      if (!form.obsDescripcion.trim()) {
        newErrors.obsDescripcion = "Describa la observación.";
      }
    }

    if (!form.estado) {
      newErrors.estado = "Seleccione el estado.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const payload = {
        numeroSerie: form.numeroSerie.trim(),
        descripcion: form.descripcion.trim(),
        observado: Number(form.observado),
        obsDescripcion: form.obsDescripcion?.trim() || null,
        precioOrigen: form.precioOrigen ? Number(form.precioOrigen) : 0,
        precio: form.precio ? Number(form.precio) : 0,
        categoriaId: Number(form.categoriaId),
        modeloId: Number(form.modeloId),
        importacionId: form.importacionId ? Number(form.importacionId) : null,
        estado: Number(form.estado),
      };

      if (initialData) {
        await ServiceProducto.update(initialData.id, payload);
        toast.success("Producto actualizado correctamente");
      } else {
        await ServiceProducto.create(payload);
        toast.success("Producto creado correctamente");
      }

      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.detail || "Error al guardar el producto"
      );
    }
  };

  // Estilos consistentes con la paleta marrón del VentaForm
  const dialogPaperStyles = {
    borderRadius: "12px",
    overflow: "hidden",
  };

  const dialogTitleStyles = {
    bgcolor: "#592B2B", // Marrón oscuro principal del VentaForm
    color: "white",
    py: 2,
    px: 3,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  };

  const inputStyles = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "8px",
      backgroundColor: "#fff",
      transition: "all 0.2s ease",
      "&:hover": {
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: "#a66", // Marrón suave
        },
      },
      "&.Mui-focused": {
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: "#592B2B",
          borderWidth: "2px",
        },
      },
      "& fieldset": {
        borderColor: "#d8d8d8",
      },
    },
    "& .MuiInputLabel-root": {
      fontSize: "14px",
      color: "#64748b",
      "&.Mui-focused": {
        color: "#592B2B",
      },
    },
    "& .MuiSelect-select": {
      padding: "10px 14px",
      fontSize: "14px",
      color: "#1e293b",
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "#e2e8f0",
    },
    "& .Mui-error": {
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: "#d32f2f",
      }
    }
  };

  const comboStyles = {
    ...inputStyles,
    "& .MuiSelect-icon": {
      color: "#64748b",
    }
  };

  const getMenuItemStyles = (selected) => ({
    fontSize: "14px",
    padding: "10px 14px",
    borderRadius: "6px",
    margin: "4px 8px",
    color: selected ? "white" : "#1e293b",
    backgroundColor: selected ? "#592B2B !important" : "transparent",
    fontWeight: selected ? 600 : 400,
    "&:hover": {
      backgroundColor: selected ? "#3A1A1A !important" : "#fdf5f5", // Fondo rosa muy claro para hover
    },
    "&.Mui-selected": {
      backgroundColor: "#592B2B !important",
      color: "white",
      "&:hover": {
        backgroundColor: "#3A1A1A !important",
      },
    },
  });

  const cancelButtonStyles = {
    borderRadius: "8px",
    textTransform: "none",
    fontWeight: 600,
    px: 3,
    borderColor: "#592B2B",
    color: "#592B2B",
    bgcolor: "white",
    "&:hover": {
      borderColor: "#3A1A1A",
      backgroundColor: "#592B2B08",
    }
  };

  const saveButtonStyles = {
    borderRadius: "8px",
    textTransform: "none",
    fontWeight: 600,
    px: 3,
    background: "linear-gradient(135deg, #592B2B 0%, #3A1A1A 100%)",
    boxShadow: "0 4px 10px rgba(89,43,43,0.25)",
    "&:hover": {
      background: "linear-gradient(135deg, #3A1A1A 0%, #592B2B 100%)",
      boxShadow: "0 6px 16px rgba(89,43,43,0.35)",
    },
    "&:disabled": {
      background: "#cbd5e1",
      boxShadow: "none",
    }
  };

  return (
    <Dialog 
      open 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: dialogPaperStyles
      }}
    >
      <DialogTitle sx={dialogTitleStyles}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ 
            width: 40, 
            height: 40, 
            borderRadius: "50%", 
            bgcolor: "rgba(255,255,255,0.15)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center" 
          }}>
            <Package size={20} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {initialData ? "Editar Producto" : "Nuevo Producto"}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {initialData ? "Modifica los datos del producto" : "Completa todos los campos requeridos"}
            </Typography>
          </Box>
        </Box>
        <IconButton 
          onClick={onClose} 
          size="small" 
          sx={{ 
            color: "white",
            "&:hover": {
              bgcolor: "rgba(255,255,255,0.1)"
            }
          }}
        >
          <X size={18} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 3, bgcolor: "#fdf5f5" }}>
        {/* Header de información */}
        <Card 
          variant="outlined" 
          sx={{ 
            mb: 3, 
            borderRadius: 3, 
            borderColor: "#f1d2d2", 
            bgcolor: "#fdf5f5" 
          }}
        >
          <CardContent sx={{ py: 1.5, display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ 
              width: 44, 
              height: 44, 
              borderRadius: "50%", 
              bgcolor: "#592B2B15", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              color: "#592B2B" 
            }}>
              <Tag size={22} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#3A1A1A" }}>
                Información del Producto
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                Complete los campos obligatorios para {initialData ? "actualizar" : "registrar"} el producto
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Grid container spacing={2}>
          {/* Número de Serie */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Número de Serie *"
              name="numeroSerie"
              value={form.numeroSerie}
              onChange={handleChange}
              fullWidth
              size="small"
              error={!!errors.numeroSerie}
              helperText={errors.numeroSerie}
              sx={inputStyles}
            />
          </Grid>

          {/* Descripción */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Descripción *"
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              fullWidth
              size="small"
              error={!!errors.descripcion}
              helperText={errors.descripcion}
              sx={inputStyles}
            />
          </Grid>

          {/* Precio Origen */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Precio Origen *"
              name="precioOrigen"
              type="number"
              value={form.precioOrigen}
              onChange={handleChange}
              fullWidth
              size="small"
              inputProps={{ 
                step: "0.01",
                min: "0"
              }}
              error={!!errors.precioOrigen}
              helperText={errors.precioOrigen}
              sx={inputStyles}
            />
          </Grid>

          {/* Precio Venta */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Precio Venta *"
              name="precio"
              type="number"
              value={form.precio}
              onChange={handleChange}
              fullWidth
              size="small"
              inputProps={{ 
                step: "0.01",
                min: "0"
              }}
              error={!!errors.precio}
              helperText={errors.precio}
              sx={inputStyles}
            />
          </Grid>

          {/* COMBO MEJORADO: Categoría */}
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Categoría *"
              name="categoriaId"
              value={form.categoriaId}
              onChange={handleChange}
              fullWidth
              size="small"
              error={!!errors.categoriaId}
              helperText={errors.categoriaId}
              sx={comboStyles}
              SelectProps={{
                displayEmpty: true,
                MenuProps: {
                  PaperProps: {
                    sx: {
                      borderRadius: "8px",
                      marginTop: "6px",
                      boxShadow: "0 10px 40px rgba(89,43,43,0.08)",
                      maxHeight: "300px",
                      "&::-webkit-scrollbar": {
                        width: "8px",
                      },
                      "&::-webkit-scrollbar-track": {
                        background: "#fdf5f5",
                        borderRadius: "4px",
                      },
                      "&::-webkit-scrollbar-thumb": {
                        background: "#d8b4b4",
                        borderRadius: "4px",
                        "&:hover": {
                          background: "#c9a0a0",
                        }
                      }
                    }
                  }
                },
                renderValue: (selected) => {
                  if (!selected) {
                    return (
                      <Typography color="#94a3b8" fontSize="14px">
                        Seleccionar categoría
                      </Typography>
                    );
                  }
                  const categoria = categorias.find(c => c.id === Number(selected));
                  return categoria?.nombre || categoria?.nombreCategoria || `Categoría ${selected}`;
                }
              }}
            >
              <MenuItem value="" sx={getMenuItemStyles(false)}>
                <Typography color="#94a3b8" fontSize="14px">
                  -- Seleccionar --
                </Typography>
              </MenuItem>
              {categorias.map((cat) => (
                <MenuItem 
                  key={cat.id} 
                  value={cat.id}
                  sx={getMenuItemStyles(form.categoriaId === String(cat.id))}
                >
                  <Box sx={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "space-between", 
                    width: "100%" 
                  }}>
                    <Typography variant="body2">
                      {cat.nombre || cat.nombreCategoria || `Cat ${cat.id}`}
                    </Typography>
                    {form.categoriaId === String(cat.id) && (
                      <Check size={16} />
                    )}
                  </Box>
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* COMBO MEJORADO: Modelo */}
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Modelo *"
              name="modeloId"
              value={form.modeloId}
              onChange={handleChange}
              fullWidth
              size="small"
              error={!!errors.modeloId}
              helperText={errors.modeloId}
              sx={comboStyles}
              SelectProps={{
                displayEmpty: true,
                MenuProps: {
                  PaperProps: {
                    sx: {
                      borderRadius: "8px",
                      marginTop: "6px",
                      boxShadow: "0 10px 40px rgba(89,43,43,0.08)",
                      maxHeight: "300px",
                      "&::-webkit-scrollbar": {
                        width: "8px",
                      },
                      "&::-webkit-scrollbar-track": {
                        background: "#fdf5f5",
                        borderRadius: "4px",
                      },
                      "&::-webkit-scrollbar-thumb": {
                        background: "#d8b4b4",
                        borderRadius: "4px",
                        "&:hover": {
                          background: "#c9a0a0",
                        }
                      }
                    }
                  }
                },
                renderValue: (selected) => {
                  if (!selected) {
                    return (
                      <Typography color="#94a3b8" fontSize="14px">
                        Seleccionar modelo
                      </Typography>
                    );
                  }
                  const modelo = modelos.find(m => m.id === Number(selected));
                  return modelo?.nombreModelo || modelo?.nombre || `Modelo ${selected}`;
                }
              }}
            >
              <MenuItem value="" sx={getMenuItemStyles(false)}>
                <Typography color="#94a3b8" fontSize="14px">
                  -- Seleccionar --
                </Typography>
              </MenuItem>
              {modelos.map((m) => (
                <MenuItem 
                  key={m.id} 
                  value={m.id}
                  sx={getMenuItemStyles(form.modeloId === String(m.id))}
                >
                  <Box sx={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "space-between", 
                    width: "100%" 
                  }}>
                    <Typography variant="body2">
                      {m.nombreModelo || m.nombre || `Modelo ${m.id}`}
                    </Typography>
                    {form.modeloId === String(m.id) && (
                      <Check size={16} />
                    )}
                  </Box>
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* COMBO MEJORADO: Importación */}
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Importación"
              name="importacionId"
              value={form.importacionId}
              onChange={handleChange}
              fullWidth
              size="small"
              sx={comboStyles}
              SelectProps={{
                displayEmpty: true,
                MenuProps: {
                  PaperProps: {
                    sx: {
                      borderRadius: "8px",
                      marginTop: "6px",
                      boxShadow: "0 10px 40px rgba(89,43,43,0.08)",
                      maxHeight: "300px",
                      "&::-webkit-scrollbar": {
                        width: "8px",
                      },
                      "&::-webkit-scrollbar-track": {
                        background: "#fdf5f5",
                        borderRadius: "4px",
                      },
                      "&::-webkit-scrollbar-thumb": {
                        background: "#d8b4b4",
                        borderRadius: "4px",
                        "&:hover": {
                          background: "#c9a0a0",
                        }
                      }
                    }
                  }
                },
                renderValue: (selected) => {
                  if (!selected) {
                    return (
                      <Typography color="#94a3b8" fontSize="14px">
                        Seleccionar importación
                      </Typography>
                    );
                  }
                  const importacion = importaciones.find(i => i.id === Number(selected));
                  return importacion?.codigo || importacion?.codigoImportacion || `IMP-${selected}`;
                }
              }}
            >
              <MenuItem value="" sx={getMenuItemStyles(false)}>
                <Typography color="#94a3b8" fontSize="14px">
                  -- Seleccionar --
                </Typography>
              </MenuItem>
              {importaciones.map((imp) => (
                <MenuItem 
                  key={imp.id} 
                  value={imp.id}
                  sx={getMenuItemStyles(form.importacionId === String(imp.id))}
                >
                  <Box sx={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "space-between", 
                    width: "100%" 
                  }}>
                    <Typography variant="body2">
                      {imp.codigo || imp.codigoImportacion || `IMP-${imp.id}`}
                    </Typography>
                    {form.importacionId === String(imp.id) && (
                      <Check size={16} />
                    )}
                  </Box>
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* COMBO MEJORADO: Observado */}
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Observado *"
              name="observado"
              value={form.observado}
              onChange={handleChange}
              fullWidth
              size="small"
              error={!!errors.observado}
              helperText={errors.observado}
              sx={comboStyles}
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    sx: {
                      borderRadius: "8px",
                      marginTop: "6px",
                      boxShadow: "0 10px 40px rgba(89,43,43,0.08)",
                    }
                  }
                },
                renderValue: (selected) => {
                  return selected === "2" ? "Sí" : "No";
                }
              }}
            >
              <MenuItem value="1" sx={getMenuItemStyles(form.observado === "1")}>
                <Box sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between", 
                  width: "100%" 
                }}>
                  <Typography variant="body2">No</Typography>
                  {form.observado === "1" && <Check size={16} />}
                </Box>
              </MenuItem>
              <MenuItem value="2" sx={getMenuItemStyles(form.observado === "2")}>
                <Box sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between", 
                  width: "100%" 
                }}>
                  <Typography variant="body2">Sí</Typography>
                  {form.observado === "2" && <Check size={16} />}
                </Box>
              </MenuItem>
            </TextField>
          </Grid>

          {/* Campo de observación */}
          <Grid item xs={12}>
            <TextField
              label="Detalle observación"
              name="obsDescripcion"
              value={form.obsDescripcion}
              onChange={handleChange}
              fullWidth
              size="small"
              multiline
              minRows={2}
              error={!!errors.obsDescripcion}
              helperText={errors.obsDescripcion}
              disabled={form.observado === "1"}
              sx={{
                ...inputStyles,
                "& .Mui-disabled": {
                  backgroundColor: "#fdf5f5",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#e2e8f0",
                  }
                },
              }}
            />
          </Grid>

          {/* Estado del producto */}
          <Grid item xs={12}>
            <Card variant="outlined" sx={{ mt: 1, borderColor: "#f1d2d2", bgcolor: "white" }}>
              <CardContent sx={{ py: 1.5, display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ 
                  width: 36, 
                  height: 36, 
                  borderRadius: "50%", 
                  bgcolor: "#592B2B15", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  color: "#592B2B" 
                }}>
                  <BarChart3 size={18} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#3A1A1A" }}>
                    Estado del Producto
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {form.estado === "1" ? "Disponible" : "No disponible"}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ 
        p: 2.5, 
        px: 3, 
        bgcolor: "#fdf5f5",
        borderTop: "1px solid #f1d2d2"
      }}>
        <Button 
          onClick={onClose} 
          variant="outlined"
          sx={cancelButtonStyles}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          sx={saveButtonStyles}
        >
          {initialData ? "Actualizar" : "Guardar Producto"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductoForm;