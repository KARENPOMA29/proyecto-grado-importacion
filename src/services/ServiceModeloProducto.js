// services/ServiceModeloProducto.js
import api from "./api";

const BASE = "/modelos";

// 🔧 helper: resuelve un nombre robusto
const resolveNombre = (m) =>
  m?.nombre ??
  m?.nombreModelo ??
  m?.modeloNombre ??
  m?.descripcion ??
  (m?.id != null ? `Modelo #${m.id}` : "—");

const getAll = async (params = {}) => {
  try {
    const res = await api.get(`${BASE}/`, { params });
    const data = res.data;

    const arr = Array.isArray(data) ? data : (data?.items ?? []);
    const normalized = arr.map((m) => ({ ...m, _nombre: resolveNombre(m) }));

    // 👇 Devolvemos el shape que espera tu GridGenerico
    return { items: normalized, total: normalized.length };
  } catch (err) {
    const message = err.response?.data?.detail || err.message || "Error al obtener modelos";
    throw new Error(message);
  }
};

const getById = async (id) => {
  try {
    const res = await api.get(`${BASE}/${id}`);
    const m = res.data;
    return { ...m, _nombre: resolveNombre(m) }; // opcional pero útil
  } catch (err) {
    const message = err.response?.data?.detail || err.message || "Modelo no encontrado";
    throw new Error(message);
  }
};

const create = async (payload) => {
  try {
    const res = await api.post(`${BASE}/`, payload);
    return res.data;
  } catch (err) {
    const message = err.response?.data?.detail || err.message || "Error al crear modelo";
    throw new Error(message);
  }
};

const update = async (id, payload) => {
  try {
    const res = await api.put(`${BASE}/${id}`, payload);
    return res.data;
  } catch (err) {
    const message = err.response?.data?.detail || err.message || "Error al actualizar modelo";
    throw new Error(message);
  }
};

const remove = async (id) => {
  try {
    const res = await api.delete(`${BASE}/${id}`);
    return res.data;
  } catch (err) {
    const message = err.response?.data?.detail || err.message || "Error al eliminar modelo";
    throw new Error(message);
  }
};

const ServiceModeloProducto = {
  getAll,
  getById,
  create,
  update,
  remove,
};

export default ServiceModeloProducto;
