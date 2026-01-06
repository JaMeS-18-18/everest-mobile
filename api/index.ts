/// <reference types="vite/client" />
import axios from 'axios';


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - har bir so'rovga token qo'shadi
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - xatolarni qayta ishlash
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 401 - Unauthorized, token eskirgan
    const url = error?.config?.url || '';
    if (
      error.response?.status === 401 &&
      (url.includes('/auth/me') || url.includes('/auth/login'))
    ) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
