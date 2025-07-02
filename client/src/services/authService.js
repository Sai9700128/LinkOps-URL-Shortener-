import axios from 'axios';

const API_URL = process.env.REACT_APP_AUTH_SERVICE_URL || 'http://localhost:8081';

class AuthService {
  constructor() {
    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor
    axios.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshToken();
            return axios(originalRequest);
          } catch (refreshError) {
            this.logout();
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async login(username, password) {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      username,
      password
    });
    
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify({
        username: response.data.username,
        email: response.data.email
      }));
    }
    
    return response.data;
  }

  async register(username, email, password) {
    const response = await axios.post(`${API_URL}/api/auth/register`, {
      username,
      email,
      password
    });
    
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify({
        username: response.data.username,
        email: response.data.email
      }));
    }
    
    return response.data;
  }

  logout() {
    const username = this.getCurrentUser()?.username;
    if (username) {
      axios.post(`${API_URL}/api/auth/logout`, { username }).catch(() => {
        // Ignore logout errors
      });
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token');

    const response = await axios.post(`${API_URL}/api/auth/refresh`, {
      refreshToken
    });

    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
    }

    return response.data;
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getAccessToken() {
    return localStorage.getItem('accessToken');
  }

  async validateToken(token) {
    const response = await axios.get(`${API_URL}/api/auth/validate`, {
      params: { token }
    });
    return response.data;
  }
}

const authService = new AuthService();
export default authService;