import api from "./api";
const BASE = "/productos";

// Crear un nuevo producto
const create = async (payload) => (await api.post(`${BASE}/`, payload)).data;

// Obtener todos los productos (usa params si el backend los soporta)
const getAll = async (params = {}) => {
  const { data } = await api.get(`${BASE}/`, { params });
  // tu backend devuelve lista simple []
  return Array.isArray(data) ? data : data.items || [];
};

// Obtener producto por id
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

const ServiceProducto = { create, getAll, getById, getDisponibles };
export default ServiceProducto;