// src/services/ServiceReporteInventario.js
import api from "./api";

const ServiceReporteInventario = {
  async getReporteInventario(filtros = {}) {
    const params = {};

    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        params[key] = value;
      }
    });

    const res = await api.get("/reportes/inventario", { params });
    return res.data;
  },
};

export default ServiceReporteInventario;
