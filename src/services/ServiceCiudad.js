import api from "./api";

const BASE = "/ciudades";

// Obtener todas
const getAll = async (params = {}) => {
  try {
    const res = await api.get(`${BASE}/`, { params });
    const data = res.data;

    if (Array.isArray(data)) return { items: data, total: data.length };
    return data;

  } catch (err) {
    const message = err.response?.data?.detail || err.message || 'Error al obtener ciudades';
    throw new Error(message);
  }
};

// Obtener por ID
const getById = async (id) => {
  try {
    const res = await api.get(`${BASE}/${id}`);
    return res.data;
  } catch (err) {
    const message = err.response?.data?.detail || err.message || 'Ciudad no encontrada';
    throw new Error(message);
  }
};

// Crear ciudad
const create = async (payload) => {
  try {
    const res = await api.post(`${BASE}/`, payload);
    return res.data;
  } catch (err) {
    const message = err.response?.data?.detail || err.message || 'Error al crear ciudad';
    throw new Error(message);
  }
};

// Actualizar ciudad
const update = async (id, payload) => {
  try {
    const res = await api.put(`${BASE}/${id}`, payload);
    return res.data;
  } catch (err) {
    const message = err.response?.data?.detail || err.message || 'Error al actualizar ciudad';
    throw new Error(message);
  }
};

// Eliminar ciudad
const remove = async (id) => {
  try {
    const res = await api.delete(`${BASE}/${id}`);
    return res.data;
  } catch (err) {
    const message = err.response?.data?.detail || err.message || 'Error al eliminar ciudad';
    throw new Error(message);
  }
};

const ServiceCiudad = {
  getAll,
  getById,
  create,
  update,
  remove,
};

export default ServiceCiudad;
