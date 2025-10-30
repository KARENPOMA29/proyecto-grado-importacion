import api from "./api";

const BASE = "/clientes";

const getAll = async (params = {}) => {
	try {
		const res = await api.get(`${BASE}/`, { params });
		const data = res.data;
		if (Array.isArray(data)) return { items: data, total: data.length };
		return data;
	} catch (err) {
		const message = err.response?.data?.detail || err.message || 'Error al obtener clientes';
		throw new Error(message);
	}
};

const getById = async (id) => {
	try {
		const res = await api.get(`${BASE}/${id}`);
		return res.data;
	} catch (err) {
		const message = err.response?.data?.detail || err.message || 'Cliente no encontrado';
		throw new Error(message);
	}
};

const create = async (payload) => {
	try {
		const res = await api.post(`${BASE}/`, payload);
		return res.data;
	} catch (err) {
		const message = err.response?.data?.detail || err.message || 'Error al crear cliente';
		throw new Error(message);
	}
};

const update = async (id, payload) => {
	try {
		const res = await api.put(`${BASE}/${id}`, payload);
		return res.data;
	} catch (err) {
		const message = err.response?.data?.detail || err.message || 'Error al actualizar cliente';
		throw new Error(message);
	}
};

const remove = async (id) => {
	try {
		const res = await api.delete(`${BASE}/${id}`);
		return res.data;
	} catch (err) {
		const message = err.response?.data?.detail || err.message || 'Error al eliminar cliente';
		throw new Error(message);
	}
};

const ServiceCliente = {
	getAll,
	getById,
	create,
	update,
	remove,
};

export default ServiceCliente;
