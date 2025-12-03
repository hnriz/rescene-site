import react, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import BackButton from '../components/BackButton';
import Avatar from '../components-en/Avatar';
import tmdbService from '../services/tmdbService';
import reviewService from '../services/reviewService';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCalendarAlt,
    faPlay,
    faStar,
    faClock,
    faFilm,
    faPaperPlane,
    faThumbsUp,
    faStarHalfAlt,
    faChevronRight,
    faChevronLeft,
    faChevronUp,
    faChevronDown,
    faReply,
    faHeart,
    faEye,
    faPlus,
    faTv,
    faTrash
} from '@fortawesome/free-solid-svg-icons';

import postTemplate from '../img/postTemplate.jpg';

const Info = () => {
    const { movieId, type } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { language } = useLanguage();
    console.log('🎬 Info component mounted with movieId:', movieId, 'type:', type);
    const [media, setMedia] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isTV, setIsTV] = useState(type === 'tv');
    const [recommendations, setRecommendations] = useState([]);
    const [loadingRecommendations, setLoadingRecommendations] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [userReview, setUserReview] = useState({ rating: 0, text: '' });
    const [submittingReview, setSubmittingReview] = useState(false);
    const [displayedReviewsCount, setDisplayedReviewsCount] = useState(5);
    const [likedReviews, setLikedReviews] = useState({});
    const [likingReviewId, setLikingReviewId] = useState(null);
    const [hoverRating, setHoverRating] = useState(0);
    const [ratingError, setRatingError] = useState(false);
    const [textError, setTextError] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [selectedSort, setSelectedSort] = useState('recent');
    const MAX_REVIEW_LENGTH = 1000;

    // Function to show popup notification
    const showPopupNotification = (message, type = 'info') => {
        // Remove existing notification
        const existingNotification = document.querySelector('.info-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `info-notification info-notification-${type}`;
        notification.innerHTML = `
            <div className="info-notification-content">
                <span>${message}</span>
            </div>
        `;

        // Notification styles
         notification.style.position = 'fixed';
        notification.style.top = '95px';
        notification.style.right = '20px';
        // notification.style.transform = 'translateX(-50%)';
        notification.style.zIndex = '1001';
        notification.style.padding = '15px 30px';
        notification.style.borderRadius = '8px';
        notification.style.color = '#fff';
        notification.style.fontWeight = '500';
        notification.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
        notification.style.animation = 'slideInInfo 0.3s ease';

        // Colors based on type
        switch (type) {
            case 'success':
                notification.style.background = '#27ae60';
                break;
            case 'error':
                notification.style.background = '#e74c3c';
                break;
            case 'warning':
                notification.style.background = '#f39c12';
                break;
            default:
                notification.style.background = '#3498db';
        }

        document.body.appendChild(notification);

        // Add animation styles if they don't exist
        if (!document.getElementById('info-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'info-notification-styles';
            style.textContent = `
                @keyframes slideInInfo {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                @keyframes slideOutInfo {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        // Remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutInfo 0.3s ease';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 5000);
    };

    // Function to show delete confirmation modal
    const showDeleteConfirmation = (reviewId) => {
        return new Promise((resolve) => {
            // Remove existing modal
            const existingModal = document.querySelector('.delete-confirmation-modal');
            if (existingModal) {
                existingModal.remove();
            }

            // Create overlay
            const overlay = document.createElement('div');
            overlay.className = 'delete-confirmation-overlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.right = '0';
            overlay.style.bottom = '0';
            overlay.style.background = 'rgba(0, 0, 0, 0.7)';
            overlay.style.display = 'flex';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            overlay.style.zIndex = '2000';
            overlay.style.animation = 'fadeInOverlay 0.3s ease';

            // Create modal
            const modal = document.createElement('div');
            modal.className = 'delete-confirmation-modal';
            modal.style.background = '#25252F';
            modal.style.borderRadius = '12px';
            modal.style.padding = '30px';
            modal.style.minWidth = '320px';
            modal.style.maxWidth = '400px';
            modal.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.5)';
            modal.style.animation = 'scaleInModal 0.3s ease';
            modal.style.color = '#fff';
            modal.innerHTML = `
                <h3 style="margin: 0 0 15px 0; font-size: 1.3rem; font-weight: 600;">
                    Delete Review?
                </h3>
                <p style="margin: 0 0 25px 0; color: #A0A0B0; font-size: 0.95rem; line-height: 1.5;">
                    Are you sure you want to delete this review? This action cannot be undone.
                </p>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button id="confirm-cancel-btn" style="
                        padding: 10px 20px;
                        border: 1px solid #555;
                        background: transparent;
                        color: #A0A0B0;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 500;
                        transition: all 0.2s ease;
                    ">
                        Cancel
                    </button>
                    <button id="confirm-delete-btn" style="
                        padding: 10px 20px;
                        border: none;
                        background: #e74c3c;
                        color: #fff;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 500;
                        transition: all 0.2s ease;
                    ">
                        Delete
                    </button>
                </div>
            `;

            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            // Add animation styles if they don't exist
            if (!document.getElementById('delete-confirmation-styles')) {
                const style = document.createElement('style');
                style.id = 'delete-confirmation-styles';
                style.textContent = `
                    @keyframes fadeInOverlay {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    
                    @keyframes scaleInModal {
                        from { 
                            opacity: 0;
                            transform: scale(0.9);
                        }
                        to { 
                            opacity: 1;
                            transform: scale(1);
                        }
                    }
                    
                    #confirm-cancel-btn:hover {
                        background: rgba(255, 255, 255, 0.1) !important;
                        color: #fff !important;
                    }
                    
                    #confirm-delete-btn:hover {
                        background: #c0392b !important;
                        transform: translateY(-2px);
                    }
                `;
                document.head.appendChild(style);
            }

            // Event listeners
            const cancelBtn = document.getElementById('confirm-cancel-btn');
            const deleteBtn = document.getElementById('confirm-delete-btn');

            const closeModal = () => {
                overlay.style.animation = 'fadeOutOverlay 0.3s ease';
                modal.style.animation = 'scaleOutModal 0.3s ease';
                setTimeout(() => {
                    overlay.remove();
                }, 300);
            };

            cancelBtn.addEventListener('click', () => {
                closeModal();
                resolve(false);
            });

            deleteBtn.addEventListener('click', () => {
                closeModal();
                resolve(true);
            });

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    closeModal();
                    resolve(false);
                }
            });
        });
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            const dropdown = document.querySelector('.sort-dropdown-info');
            if (dropdown && !dropdown.contains(event.target)) {
                setIsSortOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    useEffect(() => {
        const loadMedia = async () => {
            try {
                setLoading(true);
                console.log('🎬 Carregando detalhes da mídia:', movieId);
                let data;

                // Se o tipo foi especificado na URL, usar diretamente
                if (type === 'tv') {
                    console.log('📺 Carregando como série (type especificado)...');
                    data = await tmdbService.getTVShowDetails(movieId, 'en-US');
                    setIsTV(true);
                } else if (type === 'movie') {
                    console.log('🎬 Carregando como filme (type especificado)...');
                    try {
                        data = await tmdbService.getMovieDetails(movieId, 'en-US');
                        setIsTV(false);
                    } catch (err) {
                        console.warn('⚠️ Filme não encontrado no TMDB, tentando usar dados de reviews...');
                        // Fallback: tentar buscar dados de reviews
                        data = await reviewService.getMediaDataFromReviews(movieId);
                        console.log('✅ Dados obtidos de reviews:', data);
                        setIsTV(false);
                    }
                } else {
                    // Fallback: tenta filme primeiro, depois série
                    try {
                        console.log('📽️ Tentando carregar como filme...');
                        data = await tmdbService.getMovieDetails(movieId, 'en-US');
                        console.log('✅ Filme encontrado:', data);
                        setIsTV(false);
                    } catch (err) {
                        // Se falhar, tenta como série
                        try {
                            console.log('❌ Não é filme, tentando série...', err.message);
                            data = await tmdbService.getTVShowDetails(movieId, 'en-US');
                            console.log('✅ Série encontrada:', data);
                            setIsTV(true);
                        } catch (seriesErr) {
                            // Se também falhar, tenta dados de reviews
                            console.warn('⚠️ Mídia não encontrada no TMDB, tentando usar dados de reviews...');
                            data = await reviewService.getMediaDataFromReviews(movieId);
                            console.log('✅ Dados obtidos de reviews:', data);
                            setIsTV(false);
                        }
                    }
                }

                setMedia(data);
                setError(null);
            } catch (err) {
                console.error('❌ Erro ao carregar detalhes:', err);
                console.error('Erro completo:', err.response?.data || err.message);
                setError('Failed to load media details: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        if (movieId) {
            console.log('🚀 useEffect acionado com movieId:', movieId);
            loadMedia();
        } else {
            console.warn('⚠️ movieId não foi encontrado na URL');
            setError('No movie ID provided');
            setLoading(false);
        }
    }, [movieId, type]);

    // Carregar recomendações após carregar a mídia
    useEffect(() => {
        const loadRecommendations = async () => {
            if (!media) return;
            try {
                setLoadingRecommendations(true);
                let recs = [];
                let fullMediaDetails = media;
                
                // Buscar detalhes completos da mídia para ter informações de créditos
                const lang = language === 'pt-br' ? 'pt-BR' : 'en-US';
                if (!media.credits) {
                    if (isTV) {
                        fullMediaDetails = await tmdbService.getTVShowDetails(movieId, lang);
                        recs = await tmdbService.getTVRecommendations(movieId, lang);
                    } else {
                        fullMediaDetails = await tmdbService.getMovieDetails(movieId, lang);
                        recs = await tmdbService.getMovieRecommendations(movieId, lang);
                    }
                } else {
                    if (isTV) {
                        recs = await tmdbService.getTVRecommendations(movieId, lang);
                    } else {
                        recs = await tmdbService.getMovieRecommendations(movieId, lang);
                    }
                }
                
                if (!recs || recs.length === 0) {
                    setRecommendations([]);
                    return;
                }
                
                // ===== FILTRO DE RECOMENDAÇÕES RIGOROSO =====
                // Extrair informações do filme/série original
                const mediaGenreIds = fullMediaDetails.genre_ids || fullMediaDetails.genres?.map(g => g.id) || [];
                
                // Filtrar recomendações com critérios RIGOROSOS
                const scoredRecs = recs.map(item => {
                    let score = 0;
                    const itemGenreIds = item.genre_ids || [];
                    
                    // 1. GÊNERO EM COMUM - CRITÉRIO ESSENCIAL
                    const commonGenres = itemGenreIds.filter(id => mediaGenreIds.includes(id)).length;
                    
                    // Se não houver gênero em comum, score é 0
                    if (commonGenres === 0) {
                        return { ...item, score: 0, reason: 'Sem gênero em comum' };
                    }
                    
                    score = commonGenres * 20; // Cada gênero = 20 pontos
                    
                    // 2. QUALIDADE MÍNIMA - vote_average >= 6.0
                    const itemScore = item.vote_average || 0;
                    if (itemScore < 6.0) {
                        score *= 0.5; // Reduz score se qualidade baixa
                    } else if (itemScore >= 7.0) {
                        score += 15; // Bônus se qualidade boa
                    }
                    
                    // 3. VOTOS MÍNIMOS - vote_count >= 100
                    const itemVotes = item.vote_count || 0;
                    if (itemVotes < 100) {
                        score *= 0.7; // Reduz se poucos votos
                    }
                    
                    return { ...item, score };
                });
                
                // Filtrar apenas filmes com scores respeitáveis
                const filteredRecs = scoredRecs
                    .filter(item => item.score >= 30) // Score mínimo 30
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 12);
                
                // Se não houver com score 30+, tentar com score 20+
                let finalRecs = filteredRecs;
                if (filteredRecs.length < 6) {
                    finalRecs = scoredRecs
                        .filter(item => item.score >= 20 && item.score > 0)
                        .sort((a, b) => b.score - a.score)
                        .slice(0, 12);
                }
                
                // Se ainda houver poucos, pegar os melhores scores positivos
                if (finalRecs.length < 6) {
                    finalRecs = scoredRecs
                        .filter(item => item.score > 0)
                        .sort((a, b) => b.score - a.score)
                        .slice(0, 12);
                }
                
                const formattedRecs = finalRecs.map(item => {
                    return tmdbService.formatTMDBItem(item, isTV ? 'tv' : 'movie');
                });
                
                console.log('✅ Recomendações filtradas:', finalRecs.length, 'de', recs.length);
                console.log('🎬 Gêneros da mídia:', mediaGenreIds);
                setRecommendations(formattedRecs);
            } catch (err) {
                console.error('❌ Erro ao carregar recomendações:', err);
                setRecommendations([]);
            } finally {
                setLoadingRecommendations(false);
            }
        };
        loadRecommendations();
    }, [media, movieId, isTV]);

    // Load reviews from database
    useEffect(() => {
        const loadReviews = async () => {
            if (!movieId) return;
            try {
                setLoadingReviews(true);
                const dbReviews = await reviewService.getMovieReviews(movieId);
                console.log('✅ Reviews loaded:', dbReviews);
                setReviews(dbReviews);

                // Load like status for each review if user is logged in
                if (user) {
                    console.log('👤 User logged in:', user.id);
                    const likeStatus = {};
                    for (const review of dbReviews) {
                        try {
                            const result = await reviewService.checkIfLiked(review.id);
                            likeStatus[review.id] = result.liked || false;
                            console.log(`📌 Review ${review.id}: liked=${result.liked}`);
                        } catch (err) {
                            console.error(`Error checking like for review ${review.id}:`, err);
                            likeStatus[review.id] = false;
                        }
                    }
                    console.log('📊 Final like status:', likeStatus);
                    setLikedReviews(likeStatus);
                } else {
                    console.log('👤 User not logged in, resetting likes...');
                    setLikedReviews({});
                }
            } catch (err) {
                console.error('❌ Error loading reviews:', err);
                setReviews([]);
            } finally {
                setLoadingReviews(false);
            }
        };
        loadReviews();
    }, [movieId, user]);

    // Function to sort reviews
    const getSortedReviews = () => {
        if (!reviews || reviews.length === 0) return [];
        
        const reviewsCopy = [...reviews];
        
        switch (selectedSort) {
            case 'recent':
                return reviewsCopy.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            case 'popular':
                return reviewsCopy.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
            case 'highest':
                return reviewsCopy.sort((a, b) => b.rating - a.rating);
            case 'lowest':
                return reviewsCopy.sort((a, b) => a.rating - b.rating);
            default:
                return reviewsCopy;
        }
    };

    // Submit review
    const handleSubmitReview = async (e) => {
        e.preventDefault();

        if (!user) {
            // toast.info('Please login to submit a review');
            navigate('/login');
            return;
        }

        if (userReview.rating === 0) {
            setRatingError(true);
            // toast.warning('Please select a rating');
            return;
        }

        setRatingError(false);

        if (userReview.text.trim().length === 0) {
            setTextError(true);
            toast.warning('Please write a review');
            return;
        }

        setTextError(false);

        try {
            setSubmittingReview(true);
            const result = await reviewService.submitReview(
                movieId,
                userReview.rating,
                userReview.text,
                isTV ? 'tv' : 'movie',
                media  // Pass movie data
            );

            // console.log('✅ Review submitted successfully:', result);
            
            if (result.review) {
                setReviews([result.review, ...reviews]);
                // Add review to like state (new review starts without like from own user)
                setLikedReviews(prev => ({
                    ...prev,
                    [result.review.id]: false
                }));
                // toast.success('Review submitted successfully!');
            }            setUserReview({ rating: 0, text: '' });

            document.querySelectorAll('.star-input').forEach(star => {
                star.classList.remove('active');
            });
        } catch (err) {
            // toast.error('Error submitting review: ' + err.message);
        } finally {
            setSubmittingReview(false);
        }
    };

    // Handle star click
    const handleStarClick = (value) => {
        setUserReview({ ...userReview, rating: value });
        setRatingError(false);
        document.querySelectorAll('.star-input').forEach((star, index) => {
            if (index < value) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    };

    // Load more reviews
    const handleLoadMoreReviews = () => {
        setDisplayedReviewsCount(prev => prev + 10);
    };

    // Handle like/unlike
    const handleLikeReview = async (reviewId, isCurrentlyLiked) => {
        if (!user) {
            showPopupNotification('Please login to like a review', 'info');
            return;
        }

        // Prevent multiple clicks
        if (likingReviewId) {
            return;
        }

        try {
            setLikingReviewId(reviewId);
            const result = await reviewService.likeReview(reviewId);
            if (result.success) {
                // Update like status
                setLikedReviews(prev => ({
                    ...prev,
                    [reviewId]: result.liked
                }));

                // Update like count in review
                setReviews(prev =>
                    prev.map(review =>
                        review.id === reviewId
                            ? {
                                ...review,
                                likes_count: result.liked
                                    ? review.likes_count + 1
                                    : review.likes_count - 1
                            }
                            : review
                    )
                );
                console.log(`✅ Like ${result.liked ? 'added' : 'removed'} from review ${reviewId}`);
            }
        } catch (err) {
            console.error('Error liking review:', err);
            // toast.error('Error liking review');
        } finally {
            setLikingReviewId(null);
        }
    };

    // Delete a review
    const handleDeleteReview = async (reviewId) => {
        const confirmed = await showDeleteConfirmation(reviewId);
        
        if (!confirmed) {
            return;
        }

        try {
            await reviewService.deleteReview(reviewId);
            setReviews(prev => prev.filter(review => review.id !== reviewId));
            setLikedReviews(prev => {
                const updated = { ...prev };
                delete updated[reviewId];
                return updated;
            });
            // toast.success('Review deleted successfully!');
            console.log('✅ Review deleted successfully');
        } catch (err) {
            console.error('Error deleting review:', err);
            // toast.error('Error deleting review');
        }
    };

    // Initialize recommendations carousel
    useEffect(() => {
        if (recommendations.length === 0) return;

        setTimeout(() => {
            const carousel = document.getElementById('recommendations-carousel');
            const prevBtn = document.getElementById('recommendations-prev');
            const nextBtn = document.getElementById('recommendations-next');
            const dotsContainer = document.getElementById('recommendations-dots');

            if (!carousel) return;

            const CAROUSEL_ITEMS_PER_PAGE = 4;
            let currentPage = 0;

            // Create dots
            const totalItems = carousel.children.length;
            const maxPage = Math.ceil(totalItems / CAROUSEL_ITEMS_PER_PAGE) - 1;

            const createDots = () => {
                dotsContainer.innerHTML = '';
                for (let i = 0; i <= maxPage; i++) {
                    const dot = document.createElement('div');
                    dot.className = `carousel-dot ${i === 0 ? 'active' : ''}`;
                    dot.addEventListener('click', () => goToPage(i));
                    dotsContainer.appendChild(dot);
                }
            };

            const goToPage = (page) => {
                currentPage = page;
                const itemWidth = carousel.querySelector('.carousel-item')?.offsetWidth || 280;
                carousel.scrollLeft = page * itemWidth * CAROUSEL_ITEMS_PER_PAGE;

                // Update dots
                document.querySelectorAll('#recommendations-dots .carousel-dot').forEach((dot, idx) => {
                    dot.classList.toggle('active', idx === page);
                });

                // Update button visibility
                updateButtonVisibility();
            };

            const updateButtonVisibility = () => {
                if (prevBtn) {
                    prevBtn.style.visibility = currentPage === 0 ? 'hidden' : 'visible';
                }
                if (nextBtn) {
                    nextBtn.style.visibility = currentPage === maxPage ? 'hidden' : 'visible';
                }
            };

            createDots();
            updateButtonVisibility();

            prevBtn?.addEventListener('click', () => {
                if (currentPage > 0) {
                    goToPage(currentPage - 1);
                }
            });

            nextBtn?.addEventListener('click', () => {
                if (currentPage < maxPage) {
                    goToPage(currentPage + 1);
                }
            });
        }, 100);
    }, [recommendations]);

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '50px', color: '#fff' }}>Loading... (ID: {movieId})</div>;
    }

    if (error || !media) {
        return <div style={{ textAlign: 'center', padding: '50px', color: '#fff' }}>
            <h2>Error: {error || 'Failed to load content'}</h2>
            <p>Movie ID: {movieId}</p>
        </div>;
    }

    const backdropUrl = media.backdrop_path ? `https://image.tmdb.org/t/p/w1280${media.backdrop_path}` : null;
    const posterUrl = media.poster_path ? `https://image.tmdb.org/t/p/w500${media.poster_path}` : postTemplate;
    const releaseYear = isTV ? new Date(media.first_air_date).getFullYear() : new Date(media.release_date).getFullYear();
    const genres = media.genres?.map(g => g.name).join(', ') || 'N/A';
    const runtime = isTV ? (media.episode_run_time?.[0] || 0) : media.runtime;
    const seasons = isTV ? media.number_of_seasons : 0;
    const mediaType = isTV ? 'TV Series' : 'Movie';
    const rating = media.vote_average || 0;
    const formattedRating = (rating / 2).toFixed(1);

    console.log('📸 Backdrop URL:', backdropUrl);
    console.log('📸 Poster URL:', posterUrl);
    console.log('📸 Media data:', media);

    // Extrair diretor
    const getDirector = () => {
        if (isTV && media.created_by?.length > 0) {
            return media.created_by.map(c => c.name).join(', ');
        } else if (!isTV && media.credits?.crew) {
            const director = media.credits.crew.find(person => person.job === 'Director');
            return director?.name || 'N/A';
        }
        return 'N/A';
    };

    // Extrair watch providers (onde assistir)
    const getWatchProviders = () => {
        const providers = media['watch/providers']?.results?.US;
        if (!providers) return [];

        const watchOptions = [];
        if (providers.rent) {
            watchOptions.push(...providers.rent.map(p => ({ ...p, type: 'Rent' })));
        }
        if (providers.buy) {
            watchOptions.push(...providers.buy.map(p => ({ ...p, type: 'Buy' })));
        }
        if (providers.flatrate) {
            watchOptions.push(...providers.flatrate.map(p => ({ ...p, type: 'Stream' })));
        }
        return watchOptions.slice(0, 3); // Limite a 3 provedores
    };

    return (
        <>
            <BackButton />
            <main className="movie-info-page">
                {/* <!-- Hero Section com Banner do Filme --> */}
                <section className="movie-hero">
                    <div className="hero-backdrop">
                        {backdropUrl && <div className="backdrop-image" style={{ backgroundImage: `url(${backdropUrl})` }}></div>}
                        <div className="backdrop-overlay"></div>
                    </div>

                    <div className="container">
                        <div className="movie-hero-content">
                            <div className="movie-poster-large">
                                <img src={posterUrl} alt={media.title || media.name} />
                            </div>

                            <div className="movie-hero-info">
                                <h1 className="movie-title">{media.title || media.name}</h1>

                                <div className="movie-meta">
                                    <span className="meta-item">
                                        <FontAwesomeIcon icon={faCalendarAlt} />
                                        {releaseYear}
                                    </span>
                                    {isTV ? (
                                        <span className="meta-item">
                                            <FontAwesomeIcon icon={faTv} />
                                            {seasons} {seasons === 1 ? 'Season' : 'Seasons'}
                                        </span>
                                    ) : (
                                        <span className="meta-item">
                                            <FontAwesomeIcon icon={faClock} />
                                            {runtime}m
                                        </span>
                                    )}
                                    <span className="meta-item">
                                        <FontAwesomeIcon icon={faFilm} />
                                        {mediaType}
                                    </span>
                                    <span className="meta-item rating">
                                        <FontAwesomeIcon icon={faStar} />
                                        {formattedRating}/5
                                    </span>
                                </div>

                                <div className="movie-actions">
                                    <button className="action-btn-info watched" data-action="watched">
                                        <FontAwesomeIcon icon={faEye} />
                                        <span>Watched</span>
                                    </button>
                                    <button className="action-btn-info like" data-action="like">
                                        <FontAwesomeIcon icon={faHeart} />
                                        <span>Like</span>
                                    </button>
                                    <button className="action-btn-info add-list" data-action="addToList">
                                        <FontAwesomeIcon icon={faPlus} />
                                        <span>Add to List</span>
                                    </button>
                                </div>

                                <div className="movie-description">
                                    <h3>Synopsis</h3>
                                    <p className="overview-text">
                                        {media.overview}
                                    </p>
                                    {/* {media.overview?.length > 200 && (
                                        <button 
                                            className="read-more-btn"
                                            onClick={() => setExpandedOverview(!expandedOverview)}
                                        >
                                            {expandedOverview ? 'Read Less' : 'Read More'}
                                        </button>
                                    )} */}
                                </div>

                                <div className="movie-details">
                                    <div className="detail-item">
                                        <span className="detail-label">{isTV ? 'Creator:' : 'Director:'}</span>
                                        <span className="detail-value">{getDirector()}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Genre:</span>
                                        <span className="detail-value">{genres}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Original Language:</span>
                                        <span className="detail-value">{media.original_language?.toUpperCase() || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* <!-- Conteúdo Principal --> */}
                <section className="movie-content">
                    <div className="container">
                        <div className="content-grid">
                            {/* <!-- Coluna Esquerda - Informações Adicionais --> */}
                            <aside className="content-sidebar">
                                <div className="sidebar-card">
                                    <h3>Stats</h3>
                                    <div className="stats-grid">
                                        <div className="stat-item">
                                            <div className="stat-value">{formattedRating}</div>
                                            <div className="stat-label">Rating</div>
                                        </div>
                                        <div className="stat-item">
                                            <div className="stat-value">{media.popularity?.toFixed(0) || '0'}</div>
                                            <div className="stat-label">Popularity</div>
                                        </div>
                                        <div className="stat-item">
                                            <div className="stat-value">{media.vote_count?.toLocaleString() || '0'}</div>
                                            <div className="stat-label">Votes</div>
                                        </div>
                                        <div className="stat-item">
                                            <div className="stat-value">{mediaType === 'TV Series' ? 'Series' : 'Movie'}</div>
                                            <div className="stat-label">Type</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="sidebar-card">
                                    <h3>Technical Details</h3>
                                    <div className="tech-details">
                                        <div className="tech-item">
                                            <span>Budget:</span>
                                            <span>{media.budget && media.budget > 0 ? `$${(media.budget / 1000000)?.toFixed(1)} M` : '-'}</span>
                                        </div>
                                        <div className="tech-item">
                                            <span>Revenue:</span>
                                            <span>{media.revenue && media.revenue > 0 ? `$${(media.revenue / 1000000)?.toFixed(1)} M` : '-'}</span>
                                        </div>
                                        <div className="tech-item">
                                            <span>Status:</span>
                                            <span>{media.status ? (media.status === 'Returning Series' ? 'Returning Series' : media.status === 'Ended' ? 'Ended' : media.status) : 'N/A'}</span>
                                        </div>
                                        <div className="tech-item">
                                            <span>Type:</span>
                                            <span>{isTV ? 'TV Series' : 'Movie'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="sidebar-card">
                                    <h3>Where to Watch</h3>
                                    <div className="streaming-options">
                                        {getWatchProviders().length > 0 ? (
                                            getWatchProviders().map((provider, idx) => (
                                                <div key={idx} className="streaming-item">
                                                    <div className="streaming-logo">
                                                        {provider.logo_path ? (
                                                            <img
                                                                src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                                                                alt={provider.provider_name}
                                                                title={provider.provider_name}
                                                                style={{ width: '40px', height: '40px', borderRadius: '4px' }}
                                                            />
                                                        ) : (
                                                            <FontAwesomeIcon icon={faTv} />
                                                        )}
                                                    </div>
                                                    <span>{provider.provider_name}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="streaming-item">
                                                <span style={{ color: 'var(--text-secondary)', textAlign: 'center', width: '100%' }}>Not available</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </aside>

                            {/* <!-- Coluna Direita - Avaliações e Conteúdo Principal --> */}
                            <div className="content-main">
                                {/* <!-- User Review Section --> */}
                                {user ? (
                                    <div className="review-section">
                                        <h2>Your Review</h2>
                                        <div className="rating-widget">
                                            <div className="stars-rating">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <span
                                                        key={star}
                                                        className={`star-input ${(hoverRating || userReview.rating) >= star ? 'active' : ''}`}
                                                        onClick={() => handleStarClick(star)}
                                                        onMouseEnter={() => setHoverRating(star)}
                                                        onMouseLeave={() => setHoverRating(0)}
                                                        style={{ cursor: 'pointer' }}
                                                        id="starInputInfo"
                                                    >
                                                        <FontAwesomeIcon icon={faStar} />
                                                    </span>
                                                ))}
                                                <span className="rating-text">{Math.round(hoverRating || userReview.rating)}/5</span>
                                            </div>
                                            {ratingError && (
                                                <span className="error-message" style={{ color: '#ff4757', fontSize: '0.85rem', marginTop: '6px', marginBottom: '8px', fontWeight: '500', display: 'block', animation: 'slideDown 0.3s ease-out' }}>
                                                    Please select a rating before submitting
                                                </span>
                                            )}

                                            <form className="review-form" onSubmit={handleSubmitReview}>
                                                <div style={{ marginBottom: '0px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    {/* <label style={{ fontSize: '0.9rem', color: '#A0A0B0' }}>Your review</label> */}
                                                    <span style={{ fontSize: '0.85rem', color: userReview.text.length > MAX_REVIEW_LENGTH * 0.9 ? '#f39c12' : '#6C6C80' }}>
                                                        {userReview.text.length} / {MAX_REVIEW_LENGTH}
                                                    </span>
                                                </div>
                                                <textarea
                                                    placeholder="Share your opinion about this content..."
                                                    className="review-textarea"
                                                    value={userReview.text}
                                                    maxLength={MAX_REVIEW_LENGTH}
                                                    onChange={(e) => {
                                                        setUserReview({ ...userReview, text: e.target.value });
                                                        if (e.target.value.trim().length > 0) {
                                                            setTextError(false);
                                                        }
                                                    }}
                                                    disabled={submittingReview}
                                                />
                                                {textError && (
                                                    <span className="error-message" style={{ color: '#ff4757', fontSize: '0.85rem', marginTop: '6px', marginBottom: '8px', fontWeight: '500', display: 'block', animation: 'slideDown 0.3s ease-out' }}>
                                                        Please write a review before submitting
                                                    </span>
                                                )}
                                                <button
                                                    type="submit"
                                                    className="submit-review-btn"
                                                    disabled={submittingReview}
                                                >
                                                    <FontAwesomeIcon icon={faPaperPlane} />
                                                    {submittingReview ? 'Sending...' : 'Send Review'}
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="review-section login-prompt">
                                        <p>
                                            <Link to="/login">Log in</Link> to share your review
                                        </p>
                                    </div>
                                )}

                                {/* <!-- Community Reviews --> */}
                                <div className="community-reviews">
                                    <div className="section-header-home">
                                        <h2>Community Reviews</h2>
                                        <div className="sort-options" style={{ display: 'flex', justifyContent: 'center' }}>
                                            <div className="sort-dropdown-info" style={{ position: 'relative', display: 'inline-block' }}>
                                                <button 
                                                    className="sort-btn"
                                                    onClick={() => setIsSortOpen(!isSortOpen)}
                                                >
                                                    <span>
                                                        {{
                                                            'recent': 'Newest',
                                                            'popular': 'Most Useful',
                                                            'highest': 'Highest Rating',
                                                            'lowest': 'Lowest Rating'
                                                        }[selectedSort]}
                                                    </span>
                                                    <FontAwesomeIcon icon={isSortOpen ? faChevronUp : faChevronDown} />
                                                </button>
                                                {isSortOpen && (
                                                    <div className="filter-type-dropdown-content" style={{ position: 'absolute', top: '100%', left: 0, right: 0 }}>
                                                        <button 
                                                            className="filter-option" 
                                                            onClick={() => { setSelectedSort('recent'); setIsSortOpen(false); }}
                                                        >
                                                            Newest
                                                        </button>
                                                        <button 
                                                            className="filter-option" 
                                                            onClick={() => { setSelectedSort('popular'); setIsSortOpen(false); }}
                                                        >
                                                            Most Useful
                                                        </button>
                                                        <button 
                                                            className="filter-option" 
                                                            onClick={() => { setSelectedSort('highest'); setIsSortOpen(false); }}
                                                        >
                                                            Highest Rating
                                                        </button>
                                                        <button 
                                                            className="filter-option" 
                                                            onClick={() => { setSelectedSort('lowest'); setIsSortOpen(false); }}
                                                        >
                                                            Lowest Rating
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="reviews-list">
                                        {loadingReviews ? (
                                            <p style={{ color: '#fff', textAlign: 'center', padding: '20px' }}>Loading reviews...</p>
                                        ) : reviews && reviews.length > 0 ? (
                                            getSortedReviews().slice(0, displayedReviewsCount).map((review, idx) => (
                                                <div key={idx} className="review-card">
                                                    <div className="reviewer-info">
                                                        <div 
                                                            className="reviewer-avatar"
                                                            onClick={() => navigate(`/user/${review.username}`)}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            <Avatar
                                                                src={review.avatar}
                                                                alt={review.displayName || review.username}
                                                                className="avatar-img"
                                                                size="medium"
                                                            />
                                                        </div>
                                                        {/* <div className="reviewer-details">
                                                            <h4>{review.displayName || review.username}</h4>
                                                            <span className="review-date">
                                                                {new Date(review.created_at).toLocaleDateString('en-US')}
                                                            </span>
                                                        </div> */}
                                                    </div>

                                                    <div className="review-content">
                                                        <div className="reviewer-name">
                                                            <h4>{review.displayName || review.username}</h4>
                                                            <span className="review-date">
                                                                {new Date(review.created_at).toLocaleDateString('en-US')}
                                                            </span>
                                                        </div>

                                                        <div className="review-rating">


                                                            <div className="stars">
                                                                {[1, 2, 3, 4, 5].map(star => (
                                                                    <FontAwesomeIcon
                                                                        key={star}
                                                                        icon={faStar}
                                                                        style={{
                                                                            color: star <= review.rating ? '#fada5e' : '#555'
                                                                        }}
                                                                    />
                                                                ))}
                                                            </div>
                                                            <span>{Math.round(review.rating)}/5</span>
                                                        </div>

                                                        <p className="review-text">{review.text}</p>

                                                        <div className="review-actions">
                                                            <button
                                                                class={`like-btn ${likedReviews[review.id] ? 'liked' : ''}`}
                                                                onClick={() => handleLikeReview(review.id, likedReviews[review.id])}
                                                                disabled={likingReviewId === review.id}
                                                            >
                                                                <FontAwesomeIcon icon={faHeart} />
                                                                <span>{review.likes_count}</span>
                                                            </button>
                                                            {user && user.id === review.user_id && (
                                                                <button
                                                                    className="deleteButton"
                                                                    onClick={() => handleDeleteReview(review.id)}
                                                                    title="Delete review"
                                                                >
                                                                    <FontAwesomeIcon icon={faTrash} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p style={{ color: '#A0A0B0', textAlign: 'center', padding: '20px' }}>
                                                No reviews yet. Be the first to review!
                                            </p>
                                        )}
                                    </div>

                                    {displayedReviewsCount < reviews.length && (
                                        <div className="load-more-reviews">
                                            <button className="load-more-btn" onClick={handleLoadMoreReviews}>
                                                <FontAwesomeIcon icon={faPlus} />
                                                Load More Reviews
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* <!-- Recomendações --> */}
                <section className="similar-movies">
                    <div className="container">
                        <div className="section-header-home">
                            <h2>Recommendations</h2>
                            <p>Based on what you are watching</p>
                        </div>

                        {loadingRecommendations ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#fff' }}>
                                <p>Loading recommendations...</p>
                            </div>
                        ) : recommendations.length > 0 ? (
                            <div style={{ marginBottom: '40px' }}>
                                <div className="carousel-container">
                                    <button className="carousel-arrow prev" id="recommendations-prev">
                                        <FontAwesomeIcon icon={faChevronLeft} />
                                    </button>

                                    <div className="carousel" id="recommendations-carousel">
                                        {recommendations.map(rec => (
                                            <div key={rec.id} className="carousel-item">
                                                <div
                                                    className="movie-card"
                                                    onClick={() => {
                                                        console.log('🎬 Navigating to:', rec.id, rec.title, 'Type:', isTV ? 'tv' : 'movie');
                                                        navigate(`/info/${isTV ? 'tv' : 'movie'}/${rec.id}`);
                                                    }}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <div className="movie-poster">
                                                        <img src={rec.poster} alt={rec.title} />
                                                        <div className="movie-rating-badge">{(rec.rating / 2).toFixed(1)}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button className="carousel-arrow next" id="recommendations-next">
                                        <FontAwesomeIcon icon={faChevronRight} />
                                    </button>
                                </div>

                                <div className="carousel-dots" id="recommendations-dots"></div>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#fff' }}>
                                <p>No recommendations available</p>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </>
    );
};

export default Info;
