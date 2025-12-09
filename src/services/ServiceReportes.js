// src/services/ServiceReportes.js
import api from "./api";

const ServiceReportes = {
  getVentas: async (params = {}) => {
    // params: { fecha_desde, fecha_hasta, sucursal_id, empleado_id }
    const { data } = await api.get("/reportes/ventas", { params });
    return data;
  },

  getImportaciones: async (params = {}) => {
    // params: { fecha_desde, fecha_hasta, proveedor_id }
    const { data } = await api.get("/reportes/importaciones", { params });
    return data;
  },

  getStock: async (solo_en_alerta = false) => {
    const { data } = await api.get("/reportes/stock", {
      params: { solo_en_alerta },
    });
    return data;
  },
};

export default ServiceReportes;
