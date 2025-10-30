import api from "./api";
import { toast } from "react-toastify";

const BASE = "/categorias";

const getAll = async (params = {}) => {
  try {
    const res = await api.get(`${BASE}/`, { params });
    const data = res.data;
    if (Array.isArray(data)) return { items: data, total: data.length };
    return data;
  } catch (err) {
    const message = err.response?.data?.detail || err.message || "Error al obtener categorías";
    toast.error(message);
    throw new Error(message);
  }
};

const getById = async (id) => {
  try {
    const res = await api.get(`${BASE}/${id}`);
    return res.data;
  } catch (err) {
    const message = err.response?.data?.detail || err.message || "Categoría no encontrada";
    toast.error(message);
    throw new Error(message);
  }
};

const create = async (payload) => {
  try {
    const res = await api.post(`${BASE}/`, payload);
    toast.success("✅ Categoría creada exitosamente");
    return res.data;
  } catch (err) {
    const message = err.response?.data?.detail || err.message || "Error al crear categoría";
    toast.error(message);
    throw new Error(message);
  }
};

const update = async (id, payload) => {
  try {
    const res = await api.put(`${BASE}/${id}`, payload);
    toast.success("✅ Categoría actualizada correctamente");
    return res.data;
  } catch (err) {
    const message = err.response?.data?.detail || err.message || "Error al actualizar categoría";
    toast.error(message);
    throw new Error(message);
  }
};

const remove = async (id) => {
  try {
    const res = await api.delete(`${BASE}/${id}`);
    toast.success("🗑️ Categoría eliminada correctamente");
    return res.data;
  } catch (err) {
    const message = err.response?.data?.detail || err.message || "Error al eliminar categoría";
    toast.error(message);
    throw new Error(message);
  }
};

const ServiceCategoria = {
  getAll,
  getById,
  create,
  update,
  remove,
};

export default ServiceCategoria;
