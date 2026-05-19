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

import {
  Add,
  PhotoCamera,
  ImageOutlined,
} from "@mui/icons-material";
import { toast } from "react-toastify";

import ServiceModeloProducto from "@/services/ServiceModeloProducto";
import ServiceMarca from "@/services/ServiceMarca";
import MarcaForm from "@/routes/pages/marcas/MarcaForm"; // ajusta la ruta si hace falta

const UNIDADES = [
  "L",
  "kg",
  "°C",
  "dB(A)",
  "L/ciclo",
  "W",
  "BTU/h",
  "kW",
];
const COLORES = [
  "Blanco",
  "Negro",
  "Gris",
  "Plateado",
  "Acero inoxidable",
  "Rojo",
  "Azul",
  "Beige",
  "Marrón",
  "Dorado",
];

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
    if (!form.nombreModelo.trim()) {
      setErrorMsg("Ingresa el nombre del modelo.");
      return false;
    }

    if (!regexNombreModelo.test(form.nombreModelo)) {
      setErrorMsg("El nombre del modelo solo puede contener letras, números y símbolos simples.");
      return false;
    }

    if (!form.idMarca) {
      setErrorMsg("Selecciona la marca del modelo.");
      return false;
    }

    if (!form.color) {
      setErrorMsg("Selecciona un color para el modelo.");
      return false;
    }

    if (!form.capacidadOTamano) {
      setErrorMsg("Ingresa la capacidad o tamaño del modelo.");
      return false;
    }

    const capacidad = Number(form.capacidadOTamano);
    if (Number.isNaN(capacidad) || capacidad <= 0) {
      setErrorMsg("La capacidad o tamaño debe ser un número mayor a 0.");
      return false;
    }

    if (!form.unidadMedida) {
      setErrorMsg("Selecciona la unidad de medida.");
      return false;
    }

    const stockMin = Number(form.stockMinimo);
    if (form.stockMinimo === "" || Number.isNaN(stockMin) || stockMin < 0) {
      setErrorMsg("El stock mínimo debe ser un número mayor o igual a 0.");
      return false;
    }

    const dur = Number(form.duracionGarantia);
    if (!form.duracionGarantia || Number.isNaN(dur) || dur <= 0) {
      setErrorMsg("La duración de la garantía debe ser un número mayor a 0.");
      return false;
    }

    if (!form.tipoGarantia) {
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
        capacidadOTamano: Number(form.capacidadOTamano),
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
  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      height: 48,
      borderRadius: 1.2,
      backgroundColor: "#fff",
    },
  };

  const selectSx = {
    height: 48,
    borderRadius: 1.2,
    backgroundColor: "#fff",
    "& .MuiSelect-select": {
      height: "48px !important",
      display: "flex",
      alignItems: "center",
      boxSizing: "border-box",
      paddingTop: "0 !important",
      paddingBottom: "0 !important",
    },
  };

  return (
    <>
      <Dialog
        open={true}
        onClose={onClose}
        maxWidth="lg"
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
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
              Imagen del modelo
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "220px 1fr" },
                gap: 2,
                alignItems: "center",
                p: 2,
                border: "1px solid #E5E7EB",
                borderRadius: 2,
                bgcolor: "#FCFCFC",
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  height: 170,
                  borderRadius: 2,
                  border: "1px dashed #BDBDBD",
                  bgcolor: "#F7F7F7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {previewSrc ? (
                  <Box
                    component="img"
                    src={previewSrc}
                    alt="Vista previa del modelo"
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <Box sx={{ textAlign: "center", color: "text.secondary" }}>
                    <ImageOutlined sx={{ fontSize: 52, mb: 1, color: "#9CA3AF" }} />
                    <Typography variant="body2">
                      Sin imagen
                    </Typography>
                  </Box>
                )}
              </Box>

              <Box>
                <Button
                  variant="contained"
                  component="label"
                  disabled={uploadingImg || loading}
                  startIcon={<PhotoCamera />}
                  sx={{
                    textTransform: "none",
                    borderRadius: 999,
                    px: 3,
                    fontWeight: 600,
                    background: "linear-gradient(135deg, #592B2B 0%, #3A1A1A 100%)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #3A1A1A 0%, #261010 100%)",
                    },
                  }}
                >
                  {uploadingImg ? "Subiendo imagen..." : "Seleccionar imagen"}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleUploadImage}
                  />
                </Button>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1.2, maxWidth: 420 }}
                >
                  Puedes subir una imagen del modelo. Se mostrará una vista previa antes de guardar.
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* SECCIÓN: Datos generales */}
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.2 }}>
              Datos generales
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "1fr 1fr 1fr",
                },
                gap: 1.8,
                alignItems: "start",
              }}
            >
              <TextField
                label="Nombre del Modelo *"
                placeholder="Ej: WM42RT3S"
                fullWidth
                value={form.nombreModelo}
                onChange={(e) => handleChange("nombreModelo", e.target.value)}
                error={
                  touched.nombreModelo &&
                  (!form.nombreModelo || !regexNombreModelo.test(form.nombreModelo))
                }
                helperText={
                  touched.nombreModelo && !form.nombreModelo
                    ? "Campo obligatorio."
                    : touched.nombreModelo && !regexNombreModelo.test(form.nombreModelo)
                    ? "Solo letras, números y símbolos simples."
                    : " "
                }
                disabled={isSaving}
                required
                size="small"
                sx={fieldSx}
              />

              <Box>
                <Box sx={{ display: "flex", gap: 1 }}>
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
                      sx={selectSx}
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
                        onClick={() => setOpenMarcaForm(true)}
                        disabled={isSaving}
                        sx={{
                          width: 48,
                          height: 48,
                          border: "1px solid #D0D5DD",
                          borderRadius: 1.2,
                          flexShrink: 0,
                        }}
                      >
                        <Add fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>

                {touched.idMarca && !form.idMarca ? (
                  <Typography variant="caption" color="error">
                    Selecciona una marca.
                  </Typography>
                ) : (
                  <Typography variant="caption" sx={{ visibility: "hidden" }}>
                    espacio
                  </Typography>
                )}
              </Box>

              <FormControl
                fullWidth
                disabled={isSaving}
                error={touched.color && !form.color}
                size="small"
              >
                <InputLabel id="color-label">Color *</InputLabel>
                <Select
                  labelId="color-label"
                  label="Color *"
                  value={form.color || ""}
                  onChange={(e) => handleChange("color", e.target.value)}
                  sx={selectSx}
                >
                  <MenuItem value="">
                    <em>Selecciona un color</em>
                  </MenuItem>

                  {COLORES.map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </Select>

                {touched.color && !form.color ? (
                  <Typography variant="caption" color="error">
                    Selecciona un color.
                  </Typography>
                ) : (
                  <Typography variant="caption" sx={{ visibility: "hidden" }}>
                    espacio
                  </Typography>
                )}
              </FormControl>
            </Box>
          </Box>

          {/* SECCIÓN: Capacidad y stock */}
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.2 }}>
              Capacidad y stock
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "1fr 1fr 1fr 1fr",
                },
                gap: 1.8,
                alignItems: "start",
              }}
            >
              <TextField
                label="Capacidad/Tamaño *"
                placeholder="Ej: 350"
                fullWidth
                type="number"
                inputMode="numeric"
                value={form.capacidadOTamano}
                onChange={(e) => handleChange("capacidadOTamano", e.target.value)}
                error={
                  touched.capacidadOTamano &&
                  (!form.capacidadOTamano || Number(form.capacidadOTamano) <= 0)
                }
                helperText={
                  touched.capacidadOTamano &&
                  (!form.capacidadOTamano || Number(form.capacidadOTamano) <= 0)
                    ? "Ingresa una capacidad mayor a 0."
                    : "Ejemplo: 350, 12, 900."
                }
                disabled={isSaving}
                required
                size="small"
                inputProps={{ min: 1 }}
                sx={fieldSx}
              />

            <FormControl
              fullWidth
              disabled={isSaving}
              error={touched.unidadMedida && !form.unidadMedida}
              size="small"
            >
              <InputLabel id="unidad-label">Unidad *</InputLabel>

              <Select
                labelId="unidad-label"
                label="Unidad *"
                value={form.unidadMedida || ""}
                onChange={(e) => handleChange("unidadMedida", e.target.value)}
                sx={selectSx}
              >
                <MenuItem value="">
                  <em>Selecciona unidad</em>
                </MenuItem>

                {UNIDADES.map((u) => (
                  <MenuItem key={u} value={u}>
                    {u}
                  </MenuItem>
                ))}
              </Select>

              {touched.unidadMedida && !form.unidadMedida ? (
                <Typography variant="caption" color="error">
                  Selecciona una unidad de medida.
                </Typography>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  Ej: L, kg, BTU/h, W.
                </Typography>
              )}
            </FormControl>

              <TextField
                label="Stock mínimo *"
                fullWidth
                type="number"
                inputMode="numeric"
                value={form.stockMinimo}
                onChange={(e) => handleChange("stockMinimo", e.target.value)}
                error={
                  touched.stockMinimo &&
                  (form.stockMinimo === "" || Number(form.stockMinimo) < 0)
                }
                helperText={
                  touched.stockMinimo &&
                  (form.stockMinimo === "" || Number(form.stockMinimo) < 0)
                    ? "Ingresa un número mayor o igual a 0."
                    : "Cantidad mínima recomendada."
                }
                disabled={isSaving}
                required
                size="small"
                inputProps={{ min: 0 }}
                sx={fieldSx}
              />


            </Box>
          </Box>

          {/* SECCIÓN: Garantía */}
          <Box sx={{ mb: 1 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.2 }}>
              Garantía
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "1fr 1fr",
                },
                gap: 1.8,
                alignItems: "start",
              }}
            >
              <TextField
                label="Duración de la garantía *"
                placeholder="Ej: 12"
                fullWidth
                type="number"
                inputMode="numeric"
                value={form.duracionGarantia}
                onChange={(e) => handleChange("duracionGarantia", e.target.value)}
                error={
                  touched.duracionGarantia &&
                  (!form.duracionGarantia || Number(form.duracionGarantia) <= 0)
                }
                helperText={
                  touched.duracionGarantia &&
                  (!form.duracionGarantia || Number(form.duracionGarantia) <= 0)
                    ? "Ingresa un número mayor a 0."
                    : "Ejemplo: 12, 24, 36."
                }
                disabled={isSaving}
                required
                size="small"
                inputProps={{ min: 1 }}
                sx={fieldSx}
              />

              <FormControl
                fullWidth
                disabled={isSaving}
                error={touched.tipoGarantia && !form.tipoGarantia}
                size="small"
              >
                <InputLabel id="tipo-garantia-label">Tipo de garantía *</InputLabel>
                <Select
                  labelId="tipo-garantia-label"
                  label="Tipo de garantía *"
                  value={form.tipoGarantia || ""}
                  onChange={(e) => handleChange("tipoGarantia", e.target.value)}
                  sx={selectSx}
                >
                  <MenuItem value="">
                    <em>Selecciona el tipo</em>
                  </MenuItem>

                  {TIPOS_GARANTIA.map((t) => (
                    <MenuItem key={t.value} value={t.value}>
                      {t.label}
                    </MenuItem>
                  ))}
                </Select>

                {touched.tipoGarantia && !form.tipoGarantia ? (
                  <Typography variant="caption" color="error">
                    Selecciona el tipo de garantía.
                  </Typography>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    Indica la unidad de tiempo de la garantía.
                  </Typography>
                )}
              </FormControl>
            </Box>
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
