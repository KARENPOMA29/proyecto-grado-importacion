import axios from 'axios';
import api from "./api";


export const login = async (credentials) => {
    try {
        const response = await api.post(`/auth/login/`, credentials);
        if (response.data) {
            // Guardar datos del usuario en localStorage
            localStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    } catch (error) {
        throw error.response?.data?.detail || 'Error en el inicio de sesión';
    }
};

export const logout = () => {
    localStorage.removeItem('user');
};

export const getCurrentUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

export const isAuthorized = (allowedRoles) => {
    const user = getCurrentUser();
    return user && allowedRoles.includes(user.rol);
};