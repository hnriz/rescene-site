const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://rescene-site.vercel.app/api';

const followerService = {
    // Obter contagem de seguidores
    getFollowersCount: async (userId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/user/${userId}/followers/count`);
            if (!response.ok) {
                throw new Error('Erro ao obter contagem de seguidores');
            }
            const data = await response.json();
            return data.followersCount || 0;
        } catch (error) {
            console.error('❌ Erro ao obter contagem de seguidores:', error);
            return 0;
        }
    },

    // Obter contagem de seguindo
    getFollowingCount: async (userId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/user/${userId}/following/count`);
            if (!response.ok) {
                throw new Error('Erro ao obter contagem de seguindo');
            }
            const data = await response.json();
            return data.followingCount || 0;
        } catch (error) {
            console.error('❌ Erro ao obter contagem de seguindo:', error);
            return 0;
        }
    },

    // Verificar se está seguindo um usuário
    isFollowing: async (userId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                return false;
            }

            const response = await fetch(`${API_BASE_URL}/user/${userId}/is-following`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                return false;
            }

            const data = await response.json();
            return data.isFollowing || false;
        } catch (error) {
            console.error('❌ Erro ao verificar se está seguindo:', error);
            return false;
        }
    },

    // Seguir um usuário
    followUser: async (userId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Você precisa estar logado para seguir usuários');
            }

            const response = await fetch(`${API_BASE_URL}/user/${userId}/follow`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao seguir usuário');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('❌ Erro ao seguir usuário:', error);
            throw error;
        }
    },

    // Deixar de seguir um usuário
    unfollowUser: async (userId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Você precisa estar logado para deixar de seguir usuários');
            }

            const response = await fetch(`${API_BASE_URL}/user/${userId}/follow`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao deixar de seguir usuário');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('❌ Erro ao deixar de seguir usuário:', error);
            throw error;
        }
    },

    // Obter lista de seguidores
    getFollowersList: async (userId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/user/${userId}/followers`);
            console.log('📋 Resposta de seguidores:', response.status, response);
            if (!response.ok) {
                console.error('❌ Erro HTTP ao obter lista de seguidores:', response.status);
                return [];
            }
            const data = await response.json();
            console.log('📋 Dados de seguidores:', data);
            return data.followers || data || [];
        } catch (error) {
            console.error('❌ Erro ao obter lista de seguidores:', error);
            return [];
        }
    },

    // Obter lista de seguindo
    getFollowingList: async (userId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/user/${userId}/following`);
            console.log('📋 Resposta de seguindo:', response.status, response);
            if (!response.ok) {
                console.error('❌ Erro HTTP ao obter lista de seguindo:', response.status);
                return [];
            }
            const data = await response.json();
            console.log('📋 Dados de seguindo:', data);
            return data.following || data || [];
        } catch (error) {
            console.error('❌ Erro ao obter lista de seguindo:', error);
            return [];
        }
    }
};

export default followerService;
