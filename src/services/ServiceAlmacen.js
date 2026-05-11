// src/services/ServiceAlmacen.js
import api from "./api";

const BASE = "/almacenes";

const getAll = async (params = {}) => {
  try {
    const res = await api.get(`${BASE}/`, { params });
    const data = res.data;
    // Normaliza para GridGenerico
    if (Array.isArray(data)) return { items: data, total: data.length };
    return data;
  } catch (err) {
    const message =
      err.response?.data?.detail ||
      err.message ||
      "Error al obtener almacenes";
    throw new Error(message);
  }
};
const getCombo = async () => {
  try {
    const res = await api.get(`${BASE}/combo`);
    return res.data;
  } catch (err) {
    const message =
      err.response?.data?.detail ||
      err.message ||
      "Error al obtener almacenes";

    throw new Error(message);
  }
};
const getById = async (id) => {
  try {
    const res = await api.get(`${BASE}/${id}`);
    return res.data;
  } catch (err) {
    const message =
      err.response?.data?.detail ||
      err.message ||
      "Almacén no encontrado";
    throw new Error(message);
  }
};

const create = async (payload) => {
  try {
    const res = await api.post(`${BASE}/`, payload); // { nombre, direccion, sucursalId }
    return res.data;
  } catch (err) {
    const message =
      err.response?.data?.detail ||
      err.message ||
      "Error al crear almacén";
    throw new Error(message);
  }
};

const update = async (id, payload) => {
  try {
    const res = await api.put(`${BASE}/${id}`, payload);
    return res.data;
  } catch (err) {
    const message =
      err.response?.data?.detail ||
      err.message ||
      "Error al actualizar almacén";
    throw new Error(message);
  }
};

const remove = async (id) => {
  try {
    const res = await api.delete(`${BASE}/${id}`);
    return res.data;
  } catch (err) {
    const message =
      err.response?.data?.detail ||
      err.message ||
      "Error al eliminar almacén";
    throw new Error(message);
  }
};

// 👉 helper para filtrar por sucursal usando el mismo getAll
const getBySucursal = async (sucursalId, params = {}) => {
  return getAll({
    ...params,
    sucursalId,
  });
};

const ServiceAlmacen = {
  getAll,
  getById,
  create,
  update,
  remove,
  getBySucursal,
  getCombo
};

export default ServiceAlmacen;
