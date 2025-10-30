import api from './api';

const BASE = '/empleados';

const normalizeDetail = (detail) => {
  if (Array.isArray(detail)) {
    // FastAPI 422: [{loc, msg, type}, ...]
    return detail.map(d => d?.msg || d?.detail || JSON.stringify(d)).join(' | ');
  }
  if (detail && typeof detail === 'object') {
    return detail.detail || detail.message || JSON.stringify(detail);
  }
  return String(detail || 'Error desconocido');
};

const getAll = async (params = {}) => {
  try {
    const res = await api.get(`${BASE}`, { params });
    const data = res.data;
    if (Array.isArray(data)) return { items: data, total: data.length };
    return data;
  } catch (err) {
    const detail = err.response?.data?.detail ?? err.response?.data ?? err.message;
    throw new Error(normalizeDetail(detail) || 'Error al obtener empleados');
  }
};

const getById = async (id) => {
  try {
    const res = await api.get(`${BASE}/${id}`);
    return res.data;
  } catch (err) {
    const detail = err.response?.data?.detail ?? err.response?.data ?? err.message;
    throw new Error(normalizeDetail(detail) || 'Empleado no encontrado');
  }
};

const create = async (payload) => {
  try {
    const res = await api.post(`${BASE}`, payload);
    return res.data;
  } catch (err) {
    const detail = err.response?.data?.detail ?? err.response?.data ?? err.message;
    throw new Error(normalizeDetail(detail) || 'Error al crear empleado');
  }
};

const update = async (id, payload) => {
  try {
    const res = await api.put(`${BASE}/${id}`, payload);
    return res.data;
  } catch (err) {
    const detail = err.response?.data?.detail ?? err.response?.data ?? err.message;
    throw new Error(normalizeDetail(detail) || 'Error al actualizar empleado');
  }
};

const remove = async (id) => {
  try {
    const res = await api.delete(`${BASE}/${id}`);
    return res.data;
  } catch (err) {
    const detail = err.response?.data?.detail ?? err.response?.data ?? err.message;
    throw new Error(normalizeDetail(detail) || 'Error al eliminar empleado');
  }
};

const ServiceEmpleado = { getAll, getById, create, update, remove };
export default ServiceEmpleado;
