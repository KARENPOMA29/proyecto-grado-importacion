// src/services/ServiceMovimiento.js
import api from "./api";

const BASE = "/movimientos";

// 👇 ahora acepta params (por ejemplo { usuarioId: 1006 })
const getAll = async (params = {}) => {
  try {
    const cleanParams = {
      search: params.search || "",
      page: Number(params.page || 1),
      pageSize: Number(params.pageSize || 10),

      ...(params.usuarioId && {
        usuarioId: Number(params.usuarioId),
      }),

      ...(params.almacenId && {
        almacenId: Number(params.almacenId),
      }),
      ...(params.estadoProducto && {
        estadoProducto: Number(params.estadoProducto),
      }),

      ...(params.fecha && {
        fecha: params.fecha,
      }),
    };

    const { data } = await api.get(`${BASE}/`, { params: cleanParams });

    if (Array.isArray(data)) {
      return { items: data, total: data.length };
    }

    return {
      items: data.items || [],
      total: data.total ?? 0,
    };
  } catch (err) {
    console.error("❌ Error al listar movimientos:", err?.response?.data);
    throw new Error(
      err?.response?.data?.detail || "Error al obtener los movimientos"
    );
  }
};
const getById = async (id) => {
  try {
    const { data } = await api.get(`${BASE}/${id}`);
    return data;
  } catch (err) {
    console.error("❌ Error al obtener movimiento:", err?.response?.data);
    throw new Error(
      err?.response?.data?.detail || "No se pudo obtener el movimiento"
    );
  }
};

const create = async (payload) => {
  try {
    const { data } = await api.post(`${BASE}/`, payload);
    return data;
  } catch (err) {
    console.error("❌ Error al crear movimiento:", err?.response?.data);
    throw new Error(
      err?.response?.data?.detail || "Error al registrar el movimiento"
    );
  }
};

const update = async (id, payload) => {
  try {
    const { data } = await api.put(`${BASE}/${id}`, payload);
    return data;
  } catch (err) {
    console.error("❌ Error al actualizar movimiento:", err?.response?.data);
    throw new Error(
      err?.response?.data?.detail || "Error al actualizar el movimiento"
    );
  }
};

const remove = async (id) => {
  try {
    const { data } = await api.delete(`${BASE}/${id}`);
    return data;
  } catch (err) {
    console.error("❌ Error al eliminar movimiento:", err?.response?.data);
    throw new Error(
      err?.response?.data?.detail || "No se pudo eliminar el movimiento"
    );
  }
};

const ServiceMovimiento = { getAll, getById, create, update, remove };
export default ServiceMovimiento;
