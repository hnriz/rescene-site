const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://rescene-site.vercel.app/api';

const userStatsService = {
    // Obter média de ratings do usuário
    getAverageRating: async (userId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/user/${userId}/average-rating`);
            if (!response.ok) {
                throw new Error('Erro ao obter média de ratings');
            }
            const data = await response.json();
            return {
                averageRating: data.averageRating || 0,
                totalReviews: data.totalReviews || 0
            };
        } catch (error) {
            console.error('❌ Erro ao obter média de ratings:', error);
            return {
                averageRating: 0,
                totalReviews: 0
            };
        }
    }
};

export default userStatsService;
