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
  Divider,
  Card,
  CardContent
} from "@mui/material";
import ServiceEmpleado from "@/services/ServiceEmpleado";

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
    contrasena: "", // en edición no se envía salvo que la escribas
    correo: initialData?.correo || "",
    urlImagen: initialData?.urlImagen ?? "",
  });

  const [formError, setFormError] = useState("");
  const [formTouched, setFormTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  // Roles como strings simples
  const roles = useMemo(() => ["Administrador", "Ventas", "Almacen", "Pilotero"], []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormTouched(true);
  };

  // Autogenerados solo en creación
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Payload saneado: requeridos siempre, opcionales solo si tienen valor; contraseña solo si aplica
  const buildSanitizedPayload = (isEdit) => {
    const ci = String(form.ci || "").replace(/\D/g, "");
    const telefono = String(form.telefono || "").replace(/\D/g, "");
    const rol = typeof form.rol === "string" ? form.rol : (form.rol?.value || "");

    const payload = {
      // requeridos SIEMPRE en edición (evita 422 por "field required")
      nombre: (form.nombre || "").trim(),
      apellido: (form.apellido || "").trim(),
      ci,
      telefono,
      rol,
      usuario: (form.usuario || "").trim(),
      correo: (form.correo || "").trim(),
    };

    // opcionales solo si hay valor
    if ((form.segundoApellido || "").trim()) payload.segundoApellido = form.segundoApellido.trim();
    if ((form.urlImagen || "").trim()) payload.urlImagen = form.urlImagen.trim();

    // contraseña solo si corresponde
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
      // console.log("PUT/POST payload ->", payload);

      if (isEdit) {
        await ServiceEmpleado.update(initialData.id, payload);
        toast.success("Empleado actualizado correctamente");
      } else {
        await ServiceEmpleado.create(payload);
        toast.success("Empleado creado correctamente");
      }

      onSuccess(); // padre hace refetch y cierra
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
      PaperProps={{ 
        sx: { 
          borderRadius: 3,
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          maxHeight: "95vh"
        } 
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #666547ff 0%, #a78927ff 100%)',
        color: 'white',
        py: 3,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            {isEdit ? "Editar Empleado" : "Nuevo Empleado"}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              label={isEdit ? "Modo Edición" : "Modo Creación"} 
              color={isEdit ? "warning" : "success"}
              variant="filled"
              sx={{ 
                color: 'white', 
                fontWeight: 600,
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)'
              }} 
            />
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Complete todos los campos obligatorios
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0, bgcolor: '#f8fafc' }}>
        <Box sx={{ p: 3 }}>
          <Box id={FORM_ID} component="form" onSubmit={handleSubmit} noValidate>
            
            {/* Sección 1: Información Personal */}
            <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ color: '#374151', display: 'flex', alignItems: 'center', gap: 1 }}>
                  Información Personal
                </Typography>
                <Grid container spacing={3}>
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
                      variant="outlined"
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
                      variant="outlined"
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
                      variant="outlined"
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
                      variant="outlined"
                      size="medium"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Sección 2: Contacto y Rol */}
            <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ color: '#374151', display: 'flex', alignItems: 'center', gap: 1 }}>
                  Contacto y Rol
                </Typography>
                <Grid container spacing={3}>
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
                      variant="outlined"
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
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Rol del Empleado"
                          required
                          error={formTouched && !form.rol}
                          helperText={formTouched && !form.rol ? "Campo requerido" : "Seleccione el rol correspondiente"}
                          variant="outlined"
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
                      variant="outlined"
                      size="medium"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Sección 3: Credenciales de Acceso */}
            <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ color: '#374151', display: 'flex', alignItems: 'center', gap: 1 }}>
                  Credenciales de Acceso
                </Typography>
                <Grid container spacing={3}>
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
                      variant="outlined"
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
                        variant="outlined"
                        size="medium"
                      />
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            {/* Sección 4: Información Adicional */}
            <Card sx={{ borderRadius: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ color: '#374151', display: 'flex', alignItems: 'center', gap: 1 }}>
                  Información Adicional
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField 
                      fullWidth 
                      label="URL de Imagen de Perfil" 
                      value={form.urlImagen}
                      onChange={(e) => handleChange("urlImagen", e.target.value)}
                      disabled={loading} 
                      helperText="Opcional - Enlace a la foto del empleado"
                      variant="outlined"
                      size="medium"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Mensajes de estado */}
            {formError && (
              <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
                <Typography variant="body2" fontWeight={500}>
                  {formError}
                </Typography>
              </Alert>
            )}

            {!initialData && (
              <Alert severity="info" sx={{ mt: 3, borderRadius: 2 }}>
                <Typography variant="body2">
                  <strong>Información importante:</strong> El usuario y contraseña se generan automáticamente en base a los datos personales ingresados.
                </Typography>
              </Alert>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        px: 3, 
        py: 2, 
        gap: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: '#f8fafc'
      }}>
        <Button 
          onClick={onClose} 
          variant="outlined" 
          disabled={loading}
          sx={{ 
            minWidth: 120,
            borderRadius: 2,
            fontWeight: 600,
            py: 1
          }}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          form={FORM_ID} 
          variant="contained" 
          disabled={loading} 
          sx={{ 
            minWidth: 140,
            borderRadius: 2,
            fontWeight: 600,
            py: 1,
            background: 'linear-gradient(135deg, #9a9240ff 0%, #6a562aff 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #9a9240ff 0%, #6a562aff 100%)',
            }
          }}
        >
          {loading ? "Guardando..." : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmpleadoForm;