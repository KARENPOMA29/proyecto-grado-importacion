import api from "./api";

const BASE = "/marcas";

/* ------------------------- 🔧 helpers internos ------------------------- */

// Normaliza el mensaje de error del backend
const normalizeDetail = (detail) => {
  if (Array.isArray(detail)) {
    return detail
      .map((d) => d?.msg || d?.detail || JSON.stringify(d))
      .join(" | ");
  }
  if (detail && typeof detail === "object") {
    return detail.detail || detail.message || JSON.stringify(detail);
  }
  return String(detail || "Error desconocido");
};

// Obtiene el nombre representativo de la marca
const resolveNombre = (m) =>
  m?.nombre ?? (m?.id != null ? `Marca #${m.id}` : "—");

// Normaliza una marca recibida del backend
const normalizeMarca = (m) => {
  if (!m) return m;
  return {
    ...m,
    _nombre: resolveNombre(m),
  };
};

/* ------------------------------- CRUD ---------------------------------- */

const getAll = async (params = {}) => {
  try {
    const res = await api.get(`${BASE}/`, { params });
    const data = Array.isArray(res.data) ? res.data : res.data?.items ?? [];
    const normalized = data.map((m) => normalizeMarca(m));
    return { items: normalized, total: normalized.length };
  } catch (err) {
    const detail =
      err.response?.data?.detail ?? err.response?.data ?? err.message;
    throw new Error(normalizeDetail(detail) || "Error al obtener marcas");
  }
};

const getById = async (id) => {
  try {
    const res = await api.get(`${BASE}/${id}`);
    return normalizeMarca(res.data);
  } catch (err) {
    const detail =
      err.response?.data?.detail ?? err.response?.data ?? err.message;
    throw new Error(normalizeDetail(detail) || "Marca no encontrada");
  }
};

const create = async (payload) => {
  try {
    const res = await api.post(`${BASE}/`, payload);
    return normalizeMarca(res.data);
  } catch (err) {
    const detail =
      err.response?.data?.detail ?? err.response?.data ?? err.message;
    throw new Error(normalizeDetail(detail) || "Error al crear marca");
  }
};

const update = async (id, payload) => {
  try {
    const res = await api.put(`${BASE}/${id}`, payload);
    return normalizeMarca(res.data);
  } catch (err) {
    const detail =
      err.response?.data?.detail ?? err.response?.data ?? err.message;
    throw new Error(normalizeDetail(detail) || "Error al actualizar marca");
  }
};

const remove = async (id) => {
  try {
    const res = await api.delete(`${BASE}/${id}`);
    return res.data;
  } catch (err) {
    const detail =
      err.response?.data?.detail ?? err.response?.data ?? err.message;
    throw new Error(normalizeDetail(detail) || "Error al eliminar marca");
  }
};

/* --------------------------- Exportación final ------------------------- */

const ServiceMarca = {
  getAll,
  getById,
  create,
  update,
  remove,
};

export default ServiceMarca;
