// src/services/ServiceReporteInventario.js

import api from "./api";

const BASE = "/reportes/entradas";

const cleanParams = (params = {}) => {
  const cleaned = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      cleaned[key] = value;
    }
  });

  return cleaned;
};

const buildPaginatedResponse = (data) => ({
  items: data?.items || [],
  total: data?.total || 0,
  page: data?.page || 1,
  pageSize: data?.pageSize || 20,
});

// ============================================================
// ENTRADAS HISTÓRICAS
// ============================================================

const getDashboard = async (params = {}) => {
  const { data } = await api.get(`${BASE}/dashboard`, {
    params: cleanParams(params),
  });

  return data || {};
};

const getDetalle = async (params = {}) => {
  const { data } = await api.get(`${BASE}/detalle`, {
    params: cleanParams(params),
  });

  return buildPaginatedResponse(data);
};

const getPorDia = async (params = {}) => {
  const { data } = await api.get(`${BASE}/por-dia`, {
    params: cleanParams(params),
  });

  return buildPaginatedResponse(data);
};

const getPorSucursalAlmacen = async (params = {}) => {
  const { data } = await api.get(`${BASE}/por-sucursal-almacen`, {
    params: cleanParams(params),
  });

  return buildPaginatedResponse(data);
};

const getPorProducto = async (params = {}) => {
  const { data } = await api.get(`${BASE}/por-producto`, {
    params: cleanParams(params),
  });

  return buildPaginatedResponse(data);
};

const getPorImportacion = async (params = {}) => {
  const { data } = await api.get(`${BASE}/por-importacion`, {
    params: cleanParams(params),
  });

  return buildPaginatedResponse(data);
};

const getPorProveedor = async (params = {}) => {
  const { data } = await api.get(`${BASE}/por-proveedor`, {
    params: cleanParams(params),
  });

  return buildPaginatedResponse(data);
};

const getObservados = async (params = {}) => {
  const { data } = await api.get(`${BASE}/observados`, {
    params: cleanParams(params),
  });

  return buildPaginatedResponse(data);
};

// ============================================================
// STOCK ACTUAL
// ============================================================

const getStockDashboard = async (params = {}) => {
  const { data } = await api.get(`${BASE}/stock/dashboard`, {
    params: cleanParams(params),
  });

  return data || {};
};

const getStockActual = async (params = {}) => {
  const { data } = await api.get(`${BASE}/stock/actual`, {
    params: cleanParams(params),
  });

  return buildPaginatedResponse(data);
};

const getStockDetalle = async (params = {}) => {
  const { data } = await api.get(`${BASE}/stock/detalle`, {
    params: cleanParams(params),
  });

  return buildPaginatedResponse(data);
};

const ServiceReporteInventario = {
  // Entradas
  getDashboard,
  getDetalle,
  getPorDia,
  getPorSucursalAlmacen,
  getPorProducto,
  getPorImportacion,
  getPorProveedor,
  getObservados,

  // Stock
  getStockDashboard,
  getStockActual,
  getStockDetalle,
};

export default ServiceReporteInventario;