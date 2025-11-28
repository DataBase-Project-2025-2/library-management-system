import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 통계 API
export const statsAPI = {
  getDashboard: () => api.get('/statistics/dashboard'),
  getPopularBooks: (limit = 10) => api.get(`/statistics/popular-books?limit=${limit}`),
};

// 도서 API
export const bookAPI = {
  getAll: () => api.get('/books'),
  getById: (id) => api.get(`/books/${id}`),
  search: (keyword) => api.get(`/books/search/${keyword}`),
};

export default api;
