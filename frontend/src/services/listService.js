const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://rescene-site.vercel.app/api';

// API_BASE_URL já inclui /api, então use diretamente
const listService = {
  // Criar uma nova lista
  async createList(name, description = '', privacy = 'private') {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/lists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, description, privacy })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar lista');
      }

      return await response.json();
    } catch (err) {
      console.error('Erro ao criar lista:', err);
      throw err;
    }
  },

  // Obter listas do usuário
  async getUserLists() {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/lists`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao buscar listas');
      }

      return await response.json();
    } catch (err) {
      console.error('Erro ao buscar listas:', err);
      throw err;
    }
  },

  // Deletar uma lista
  async deleteList(listId) {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/lists/${listId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao deletar lista');
      }

      return await response.json();
    } catch (err) {
      console.error('Erro ao deletar lista:', err);
      throw err;
    }
  },

  // Atualizar uma lista
  async updateList(listId, name, description = '') {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/lists/${listId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, description })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao atualizar lista');
      }

      return await response.json();
    } catch (err) {
      console.error('Erro ao atualizar lista:', err);
      throw err;
    }
  },

  // Adicionar/remover like de uma lista (toggle)
  async likeList(listId) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/lists/${listId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao adicionar/remover like');
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Erro ao adicionar/remover like:', error);
      throw error;
    }
  },

  // Verificar se usuário já curtiu uma lista
  async checkIfListLiked(listId) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log(`❌ Sem token para verificar like da lista ${listId}`);
        return { success: true, liked: false };
      }

      console.log(`🔍 Verificando like da lista ${listId}...`);
      const response = await fetch(`${API_BASE_URL}/lists/${listId}/liked`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao verificar like');
      }

      const result = await response.json();
      console.log(`✅ Resultado checkIfListLiked para lista ${listId}:`, result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao verificar like:', error);
      return { success: true, liked: false };
    }
  },

  // Salvar/remover lista (toggle)
  async saveList(listId) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/lists/${listId}/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar/remover lista');
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Erro ao salvar/remover lista:', error);
      throw error;
    }
  },

  // Verificar se lista está salva
  async checkIfListSaved(listId) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log(`❌ Sem token para verificar save da lista ${listId}`);
        return { success: true, saved: false };
      }

      console.log(`🔍 Verificando save da lista ${listId}...`);
      const response = await fetch(`${API_BASE_URL}/lists/${listId}/saved`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao verificar save');
      }

      const result = await response.json();
      console.log(`✅ Resultado checkIfListSaved para lista ${listId}:`, result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao verificar save:', error);
      return { success: true, saved: false };
    }
  },

  // Obter listas salvas do usuário
  async getSavedLists() {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/user/saved-lists`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao buscar listas salvas');
      }

      return await response.json();
    } catch (err) {
      console.error('Erro ao buscar listas salvas:', err);
      throw err;
    }
  }
};

export default listService;
