// src/services/ServiceAlerta.js
import api from "./api";

const resource = "/alertas";

const ServiceAlerta = {
  async getDashboard(limit = 5) {
    const res = await api.get(`${resource}/dashboard`, {
      params: { limite: limit },
    });
    return res.data;
  },

  // 👇 nuevo método para marcar como leída
  async marcarLeida(id) {
    const res = await api.put(`${resource}/${id}/leer`);
    return res.data;
  },
};

export default ServiceAlerta;
