// src/services/ServiceSeccion.js
import api from "./api";

const BASE = "/secciones";

const getAll = async (params = {}) => {
  try {
    const res = await api.get(`${BASE}/`, { params });
    const data = res.data;
    if (Array.isArray(data)) return { items: data, total: data.length };
    return data;
  } catch (err) {
    const message =
      err.response?.data?.detail || err.message || "Error al obtener secciones";
    throw new Error(message);
  }
};


const getById = async (id) => {
  try {
    const res = await api.get(`${BASE}/${id}`);
    return res.data;
  } catch (err) {
    const message =
      err.response?.data?.detail || err.message || "Sección no encontrada";
    throw new Error(message);
  }
};
const getByAlmacen = async (almacenId, params = {}) => {
  return getAll({
    ...params,
    almacenId,
  });
};
const create = async (payload) => {
  try {
    const res = await api.post(`${BASE}/`, payload);
    return res.data;
  } catch (err) {
    const message =
      err.response?.data?.detail || err.message || "Error al crear sección";
    throw new Error(message);
  }
};

const update = async (id, payload) => {
  try {
    const res = await api.put(`${BASE}/${id}`, payload);
    return res.data;
  } catch (err) {
    const message =
      err.response?.data?.detail || err.message || "Error al actualizar sección";
    throw new Error(message);
  }
};

const remove = async (id) => {
  try {
    const res = await api.delete(`${BASE}/${id}`);
    return res.data;
  } catch (err) {
    const message =
      err.response?.data?.detail || err.message || "Error al eliminar sección";
    throw new Error(message);
  }
};

const ServiceSeccion = { getAll, getById, getByAlmacen, create, update, remove };
export default ServiceSeccion;
