// src/pages/modelos/ModeloProductoForm.jsx
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  IconButton,
  Tooltip,
} from "@mui/material";

import { Add } from "@mui/icons-material";
import { toast } from "react-toastify";

import ServiceModeloProducto from "@/services/ServiceModeloProducto";
import ServiceMarca from "@/services/ServiceMarca";
import MarcaForm from "@/routes/pages/marcas/MarcaForm"; // ajusta la ruta si hace falta

const UNIDADES = ["Unidades", "Litros", "Kg", "Metros", "Pies³", "BTU"];

const TIPOS_GARANTIA = [
  { value: "DIAS", label: "Días" },
  { value: "MESES", label: "Meses" },
  { value: "ANIOS", label: "Años" },
];

const regexNombreModelo = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .\-\/]+$/;
const regexColor = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .\-\/#()]+$/;

// helper para armar URL completa cuando el backend manda ruta relativa
const buildFileUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;

  const base =
    import.meta.env.VITE_FILES_URL ||
    import.meta.env.VITE_API_URL ||
    window.location.origin;

  const baseClean = base.endsWith("/") ? base.slice(0, -1) : base;
  const pathClean = url.startsWith("/") ? url : `/${url}`;
  return `${baseClean}${pathClean}`;
};

const ModeloProductoForm = ({ onClose, onSuccess, initialData = null }) => {
  const [form, setForm] = useState({
    nombreModelo: "",
    idMarca: "",
    capacidadOTamano: "",
    unidadMedida: "",
    stockMinimo: 0,
    stockActual: 0,
    color: "",
    duracionGarantia: "",
    tipoGarantia: "",
    urlImagen: "",
  });

  const [touched, setTouched] = useState({
    nombreModelo: false,
    idMarca: false,
    capacidadOTamano: false,
    unidadMedida: false,
    stockMinimo: false,
    stockActual: false,
    color: false,
    duracionGarantia: false,
    tipoGarantia: false,
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  // marcas
  const [marcas, setMarcas] = useState([]);
  const [loadingMarcas, setLoadingMarcas] = useState(false);
  const [openMarcaForm, setOpenMarcaForm] = useState(false);

  // vista previa local/normalizada
  const [previewSrc, setPreviewSrc] = useState(null);

  // cargar marcas
  useEffect(() => {
    const fetchMarcas = async () => {
      try {
        setLoadingMarcas(true);
        const { items } = await ServiceMarca.getAll();
        setMarcas(items || []);
      } catch (err) {
        console.error("Error cargando marcas:", err);
        toast.error(
          err.message || "Error al cargar marcas. Verifique la conexión."
        );
      } finally {
        setLoadingMarcas(false);
      }
    };
    fetchMarcas();
  }, []);

  // inicializar form
  useEffect(() => {
    const urlImg = initialData?.urlImagen || "";
    setForm({
      nombreModelo: initialData?.nombreModelo || "",
      idMarca:
        initialData?.idMarca !== undefined && initialData?.idMarca !== null
          ? String(initialData.idMarca)
          : "",
      capacidadOTamano: initialData?.capacidadOTamano ?? "",
      unidadMedida: initialData?.unidadMedida || "",
      stockMinimo: initialData?.stockMinimo ?? 0,
      stockActual: initialData?.stockActual ?? 0,
      color: initialData?.color || "",
      duracionGarantia:
        initialData?.duracionGarantia !== undefined &&
        initialData?.duracionGarantia !== null
          ? String(initialData.duracionGarantia)
          : "",
      tipoGarantia: initialData?.tipoGarantia || "",
      urlImagen: urlImg,
    });

    setPreviewSrc(urlImg ? buildFileUrl(urlImg) : null);

    setErrorMsg("");
    setTouched({
      nombreModelo: false,
      idMarca: false,
      capacidadOTamano: false,
      unidadMedida: false,
      stockMinimo: false,
      stockActual: false,
      color: false,
      duracionGarantia: false,
      tipoGarantia: false,
    });
  }, [initialData]);

  const handleChange = (field, value) => {
    let newVal = value ?? "";

    if (field === "nombreModelo") {
      newVal = String(newVal).replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .\-\/]/g, "");
    }

    if (field === "color") {
      newVal = String(newVal).replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .\-\/#()]/g, "");
    }

    // 🔢 solo para inputs de texto numéricos (NO para idMarca ni selects)
    const numericTextFields = [
      "capacidadOTamano",
      "stockMinimo",
      "stockActual",
      "duracionGarantia",
    ];

    if (numericTextFields.includes(field)) {
      newVal = String(newVal).replace(/\D/g, ""); // solo dígitos
    }

    // idMarca, unidadMedida, tipoGarantia se guardan tal cual vienen del Select
    setForm((prev) => ({ ...prev, [field]: newVal }));
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrorMsg("");
  };

  const validate = () => {
    if (!form.nombreModelo) {
      setErrorMsg("Ingresa el nombre del modelo.");
      return false;
    }
    if (!regexNombreModelo.test(form.nombreModelo)) {
      setErrorMsg("El nombre del modelo solo puede contener letras y números.");
      return false;
    }

    if (!form.idMarca) {
      setErrorMsg("Selecciona la marca del modelo.");
      return false;
    }

    if (!form.color) {
      setErrorMsg("Ingresa un color para el modelo.");
      return false;
    }
    if (!regexColor.test(form.color)) {
      setErrorMsg("El color contiene caracteres no válidos.");
      return false;
    }

    const stockMin = Number(form.stockMinimo);
    if (Number.isNaN(stockMin) || stockMin < 0) {
      setErrorMsg("El stock mínimo debe ser un número mayor o igual a 0.");
      return false;
    }

    const stockAct = Number(form.stockActual);
    if (Number.isNaN(stockAct) || stockAct < 0) {
      setErrorMsg("El stock actual debe ser un número mayor o igual a 0.");
      return false;
    }

    if (form.unidadMedida && !UNIDADES.includes(form.unidadMedida)) {
      setErrorMsg("Selecciona una unidad de medida válida.");
      return false;
    }

    const dur = Number(form.duracionGarantia);
    if (!form.duracionGarantia || Number.isNaN(dur) || dur <= 0) {
      setErrorMsg("La duración de la garantía debe ser un número mayor a 0.");
      return false;
    }

    if (
      !form.tipoGarantia ||
      !TIPOS_GARANTIA.some((t) => t.value === form.tipoGarantia)
    ) {
      setErrorMsg("Selecciona el tipo de garantía.");
      return false;
    }

    return true;
  };

  const handleUploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // vista previa inmediata local
    const localUrl = URL.createObjectURL(file);
    setPreviewSrc(localUrl);

    try {
      setUploadingImg(true);
      const { urlImagen } = await ServiceModeloProducto.uploadImagen(file);
      setForm((prev) => ({ ...prev, urlImagen }));
      // normalizamos la URL devuelta por el backend
      setPreviewSrc(buildFileUrl(urlImagen));
      toast.success("Imagen subida correctamente");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Error al subir la imagen");
      // si falla el backend, al menos se ve el localUrl
    } finally {
      setUploadingImg(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg("");

    setTouched({
      nombreModelo: true,
      idMarca: true,
      capacidadOTamano: true,
      unidadMedida: true,
      stockMinimo: true,
      stockActual: true,
      color: true,
      duracionGarantia: true,
      tipoGarantia: true,
    });

    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        nombreModelo: form.nombreModelo.trim(),
        idMarca: form.idMarca ? Number(form.idMarca) : null,
        capacidadOTamano: form.capacidadOTamano
          ? Number(form.capacidadOTamano)
          : null,
        unidadMedida: form.unidadMedida || null,
        stockMinimo: Number(form.stockMinimo) || 0,
        stockActual: Number(form.stockActual) || 0,
        color: form.color.trim(),
        duracionGarantia: Number(form.duracionGarantia),
        tipoGarantia: form.tipoGarantia,
        urlImagen: form.urlImagen || null,
      };

      let resp;
      if (initialData?.id) {
        resp = await ServiceModeloProducto.update(initialData.id, payload);
        toast.success("Modelo actualizado correctamente");
      } else {
        resp = await ServiceModeloProducto.create(payload);
        toast.success("Modelo creado correctamente");
      }

      onSuccess?.(resp);
      onClose?.();
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "Error al guardar el modelo";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const isSaving = loading || uploadingImg;

  // cuando se crea una marca desde el modal
  const handleMarcaCreated = (nuevaMarca) => {
    if (!nuevaMarca) return;
    setMarcas((prev) => [...prev, nuevaMarca]);
    setForm((prev) => ({ ...prev, idMarca: String(nuevaMarca.id) }));
  };

  return (
    <>
      <Dialog
        open={true}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: "0 12px 36px rgba(0,0,0,0.18)",
          },
        }}
      >
        {/* HEADER estilo vino */}
        <DialogTitle
          sx={{
            background: "linear-gradient(135deg, #592B2B 0%, #3A1A1A 100%)",
            color: "#F5F5F5",
            py: 2.5,
            px: 3,
          }}
        >
          <Typography variant="h6" component="span" fontWeight={700}>
            {initialData ? "Editar Modelo" : "Nuevo Modelo"}
          </Typography>
        </DialogTitle>

        <DialogContent
          sx={{
            py: 3,
            px: 3,
            bgcolor: "#FAFAFA",
          }}
        >
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{
              bgcolor: "#FFFFFF",
              borderRadius: 2,
              p: 2.5,
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}
          >
            {/* SECCIÓN: Imagen */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                Imagen del modelo
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  flexWrap: "wrap",
                }}
              >
                <Button
                  variant="outlined"
                  component="label"
                  disabled={uploadingImg || loading}
                >
                  {uploadingImg ? "Subiendo..." : "Seleccionar imagen"}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleUploadImage}
                  />
                </Button>

                <Typography variant="body2" color="text.secondary">
                  Imagen opcional del modelo. Al escoger un archivo se subirá y
                  verás una vista previa.
                </Typography>

                {previewSrc && (
                  <Box
                    component="img"
                    src={previewSrc}
                    alt="Vista previa del modelo"
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: 1,
                      objectFit: "cover",
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                )}
              </Box>
            </Box>

            {/* SECCIÓN: Datos generales */}
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="subtitle2"
                fontWeight={600}
                sx={{ mb: 1, mt: 1 }}
              >
                Datos generales
              </Typography>

              <Grid container spacing={2}>
                {/* NOMBRE MODELO */}
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Nombre del Modelo *"
                    fullWidth
                    value={form.nombreModelo}
                    onChange={(e) =>
                      handleChange("nombreModelo", e.target.value)
                    }
                    error={
                      touched.nombreModelo &&
                      (!form.nombreModelo ||
                        !regexNombreModelo.test(form.nombreModelo))
                    }
                    helperText={
                      touched.nombreModelo && !form.nombreModelo
                        ? "Campo obligatorio."
                        : touched.nombreModelo &&
                          !regexNombreModelo.test(form.nombreModelo)
                        ? "Solo letras, números y símbolos simples."
                        : ""
                    }
                    disabled={isSaving}
                    required
                    size="small"
                  />
                </Grid>

                {/* MARCA + botón agregar */}
                <Grid item xs={12} md={4}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <FormControl
                      fullWidth
                      disabled={isSaving || loadingMarcas}
                      error={touched.idMarca && !form.idMarca}
                      size="small"
                    >
                      <InputLabel id="marca-label">Marca *</InputLabel>
                      <Select
                        labelId="marca-label"
                        label="Marca *"
                        value={form.idMarca || ""}
                        onChange={(e) => handleChange("idMarca", e.target.value)}
                        MenuProps={{ sx: { zIndex: 2000 } }}
                      >
                        <MenuItem value="">
                          <em>Selecciona una marca</em>
                        </MenuItem>
                        {marcas.map((m) => (
                          <MenuItem key={m.id} value={String(m.id)}>
                            {m.nombre}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>


                    <Tooltip title="Agregar nueva marca">
                      <span>
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => setOpenMarcaForm(true)}
                          disabled={isSaving}
                          sx={{
                            border: "1px solid",
                            borderColor: "divider",
                            ml: 0.5,
                          }}
                        >
                          <Add fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                  {touched.idMarca && !form.idMarca && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ mt: 0.5, display: "block" }}
                    >
                      Selecciona una marca.
                    </Typography>
                  )}
                </Grid>

                {/* COLOR */}
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Color *"
                    fullWidth
                    value={form.color}
                    onChange={(e) => handleChange("color", e.target.value)}
                    error={
                      touched.color &&
                      (!form.color || !regexColor.test(form.color))
                    }
                    helperText={
                      touched.color && !form.color
                        ? "Campo obligatorio."
                        : touched.color && !regexColor.test(form.color)
                        ? "El color contiene caracteres no válidos."
                        : ""
                    }
                    disabled={isSaving}
                    required
                    size="small"
                  />
                </Grid>
              </Grid>
            </Box>

            {/* SECCIÓN: Capacidad y stock */}
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="subtitle2"
                fontWeight={600}
                sx={{ mb: 1, mt: 1 }}
              >
                Capacidad y stock
              </Typography>

              <Grid container spacing={2}>
                {/* CAPACIDAD / TAMAÑO */}
                <Grid item xs={12} md={3}>
                  <TextField
                    label="Capacidad/Tamaño"
                    fullWidth
                    type="number"
                    inputMode="numeric"
                    value={form.capacidadOTamano}
                    onChange={(e) =>
                      handleChange("capacidadOTamano", e.target.value)
                    }
                    helperText="Opcional. Solo números (ej: 3500)."
                    disabled={isSaving}
                    size="small"
                    inputProps={{ min: 0 }}
                  />
                </Grid>

                {/* UNIDAD DE MEDIDA */}
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth disabled={isSaving} size="small">
                    <InputLabel id="unidad-label">Unidad</InputLabel>
                    <Select
                      labelId="unidad-label"
                      label="Unidad"
                      value={form.unidadMedida || ""}
                      onChange={(e) =>
                        handleChange("unidadMedida", e.target.value)
                      }
                      MenuProps={{ sx: { zIndex: 2000 } }}
                    >
                      <MenuItem value="">
                        <em>Sin unidad</em>
                      </MenuItem>
                      {UNIDADES.map((u) => (
                        <MenuItem key={u} value={u}>
                          {u}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Typography variant="caption" color="text.secondary">
                    Opcional.
                  </Typography>
                </Grid>

                {/* STOCK MÍNIMO */}
                <Grid item xs={12} md={3}>
                  <TextField
                    label="Stock mínimo *"
                    fullWidth
                    type="number"
                    inputMode="numeric"
                    value={form.stockMinimo}
                    onChange={(e) =>
                      handleChange("stockMinimo", e.target.value)
                    }
                    error={
                      touched.stockMinimo &&
                      (form.stockMinimo === "" ||
                        Number(form.stockMinimo) < 0)
                    }
                    helperText={
                      touched.stockMinimo &&
                      (form.stockMinimo === "" ||
                        Number(form.stockMinimo) < 0)
                        ? "Ingresa un número mayor o igual a 0."
                        : "Cantidad mínima recomendada."
                    }
                    disabled={isSaving}
                    required
                    size="small"
                    inputProps={{ min: 0 }}
                  />
                </Grid>

                {/* STOCK ACTUAL */}
                <Grid item xs={12} md={3}>
                  <TextField
                    label="Stock actual"
                    fullWidth
                    type="number"
                    inputMode="numeric"
                    value={form.stockActual}
                    onChange={(e) =>
                      handleChange("stockActual", e.target.value)
                    }
                    helperText={
                      initialData
                        ? "Stock actual del modelo."
                        : "Se iniciará automáticamente en 0."
                    }
                    disabled={true}
                    size="small"
                    inputProps={{ min: 0 }}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* SECCIÓN: Garantía */}
            <Box sx={{ mb: 1 }}>
              <Typography
                variant="subtitle2"
                fontWeight={600}
                sx={{ mb: 1, mt: 1 }}
              >
                Garantía
              </Typography>

              <Grid container spacing={2}>
                {/* DURACIÓN GARANTÍA */}
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Duración de la garantía *"
                    fullWidth
                    type="number"
                    inputMode="numeric"
                    value={form.duracionGarantia}
                    onChange={(e) =>
                      handleChange("duracionGarantia", e.target.value)
                    }
                    error={
                      touched.duracionGarantia &&
                      (!form.duracionGarantia ||
                        Number(form.duracionGarantia) <= 0)
                    }
                    helperText={
                      touched.duracionGarantia &&
                      (!form.duracionGarantia ||
                        Number(form.duracionGarantia) <= 0)
                        ? "Ingresa un número mayor a 0."
                        : "Ejemplo: 12, 24, 36."
                    }
                    disabled={isSaving}
                    required
                    size="small"
                    inputProps={{ min: 1 }}
                  />
                </Grid>

                {/* TIPO GARANTÍA */}
                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Tipo de garantía *"
                    value={form.tipoGarantia || ""}
                    onChange={(e) => handleChange("tipoGarantia", e.target.value)}
                    disabled={isSaving}
                    error={touched.tipoGarantia && !form.tipoGarantia}
                    helperText={
                      touched.tipoGarantia && !form.tipoGarantia
                        ? "Selecciona el tipo de garantía."
                        : ""
                    }
                  >
                    <MenuItem value="">
                      <em>Selecciona el tipo</em>
                    </MenuItem>
                    {TIPOS_GARANTIA.map((t) => (
                      <MenuItem key={t.value} value={t.value}>
                        {t.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

              </Grid>
            </Box>

            {errorMsg && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {errorMsg}
              </Alert>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1.5 }}>
          <Button
            onClick={onClose}
            variant="outlined"
            disabled={isSaving}
            sx={{
              textTransform: "none",
              borderRadius: 999,
              px: 3,
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isSaving}
            sx={{
              textTransform: "none",
              borderRadius: 999,
              px: 4,
              minWidth: 140,
              fontWeight: 600,
              background: "linear-gradient(135deg, #14AE5C 0%, #0D8C47 100%)",
              "&:hover": {
                background:
                  "linear-gradient(135deg, #0D8C47 0%, #0A6B37 100%)",
              },
            }}
          >
            {isSaving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para crear marca */}
      {openMarcaForm && (
        <MarcaForm
          open={openMarcaForm}
          onClose={() => setOpenMarcaForm(false)}
          marca={null}
          onSuccess={(nuevaMarca) => {
            handleMarcaCreated(nuevaMarca);
            setOpenMarcaForm(false);
          }}
        />
      )}
    </>
  );
};

export default ModeloProductoForm;
