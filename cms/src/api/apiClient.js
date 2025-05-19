import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    let token = localStorage.getItem('access_token');
    if (!token) {
      token = sessionStorage.getItem('access_token');
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        const response = await axios.post('http://127.0.0.1:8000/api/token/refresh/', {
          refresh: refreshToken,
        });
        const { access } = response.data;

        if (localStorage.getItem('refresh_token')) {
          localStorage.setItem('access_token', access);
        } else if (sessionStorage.getItem('refresh_token')) {
          sessionStorage.setItem('access_token', access);
        }
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return apiClient(originalRequest);
      } catch (err) {
        console.error('Token refresh failed:', err);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }

    if (error.response?.status === 403) {
      console.warn('Permission denied for request:', originalRequest.url);
      return Promise.reject(error);
    }

    if (error.response?.status === 400) {
      console.error('Bad request:', error.response.data);
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default apiClient;