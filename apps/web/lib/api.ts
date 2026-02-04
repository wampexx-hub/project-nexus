import axios from "axios";

export const api = axios.create({
    baseURL: "/api",
    timeout: 10000, // 10 seconds timeout
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
