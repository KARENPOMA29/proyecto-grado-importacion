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
  CardContent,
  CircularProgress,
} from "@mui/material";
import ServiceEmpleado from "@/services/ServiceEmpleado";
import ServiceSucursal from "@/services/ServiceSucursal";
import "./EmpleadoFormMod.css";

const FORM_ID = "empleado-form";

// 🔹 Roles disponibles
const ROLES = ["Administrador", "Ventas", "Almacen", "Pilotero"];

const EmpleadoForm = ({ onClose, onSuccess, initialData = null }) => {
  const isEdit = Boolean(initialData?.id);

  const [form, setForm] = useState({
    nombre: initialData?.nombre || "",
    apellido: initialData?.apellido || "",
    segundoApellido: initialData?.segundoApellido ?? "",
    ci: String(initialData?.ci ?? ""),
    telefono: String(initialData?.telefono ?? ""),
    rol:
      typeof initialData?.rol === "string"
        ? initialData.rol
        : initialData?.rol?.value || ROLES[0],
    usuario: initialData?.usuario || "",
    contrasena: "",
    correo: initialData?.correo || "",
    urlImagen: initialData?.urlImagen ?? "",
    idSucursal: initialData?.idSucursal ?? null,
  });

  const [formError, setFormError] = useState("");
  const [formTouched, setFormTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  const [touched, setTouched] = useState({
    ci: false,
    nombre: false,
    apellido: false,
    telefono: false,
    correo: false,
    rol: false,
    idSucursal: false,
    usuario: false,
    contrasena: false,
  });

  const [checkingCi, setCheckingCi] = useState(false);
  const [ciError, setCiError] = useState("");
  const [ciExists, setCiExists] = useState(false);

  const [sucursales, setSucursales] = useState([]);
  const [loadingSucursales, setLoadingSucursales] = useState(false);

  const roles = useMemo(() => ROLES, []);

  // 🔹 Subir imagen
  const handleImagenChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSubiendoImagen(true);
      setFormError("");

      const resp = await ServiceEmpleado.uploadImagen(file);
      setForm((prev) => ({
        ...prev,
        urlImagen: resp.urlImagen,
      }));

      toast.success("Imagen subida correctamente");
    } catch (err) {
      console.error("Error subiendo imagen:", err);
      toast.error(err.message || "Error al subir la imagen");
      setFormError(err.message || "Error al subir la imagen");
    } finally {
      setSubiendoImagen(false);
    }
  };

  // 🔹 Armar URL final para la imagen
  const getImageSrc = (url) => {
    if (!url) return "";

    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    const base =
      import.meta.env.VITE_FILES_URL ||
      import.meta.env.VITE_API_URL ||
      "";

    const baseClean = base.endsWith("/") ? base.slice(0, -1) : base;
    const pathClean = url.startsWith("/") ? url : `/${url}`;

    return `${baseClean}${pathClean}`;
  };

  const handleChange = (field, value) => {
    let newValue = value;

    if (field === "ci" || field === "telefono") {
      newValue = String(value || "").replace(/\D/g, "");
    }

    setForm((prev) => ({ ...prev, [field]: newValue }));
    setFormError("");

    if (field === "ci") {
      setCiError("");
      setCiExists(false);
    }
  };

  // 🔄 Cargar sucursales al abrir el formulario
  useEffect(() => {
    const fetchSucursales = async () => {
      try {
        setLoadingSucursales(true);
        const res = await ServiceSucursal.getAll();
        const items = Array.isArray(res) ? res : res.items || [];
        setSucursales(items);
      } catch (err) {
        console.error("Error cargando sucursales:", err);
        toast.error(
          err.message || "Error al cargar las sucursales, intente nuevamente."
        );
      } finally {
        setLoadingSucursales(false);
      }
    };
    fetchSucursales();
  }, []);

  // 🧠 Generación automática de usuario y contraseña (solo creación)
  useEffect(() => {
    if (!initialData) {
      const inicialApellido = String(form.apellido || "")
        .charAt(0)
        .toLowerCase();
      const ciNumeros = String(form.ci || "").replace(/\D/g, "");
      const nuevoUsuario =
        inicialApellido && ciNumeros ? `${inicialApellido}${ciNumeros}` : "";

      const inicialNombre = String(form.nombre || "")
        .charAt(0)
        .toLowerCase();
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

  // 🧠 Debounce para verificar CI en tiempo real
  useEffect(() => {
    const originalCi = initialData?.ci
      ? String(initialData.ci).replace(/\D/g, "")
      : "";
    const ciSanitized = String(form.ci || "").replace(/\D/g, "");

    if (!ciSanitized || ciSanitized.length < 7) {
      setCheckingCi(false);
      setCiError("");
      setCiExists(false);
      return;
    }

    if (isEdit && ciSanitized === originalCi) {
      setCheckingCi(false);
      setCiError("");
      setCiExists(false);
      return;
    }

    let cancelado = false;

    const timer = setTimeout(async () => {
      try {
        setCheckingCi(true);
        const all = await ServiceEmpleado.getAll();
        const items = Array.isArray(all) ? all : all.items || [];

        const existe = items.some(
          (emp) =>
            String(emp.ci || "").replace(/\D/g, "") === ciSanitized &&
            emp.estado === 1 &&
            (!isEdit || emp.id !== initialData?.id)
        );

        if (!cancelado) {
          setCiExists(existe);
          setCiError(existe ? "Ya existe un empleado activo con este CI" : "");
        }
      } catch (err) {
        console.error("Error verificando CI:", err);
        if (!cancelado) {
          setCiExists(false);
          setCiError("");
        }
      } finally {
        if (!cancelado) {
          setCheckingCi(false);
        }
      }
    }, 500);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [form.ci, isEdit, initialData]);

  const validateForm = () => {
    if (
      !form.nombre ||
      !form.apellido ||
      !form.ci ||
      !form.telefono ||
      !form.rol ||
      !form.usuario ||
      (!initialData && !form.contrasena) ||
      !form.correo ||
      !form.idSucursal
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
      setFormError(
        "Ingrese un correo electrónico válido (ej: usuario@dominio.com)"
      );
      return false;
    }
    if (ciExists) {
      setFormError("Ya existe un empleado activo con ese CI.");
      return false;
    }
    return true;
  };

  const buildSanitizedPayload = (isEdit) => {
    const ci = String(form.ci || "").replace(/\D/g, "");
    const telefono = String(form.telefono || "").replace(/\D/g, "");
    const rol =
      typeof form.rol === "string" ? form.rol : form.rol?.value || "";

    const payload = {
      nombre: (form.nombre || "").trim(),
      apellido: (form.apellido || "").trim(),
      ci,
      telefono,
      rol,
      usuario: (form.usuario || "").trim(),
      correo: (form.correo || "").trim(),
    };

    if ((form.segundoApellido || "").trim())
      payload.segundoApellido = form.segundoApellido.trim();
    if ((form.urlImagen || "").trim())
      payload.urlImagen = form.urlImagen.trim();
    if (form.idSucursal) payload.idSucursal = Number(form.idSucursal);

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
      console.error("Error submitting empleado form:", err);

      const detail =
        err.response?.data?.detail ?? err.response?.data ?? err.message;
      const toText = (d) =>
        Array.isArray(d)
          ? d
              .map((x) => {
                const path = Array.isArray(x?.loc) ? x.loc.join(".") : "";
                const msg = x?.msg || x?.detail || JSON.stringify(x);
                return path ? `${path}: ${msg}` : msg;
              })
              .join(" | ")
          : typeof d === "object"
          ? d?.detail || d?.message || JSON.stringify(d)
          : String(d);

      const msg = toText(detail) || "Error al procesar el empleado";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Sucursal seleccionada (objeto) a partir de idSucursal
  const sucursalSeleccionada =
    sucursales.find((s) => s.id === form.idSucursal) || null;

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ className: "dialog-paper" }}
    >
      <DialogTitle
        sx={{
          p: 2.5,
          pb: 2,
          background: "linear-gradient(135deg, #592B2B 0%, #3A1A1A 100%)",
          color: "#F5F5F5",
        }}
      >
        <Typography component="div" variant="h6" fontWeight={700}>
          {isEdit ? "Editar Empleado" : "Nuevo Empleado"}
        </Typography>

        <Typography component="div" variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
          Complete la información del empleado.
        </Typography>
      </DialogTitle>

      <DialogContent dividers className="dialog-content">
        <Box className="form-container">
          <Box id={FORM_ID} component="form" onSubmit={handleSubmit} noValidate>
            {/* Información personal */}
            <Card className="section-card">
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="h6"
                  fontWeight={600}
                  gutterBottom
                  className="section-title"
                >
                  Información Personal
                </Typography>
                <Grid container spacing={3} className="form-grid">
                  {/* CI */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Cédula de Identidad"
                      value={form.ci}
                      onChange={(e) => handleChange("ci", e.target.value)}
                      onBlur={() =>
                        setTouched((prev) => ({ ...prev, ci: true }))
                      }
                      error={
                        (touched.ci || formTouched) &&
                        (!!ciError || !/^\d{7,8}$/.test(String(form.ci)))
                      }
                      helperText={
                        ciError
                          ? ciError
                          : (touched.ci || formTouched) &&
                            !/^\d{7,8}$/.test(String(form.ci))
                          ? "Debe tener 7 u 8 dígitos"
                          : "Solo números"
                      }
                      required
                      disabled={loading}
                      inputProps={{ maxLength: 8 }}
                      className="text-field"
                      size="medium"
                      slotProps={{
                        input: {
                          endAdornment: checkingCi ? (
                            <CircularProgress size={20} />
                          ) : null,
                        },
                      }}
                    />
                  </Grid>

                  {/* Nombre */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Nombre"
                      value={form.nombre}
                      onChange={(e) =>
                        handleChange("nombre", e.target.value)
                      }
                      onBlur={() =>
                        setTouched((prev) => ({ ...prev, nombre: true }))
                      }
                      error={(touched.nombre || formTouched) && !form.nombre}
                      helperText={
                        (touched.nombre || formTouched) && !form.nombre
                          ? "Campo requerido"
                          : ""
                      }
                      required
                      disabled={loading}
                      className="text-field"
                      size="medium"
                    />
                  </Grid>

                  {/* Apellido */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Apellido"
                      value={form.apellido}
                      onChange={(e) =>
                        handleChange("apellido", e.target.value)
                      }
                      onBlur={() =>
                        setTouched((prev) => ({ ...prev, apellido: true }))
                      }
                      error={(touched.apellido || formTouched) && !form.apellido}
                      helperText={
                        (touched.apellido || formTouched) && !form.apellido
                          ? "Campo requerido"
                          : ""
                      }
                      required
                      disabled={loading}
                      className="text-field"
                      size="medium"
                    />
                  </Grid>

                  {/* Segundo Apellido */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Segundo Apellido"
                      value={form.segundoApellido}
                      onChange={(e) =>
                        handleChange("segundoApellido", e.target.value)
                      }
                      disabled={loading}
                      helperText="Opcional"
                      className="text-field"
                      size="medium"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Contacto, Rol y Sucursal */}
            <Card className="section-card">
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="h6"
                  fontWeight={600}
                  gutterBottom
                  className="section-title"
                >
                  Contacto, Rol y Sucursal
                </Typography>
                <Grid container spacing={3} className="form-grid">
                  {/* Teléfono */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Teléfono"
                      value={form.telefono}
                      onChange={(e) =>
                        handleChange("telefono", e.target.value)
                      }
                      onBlur={() =>
                        setTouched((prev) => ({ ...prev, telefono: true }))
                      }
                      error={
                        (touched.telefono || formTouched) &&
                        (!form.telefono ||
                          !/^\d{8}$/.test(String(form.telefono)))
                      }
                      helperText={
                        (touched.telefono || formTouched) &&
                        (!form.telefono ||
                          !/^\d{8}$/.test(String(form.telefono)))
                          ? "Debe tener 8 dígitos"
                          : "Solo números"
                      }
                      required
                      disabled={loading}
                      inputProps={{ maxLength: 8 }}
                      className="text-field"
                      size="medium"
                    />
                  </Grid>

                  {/* Rol */}
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      options={roles}
                      disablePortal
                      disableClearable
                      value={form.rol}
                      onChange={(_, newValue) =>
                        handleChange("rol", newValue)
                      }
                      isOptionEqualToValue={(option, value) =>
                        String(option).toLowerCase() ===
                        String(value).toLowerCase()
                      }
                      getOptionLabel={(option) => option || ""}
                      className="autocomplete-container"
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Rol del Empleado"
                          required
                          onBlur={() =>
                            setTouched((prev) => ({ ...prev, rol: true }))
                          }
                          error={(touched.rol || formTouched) && !form.rol}
                          helperText={
                            (touched.rol || formTouched) && !form.rol
                              ? "Campo requerido"
                              : "Seleccione el rol correspondiente"
                          }
                          className="text-field"
                          size="medium"
                        />
                      )}
                      disabled={loading}
                    />
                  </Grid>

                  {/* Sucursal - CORREGIDO */}
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      options={sucursales}
                      loading={loadingSucursales}
                      value={sucursalSeleccionada}
                      onChange={(_, newValue) =>
                        handleChange("idSucursal", newValue?.id || null)
                      }
                      getOptionLabel={(option) => option?.nombre || ""}
                      isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
                      renderInput={(params) => {
                        if (!params) {
                          return (
                            <TextField
                              label="Sucursal"
                              required
                              disabled={loading || loadingSucursales}
                              error={
                                (touched.idSucursal || formTouched) &&
                                !form.idSucursal
                              }
                              helperText={
                                (touched.idSucursal || formTouched) &&
                                !form.idSucursal
                                  ? "Seleccione una sucursal"
                                  : "Sucursal donde trabaja el empleado"
                              }
                              className="text-field"
                              size="medium"
                            />
                          );
                        }

                        return (
                          <TextField
                            {...params}
                            label="Sucursal"
                            required
                            onBlur={() =>
                              setTouched((prev) => ({
                                ...prev,
                                idSucursal: true,
                              }))
                            }
                            error={
                              (touched.idSucursal || formTouched) &&
                              !form.idSucursal
                            }
                            helperText={
                              (touched.idSucursal || formTouched) &&
                              !form.idSucursal
                                ? "Seleccione una sucursal"
                                : "Sucursal donde trabaja el empleado"
                            }
                            slotProps={{
                              input: {
                                ...params.InputProps,
                                endAdornment: (
                                  <>
                                    {loadingSucursales ? (
                                      <CircularProgress size={18} />
                                    ) : null}
                                    {params.InputProps?.endAdornment}
                                  </>
                                ),
                              },
                            }}
                            className="text-field"
                            size="medium"
                          />
                        );
                      }}
                      disabled={loading || loadingSucursales}
                    />
                  </Grid>

                  {/* Correo */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="email"
                      label="Correo Electrónico"
                      value={form.correo}
                      onChange={(e) =>
                        handleChange("correo", e.target.value)
                      }
                      onBlur={() =>
                        setTouched((prev) => ({ ...prev, correo: true }))
                      }
                      error={
                        (touched.correo || formTouched) &&
                        (!form.correo ||
                          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo))
                      }
                      helperText={
                        (touched.correo || formTouched) &&
                        (!form.correo ||
                          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo))
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

            {/* Credenciales */}
            <Card className="section-card">
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="h6"
                  fontWeight={600}
                  gutterBottom
                  className="section-title"
                >
                  Credenciales de Acceso
                </Typography>
                <Grid container spacing={3} className="form-grid">
                  {/* Usuario */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Usuario"
                      value={form.usuario}
                      onChange={(e) =>
                        handleChange("usuario", e.target.value)
                      }
                      onBlur={() =>
                        setTouched((prev) => ({ ...prev, usuario: true }))
                      }
                      error={(touched.usuario || formTouched) && !form.usuario}
                      helperText={
                        (touched.usuario || formTouched) && !form.usuario
                          ? "Campo requerido"
                          : isEdit
                          ? "Usuario no editable en modificación"
                          : "Generado automáticamente"
                      }
                      required
                      disabled={loading || isEdit}
                      slotProps={{
                        input: { readOnly: isEdit },
                      }}
                      className={`text-field ${isEdit ? "readonly-field" : ""}`}
                      size="medium"
                    />
                  </Grid>

                  {/* Contraseña Temporal */}
                  {!initialData && (
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="password"
                        label="Contraseña Temporal"
                        value={form.contrasena}
                        onChange={(e) =>
                          handleChange("contrasena", e.target.value)
                        }
                        onBlur={() =>
                          setTouched((prev) => ({
                            ...prev,
                            contrasena: true,
                          }))
                        }
                        error={
                          (touched.contrasena || formTouched) &&
                          !form.contrasena
                        }
                        helperText={
                          (touched.contrasena || formTouched) &&
                          !form.contrasena
                            ? "Campo requerido"
                            : "Generada automáticamente"
                        }
                        required
                        disabled={loading}
                        slotProps={{
                          input: { readOnly: true },
                        }}
                        className="text-field readonly-field"
                        size="medium"
                      />
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            {/* Foto del Empleado */}
            <Card className="section-card">
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="h6"
                  fontWeight={600}
                  gutterBottom
                  className="section-title"
                >
                  Foto del Empleado
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <Box
                    sx={{
                      width: 150,
                      height: 150,
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: "4px solid #F1E5E5",
                      boxShadow: "0 8px 22px rgba(0,0,0,0.16)",
                      bgcolor: "#F8F2F2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {form.urlImagen ? (
                      <Box
                        component="img"
                        src={getImageSrc(form.urlImagen)}
                        alt="Foto del empleado"
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <Typography sx={{ color: "#592B2B", fontWeight: 700 }}>
                        Sin foto
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary", mb: 2 }}
                    >
                      Suba una imagen del empleado para mostrarla en el listado
                      y en los detalles.
                    </Typography>

                    <Button
                      variant="outlined"
                      component="label"
                      disabled={loading || subiendoImagen}
                      sx={{
                        borderRadius: 999,
                        px: 3,
                        textTransform: "none",
                        fontWeight: 600,
                        borderColor: "#592B2B",
                        color: "#592B2B",
                        "&:hover": {
                          borderColor: "#3A1A1A",
                          bgcolor: "#F8F2F2",
                        },
                      }}
                    >
                      {subiendoImagen
                        ? "Subiendo imagen..."
                        : "Subir foto de perfil"}
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleImagenChange}
                      />
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Alertas */}
            {formError && (
              <Alert severity="error" className="alert-message">
                <Typography
                  variant="body2"
                  fontWeight={500}
                  className="alert-text"
                >
                  {formError}
                </Typography>
              </Alert>
            )}

            {!initialData && (
              <Alert severity="info" className="info-alert">
                <Typography variant="body2">
                  <strong>Información importante:</strong> El usuario y
                  contraseña se generan automáticamente en base a los datos
                  personales ingresados.
                </Typography>
              </Alert>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2.5,
          gap: 1.5,
          bgcolor: "#FAFAFA",
          borderTop: "1px solid #E0E0E0",
        }}
      >
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
          type="submit"
          form={FORM_ID}
          variant="contained"
          disabled={loading || checkingCi || ciExists || subiendoImagen}
          sx={{
            textTransform: "none",
            borderRadius: 999,
            px: 4,
            minWidth: 140,
            fontWeight: 600,
            background: "linear-gradient(135deg, #14AE5C 0%, #0D8C47 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #0D8C47 0%, #0A6B37 100%)",
              boxShadow: "0 4px 12px rgba(20,174,92,0.4)",
            },
          }}
        >
          {loading ? "Guardando..." : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmpleadoForm;
