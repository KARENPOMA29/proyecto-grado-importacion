import api from "./api";
const BASE = "/productos";

const create = async (payload) => (await api.post(`${BASE}/`, payload)).data;

const getAll = async (params = {}) => {
  const { data } = await api.get(`${BASE}/`, { params });
  // ahora el backend devuelve lista simple: []
  return Array.isArray(data) ? data : data.items || [];
};

const getById = async (id) => {
  const { data } = await api.get(`${BASE}/${id}`);
  return data;
};

const ServiceProducto = { getAll, getById, create };
export default ServiceProducto;
