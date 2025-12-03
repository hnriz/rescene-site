const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const communityReviewService = {
    getCommunityReviews: async (limit = 4) => {
        try {
            const response = await fetch(`${API_BASE_URL}/community-reviews?limit=${limit}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.reviews || [];
        } catch (error) {
            console.error('Erro ao buscar reviews da comunidade:', error);
            return [];
        }
    }
};

export default communityReviewService;
