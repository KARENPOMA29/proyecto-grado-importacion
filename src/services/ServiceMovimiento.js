// src/services/ServiceMovimiento.js
import api from "./api";

const BASE = "/movimientos";

const getAll = async () => {
  try {
    const { data } = await api.get(`${BASE}/`);
    // backend devuelve lista simple
    return { items: data, total: data.length };
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
