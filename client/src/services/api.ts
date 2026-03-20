import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (userData: any) =>
    api.post('/auth/register', userData),
  
  getProfile: () =>
    api.get('/auth/profile'),
  
  updateProfile: (userData: any) =>
    api.put('/auth/profile', userData),
  
  getBalance: () =>
    api.get('/auth/balance'),
  
  getTransactions: (limit?: number, order?: string) =>
    api.get('/auth/transactions', { params: { limit, order } }),
  
  validateAddress: (address: string) =>
    api.post('/auth/validate-address', { address }),
  
  refreshToken: () =>
    api.post('/auth/refresh'),
};

export const donationAPI = {
  createDonation: (donationData: any) =>
    api.post('/donations', donationData),
  
  getDonations: (creatorId?: string, limit?: number) =>
    api.get('/donations', { params: { creatorId, limit } }),
  
  getDonation: (id: string) =>
    api.get(`/donations/${id}`),
  
  getUserDonations: (userId: string, type?: 'sent' | 'received') =>
    api.get(`/donations/user/${userId}`, { params: { type } }),
  
  getCreatorStats: (creatorId: string) =>
    api.get(`/donations/stats/${creatorId}`),
};

export const userAPI = {
  searchCreators: (query: string) =>
    api.get('/users/search', { params: { q: query } }),
  
  getCreator: (id: string) =>
    api.get(`/users/${id}`),
  
  updateCreatorProfile: (id: string, profileData: any) =>
    api.put(`/users/${id}`, profileData),
};

export default api;
