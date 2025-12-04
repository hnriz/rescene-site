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
    faChevronDown,
    faChevronUp,
    faChevronLeft,
    faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import '../css/profile.css';
import '../css/profileFavorites.css';

function PerfilFavoritos({ userId }) {
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

    // Carregar favoritos ao montar componente e quando há mudanças de favoritos
    useEffect(() => {
        if (isOwnProfile && user) {
            fetchFavorites();
        } else if (userId) {
            fetchPublicFavorites();
        }
    }, [isOwnProfile, user, userId]);

    // Listener para evento de favorito adicionado/removido
    useEffect(() => {
        const handleFavoriteChange = () => {
            fetchFavorites();
        };
        
        window.addEventListener('favoriteAdded', handleFavoriteChange);
        window.addEventListener('favoriteRemoved', handleFavoriteChange);
        
        return () => {
            window.removeEventListener('favoriteAdded', handleFavoriteChange);
            window.removeEventListener('favoriteRemoved', handleFavoriteChange);
        };
    }, []);

    const fetchFavorites = async () => {
        try {
            setLoading(true);
            const response = await api.get('/user/favorites');
            
            if (response.data.success && response.data.favorites) {
                const formattedFavorites = response.data.favorites.map(fav => {
                    console.log('Favorito recebido:', { 
                        id: fav.id, 
                        title: fav.title, 
                        poster: fav.poster ? 'possui poster' : 'sem poster',
                        rating: fav.rating,
                        year: fav.year
                    });
                    return {
                        id: fav.id,
                        type: fav.mediaType === 'tv' ? 'series' : 'movie',
                        title: fav.title,
                        year: fav.year || 'N/A',
                        duration: fav.mediaType === 'tv' ? 'Série de TV' : 'Filme',
                        rating: fav.rating || 0,
                        poster: fav.poster && fav.poster.length > 0 ? fav.poster : postTemplate,
                        externalId: fav.externalId || fav.id,
                        mediaType: fav.mediaType
                    };
                });
                console.log('Favoritos formatados:', formattedFavorites);
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
                        duration: fav.mediaType === 'tv' ? 'Série de TV' : 'Filme',
                        rating: fav.rating || 0,
                        poster: fav.poster && fav.poster.length > 0 ? fav.poster : postTemplate,
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
                return 0;
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

    const getFilterLabel = (filter) => {
        const labels = {
            'all': 'Todos',
            'movies': 'Filmes',
            'series': 'Séries'
        };
        return labels[filter] || 'Todos';
    };

    const getSortLabel = (sort) => {
        const labels = {
            'recent': 'Mais recentes',
            'oldest': 'Mais antigos',
            'rating': 'Melhor avaliados',
            'title': 'Título (A-Z)'
        };
        return labels[sort] || 'Mais recentes';
    };

    const handleNavigateToInfo = (cardId, cardType) => {
        // Determinar a página de Info baseado no idioma
        // Se PT-BR, leva para pagina ptbr; se EN, leva para pagina en
        const infoPath = language === 'pt-br' 
            ? `/info-ptbr/${cardType === 'series' ? 'tv' : 'movie'}/${cardId}`
            : `/info/${cardType === 'series' ? 'tv' : 'movie'}/${cardId}`;
        
        navigate(infoPath);
    };

    const handleRemoveFavorite = async (cardId, cardType) => {
        if (unfavoritingId) return; // Previne múltiplos cliques

        try {
            setUnfavoritingId(cardId);
            console.log(`❤️ Removendo favorito: ID ${cardId}`);
            
            const response = await api.post(`/media/${cardId}/favorite`, {
                title: 'Unknown',
                year: null,
                poster: null,
                mediaType: cardType === 'series' ? 'tv' : 'movie',
                externalId: cardId
            });

            if (response.data.success) {
                console.log(`✅ Favorito removido com sucesso`);
                // Remover do estado local imediatamente
                setFavorites(prev => prev.filter(fav => fav.id !== cardId));
                // Disparar evento para atualizar Info.js se estiver aberto
                window.dispatchEvent(new CustomEvent('favoriteAdded', { 
                    detail: { 
                        mediaId: cardId, 
                        favorited: false 
                    } 
                }));
            }
        } catch (error) {
            console.error('Erro ao remover favorito:', error);
        } finally {
            setUnfavoritingId(null);
        }
    };

    return (
        <section className="likedContent container" display="none">
            <div className="contentHeader">
                <h2 className="sectionTitle">Favoritos</h2>
            </div>

            <div className="contentFilters">
                <div className="filterGroup">
                    <label>Tipo:</label>
                    <div className="filter-type-dropdown">
                        <button className="filter-type-btn" onClick={() => setIsFilterOpen(!isFilterOpen)}>
                            <span>{getFilterLabel(selectedFilter)}</span>
                            <FontAwesomeIcon icon={isFilterOpen ? faChevronUp : faChevronDown} />
                        </button>
                        {isFilterOpen && (
                            <div className="filter-type-dropdown-content">
                                {[
                                    { value: 'all', label: 'Todos' },
                                    { value: 'movies', label: 'Filmes' },
                                    { value: 'series', label: 'Séries' }
                                ].map(option => (
                                    <button
                                        key={option.value}
                                        className={`filter-option ${selectedFilter === option.value ? 'selected' : ''}`}
                                        onClick={() => {
                                            setSelectedFilter(option.value);
                                            setIsFilterOpen(false);
                                        }}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="filterGroup">
                    <label>Ordenar por:</label>
                    <div className="sort-dropdown">
                        <button className="sort-btn" onClick={() => setIsSortOpen(!isSortOpen)}>
                            <span>{getSortLabel(selectedSort)}</span>
                            <FontAwesomeIcon icon={isSortOpen ? faChevronUp : faChevronDown} />
                        </button>
                        {isSortOpen && (
                            <div className="filter-type-dropdown-content">
                                {[
                                    { value: 'recent', label: 'Mais recentes' },
                                    { value: 'oldest', label: 'Mais antigos' },
                                    { value: 'rating', label: 'Melhor avaliados' },
                                    { value: 'title', label: 'Título (A-Z)' }
                                ].map(option => (
                                    <button
                                        key={option.value}
                                        className={`filter-option ${selectedSort === option.value ? 'selected' : ''}`}
                                        onClick={() => {
                                            setSelectedSort(option.value);
                                            setIsSortOpen(false);
                                        }}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="contentGrid">
                {loading ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#fff' }}>
                        <p>Carregando favoritos...</p>
                    </div>
                ) : sortedCards.length > 0 ? (
                    sortedCards.map(card => (
                        <div 
                            key={card.id} 
                            className={`contentCard ${card.type}`}
                            onClick={() => handleNavigateToInfo(card.id, card.type)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="cardImage">
                                <img 
                                    src={card.poster} 
                                    alt={card.title}
                                    style={{ cursor: 'pointer' }}
                                />
                                <div className="cardOverlay">
                                    {isOwnProfile && (
                                        <button 
                                            className="likeButton liked"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveFavorite(card.id, card.type);
                                            }}
                                            disabled={unfavoritingId === card.id}
                                            title="Remover dos favoritos"
                                        >
                                            <FontAwesomeIcon icon={faHeart} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="cardInfo">
                                <h3 className="cardTitle">{card.title}</h3>
                                <div className="cardMeta">
                                    <span className="cardYear">{card.year}</span>
                                    <span className="cardDuration">{card.duration}</span>
                                </div>
                                {card.rating > 0 && (
                                    <div className="cardRating">
                                        <FontAwesomeIcon icon={faStar} />
                                        <span>{card.rating.toFixed(1)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#fff' }}>
                        <p>Nenhum favorito ainda. Comece a adicionar filmes e séries aos seus favoritos!</p>
                    </div>
                )}
            </div>

            {/* <div className="pagination">
                <button className="paginationButton" disabled>
                    <FontAwesomeIcon icon={faChevronLeft} />
                </button>
                <button className="paginationButton active">1</button>
                <button className="paginationButton">2</button>
                <button className="paginationButton">3</button>
                <button className="paginationButton">
                    <FontAwesomeIcon icon={faChevronRight} />
                </button>
            </div> */}
        </section>
    );
}

export default PerfilFavoritos;