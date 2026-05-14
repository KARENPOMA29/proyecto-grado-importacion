import api from "./api";

const BASE = "/reportes/importaciones";

const getDashboard = async () => {
  const { data } = await api.get(`${BASE}/dashboard`);
  return data;
};

const getRetrasadas = async (params = {}) => {
  const { data } = await api.get(`${BASE}/retrasadas`, { params });
  return data;
};

const getConcluidas = async (params = {}) => {
  const { data } = await api.get(`${BASE}/concluidas`, { params });
  return data;
};

const getProveedores = async () => {
  const { data } = await api.get(`${BASE}/proveedores`);
  return data;
};

const getEmpleados = async () => {
  const { data } = await api.get(`${BASE}/empleados`);
  return data;
};

const getPorMes = async () => {
  const { data } = await api.get(`${BASE}/por-mes`);
  return data;
};

const getPorModelo = async () => {
  const { data } = await api.get(`${BASE}/por-modelo`);
  return data;
};

const getTopModelosRentables = async () => {
  const { data } = await api.get(`${BASE}/top-modelos-rentables`);
  return data;
};

const getProductosObservados = async (params = {}) => {
  const { data } = await api.get(`${BASE}/productos-observados`, { params });
  return data;
};

const getResumenFinanciero = async () => {
  const { data } = await api.get(`${BASE}/resumen-financiero`);
  return data;
};

const ServiceReporteImportaciones = {
  getDashboard,
  getRetrasadas,
  getConcluidas,
  getProveedores,
  getEmpleados,
  getPorMes,
  getPorModelo,
  getTopModelosRentables,
  getProductosObservados,
  getResumenFinanciero,
};

export default ServiceReporteImportaciones;