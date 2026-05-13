// src/services/ServiceVentas.js
import api from "./api";

const BASE = "/ventas";

const create = async (payload) => {
  const { data } = await api.post(`${BASE}/`, payload);
  return data;
};

const getAll = async (params = {}) => {
  try {
    const cleanParams = {
      search: params.search || "",
      page: Number(params.page || 1),
      pageSize: Number(params.pageSize || 10),

      ...(params.sucursalId && {
        sucursalId: Number(params.sucursalId),
      }),

      ...(params.empleadoId && {
        empleadoId: Number(params.empleadoId),
      }),
    };

    console.log("PARAMS VENTAS =>", cleanParams);

    const res = await api.get(`${BASE}/`, {
      params: cleanParams,
    });

    const data = res.data;

    return {
      items: Array.isArray(data) ? data : data.items || [],
      total: data.total ?? 0,
    };
  } catch (err) {
    console.error("ERROR GET VENTAS:", err);

    return {
      items: [],
      total: 0,
    };
  }
};

const getById = async (id) => {
  const { data } = await api.get(`${BASE}/${id}`);
  return data;
};

const cancel = async (id) => {
  const { data } = await api.put(`${BASE}/${id}/cancelar`);
  return data;
};

const ServiceVentas = { create, getAll, getById, cancel };

export default ServiceVentas;