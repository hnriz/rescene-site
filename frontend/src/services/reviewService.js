const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://rescene-site.vercel.app/api';

const reviewService = {
    // Enviar uma review
    submitReview: async (movieId, rating, text, mediaType = 'movie', movieData = {}) => {
        try {
            const token = localStorage.getItem('token');
            const movieTitle = movieData.title || movieData.name; // Para séries usa 'name'
            const releaseDate = movieData.release_date || movieData.first_air_date; // Para séries usa 'first_air_date'
            
            const response = await fetch(`${API_BASE_URL}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    movieId, 
                    rating, 
                    text, 
                    mediaType,
                    movieTitle: movieTitle,
                    movieYear: releaseDate ? new Date(releaseDate).getFullYear() : null,
                    moviePoster: movieData.poster_path ? `https://image.tmdb.org/t/p/w500${movieData.poster_path}` : null
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao enviar review');
            }

            return await response.json();
        } catch (error) {
            console.error('❌ Erro ao enviar review:', error);
            throw error;
        }
    },

    // Obter dados de fallback de uma review pelo media_id
    getMediaDataFromReviews: async (mediaId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/reviews/${mediaId}`);
            
            if (!response.ok) {
                throw new Error('Nenhuma review encontrada');
            }

            const reviews = await response.json();
            if (reviews.length === 0) {
                throw new Error('Nenhuma review encontrada');
            }

            // Usar dados da primeira review que tem informações completas
            const review = reviews.find(r => r.movie_title) || reviews[0];
            
            return {
                title: review.movie_title,
                release_date: review.movie_year,
                poster_path: review.movie_poster,
                overview: `Collected from ${reviews.length} review(s)`,
                isFromReviews: true
            };
        } catch (error) {
            console.error('❌ Erro ao buscar dados de fallback:', error);
            throw error;
        }
    },

    // Obter reviews de um filme
    getMovieReviews: async (movieId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/reviews/${movieId}`);
            
            if (!response.ok) {
                throw new Error('Erro ao carregar reviews');
            }

            return await response.json();
        } catch (error) {
            console.error('❌ Erro ao carregar reviews:', error);
            throw error;
        }
    },

    // Adicionar/remover like de uma review (toggle)
    likeReview: async (reviewId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/like`, {
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

    // Verificar se usuário já curtiu uma review
    checkIfLiked: async (reviewId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.log(`❌ Sem token para verificar like da review ${reviewId}`);
                return { success: true, liked: false };
            }

            console.log(`🔍 Verificando like da review ${reviewId}...`);
            const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/liked`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao verificar like');
            }

            const result = await response.json();
            console.log(`✅ Resultado checkIfLiked para review ${reviewId}:`, result);
            return result;
        } catch (error) {
            console.error('❌ Erro ao verificar like:', error);
            return { success: true, liked: false };
        }
    },

    // Deletar uma review
    deleteReview: async (reviewId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao deletar review');
            }

            return await response.json();
        } catch (error) {
            console.error('❌ Erro ao deletar review:', error);
            throw error;
        }
    },

    // Obter reviews do usuário autenticado (para perfil)
    getUserReviews: async (sortBy = 'recent', limit = 10, offset = 0) => {
        try {
            const token = localStorage.getItem('token');
            console.log('🔑 Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'MISSING');
            
            if (!token) {
                throw new Error('Token não encontrado - use o endpoint público em vez disso');
            }

            const params = new URLSearchParams({
                sortBy,
                limit,
                offset
            });

            const url = `${API_BASE_URL}/user/reviews?${params}`;
            console.log('📡 Fetching URL:', url);
            console.log('📡 Authorization header: Bearer ' + (token ? token.substring(0, 20) + '...' : 'MISSING'));

            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include',  // Include cookies
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📊 Response status:', response.status);
            console.log('📊 Response headers:', response.headers);

            if (!response.ok) {
                const errorData = await response.text();
                console.error('❌ Error response:', errorData);
                throw new Error(`Erro ao carregar reviews do usuário (${response.status}): ${errorData}`);
            }

            return await response.json();
        } catch (error) {
            console.error('❌ Erro ao carregar reviews do usuário:', error);
            throw error;
        }
    },

    // Obter reviews de um usuário específico (público)
    getUserPublicReviews: async (userId, sortBy = 'recent', limit = 10, offset = 0) => {
        try {
            const params = new URLSearchParams({
                sortBy,
                limit,
                offset
            });

            const response = await fetch(`${API_BASE_URL}/user/${userId}/reviews?${params}`, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error('Erro ao carregar reviews do usuário');
            }

            return await response.json();
        } catch (error) {
            console.error('❌ Erro ao carregar reviews públicas do usuário:', error);
            throw error;
        }
    }
};

export default reviewService;
