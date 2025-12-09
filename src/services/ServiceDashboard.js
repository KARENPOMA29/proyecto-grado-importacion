// src/services/ServiceDashboard.js
class ServiceDashboard {
  static async getStats() {
    try {
      // Por ahora simulamos datos estáticos
      // En producción, aquí harías las llamadas a tu API
      return {
        totalVentas: 12450,
        totalProductos: 856,
        totalClientes: 324,
        importacionesPendientes: 12,
        alertasStock: 8,
      };
    } catch (error) {
      console.error("Error obteniendo estadísticas:", error);
      return null;
    }
  }

  static async getRecentActivity() {
    try {
      // Simular actividad reciente
      return [
        {
          id: 1,
          tipo: "Venta",
          mensaje: "Nueva venta registrada - Bs. 1,200",
          fecha: new Date(),
        },
        {
          id: 2,
          tipo: "Importación",
          mensaje: "Importación #1234 recibida",
          fecha: new Date(Date.now() - 3600000),
        },
        // ... más actividades
      ];
    } catch (error) {
      console.error("Error obteniendo actividad reciente:", error);
      return [];
    }
  }
}

export default ServiceDashboard;