import api from "./api";

const resource = "/dashboard-empleado";

const ServiceDashboardEmpleado = {
  async getDashboardEmpleado(empleadoId) {
    const response = await api.get(`${resource}/${empleadoId}`);
    return response.data;
  },
};

export default ServiceDashboardEmpleado;