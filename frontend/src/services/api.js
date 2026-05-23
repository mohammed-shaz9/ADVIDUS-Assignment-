import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Interceptor to attach JWT token to authorization header automatically
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

export default api;
// Export key endpoints as functions for cleaner component usage
export const loginUser = (data) => api.post('/auth/login', data);
export const registerUser = (data) => api.post('/auth/register', data);
export const getTasks = () => api.get('/tasks');
export const createTask = (data) => api.post('/tasks', data);
export const updateTask = (id, data) => api.patch(`/tasks/${id}`, data);
export const deleteTask = (id) => api.delete(`/tasks/${id}`);

// Admin APIs
export const getAdminUsers = () => api.get('/admin/users');
export const deleteAdminUser = (id) => api.delete(`/admin/users/${id}`);
export const updateAdminUserStatus = (id, data) => api.patch(`/admin/users/${id}/status`, data);
export const getAdminTasks = () => api.get('/admin/tasks');
export const deleteAdminTask = (id) => api.delete(`/admin/tasks/${id}`);
export const getActivityLogs = () => api.get('/admin/logs');
export const getAdminSummary = () => api.get('/admin/summary');
