import ApiClient from "./apiClient";

const API_URL = import.meta.env.VITE_API_URL; // from .env

export const getModules = () => ApiClient.get(`${API_URL}/grouped-modules`);
