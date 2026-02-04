import axios from "axios";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.86:3001";

export const api = axios.create({
    baseURL: `${apiUrl}/api`,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});
