import api from "./api";
import { toast } from "react-toastify";

const BASE = "/secciones";

const getAll = async (params = {}) => {
  try {
    const res = await api.get(`${BASE}/`, { params });
    const data = res.data;
    // 🔧 Normaliza para GridGenerico: { items, total } si el backend devuelve []
    if (Array.isArray(data)) return { items: data, total: data.length };
    return data;
  } catch (err) {
    const message = err.response?.data?.detail || err.message || "Error al obtener secciones";
    console.error("Error al obtener secciones:", err);
    toast.error(message);
    // GridGenerico maneja vacío
    return { items: [], total: 0 };
  }
};

const getById = async (id) => {
  try {
    const res = await api.get(`${BASE}/${id}`);
    return res.data;
  } catch (err) {
    const message = err.response?.data?.detail || err.message || "Sección no encontrada";
    console.error("Error al obtener sección:", err);
    toast.error(message);
    return null;
  }
};

const create = async (payload) => {
  try {
    const res = await api.post(`${BASE}/`, payload); // { almacenId, modeloId, descripcion }
    toast.success("Sección creada exitosamente");
    return res.data;
  } catch (err) {
    const message = err.response?.data?.detail || err.message || "Error al crear sección";
    console.error("Error al crear sección:", err);
    toast.error(message);
    throw err;
  }
};

const update = async (id, payload) => {
  try {
    const res = await api.put(`${BASE}/${id}`, payload);
    toast.success("Sección actualizada exitosamente");
    return res.data;
  } catch (err) {
    const message = err.response?.data?.detail || err.message || "Error al actualizar sección";
    console.error("Error al actualizar sección:", err);
    toast.error(message);
    throw err;
  }
};

const remove = async (id) => {
  try {
    const res = await api.delete(`${BASE}/${id}`);
    toast.success("Sección eliminada exitosamente");
    return res.data;
  } catch (err) {
    const message = err.response?.data?.detail || err.message || "Error al eliminar sección";
    console.error("Error al eliminar sección:", err);
    toast.error(message);
    throw err;
  }
};

const ServiceSeccion = { getAll, getById, create, update, remove };
export default ServiceSeccion;
