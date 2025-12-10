import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Button,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  IconButton,
  Divider,
  Card,
  CardContent,
} from "@mui/material";
import { X, Check, Truck, Calendar, User, Briefcase } from "lucide-react";
import ServiceImportacion from "@/services/ServiceImportacion";
import ServiceProveedor from "@/services/ServiceProveedor";
import ServiceEmpleado from "@/services/ServiceEmpleado";

export default function ImportacionForm({
  open,
  onClose,
  initialData = null,
  onSuccess,
}) {
  const [form, setForm] = useState({
    codigo: "",
    proveedorId: "",
    fechaLlegada: "",
    descripcion: "",
    idEmpleadoAsignado: "",
  });

  const [proveedores, setProveedores] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // Cargar proveedores
  useEffect(() => {
    (async () => {
      try {
        const res = await ServiceProveedor.getAll();
        const provs = Array.isArray(res) ? res : res.items || [];
        setProveedores(provs);
      } catch (e) {
        console.error("Error cargando proveedores:", e);
      }
    })();
  }, []);

  // Cargar empleados (solo rol pilotero)
  useEffect(() => {
    (async () => {
      try {
        const res = await ServiceEmpleado.getAll();
        const emps = Array.isArray(res) ? res : res.items || [];

        const piloteros = emps.filter((emp) => {
          const rawRol = (
            emp.rol ??
            emp.role ??
            emp.nombreRol ??
            emp.rolNombre ??
            emp.tipoRol ??
            emp.perfil?.rol ??
            emp.perfil?.nombre ??
            ""
          )
            .toString()
            .trim()
            .toLowerCase();

          return rawRol.includes("pilotero");
        });

        setEmpleados(piloteros);
      } catch (e) {
        console.error("Error cargando empleados:", e);
      }
    })();
  }, []);

  // Cargar datos en edición
  useEffect(() => {
    setForm({
      codigo: initialData?.codigo || "",
      proveedorId: initialData?.proveedorId || "",
      fechaLlegada: initialData?.fechaLlegada?.slice?.(0, 10) || "",
      descripcion: initialData?.descripcion || "",
      idEmpleadoAsignado: initialData?.idEmpleadoAsignado || "",
    });
    setErr("");
  }, [initialData]);

  const handle = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const esFechaPosteriorAHoy = (fechaStr) => {
    if (!fechaStr) return false;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fecha = new Date(fechaStr);
    fecha.setHours(0, 0, 0, 0);
    return fecha > hoy;
  };

  const submit = async () => {
    setErr("");

    const proveedorIdNum = parseInt(form.proveedorId, 10);
    if (!form.codigo?.trim()) return setErr("El código es obligatorio");
    if (!Number.isFinite(proveedorIdNum))
      return setErr("Seleccione un proveedor válido");
    if (!form.fechaLlegada)
      return setErr("La fecha de llegada es obligatoria");
    if (!esFechaPosteriorAHoy(form.fechaLlegada)) {
      return setErr("La fecha de llegada debe ser posterior a la fecha de hoy.");
    }
    if (!form.idEmpleadoAsignado) {
      return setErr("Debe seleccionar el empleado asignado a la importación.");
    }

    const payload = {
      codigo: form.codigo.trim(),
      proveedorId: Number(form.proveedorId),
      fechaLlegada: form.fechaLlegada,
      descripcion: form.descripcion?.trim() || null,
      idEmpleadoAsignado: Number(form.idEmpleadoAsignado),
    };

    setLoading(true);
    try {
      const data = initialData?.id
        ? await ServiceImportacion.update(initialData.id, payload)
        : await ServiceImportacion.create(payload);

      onSuccess?.(data);
      if (!initialData)
        toast.success("Importación registrada correctamente");
      return data;
    } catch (e) {
      console.error("Error guardando importación:", e);
      setErr(e.message || "Error guardando importación");
    } finally {
      setLoading(false);
    }
  };

  // CI + nombre para mostrar en el combo
  const renderEmpleadoLabel = (emp) => {
    const ci =
      emp.ci ?? emp.ciNit ?? emp.documento ?? emp.numeroDocumento ?? "";
    const nombreCompleto =
      emp.nombre ??
      [emp.nombres, emp.apellidos].filter(Boolean).join(" ") ??
      "";
    if (ci && nombreCompleto) return `${ci} - ${nombreCompleto}`;
    if (nombreCompleto) return nombreCompleto;
    return `ID ${emp.id}`;
  };

  // Estilos consistentes
  const dialogPaperStyles = {
    borderRadius: "12px",
    overflow: "hidden",
  };

  const dialogTitleStyles = {
    bgcolor: "#592B2B",
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
          borderColor: "#a66",
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
    "& .MuiInputBase-input": {
      padding: "12px 14px",
      fontSize: "14px",
    },
    "& .Mui-disabled": {
      backgroundColor: "#fdf5f5",
    }
  };

  const selectStyles = {
    ...inputStyles,
    "& .MuiSelect-select": {
      padding: "12px 14px",
      minHeight: "auto",
      display: "flex",
      alignItems: "center",
    },
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
      backgroundColor: selected ? "#3A1A1A !important" : "#fdf5f5",
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
      open={open}
      onClose={onClose}
      maxWidth="md"
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
            <Truck size={20} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {initialData ? "Editar Importación" : "Nueva Importación"}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {initialData ? "Modifica los datos de la importación" : "Registra una nueva importación"}
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
        {/* Header informativo */}
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
              <Calendar size={22} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#3A1A1A" }}>
                Información de Importación
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                Complete todos los campos requeridos para {initialData ? "actualizar" : "registrar"} la importación
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Grid container spacing={2}>
          {/* CÓDIGO */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Código *"
              fullWidth
              required
              value={form.codigo}
              onChange={(e) => handle("codigo", e.target.value)}
              disabled={loading || !!initialData}
              sx={inputStyles}
              InputProps={{
                startAdornment: (
                  <Box sx={{ display: "flex", alignItems: "center", mr: 1, color: "#592B2B" }}>
                    <Briefcase size={16} />
                  </Box>
                ),
              }}
            />
          </Grid>

          {/* PROVEEDOR */}
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth required disabled={loading} sx={selectStyles}>
              <InputLabel id="proveedor-label">Proveedor *</InputLabel>
              <Select
                labelId="proveedor-label"
                label="Proveedor *"
                value={form.proveedorId ?? ""}
                onChange={(e) => handle("proveedorId", e.target.value)}
                MenuProps={{
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
                }}
                renderValue={(selected) => {
                  if (!selected) {
                    return (
                      <Typography color="#94a3b8" fontSize="14px">
                        Seleccionar proveedor
                      </Typography>
                    );
                  }
                  const proveedor = proveedores.find(p => p.id === Number(selected));
                  return proveedor?.razonSocial || `Proveedor ${selected}`;
                }}
              >
                <MenuItem value="" sx={getMenuItemStyles(false)}>
                  <Typography color="#94a3b8" fontSize="14px">
                    -- Seleccionar --
                  </Typography>
                </MenuItem>
                {proveedores.map((p) => (
                  <MenuItem 
                    key={p.id} 
                    value={p.id}
                    sx={getMenuItemStyles(form.proveedorId === String(p.id))}
                  >
                    <Box sx={{ 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "space-between", 
                      width: "100%" 
                    }}>
                      <Typography variant="body2">
                        {p.razonSocial}
                      </Typography>
                      {form.proveedorId === String(p.id) && (
                        <Check size={16} />
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* FECHA LLEGADA */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Fecha de llegada *"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={form.fechaLlegada || ""}
              onChange={(e) => handle("fechaLlegada", e.target.value)}
              disabled={loading}
              sx={inputStyles}
              inputProps={{
                min: new Date().toISOString().slice(0, 10),
              }}
              InputProps={{
                startAdornment: (
                  <Box sx={{ display: "flex", alignItems: "center", mr: 1, color: "#592B2B" }}>
                    <Calendar size={16} />
                  </Box>
                ),
              }}
            />
          </Grid>

          {/* EMPLEADO ASIGNADO (solo piloteros) */}
          <Grid item xs={12} sm={6} md={6}>
            <FormControl fullWidth required disabled={loading} sx={selectStyles}>
              <InputLabel id="empleado-asignado-label">
                Empleado asignado (Pilotero) *
              </InputLabel>
              <Select
                labelId="empleado-asignado-label"
                label="Empleado asignado (Pilotero) *"
                value={form.idEmpleadoAsignado ?? ""}
                onChange={(e) => handle("idEmpleadoAsignado", e.target.value)}
                MenuProps={{
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
                }}
                renderValue={(selected) => {
                  if (!selected) {
                    return (
                      <Typography color="#94a3b8" fontSize="14px">
                        Seleccionar empleado
                      </Typography>
                    );
                  }
                  const empleado = empleados.find(e => e.id === Number(selected));
                  return empleado ? renderEmpleadoLabel(empleado) : `ID ${selected}`;
                }}
              >
                <MenuItem value="" sx={getMenuItemStyles(false)}>
                  <Typography color="#94a3b8" fontSize="14px">
                    -- Seleccionar --
                  </Typography>
                </MenuItem>
                {empleados.map((emp) => (
                  <MenuItem 
                    key={emp.id} 
                    value={emp.id}
                    sx={getMenuItemStyles(form.idEmpleadoAsignado === String(emp.id))}
                  >
                    <Box sx={{ 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "space-between", 
                      width: "100%" 
                    }}>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {renderEmpleadoLabel(emp)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {emp.rol || emp.role || "Pilotero"}
                        </Typography>
                      </Box>
                      {form.idEmpleadoAsignado === String(emp.id) && (
                        <Check size={16} />
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* DESCRIPCIÓN */}
          <Grid item xs={12}>
            <TextField
              label="Descripción"
              fullWidth
              multiline
              rows={3}
              value={form.descripcion}
              onChange={(e) => handle("descripcion", e.target.value)}
              disabled={loading}
              sx={{
                ...inputStyles,
                "& .MuiOutlinedInput-root": {
                  alignItems: "flex-start",
                }
              }}
              InputProps={{
                startAdornment: (
                  <Box sx={{ 
                    display: "flex", 
                    alignItems: "flex-start", 
                    mt: 1.5, 
                    mr: 1, 
                    color: "#592B2B" 
                  }}>
                    <User size={16} />
                  </Box>
                ),
              }}
            />
          </Grid>
        </Grid>

        {err && (
          <Alert 
            severity="error" 
            sx={{ 
              mt: 3, 
              whiteSpace: "pre-wrap",
              borderRadius: "8px",
              border: "1px solid #f1d2d2"
            }}
          >
            {err}
          </Alert>
        )}
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
          disabled={loading}
          sx={cancelButtonStyles}
        >
          Cancelar
        </Button>
        <Button
          onClick={submit}
          variant="contained"
          disabled={loading}
          sx={saveButtonStyles}
        >
          {loading ? "Guardando..." : (initialData ? "Actualizar" : "Guardar")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}