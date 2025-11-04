import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  Grid,
  Autocomplete,
  Chip,
  Card,
  CardContent
} from "@mui/material";
import ServiceEmpleado from "@/services/ServiceEmpleado";
import "./EmpleadoFormMod.css";

const FORM_ID = "empleado-form";

const EmpleadoForm = ({ onClose, onSuccess, initialData = null }) => {
  const isEdit = Boolean(initialData?.id);

  const [form, setForm] = useState({
    nombre: initialData?.nombre || "",
    apellido: initialData?.apellido || "",
    segundoApellido: initialData?.segundoApellido ?? "",
    ci: String(initialData?.ci ?? ""),
    telefono: String(initialData?.telefono ?? ""),
    rol: typeof initialData?.rol === "string" ? initialData.rol : (initialData?.rol?.value || ""),
    usuario: initialData?.usuario || "",
    contrasena: "",
    correo: initialData?.correo || "",
    urlImagen: initialData?.urlImagen ?? "",
  });

  const [formError, setFormError] = useState("");
  const [formTouched, setFormTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  const roles = useMemo(() => ["Administrador", "Ventas", "Almacen", "Pilotero"], []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormTouched(true);
  };

  useEffect(() => {
    if (!initialData) {
      const inicialApellido = String(form.apellido || "").charAt(0).toLowerCase();
      const ciNumeros = String(form.ci || "").replace(/\D/g, "");
      const nuevoUsuario = (inicialApellido && ciNumeros) ? `${inicialApellido}${ciNumeros}` : "";

      const inicialNombre = String(form.nombre || "").charAt(0).toLowerCase();
      const nuevaContrasena =
        ciNumeros && inicialNombre && inicialApellido
          ? `${ciNumeros}${inicialNombre}${inicialApellido}`
          : "";

      setForm((prev) => ({
        ...prev,
        usuario: nuevoUsuario || prev.usuario,
        contrasena: nuevaContrasena || prev.contrasena,
      }));
    }
  }, [form.nombre, form.apellido, form.ci, initialData]);

  const validateForm = () => {
    if (
      !form.nombre || !form.apellido || !form.ci || !form.telefono ||
      !form.rol || !form.usuario || (!initialData && !form.contrasena) || !form.correo
    ) {
      setFormError("Por favor complete todos los campos obligatorios");
      return false;
    }
    if (!/^\d{7,8}$/.test(String(form.ci))) {
      setFormError("El CI debe tener 7 u 8 dígitos");
      return false;
    }
    if (!/^\d{8}$/.test(String(form.telefono))) {
      setFormError("El teléfono debe tener 8 dígitos");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.correo)) {
      setFormError("Ingrese un correo electrónico válido (ej: usuario@dominio.com)");
      return false;
    }
    return true;
  };

  const buildSanitizedPayload = (isEdit) => {
    const ci = String(form.ci || "").replace(/\D/g, "");
    const telefono = String(form.telefono || "").replace(/\D/g, "");
    const rol = typeof form.rol === "string" ? form.rol : (form.rol?.value || "");

    const payload = {
      nombre: (form.nombre || "").trim(),
      apellido: (form.apellido || "").trim(),
      ci,
      telefono,
      rol,
      usuario: (form.usuario || "").trim(),
      correo: (form.correo || "").trim(),
    };

    if ((form.segundoApellido || "").trim()) payload.segundoApellido = form.segundoApellido.trim();
    if ((form.urlImagen || "").trim()) payload.urlImagen = form.urlImagen.trim();

    const pwd = (form.contrasena || "").trim();
    if (!isEdit && pwd) payload.contrasena = pwd;
    if (isEdit && pwd) payload.contrasena = pwd;

    return payload;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setFormError("");
    setFormTouched(true);

    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = buildSanitizedPayload(isEdit);

      if (isEdit) {
        await ServiceEmpleado.update(initialData.id, payload);
        toast.success("Empleado actualizado correctamente");
      } else {
        await ServiceEmpleado.create(payload);
        toast.success("Empleado creado correctamente");
      }

      onSuccess();
    } catch (err) {
      const detail = err.response?.data?.detail ?? err.response?.data ?? err.message;
      const toText = (d) =>
        Array.isArray(d)
          ? d.map(x => {
              const path = Array.isArray(x?.loc) ? x.loc.join('.') : '';
              const msg = x?.msg || x?.detail || JSON.stringify(x);
              return path ? `${path}: ${msg}` : msg;
            }).join(' | ')
          : (typeof d === 'object' ? (d?.detail || d?.message || JSON.stringify(d)) : String(d));
      const msg = toText(detail) || "Error al procesar el empleado";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={true} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{ className: "dialog-paper" }}
    >
      <DialogTitle className="dialog-title">
        <Box className="title-content">
          <Typography variant="h5" fontWeight={700} gutterBottom>
            {isEdit ? "Editar Empleado" : "Nuevo Empleado"}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              label={isEdit ? "Modo Edición" : "Modo Creación"} 
              color={isEdit ? "warning" : "success"}
              variant="filled"
              className="mode-chip"
            />
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Complete todos los campos obligatorios
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers className="dialog-content">
        <Box className="form-container">
          <Box id={FORM_ID} component="form" onSubmit={handleSubmit} noValidate>
            
            <Card className="section-card">
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom className="section-title">
                  Información Personal
                </Typography>
                <Grid container spacing={3} className="form-grid">
                  <Grid item xs={12} md={6}>
                    <TextField 
                      fullWidth 
                      label="Nombre" 
                      value={form.nombre}
                      onChange={(e) => handleChange("nombre", e.target.value)}
                      error={formTouched && !form.nombre}
                      helperText={formTouched && !form.nombre ? "Campo requerido" : ""}
                      required 
                      disabled={loading}
                      className="text-field"
                      size="medium"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField 
                      fullWidth 
                      label="Apellido" 
                      value={form.apellido}
                      onChange={(e) => handleChange("apellido", e.target.value)}
                      error={formTouched && !form.apellido}
                      helperText={formTouched && !form.apellido ? "Campo requerido" : ""}
                      required 
                      disabled={loading}
                      className="text-field"
                      size="medium"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField 
                      fullWidth 
                      label="Segundo Apellido" 
                      value={form.segundoApellido}
                      onChange={(e) => handleChange("segundoApellido", e.target.value)}
                      disabled={loading} 
                      helperText="Opcional" 
                      className="text-field"
                      size="medium"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField 
                      fullWidth 
                      label="Cédula de Identidad" 
                      value={form.ci}
                      onChange={(e) => handleChange("ci", e.target.value.replace(/\D/g, ""))}
                      error={formTouched && (!form.ci || !/^\d{7,8}$/.test(String(form.ci)))}
                      helperText={formTouched && (!form.ci || !/^\d{7,8}$/.test(String(form.ci))) ? "Debe tener 7 u 8 dígitos" : "Solo números"}
                      required 
                      disabled={loading} 
                      inputProps={{ maxLength: 8 }}
                      className="text-field"
                      size="medium"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card className="section-card">
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom className="section-title">
                  Contacto y Rol
                </Typography>
                <Grid container spacing={3} className="form-grid">
                  <Grid item xs={12} md={6}>
                    <TextField 
                      fullWidth 
                      label="Teléfono" 
                      value={form.telefono}
                      onChange={(e) => handleChange("telefono", e.target.value.replace(/\D/g, ""))}
                      error={formTouched && (!form.telefono || !/^\d{8}$/.test(String(form.telefono)))}
                      helperText={formTouched && (!form.telefono || !/^\d{8}$/.test(String(form.telefono))) ? "Debe tener 8 dígitos" : "Solo números"}
                      required 
                      disabled={loading} 
                      inputProps={{ maxLength: 8 }}
                      className="text-field"
                      size="medium"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      options={roles}
                      disablePortal
                      disableClearable
                      value={form.rol || roles[0]}
                      onChange={(_, newValue) => handleChange("rol", newValue || roles[0])}
                      isOptionEqualToValue={(option, value) => option === value}
                      getOptionLabel={(option) => option || ""}
                      className="autocomplete-container"
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Rol del Empleado"
                          required
                          error={formTouched && !form.rol}
                          helperText={formTouched && !form.rol ? "Campo requerido" : "Seleccione el rol correspondiente"}
                          className="text-field"
                          size="medium"
                        />
                      )}
                      disabled={loading}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField 
                      fullWidth 
                      type="email" 
                      label="Correo Electrónico"
                      value={form.correo}
                      onChange={(e) => handleChange("correo", e.target.value)}
                      error={formTouched && (!form.correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo))}
                      helperText={
                        formTouched && (!form.correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo))
                          ? "Ingrese un correo válido (ej: usuario@dominio.com)"
                          : "Dirección de correo institucional"
                      }
                      required 
                      disabled={loading}
                      className="text-field"
                      size="medium"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card className="section-card">
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom className="section-title">
                  Credenciales de Acceso
                </Typography>
                <Grid container spacing={3} className="form-grid">
                  <Grid item xs={12} md={6}>
                    <TextField 
                      fullWidth 
                      label="Usuario" 
                      value={form.usuario}
                      onChange={(e) => handleChange("usuario", e.target.value)}
                      error={formTouched && !form.usuario}
                      helperText={
                        formTouched && !form.usuario 
                          ? "Campo requerido" 
                          : isEdit 
                            ? "Usuario no editable en modificación" 
                            : "Generado automáticamente"
                      }
                      required 
                      disabled={loading || isEdit} 
                      InputProps={{ readOnly: isEdit }}
                      className={`text-field ${isEdit ? 'readonly-field' : ''}`}
                      size="medium"
                    />
                  </Grid>

                  {!initialData && (
                    <Grid item xs={12} md={6}>
                      <TextField 
                        fullWidth 
                        type="password" 
                        label="Contraseña Temporal"
                        value={form.contrasena}
                        onChange={(e) => handleChange("contrasena", e.target.value)}
                        error={formTouched && !form.contrasena}
                        helperText={formTouched && !form.contrasena ? "Campo requerido" : "Generada automáticamente"}
                        required 
                        disabled={loading} 
                        InputProps={{ readOnly: true }}
                        className="text-field readonly-field"
                        size="medium"
                      />
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            <Card className="section-card">
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom className="section-title">
                  Información Adicional
                </Typography>
                <Grid container spacing={3} className="form-grid">
                  <Grid item xs={12}>
                    <TextField 
                      fullWidth 
                      label="URL de Imagen de Perfil" 
                      value={form.urlImagen}
                      onChange={(e) => handleChange("urlImagen", e.target.value)}
                      disabled={loading} 
                      helperText="Opcional - Enlace a la foto del empleado"
                      className="text-field"
                      size="medium"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {formError && (
              <Alert severity="error" className="alert-message">
                <Typography variant="body2" fontWeight={500} className="alert-text">
                  {formError}
                </Typography>
              </Alert>
            )}

            {!initialData && (
              <Alert severity="info" className="info-alert">
                <Typography variant="body2">
                  <strong>Información importante:</strong> El usuario y contraseña se generan automáticamente en base a los datos personales ingresados.
                </Typography>
              </Alert>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions className="dialog-actions">
        <Button 
          onClick={onClose} 
          variant="outlined" 
          disabled={loading}
          className="cancel-button"
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          form={FORM_ID} 
          variant="contained" 
          disabled={loading} 
          className="submit-button"
        >
          {loading ? "Guardando..." : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmpleadoForm;