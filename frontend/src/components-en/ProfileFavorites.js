import { useEffect, useState } from 'react';
import { api } from '../services/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import postTemplate from '../img/postTemplate.jpg';
import {
    faStar,
    faHeart,
    faSearch,
    faEllipsisH,
    faChevronRight,
    faChevronLeft,
    faChevronDown,
    faChevronUp
} from '@fortawesome/free-solid-svg-icons';
import '../css/profile.css';
import '../css/profileFavorites.css';

function ProfileFavorites({ userId }) {
    const { user } = useAuth();
    const { language } = useLanguage();
    const navigate = useNavigate();
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [selectedSort, setSelectedSort] = useState('recent');
    const [unfavoritingId, setUnfavoritingId] = useState(null);
    const [isOwnProfile, setIsOwnProfile] = useState(false);

    // Determinar se é o próprio perfil ou de outro usuário
    useEffect(() => {
        setIsOwnProfile(!userId || (user && user.id === parseInt(userId)));
    }, [userId, user]);

    // Carregar favoritos ao montar componente
    useEffect(() => {
        if (isOwnProfile && user) {
            fetchFavorites();
        } else if (userId) {
            fetchPublicFavorites();
        }
    }, [isOwnProfile, user, userId]);

    const fetchFavorites = async () => {
        try {
            setLoading(true);
            const response = await api.get('/user/favorites');
            
            if (response.data.success && response.data.favorites) {
                const formattedFavorites = response.data.favorites.map(fav => ({
                    id: fav.id,
                    type: fav.mediaType === 'tv' ? 'series' : 'movie',
                    title: fav.title,
                    year: fav.year || 'N/A',
                    duration: fav.mediaType === 'tv' ? 'TV Series' : 'Movie',
                    rating: 0,
                    poster: fav.poster || postTemplate,
                    externalId: fav.externalId || fav.id,
                    mediaType: fav.mediaType
                }));
                setFavorites(formattedFavorites);
            }
        } catch (error) {
            console.error('Erro ao carregar favoritos:', error);
            setFavorites([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchPublicFavorites = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/user/${userId}/favorites`);
            
            if (response.data.success && response.data.favorites) {
                const formattedFavorites = response.data.favorites.map(fav => {
                    return {
                        id: fav.id,
                        type: fav.mediaType === 'tv' ? 'series' : 'movie',
                        title: fav.title,
                        year: fav.year || 'N/A',
                        duration: fav.mediaType === 'tv' ? 'TV Series' : 'Movie',
                        rating: 0,
                        poster: fav.poster || postTemplate,
                        externalId: fav.externalId || fav.id,
                        mediaType: fav.mediaType
                    };
                });
                setFavorites(formattedFavorites);
            }
        } catch (error) {
            console.error('Erro ao carregar favoritos públicos:', error);
            setFavorites([]);
        } finally {
            setLoading(false);
        }
    };

    // Filter cards based on selectedFilter
    const filteredCards = favorites.filter(card => {
        if (selectedFilter === 'all') return true;
        if (selectedFilter === 'movies') return card.type === 'movie';
        if (selectedFilter === 'series') return card.type === 'series';
        return true;
    });

    // Sort cards based on selectedSort
    const sortedCards = [...filteredCards].sort((a, b) => {
        switch(selectedSort) {
            case 'recent':
                return 0; // Keep original order for favorites
            case 'oldest':
                return 0;
            case 'rating':
                return b.rating - a.rating;
            case 'title':
                return a.title.localeCompare(b.title);
            default:
                return 0;
        }
    });

    useEffect(() => {
        const handleClickOutside = (event) => {
            const filterDropdown = document.querySelector('.filter-type-dropdown');
            const sortDropdown = document.querySelector('.sort-dropdown');
            if (filterDropdown && !filterDropdown.contains(event.target)) {
                setIsFilterOpen(false);
            }
            if (sortDropdown && !sortDropdown.contains(event.target)) {
                setIsSortOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const getFilterLabel = () => {
        const options = {
            'all': 'All',
            'movies': 'Movies',
            'series': 'TV Shows'
        };
        return options[selectedFilter] || 'All';
    };

    const getSortLabel = () => {
        const options = {
            'recent': 'Latest',
            'oldest': 'Oldest',
            'rating': 'Highest rating',
            'title': 'Title (A-Z)'
        };
        return options[selectedSort] || 'Latest';
    };

    const handleNavigateToInfo = (cardId, cardType) => {
        // Determine Info page based on language
        // If PT-BR, navigate to ptbr page; if EN, navigate to en page
        const infoPath = language === 'pt-br' 
            ? `/info-ptbr/${cardType === 'series' ? 'tv' : 'movie'}/${cardId}`
            : `/info/${cardType === 'series' ? 'tv' : 'movie'}/${cardId}`;
        
        navigate(infoPath);
    };

    const handleRemoveFavorite = async (cardId, cardType) => {
        if (unfavoritingId) return; // Prevent multiple clicks

        try {
            setUnfavoritingId(cardId);
            console.log(`❤️ Removing favorite: ID ${cardId}`);
            
            const response = await api.post(`/media/${cardId}/favorite`, {
                title: 'Unknown',
                year: null,
                poster: null,
                mediaType: cardType === 'series' ? 'tv' : 'movie',
                externalId: cardId
            });

            if (response.data.success) {
                console.log(`✅ Favorite removed successfully`);
                // Remove from local state immediately
                setFavorites(prev => prev.filter(fav => fav.id !== cardId));
                // Dispatch event to update Info.js if open
                window.dispatchEvent(new CustomEvent('favoriteAdded', { 
                    detail: { 
                        mediaId: cardId, 
                        favorited: false 
                    } 
                }));
            }
        } catch (error) {
            console.error('Error removing favorite:', error);
        } finally {
            setUnfavoritingId(null);
        }
    };

    return (
        <section class="likedContent container">
            <div class="contentHeader">
                <h2 class="sectionTitle">Favorites</h2>

            </div>
            <div class="contentFilters">
                <div class="filterGroup">
                    <label>Filter:</label>
                    <div class="filter-type-dropdown">
                        <button 
                            class="filter-type-btn"
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                        >
                            {getFilterLabel()}
                            <FontAwesomeIcon icon={isFilterOpen ? faChevronUp : faChevronDown} />
                        </button>
                        {isFilterOpen && (
                            <div class="filter-type-dropdown-content">
                                <div class="filter-option" onClick={() => { setSelectedFilter('all'); setIsFilterOpen(false); }}>
                                    All
                                </div>
                                <div class="filter-option" onClick={() => { setSelectedFilter('movies'); setIsFilterOpen(false); }}>
                                    Movies
                                </div>
                                <div class="filter-option" onClick={() => { setSelectedFilter('series'); setIsFilterOpen(false); }}>
                                    TV Shows
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div class="filterGroup">
                    <label>Order by:</label>
                    <div class="sort-dropdown">
                        <button 
                            class="sort-btn"
                            onClick={() => setIsSortOpen(!isSortOpen)}
                        >
                            {getSortLabel()}
                            <FontAwesomeIcon icon={isSortOpen ? faChevronUp : faChevronDown} />
                        </button>
                        {isSortOpen && (
                            <div class="filter-type-dropdown-content">
                                <div class="filter-option" onClick={() => { setSelectedSort('recent'); setIsSortOpen(false); }}>
                                    Latest
                                </div>
                                <div class="filter-option" onClick={() => { setSelectedSort('oldest'); setIsSortOpen(false); }}>
                                    Oldest
                                </div>
                                <div class="filter-option" onClick={() => { setSelectedSort('rating'); setIsSortOpen(false); }}>
                                    Highest rating
                                </div>
                                <div class="filter-option" onClick={() => { setSelectedSort('title'); setIsSortOpen(false); }}>
                                    Title (A-Z)
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div class="contentGrid">
                {loading ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#fff' }}>
                        <p>Loading favorites...</p>
                    </div>
                ) : sortedCards.length > 0 ? (
                    sortedCards.map((card) => (
                        <div 
                            key={card.id} 
                            class={`contentCard ${card.type}`}
                            onClick={() => handleNavigateToInfo(card.id, card.type)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div class="cardImage">
                                <img 
                                    src={card.poster} 
                                    alt={card.title}
                                    style={{ cursor: 'pointer' }}
                                />
                                <div class="cardOverlay">
                                    {isOwnProfile && (
                                        <button 
                                            class="likeButton liked"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveFavorite(card.id, card.type);
                                            }}
                                            disabled={unfavoritingId === card.id}
                                            title="Remove from favorites"
                                        >
                                            <FontAwesomeIcon icon={faHeart} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div class="cardInfo">
                                <h3 class="cardTitle">{card.title}</h3>
                                <div class="cardMeta">
                                    <span class="cardYear">{card.year}</span>
                                    <span class="cardDuration">{card.duration}</span>
                                </div>
                                <div class="cardActions">
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#fff' }}>
                        <p>No favorites yet. Start adding movies and TV shows to your favorites!</p>
                    </div>
                )}
            </div>
        </section>
    );

}

export default ProfileFavorites;