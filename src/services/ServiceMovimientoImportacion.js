// src/services/ServiceMovimientoImportacion.js
import api from "./api";

// 👈 usa exactamente la ruta de tu backend
// si en FastAPI tienes @router.post("/movimientos-importacion/")
const BASE = "/movimientos-importacion";

const create = async (payload) => {
  try {
    console.log("📤 Enviando movimiento de importación:", payload);
    const { data } = await api.post(`${BASE}/`, payload);
    console.log("✅ Movimiento creado:", data);
    return data;
  } catch (err) {
    console.error(
      "❌ Error al crear movimiento:",
      err?.response?.data || err.message || err
    );
    throw err;
  }
};

const update = async (id, payload) => {
  try {
    console.log("✏️ Actualizando movimiento:", id, payload);
    const { data } = await api.put(`${BASE}/${id}`, payload);
    return data;
  } catch (err) {
    console.error(
      "❌ Error al actualizar movimiento:",
      err?.response?.data || err.message || err
    );
    throw err;
  }
};

const getByImportacion = async (importacionId) => {
  try {
    const { data } = await api.get(`${BASE}/importacion/${importacionId}`);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error(
      "❌ Error al listar movimientos por importación:",
      err?.response?.data || err.message || err
    );
    throw err;
  }
};

const getById = async (id) => {
  try {
    const { data } = await api.get(`${BASE}/${id}`);
    return data;
  } catch (err) {
    console.error(
      "❌ Error al obtener movimiento:",
      err?.response?.data || err.message || err
    );
    throw err;
  }
};

const remove = async (id) => {
  try {
    const { data } = await api.delete(`${BASE}/${id}`);
    return data;
  } catch (err) {
    console.error(
      "❌ Error al eliminar movimiento:",
      err?.response?.data || err.message || err
    );
    throw err;
  }
};

const getEstadoByImportacion = async (importacionId) => {
  try {
    const { data } = await api.get(`${BASE}/estado/${importacionId}`);
    // data = [{ code, label, completado, movimiento }, ...]
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error(
      "❌ Error al obtener estado de movimientos por importación:",
      err?.response?.data || err.message || err
    );
    throw err;
  }
};

const ServiceMovimientoImportacion = {
  create,
  update,
  getByImportacion,
  getById,
  remove,
  getEstadoByImportacion,
};

export default ServiceMovimientoImportacion;
