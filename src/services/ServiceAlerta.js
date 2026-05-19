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

  async marcarLeida(id) {
    const res = await api.put(`${resource}/${id}/leer`);
    return res.data;
  },

  async verificarStockBajo() {
    const res = await api.post(`${resource}/verificar-stock-bajo`);
    return res.data;
  },

  // ✅ NUEVO
  async enviarStockBajoCorreo() {
    const res = await api.post(
      `${resource}/enviar-stock-bajo-correo`
    );
    return res.data;
  },
};

export default ServiceAlerta;