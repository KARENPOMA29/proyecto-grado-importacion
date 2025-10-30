import api from "./api";

const BASE = "/sucursales";

const getAll = async (params = {}) => {
  try {
    const res = await api.get(`${BASE}/`, { params });
    const data = res.data;
    if (Array.isArray(data)) return { items: data, total: data.length };
    return data;
  } catch (err) {
    const message = err.response?.data?.detail || err.message || 'Error al obtener sucursales';
    throw new Error(message);
  }
};

const getById = async (id) => {
  try {
    const res = await api.get(`${BASE}/${id}`);
    return res.data;
  } catch (err) {
    const message = err.response?.data?.detail || err.message || 'Sucursal no encontrada';
    throw new Error(message);
  }
};

const create = async (payload) => {
  try {
    const res = await api.post(`${BASE}/`, payload);
    return res.data;
  } catch (err) {
    const message = err.response?.data?.detail || err.message || 'Error al crear sucursal';
    throw new Error(message);
  }
};

const update = async (id, payload) => {
  try {
    const res = await api.put(`${BASE}/${id}`, payload);
    return res.data;
  } catch (err) {
    const message = err.response?.data?.detail || err.message || 'Error al actualizar sucursal';
    throw new Error(message);
  }
};

const remove = async (id) => {
  try {
    const res = await api.delete(`${BASE}/${id}`);
    return res.data;
  } catch (err) {
    const message = err.response?.data?.detail || err.message || 'Error al eliminar sucursal';
    throw new Error(message);
  }
};

const ServiceSucursal = {
  getAll,
  getById,
  create,
  update,
  remove,
};

export default ServiceSucursal;
