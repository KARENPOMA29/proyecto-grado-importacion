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
} from "@mui/material";
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
  const [empleados, setEmpleados] = useState([]); // solo piloteros
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // cargar proveedores
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

  // cargar empleados (solo rol pilotero)
  useEffect(() => {
    (async () => {
      try {
        const res = await ServiceEmpleado.getAll();
        const emps = Array.isArray(res) ? res : res.items || [];

        console.log("👀 Empleados recibidos:", emps);

        const piloteros = emps.filter((emp) => {
          const rawRol =
            (
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

        console.log("✅ Empleados filtrados (pilotero):", piloteros);
        setEmpleados(piloteros);
      } catch (e) {
        console.error("Error cargando empleados:", e);
      }
    })();
  }, []);

  // cargar datos en edición
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: "visible",
        },
      }}
    >
      <DialogTitle
        sx={{ borderBottom: "1px solid", borderColor: "divider", pb: 2 }}
      >
        <Typography variant="h6" fontWeight={600}>
          {initialData ? "Editar Importación" : "Nueva Importación"}
        </Typography>
      </DialogTitle>

      <DialogContent
        sx={{
          py: 3,
          overflow: "visible",
          maxHeight: "70vh",
        }}
      >
        <Grid container spacing={2}>
          {/* CÓDIGO */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Código"
              fullWidth
              required
              value={form.codigo}
              onChange={(e) => handle("codigo", e.target.value)}
              disabled={loading || !!initialData}
            />
          </Grid>

          {/* PROVEEDOR */}
          <Grid item xs={12} sm={6} md={4}>
            <FormControl
              fullWidth
              required
              disabled={loading}
              sx={{
                overflow: "visible",
                "& .MuiInputBase-root": { minHeight: 56 }, // combo más grande
              }}
            >
              <InputLabel id="proveedor-label">Proveedor</InputLabel>
              <Select
                labelId="proveedor-label"
                label="Proveedor"
                value={form.proveedorId ?? ""}
                onChange={(e) => handle("proveedorId", e.target.value)}
                MenuProps={{
                  sx: {
                    zIndex: 2000,
                  },
                }}
                sx={{
                  "& .MuiSelect-select": {
                    py: 1.5, // más alto
                  },
                }}
              >
                {proveedores.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.razonSocial}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* FECHA LLEGADA */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Fecha de llegada"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={form.fechaLlegada || ""}
              onChange={(e) => handle("fechaLlegada", e.target.value)}
              disabled={loading}
              inputProps={{
                min: new Date().toISOString().slice(0, 10),
              }}
            />
          </Grid>

          {/* EMPLEADO ASIGNADO (solo piloteros) */}
          <Grid item xs={12} sm={6} md={6}>
            <FormControl
              fullWidth
              required
              disabled={loading}
              sx={{
                overflow: "visible",
                "& .MuiInputBase-root": { minHeight: 56 }, // combo más grande
              }}
            >
              <InputLabel id="empleado-asignado-label">
                Empleado asignado (Pilotero)
              </InputLabel>
              <Select
                labelId="empleado-asignado-label"
                label="Empleado asignado (Pilotero)"
                value={form.idEmpleadoAsignado ?? ""}
                onChange={(e) =>
                  handle("idEmpleadoAsignado", e.target.value)
                }
                MenuProps={{
                  sx: {
                    zIndex: 2000,
                  },
                }}
                sx={{
                  "& .MuiSelect-select": {
                    py: 1.5,
                  },
                }}
              >
                {empleados.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {renderEmpleadoLabel(emp)}
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
            />
          </Grid>
        </Grid>

        {err && (
          <Alert severity="error" sx={{ mt: 3, whiteSpace: "pre-wrap" }}>
            {err}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={submit}
          variant="contained"
          disabled={loading}
          sx={{ minWidth: 120 }}
        >
          {loading ? "Guardando..." : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
