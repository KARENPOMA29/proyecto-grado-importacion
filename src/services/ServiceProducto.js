// src/services/ServiceProducto.js
import api from "./api";

const BASE = "/productos";

const create = async (payload) => (await api.post(`${BASE}/`, payload)).data;

const getAll = async (params = {}) => {
  const { data } = await api.get(`${BASE}/`, { params });
  return Array.isArray(data) ? data : data.items || [];
};

const getById = async (id) => {
  const { data } = await api.get(`${BASE}/${id}`);
  return data;
};

const getDisponibles = async () => {
  const { data } = await api.get(`${BASE}/`, {
    params: { estado: 1 },
  });
  return Array.isArray(data) ? data : data.items || [];
};

const getBySerie = async (serie) => {
  const { data } = await api.get(`${BASE}/by-serie/${serie}`);
  return data; // será null si no existe
};

const update = async (id, payload) =>
  (await api.put(`${BASE}/${id}`, payload)).data;

const getDetalleBySerie = async (serie) => {
  const { data } = await api.get(`${BASE}/detalle/by-serie/${serie}`);
  return data; // puede ser null
};

const getDisponiblesPorSucursal = async (sucursalId) => {
  const { data } = await api.get(`/productos/disponibles/sucursal/${sucursalId}`);
  return Array.isArray(data) ? data : data.items || [];
};
const ServiceProducto = {
  create,
  getAll,
  getById,
  getDisponibles,
  getBySerie,
  getDetalleBySerie,
  update,
  getDisponiblesPorSucursal
};

export default ServiceProducto;
