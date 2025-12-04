import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://rescene-site.vercel.app/api';

// Criar instância do axios
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor de requisição
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('📤 Requisição com token:', config.url);
    } else {
      console.log('📤 Requisição sem token:', config.url);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de resposta
api.interceptors.response.use(
  (response) => {
    console.log('✅ Resposta OK:', response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ Erro na requisição:', error.config?.url, error.response?.status, error.message);
    
    // Se receber 401, token expirou
    if (error.response?.status === 401) {
      console.log('🚫 Recebido 401 - Verificando se deve redirecionar');
      // Apenas redireciona se não estiver na página de login
      if (!window.location.pathname.includes('/login')) {
        console.log('🔐 Redirecionando para login');
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        window.location.href = '/login-ptbr';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
