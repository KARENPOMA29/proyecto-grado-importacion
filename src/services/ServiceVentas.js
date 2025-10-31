// src/services/ServiceVentas.js
import api from "./api";

const BASE = "/ventas";

const create = async (payload) => {
  const { data } = await api.post(`${BASE}/`, payload);
  return data;
};

// 👇 ya lo habías corregido para el grid
const getAll = async (params = {}) => {
  const res = await api.get(`${BASE}/`, { params });
  const data = res.data;

  if (Array.isArray(data)) {
    return { items: data, total: data.length };
  }

  return {
    items: data.items || [],
    total: data.total ?? (data.items ? data.items.length : 0),
  };
};

const getById = async (id) => {
  const { data } = await api.get(`${BASE}/${id}`);
  return data;
};

// 👇 NUEVO: cancelar venta
const cancel = async (id) => {
  const { data } = await api.put(`${BASE}/${id}/cancelar`);
  return data;
};

const ServiceVentas = { create, getAll, getById, cancel };
export default ServiceVentas;
