import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const statsAPI = {
  getDashboard: () => api.get('/statistics/dashboard'),
  getPopularBooks: (limit = 10) => api.get(`/statistics/popular-books?limit=${limit}`),
};

export default api;
