import api from "./api";

const BASE = "/modelos";

/* ------------------------- 🔧 helpers internos ------------------------- */

// Normaliza el mensaje de error del backend
const normalizeDetail = (detail) => {
  if (Array.isArray(detail)) {
    return detail.map((d) => d?.msg || d?.detail || JSON.stringify(d)).join(" | ");
  }
  if (detail && typeof detail === "object") {
    return detail.detail || detail.message || JSON.stringify(detail);
  }
  return String(detail || "Error desconocido");
};

// Obtiene el nombre representativo del modelo
const resolveNombre = (m) =>
  m?.nombreModelo ??
  m?.modeloNombre ??
  m?.descripcion ??
  (m?.id != null ? `Modelo #${m.id}` : "—");


// Construye la URL completa para imágenes
const buildFileUrl = (url) => {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;

  const base =
    import.meta.env.VITE_FILES_URL ||
    import.meta.env.VITE_API_URL ||
    window.location.origin; // fallback local

  const baseClean = base.endsWith("/") ? base.slice(0, -1) : base;
  const pathClean = url.startsWith("/") ? url : `/${url}`;
  return `${baseClean}${pathClean}`;
};

// Normaliza un modelo recibido del backend
const normalizeModelo = (m) => {
  if (!m) return m;
  const urlImagen = m.urlImagen ? buildFileUrl(m.urlImagen) : null;
  return {
    ...m,
    urlImagen,
    _nombre: resolveNombre(m),
  };
};

/* --------------------------- 📸 Subir imagen --------------------------- */

const uploadImagen = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    // 👇 backend tiene endpoint POST /modelos/upload-imagen
    const res = await api.post(`${BASE}/upload-imagen`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const data = res.data || {};
    const { filename, urlImagen } = data;

    if (!urlImagen)
      throw new Error("El backend no devolvió la URL de la imagen");

    // Se devuelve la ruta relativa tal como la guarda el backend
    return { filename, urlImagen };
  } catch (err) {
    const detail =
      err.response?.data?.detail ?? err.response?.data ?? err.message;
    throw new Error(
      normalizeDetail(detail) || "Error al subir la imagen del modelo"
    );
  }
};

/* ------------------------------- CRUD ---------------------------------- */

const getAll = async (params = {}) => {
  try {
    const res = await api.get(`${BASE}/`, { params });
    const data = Array.isArray(res.data) ? res.data : res.data?.items ?? [];
    const normalized = data.map((m) => normalizeModelo(m));
    return { items: normalized, total: normalized.length };
  } catch (err) {
    const detail =
      err.response?.data?.detail ?? err.response?.data ?? err.message;
    throw new Error(normalizeDetail(detail) || "Error al obtener modelos");
  }
};

const getById = async (id) => {
  try {
    const res = await api.get(`${BASE}/${id}`);
    return normalizeModelo(res.data);
  } catch (err) {
    const detail =
      err.response?.data?.detail ?? err.response?.data ?? err.message;
    throw new Error(normalizeDetail(detail) || "Modelo no encontrado");
  }
};

const create = async (payload) => {
  try {
    const res = await api.post(`${BASE}/`, payload);
    return normalizeModelo(res.data);
  } catch (err) {
    const detail =
      err.response?.data?.detail ?? err.response?.data ?? err.message;
    throw new Error(normalizeDetail(detail) || "Error al crear modelo");
  }
};

const update = async (id, payload) => {
  try {
    const res = await api.put(`${BASE}/${id}`, payload);
    return normalizeModelo(res.data);
  } catch (err) {
    const detail =
      err.response?.data?.detail ?? err.response?.data ?? err.message;
    throw new Error(normalizeDetail(detail) || "Error al actualizar modelo");
  }
};

const remove = async (id) => {
  try {
    const res = await api.delete(`${BASE}/${id}`);
    return res.data;
  } catch (err) {
    const detail =
      err.response?.data?.detail ?? err.response?.data ?? err.message;
    throw new Error(normalizeDetail(detail) || "Error al eliminar modelo");
  }
};

/* --------------------------- Exportación final ------------------------- */

const ServiceModeloProducto = {
  getAll,
  getById,
  create,
  update,
  remove,
  uploadImagen,
};

export default ServiceModeloProducto;
