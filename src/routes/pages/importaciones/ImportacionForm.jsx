// src/pages/importaciones/ImportacionForm.jsx
import { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Grid, Button, Typography, Alert, FormControl,
  InputLabel, Select, MenuItem
} from "@mui/material";
import ServiceImportacion from "@/services/ServiceImportacion";
import ServiceProveedor from "@/services/ServiceProveedor";

const ESTADOS = ["En tránsito", "En aduana", "Entregado"];

export default function ImportacionForm({ open, onClose, initialData = null, onSuccess }) {
  const [form, setForm] = useState({
    codigo: "",
    proveedorId: "",
    fechaLlegada: "",
    estado: "En tránsito",
    observaciones: "",
    empleadoId: "", // obligatorio en create
  });
  const [proveedores, setProveedores] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // Cargar proveedores
  useEffect(() => {
    (async () => {
      try {
        const res = await ServiceProveedor.getAll();
        const provs = Array.isArray(res) ? res : (res.items || []);
        setProveedores(provs);
      } catch (e) {
        console.error("Error cargando proveedores:", e);
      }
    })();
  }, []);

  // Cargar datos en edición
  useEffect(() => {
    setForm({
      codigo:        initialData?.codigo || "",
      proveedorId:   initialData?.proveedorId || "",
      fechaLlegada:  initialData?.fechaLlegada?.slice?.(0,10) || "",
      estado:        initialData?.estado || "En tránsito",
      observaciones: initialData?.observaciones || "",
      empleadoId:    initialData?.empleadoId || "",  // si lo traes
    });
    setErr("");
  }, [initialData]);

  const handle = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    setErr("");

    const proveedorIdNum = parseInt(form.proveedorId, 10);
    if (!form.codigo?.trim()) return setErr("El código es obligatorio");
    if (!Number.isFinite(proveedorIdNum)) return setErr("Seleccione un proveedor válido");
    if (!form.fechaLlegada) return setErr("La fecha de llegada es obligatoria");

    const payload = {
      codigo: form.codigo.trim(),
      proveedorId: Number(form.proveedorId),
      fechaLlegada: form.fechaLlegada,
      estado: form.estado,
      observaciones: form.observaciones?.trim() || null,
      empleadoId: Number(form.empleadoId),
    };

    setLoading(true);
    try {
      const data = initialData?.id
        ? await ServiceImportacion.update(initialData.id, payload) // ojo: backend no deja cambiar todo
        : await ServiceImportacion.create(payload);

      onSuccess?.(data);
      onClose?.();
    } catch (e) {
      setErr(e.message || "Error guardando importación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle component="div">
        <Typography variant="h6" component="span" fontWeight={600}>
          {initialData ? "Editar Importación" : "Nueva Importación"}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Grid container spacing={2}>
          {/* CÓDIGO */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Código"
              fullWidth
              required
              value={form.codigo}
              onChange={(e) => handle("codigo", e.target.value)}
              disabled={loading || !!initialData}  // si no quieres que se edite
            />
          </Grid>

          {/* PROVEEDOR */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required disabled={loading}>
              <InputLabel id="proveedor-label">Proveedor</InputLabel>
              <Select
                labelId="proveedor-label"
                label="Proveedor"
                value={form.proveedorId ?? ""}
                onChange={(e) => handle("proveedorId", e.target.value)}
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
          <Grid item xs={12} md={6}>
            <TextField
              label="Fecha de llegada"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={form.fechaLlegada || ""}
              onChange={(e) => handle("fechaLlegada", e.target.value)}
              disabled={loading}
            />
          </Grid>

          {/* ESTADO */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth disabled={loading}>
              <InputLabel id="estado-label">Estado</InputLabel>
              <Select
                labelId="estado-label"
                label="Estado"
                value={form.estado}
                onChange={(e) => handle("estado", e.target.value)}
              >
                {ESTADOS.map((st) => (
                  <MenuItem key={st} value={st}>
                    {st}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          

          {/* OBSERVACIONES */}
          <Grid item xs={12}>
            <TextField
              label="Observaciones"
              fullWidth
              multiline
              rows={3}
              value={form.observaciones}
              onChange={(e) => handle("observaciones", e.target.value)}
              disabled={loading}
            />
          </Grid>
        </Grid>

        {err && (
          <Alert severity="error" sx={{ mt: 2, whiteSpace: "pre-wrap" }}>
            {err}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button variant="outlined" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={submit} disabled={loading}>
          {loading ? "Guardando..." : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
