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
  MenuItem,
  Box,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Plus } from "lucide-react";

import ServiceImportacion from "@/services/ServiceImportacion";
import ServiceProveedor from "@/services/ServiceProveedor";
import ServiceEmpleado from "@/services/ServiceEmpleado";

import ProveedorForm from "@/routes/pages/proveedor/proveedorForm";
import EmpleadoForm from "@/routes/pages/empleado/EmpleadoForm";

const todayLocalISO = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};
const tomorrowLocalISO = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
};
const parseLocalDate = (value) => {
  if (!value) return null;
  const [yyyy, mm, dd] = value.slice(0, 10).split("-").map(Number);
  return new Date(yyyy, mm - 1, dd);
};

export default function ImportacionForm({
  open = true,
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
  const [touched, setTouched] = useState({});

  const [showProveedorForm, setShowProveedorForm] = useState(false);
  const [showEmpleadoForm, setShowEmpleadoForm] = useState(false);

  const fetchProveedores = async () => {
    try {
      const res = await ServiceProveedor.getAll();
      setProveedores(Array.isArray(res) ? res : res.items || []);
    } catch {
      toast.error("Error al cargar proveedores");
    }
  };

  const fetchEmpleados = async () => {
    try {
      const res = await ServiceEmpleado.getAll({
        page: 1,
        pageSize: 1000,
      });

      const emps = res.items || [];

      const piloteros = emps.filter((emp) => {
        const rol = (
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

        return rol.includes("pilotero");
      });

      setEmpleados(piloteros);
    } catch {
      toast.error("Error al cargar empleados");
    }
  };

  useEffect(() => {
    fetchProveedores();
    fetchEmpleados();
  }, []);

  useEffect(() => {
    setForm({
      codigo: initialData?.codigo || "",
      proveedorId: initialData?.proveedorId ?? "",
      fechaLlegada: initialData?.fechaLlegada?.slice?.(0, 10) || "",
      descripcion: initialData?.descripcion || "",
      idEmpleadoAsignado: initialData?.idEmpleadoAsignado ?? "",
    });

    setErr("");
    setTouched({});
  }, [initialData]);

  const handle = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const esFechaPosteriorAHoy = (fechaStr) => {
    const hoy = parseLocalDate(todayLocalISO());
    const fecha = parseLocalDate(fechaStr);
    if (!fecha || !hoy) return false;
    return fecha > hoy;
  };

  const renderEmpleadoLabel = (emp) => {
    const ci = emp.ci ?? emp.ciNit ?? emp.documento ?? emp.numeroDocumento ?? "";

    const nombreCompleto = `${emp.nombre || emp.nombres || ""} ${
      emp.apellido || emp.apellidos || ""
    }`.trim();

    if (ci && nombreCompleto) return `${ci} - ${nombreCompleto}`;
    if (nombreCompleto) return nombreCompleto;
    return `ID ${emp.id}`;
  };

  const validate = () => {
    if (!form.codigo.trim()) {
      setErr("El código es obligatorio.");
      return false;
    }

    if (!form.proveedorId) {
      setErr("Seleccione un proveedor.");
      return false;
    }

    if (!form.fechaLlegada) {
      setErr("La fecha de llegada es obligatoria.");
      return false;
    }

    if (!esFechaPosteriorAHoy(form.fechaLlegada)) {
      setErr("La fecha de llegada debe ser posterior a la fecha de hoy.");
      return false;
    }

    if (!form.idEmpleadoAsignado) {
      setErr("Seleccione el empleado asignado.");
      return false;
    }

    return true;
  };

  const submit = async (e) => {
    if (e) e.preventDefault();

    setErr("");
    setTouched({
      codigo: true,
      proveedorId: true,
      fechaLlegada: true,
      idEmpleadoAsignado: true,
    });

    if (!validate()) return;

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

      toast.success(
        initialData
          ? "Importación actualizada correctamente"
          : "Importación registrada correctamente"
      );

      onSuccess?.(data);
      onClose?.();
    } catch (e) {
      const msg = e.message || "Error al guardar la importación";
      setErr(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: "0 12px 36px rgba(0,0,0,0.18)",
          },
        }}
      >
        <DialogTitle
          sx={{
            p: 2.5,
            pb: 2,
            background: "linear-gradient(135deg, #592B2B 0%, #3A1A1A 100%)",
            color: "#F5F5F5",
          }}
        >
          <Typography variant="h6" fontWeight={700}>
            {initialData ? "Editar Importación" : "Nueva Importación"}
          </Typography>

          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            Registra la información de llegada, proveedor y empleado asignado.
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ py: 3, px: 3, bgcolor: "#FAFAFA" }}>
          <Box
            component="form"
            onSubmit={submit}
            noValidate
            sx={{
              bgcolor: "#FFFFFF",
              borderRadius: 2,
              p: 2.5,
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Código"
                  value={form.codigo}
                  onChange={(e) => handle("codigo", e.target.value)}
                  required
                  disabled={loading || !!initialData}
                  error={touched.codigo && !form.codigo.trim()}
                  helperText={
                    touched.codigo && !form.codigo.trim()
                      ? "Campo requerido"
                      : "Obligatorio"
                  }
                />
              </Grid>

              <Grid size={{ xs: 10, sm: 5 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Proveedor"
                  value={form.proveedorId}
                  onChange={(e) => handle("proveedorId", e.target.value)}
                  required
                  disabled={loading}
                  error={touched.proveedorId && !form.proveedorId}
                  helperText={
                    touched.proveedorId && !form.proveedorId
                      ? "Seleccione un proveedor"
                      : "Obligatorio"
                  }
                >
                  <MenuItem value="">Seleccione un proveedor</MenuItem>
                  {proveedores.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.razonSocial}
                      {p.encargado ? ` - ${p.encargado}` : ""}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid
                size={{ xs: 2, sm: 1 }}
                sx={{ display: "flex", alignItems: "flex-start" }}
              >
                <Tooltip title="Agregar proveedor">
                  <span>
                    <IconButton
                      onClick={() => setShowProveedorForm(true)}
                      disabled={loading}
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        border: "1px solid #C9B3B3",
                        bgcolor: "#FFFFFF",
                        "&:hover": {
                          bgcolor: "#F8F1F1",
                          borderColor: "#592B2B",
                          transform: "scale(1.03)",
                        },
                        transition: "all 0.2s ease",
                      }}
                    >
                      <Plus size={18} color="#592B2B" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  value={form.fechaLlegada}
                  onChange={(e) => handle("fechaLlegada", e.target.value)}
                  required
                  disabled={loading}
                  inputProps={{
                    min: tomorrowLocalISO(),
                    "aria-label": "Fecha de llegada",
                  }}
                  error={
                    touched.fechaLlegada &&
                    (!form.fechaLlegada || !esFechaPosteriorAHoy(form.fechaLlegada))
                  }
                  helperText="Fecha de llegada · Debe ser posterior a hoy"
                  sx={{
                    "& .MuiInputBase-root": {
                      height: 50,
                      backgroundColor: "#FFFFFF",
                    },
                    "& input": {
                      fontSize: "1rem",
                      color: "#6B7280",
                    },
                    "& input:valid": {
                      color: "#1F2937",
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 10, sm: 5 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Empleado asignado"
                  value={form.idEmpleadoAsignado}
                  onChange={(e) => handle("idEmpleadoAsignado", e.target.value)}
                  required
                  disabled={loading}
                  error={touched.idEmpleadoAsignado && !form.idEmpleadoAsignado}
                  helperText={
                    touched.idEmpleadoAsignado && !form.idEmpleadoAsignado
                      ? "Seleccione un empleado"
                      : "Obligatorio"
                  }
                >
                  <MenuItem value="">Seleccione un empleado</MenuItem>
                  {empleados.map((emp) => (
                    <MenuItem key={emp.id} value={emp.id}>
                      {renderEmpleadoLabel(emp)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid
                size={{ xs: 2, sm: 1 }}
                sx={{ display: "flex", alignItems: "flex-start" }}
              >
                <Tooltip title="Agregar empleado">
                  <span>
                    <IconButton
                      onClick={() => setShowEmpleadoForm(true)}
                      disabled={loading}
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        border: "1px solid #C9B3B3",
                        bgcolor: "#FFFFFF",
                        "&:hover": {
                          bgcolor: "#F8F1F1",
                          borderColor: "#592B2B",
                          transform: "scale(1.03)",
                        },
                        transition: "all 0.2s ease",
                      }}
                    >
                      <Plus size={18} color="#592B2B" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Descripción"
                  multiline
                  rows={3}
                  value={form.descripcion}
                  onChange={(e) => handle("descripcion", e.target.value)}
                  disabled={loading}
                  helperText="Opcional"
                />
              </Grid>
            </Grid>

            {err && (
              <Alert severity="error" sx={{ mt: 3 }}>
                {err}
              </Alert>
            )}
          </Box>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2.5, gap: 1.5 }}>
          <Button
            onClick={onClose}
            variant="outlined"
            disabled={loading}
            sx={{
              textTransform: "none",
              borderRadius: 999,
              px: 3,
              borderColor: "#e0e0e0",
              color: "rgba(0,0,0,0.7)",
              "&:hover": {
                borderColor: "#d32f2f",
                color: "#d32f2f",
                backgroundColor: "rgba(211,47,47,0.04)",
              },
            }}
          >
            Cancelar
          </Button>

          <Button
            onClick={submit}
            variant="contained"
            disabled={loading}
            sx={{
              textTransform: "none",
              borderRadius: 999,
              px: 4,
              minWidth: 140,
              fontWeight: 600,
              background:
                "linear-gradient(135deg, #14AE5C 0%, #0D8C47 100%)",
              "&:hover": {
                background:
                  "linear-gradient(135deg, #0D8C47 0%, #0A6B37 100%)",
                boxShadow: "0 4px 12px rgba(20,174,92,0.4)",
              },
            }}
          >
            {loading ? "Guardando..." : initialData ? "Actualizar" : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {showProveedorForm && (
        <ProveedorForm
          onClose={() => setShowProveedorForm(false)}
          onSuccess={async () => {
            setShowProveedorForm(false);
            await fetchProveedores();
          }}
        />
      )}

      {showEmpleadoForm && (
        <EmpleadoForm
          onClose={() => setShowEmpleadoForm(false)}
          onSuccess={async () => {
            setShowEmpleadoForm(false);
            await fetchEmpleados();
          }}
        />
      )}
    </>
  );
}