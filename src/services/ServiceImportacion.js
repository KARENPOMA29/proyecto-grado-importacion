// services/ServiceImportacion.js
import api from "./api";

const BASE = "/importaciones";

function toISODate(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (m) {
    const [, dd, mm, yyyy] = m;
    return `${yyyy}-${mm}-${dd}`;
  }
  if (value instanceof Date && !isNaN(value)) {
    const yyyy = value.getFullYear();
    const mm = String(value.getMonth() + 1).padStart(2, "0");
    const dd = String(value.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  return value;
}

function parseFastAPIErr(err) {
  const detail = err?.response?.data?.detail;
  if (Array.isArray(detail)) {
    return detail
      .map((e) => `${(e.loc || []).join(".")}: ${e.msg}`)
      .join(" | ");
  }
  if (typeof detail === "string") return detail;
  return err?.message || "Error al procesar importación";
}

function getCurrentUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const getAll = async (params = {}) => {
  const {
    search = "",
    page = 1,
    pageSize = 10,
  } = params;

  const { data } = await api.get(`${BASE}/`, {
    params: {
      search: search || undefined,
      page,
      pageSize,
    },
  });

  if (Array.isArray(data)) {
    return { items: data, total: data.length };
  }

  return {
    items: data.items || [],
    total: data.total || 0,
  };
};
const getControl = async (params = {}) => {
  const {
    search = "",
    page = 1,
    pageSize = 10,
    situacion = "",
  } = params;

  const { data } = await api.get(`${BASE}/control`, {
    params: {
      search,
      page,
      pageSize,
      situacion: situacion || undefined,
    },
  });

  return {
    items: data.items || [],
    total: data.total || 0,
  };
};
const getById = async (id) => {
  const { data } = await api.get(`${BASE}/${id}`);
  return data;
};

const create = async (payload) => {
  try {
    const user = getCurrentUser();
    const empleadoId = payload.empleadoId || user?.id; // por si se lo pasan
    const idEmpleadoAsignado = payload.idEmpleadoAsignado;

    const clean = {
      codigo: String(payload.codigo ?? "").trim(),
      proveedorId: Number(payload.proveedorId),
      fechaLlegada: toISODate(payload.fechaLlegada),
      estado: 1, // 👈 entero, activo
      descripcion: payload.descripcion?.trim() || null,
      empleadoId: Number(empleadoId),
      idEmpleadoAsignado: Number(idEmpleadoAsignado),
    };

    if (!clean.codigo) throw new Error("El código es requerido");
    if (!clean.proveedorId) throw new Error("El proveedor es requerido");
    if (!clean.empleadoId)
      throw new Error("No hay usuario logueado (empleadoId)");
    if (!clean.fechaLlegada)
      throw new Error("La fecha de llegada es requerida");
    if (!clean.idEmpleadoAsignado)
      throw new Error("El empleado asignado es requerido");

    const res = await api.post(`${BASE}/`, clean);
    return res.data;
  } catch (err) {
    console.error(
      "❌ Error creando importación. Respuesta:",
      err?.response?.data
    );
    throw new Error(parseFastAPIErr(err));
  }
};

const update = async (id, payload) => {
  try {
    const clean = {
      proveedorId: payload.proveedorId
        ? Number(payload.proveedorId)
        : undefined,
      fechaLlegada: payload.fechaLlegada
        ? toISODate(payload.fechaLlegada)
        : undefined,
      descripcion: payload.descripcion?.trim?.() ?? undefined,
      idEmpleadoAsignado: payload.idEmpleadoAsignado
        ? Number(payload.idEmpleadoAsignado)
        : undefined,
      // si más adelante dejas editar estado, aquí se puede mandar
    };

    const res = await api.put(`${BASE}/${id}`, clean);
    return res.data;
  } catch (err) {
    console.error(
      "❌ Error actualizando importación. Respuesta:",
      err?.response?.data
    );
    throw new Error(parseFastAPIErr(err));
  }
};

const remove = async (id) => {
  const { data } = await api.delete(`${BASE}/${id}`);
  return data;
};
const getByEmpleado = async (empleadoId) => {
  const { data } = await api.get(`${BASE}/empleado/${empleadoId}`);
  return Array.isArray(data) ? data : data.items || data;
};
const getConcluidas = async (params = {}) => {
  const { search = "", page = 1, pageSize = 1000 } = params;

  const { data } = await api.get(`${BASE}/concluidas`, {
    params: {
      search: search || undefined,
      page,
      pageSize,
    },
  });

  if (Array.isArray(data)) {
    return { items: data, total: data.length };
  }

  return {
    items: data.items || [],
    total: data.total || 0,
  };
};
const ServiceImportacion = { getAll, getById, create, update, remove, getByEmpleado, getControl, getConcluidas };
export default ServiceImportacion;
