import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '../services/axiosConfig';

const AuthContext = createContext(undefined);

const API_URL = process.env.REACT_APP_API_URL || 'https://rescene-site.vercel.app/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Carregar usuário ao iniciar (verifica se há token no localStorage)
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('🔐 Token encontrado:', token ? 'Sim' : 'Não');
        
        if (token) {
          // Adicionar token ao header de autorização
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          console.log('📡 Carregando dados do usuário...');
          const response = await api.get('/user/profile');
          console.log('✅ Usuário carregado:', response.data);
          // Salvar username no localStorage
          localStorage.setItem('username', response.data.username);
          setUser(response.data);
        } else {
          console.log('❌ Nenhum token no localStorage');
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Erro ao carregar usuário:', error.response?.status, error.message);
        // Se for erro 401, apenas limpa o token silenciosamente
        if (error.response?.status === 401) {
          console.log('🔄 Token expirado ou inválido - limpando');
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
          setUser(null);
        } else {
          console.error('Erro ao carregar usuário:', error);
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/login', { email, password });
      const { token, user } = response.data;
      
      // Salvar token no localStorage
      localStorage.setItem('token', token);
      // Salvar username para usar em URLs
      localStorage.setItem('username', user.username);
      
      // Adicionar token ao header de autorização do axios
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Atualizar estado do usuário
      setUser(user);
      
      return user;
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/register', userData);
      const { token, user } = response.data;
      
      // Salvar token no localStorage
      localStorage.setItem('token', token);
      // Salvar username para usar em URLs
      localStorage.setItem('username', user.username);
      
      // Adicionar token ao header de autorização do axios
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Atualizar estado do usuário
      setUser(user);
      
      return user;
    } catch (error) {
      console.error('Erro ao registrar:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const updateUser = (userData) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
    // Se há preferência de idioma, salvar no localStorage
    if (userData?.preferredLanguage) {
      localStorage.setItem('userLanguage', userData.preferredLanguage);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};
