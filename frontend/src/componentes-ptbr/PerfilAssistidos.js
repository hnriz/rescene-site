import {useEffect, useState} from 'react';
import { api } from '../services/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import postTemplate from '../img/postTemplate.jpg';
import {
    faStar,
    faStarHalfAlt,
    faHeart,
    faChevronRight,
    faChevronLeft,
    faTh,
    faList,
    faEye,
    faEdit,
    faChevronDown,
    faChevronUp
} from '@fortawesome/free-solid-svg-icons';
import '../css/profile.css';
import '../css/profileWatched.css';

function PerfilAssistidos({ userId }) {
    const { user } = useAuth();
    const { language } = useLanguage();
    const navigate = useNavigate();
    const [watched, setWatched] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [selectedSort, setSelectedSort] = useState('recent');
    const [removingWatchedId, setRemovingWatchedId] = useState(null);
    const [isOwnProfile, setIsOwnProfile] = useState(false);

    // Determinar se é o próprio perfil ou de outro usuário
    useEffect(() => {
        setIsOwnProfile(!userId || (user && user.id === parseInt(userId)));
    }, [userId, user]);

    // Carregar assistidos ao montar componente
    useEffect(() => {
        if (isOwnProfile && user) {
            fetchWatched();
        } else if (userId) {
            fetchPublicWatched();
        }
    }, [isOwnProfile, user, userId]);

    const fetchWatched = async () => {
        try {
            setLoading(true);
            const response = await api.get('/user/watched');
            
            if (response.data.success && response.data.watched) {
                const formattedWatched = response.data.watched.map(item => ({
                    id: item.id,
                    type: item.mediaType === 'tv' ? 'series' : 'movie',
                    title: item.title,
                    year: item.year || 'N/A',
                    duration: item.mediaType === 'tv' ? 'Série de TV' : 'Filme',
                    rating: 0,
                    poster: item.poster || postTemplate,
                    externalId: item.externalId || item.id,
                    mediaType: item.mediaType
                }));
                setWatched(formattedWatched);
            }
        } catch (error) {
            console.error('Erro ao carregar assistidos:', error);
            setWatched([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchPublicWatched = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/user/${userId}/watched`);
            
            if (response.data.success && response.data.watched) {
                const formattedWatched = response.data.watched.map(item => {
                    return {
                        id: item.id,
                        type: item.mediaType === 'tv' ? 'series' : 'movie',
                        title: item.title,
                        year: item.year || 'N/A',
                        duration: item.mediaType === 'tv' ? 'Série de TV' : 'Filme',
                        rating: 0,
                        poster: item.poster || postTemplate,
                        externalId: item.externalId || item.id,
                        mediaType: item.mediaType
                    };
                });
                setWatched(formattedWatched);
            }
        } catch (error) {
            console.error('Erro ao carregar assistidos públicos:', error);
            setWatched([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveWatched = async (e, cardId) => {
        e.stopPropagation();
        setRemovingWatchedId(cardId);
        try {
            const card = watched.find(c => c.id === cardId);
            const response = await api.post(`/media/${cardId}/watched`, {
                title: card.title,
                year: parseInt(card.year) || null,
                poster: card.poster,
                mediaType: card.mediaType,
                externalId: card.externalId
            });
            if (response.data.success) {
                setWatched(watched.filter(c => c.id !== cardId));
                window.dispatchEvent(new CustomEvent('watchedRemoved', { 
                    detail: { mediaId: cardId, watched: false } 
                }));
            }
        } catch (error) {
            console.error('Erro ao remover assistido:', error);
        } finally {
            setRemovingWatchedId(null);
        }
    };

    const handleNavigateToInfo = (cardId, cardType) => {
        const infoPath = language === 'pt-br' 
            ? `/info-ptbr/${cardType === 'series' ? 'tv' : 'movie'}/${cardId}`
            : `/info/${cardType === 'series' ? 'tv' : 'movie'}/${cardId}`;
        
        navigate(infoPath);
    };

    const getSortedCards = () => {
        let sorted = [...watched];
        if (selectedSort === 'recent') {
            sorted.reverse();
        } else if (selectedSort === 'alphabetical') {
            sorted.sort((a, b) => a.title.localeCompare(b.title));
        }
        return sorted;
    };

    const filteredCards = getSortedCards().filter(card => {
        if (selectedFilter === 'all') return true;
        if (selectedFilter === 'movies') return card.type === 'movie';
        if (selectedFilter === 'series') return card.type === 'series';
        return true;
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
            'all': 'Todos',
            'movies': 'Filmes',
            'series': 'Séries'
        };
        return options[selectedFilter] || 'Todos';
    };

    const getSortLabel = () => {
        const options = {
            'recent': 'Mais recentes',
            'oldest': 'Mais antigos',
            'rating': 'Classificação',
            'title': 'Título (A-Z)',
            'duration': 'Duração'
        };
        return options[selectedSort] || 'Mais recentes';
    };

    if (loading) return <div style={{ color: '#fff', padding: '20px' }}>Carregando...</div>;

    return (
        <section className="watchedContent container">
            <div className="contentHeader">
                <h2 className="sectionTitle">Conteúdo Assistido</h2>
                <div className="contentStats">
                    <div className="statBubble">
                        <span className="statNumber">{watched.length}</span>
                        <span className="statLabel">Total</span>
                    </div>
                    <div className="statBubble">
                        <span className="statNumber">{watched.filter(c => c.type === 'movie').length}</span>
                        <span className="statLabel">Filmes</span>
                    </div>
                    <div className="statBubble">
                        <span className="statNumber">{watched.filter(c => c.type === 'series').length}</span>
                        <span className="statLabel">Séries</span>
                    </div>
                </div>
            </div>

            <div className="contentFilters">
                <div className="filterGroup">
                    <label>Filtro:</label>
                    <div className="filter-type-dropdown">
                        <button 
                            className="filter-type-btn"
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                        >
                            {getFilterLabel()}
                            <FontAwesomeIcon icon={isFilterOpen ? faChevronUp : faChevronDown} />
                        </button>
                        {isFilterOpen && (
                            <div className="filter-type-dropdown-content">
                                <div className="filter-option" onClick={() => { setSelectedFilter('all'); setIsFilterOpen(false); }}>
                                    Todos
                                </div>
                                <div className="filter-option" onClick={() => { setSelectedFilter('movies'); setIsFilterOpen(false); }}>
                                    Filmes
                                </div>
                                <div className="filter-option" onClick={() => { setSelectedFilter('series'); setIsFilterOpen(false); }}>
                                    Séries
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="filterGroup">
                    <label>Ordenar por:</label>
                    <div className="sort-dropdown">
                        <button 
                            className="sort-btn"
                            onClick={() => setIsSortOpen(!isSortOpen)}
                        >
                            {getSortLabel()}
                            <FontAwesomeIcon icon={isSortOpen ? faChevronUp : faChevronDown} />
                        </button>
                        {isSortOpen && (
                            <div className="filter-type-dropdown-content">
                                <div className="filter-option" onClick={() => { setSelectedSort('recent'); setIsSortOpen(false); }}>
                                    Mais recentes
                                </div>
                                <div className="filter-option" onClick={() => { setSelectedSort('oldest'); setIsSortOpen(false); }}>
                                    Mais antigos
                                </div>
                                <div className="filter-option" onClick={() => { setSelectedSort('rating'); setIsSortOpen(false); }}>
                                    Classificação
                                </div>
                                <div className="filter-option" onClick={() => { setSelectedSort('title'); setIsSortOpen(false); }}>
                                    Título (A-Z)
                                </div>
                                <div className="filter-option" onClick={() => { setSelectedSort('duration'); setIsSortOpen(false); }}>
                                    Duração
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="contentGrid">
                {filteredCards.map((card) => (
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
                                onError={(e) => e.target.src = postTemplate}
                            />
                            <div className="cardOverlay">
                                <div className="cardActions">
                                    {/* <button className="actionButton watched active">
                                        <FontAwesomeIcon icon={faEye} />
                                    </button> */}
                                    {isOwnProfile && (
                                        <button 
                                            className="actionButton remove"
                                            onClick={(e) => handleRemoveWatched(e, card.id)}
                                            disabled={removingWatchedId === card.id}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="cardInfo">
                            <h3 className="cardTitle">{card.title}</h3>
                            <div className="cardMeta">
                                <span className="cardYear">{card.year}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
export default PerfilAssistidos;