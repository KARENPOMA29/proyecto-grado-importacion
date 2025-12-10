// src/services/ServiceReporteVentas.js
import api from "./api";

// Reporte de ventas
// Usa el endpoint GET /reportes/ventas del backend
const ServiceReporteVentas = {
  async getReporteVentas(filtros = {}) {
    // limpiamos filtros vacíos
    const params = {};
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        params[key] = value;
      }
    });

    const res = await api.get("/reportes/ventas", { params });
    return res.data;
  },
};

export default ServiceReporteVentas;
