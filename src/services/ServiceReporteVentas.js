import api from "./api";

const BASE = "/reportes/ventas";

const getDashboard = async (params = {}) => {
  try {
    const res = await api.get(`${BASE}/dashboard`, { params });
    return res.data;
  } catch (err) {
    const message =
      err.response?.data?.detail ||
      err.message ||
      "Error al obtener dashboard de ventas";
    throw new Error(message);
  }
};

const getDetalle = async (params = {}) => {
  try {
    const res = await api.get(`${BASE}/detalle`, { params });
    return res.data;
  } catch (err) {
    const message =
      err.response?.data?.detail ||
      err.message ||
      "Error al obtener detalle de ventas";
    throw new Error(message);
  }
};

const getPorDia = async (params = {}) => {
  try {
    const res = await api.get(`${BASE}/por-dia`, { params });
    return res.data;
  } catch (err) {
    const message =
      err.response?.data?.detail ||
      err.message ||
      "Error al obtener ventas por día";
    throw new Error(message);
  }
};

const getPorSucursal = async (params = {}) => {
  try {
    const res = await api.get(`${BASE}/por-sucursal`, { params });
    return res.data;
  } catch (err) {
    const message =
      err.response?.data?.detail ||
      err.message ||
      "Error al obtener ventas por sucursal";
    throw new Error(message);
  }
};

const getPorProducto = async (params = {}) => {
  try {
    const res = await api.get(`${BASE}/por-producto`, { params });
    return res.data;
  } catch (err) {
    const message =
      err.response?.data?.detail ||
      err.message ||
      "Error al obtener ventas por producto";
    throw new Error(message);
  }
};

const ServiceReporteVentas = {
  getDashboard,
  getDetalle,
  getPorDia,
  getPorSucursal,
  getPorProducto,
};

export default ServiceReporteVentas;