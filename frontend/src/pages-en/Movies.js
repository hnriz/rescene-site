import React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faFilm,
    faHeart,
    faPlay,
    faStar,
    faBookmark,
    faSearch,
    faTh,
    faEye,
    faList,
    faPlus,
    faChevronDown,
    faChevronUp
} from '@fortawesome/free-solid-svg-icons';
import BackButton from '../components/BackButton';
import * as tmdbService from '../services/tmdbService';
import '../css/movies.css';

function Movies() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [selectedGenre, setSelectedGenre] = useState(() => searchParams.get('genre') || '');
    const [genreLoading, setGenreLoading] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [isGenreDropdownOpen, setIsGenreDropdownOpen] = useState(false);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            const genreDropdown = document.querySelector('.genre-dropdown');

            if (genreDropdown && !genreDropdown.contains(event.target)) {
                setIsGenreDropdownOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Update genre when URL parameter changes
    useEffect(() => {
        const genreParam = searchParams.get('genre');
        if (genreParam) {
            setSelectedGenre(genreParam);
            setPage(1);
            setIsInitialLoad(true);
        }
    }, [searchParams]);

    // Reset page when genre changes (beyond URL)
    useEffect(() => {
        setPage(1);
        setIsInitialLoad(true);
        setMovies([]); // Clear movies when genre changes
    }, [selectedGenre]);

    // Genre mapping (TMDB IDs)
    const genres = [
        { id: '', label: 'All Genres' },
        { id: 28, label: 'Action' },
        { id: 12, label: 'Adventure' },
        { id: 16, label: 'Animation' },
        { id: 35, label: 'Comedy' },
        { id: 80, label: 'Crime' },
        { id: 99, label: 'Documentary' },
        { id: 18, label: 'Drama' },
        { id: 10751, label: 'Family' },
        { id: 14, label: 'Fantasy' },
        { id: 36, label: 'History' },
        { id: 27, label: 'Horror' },
        { id: 10402, label: 'Music' },
        { id: 10749, label: 'Romance' },
        { id: 878, label: 'Science Fiction' },
        { id: 10770, label: 'TV Movie' },
        { id: 53, label: 'Thriller' },
        { id: 10752, label: 'War' },
        { id: 37, label: 'Western' }
    ];

    // Load movies from TMDB API
    useEffect(() => {
        const loadMovies = async () => {
            try {
                if (isInitialLoad) {
                    setLoading(true);
                } else {
                    setGenreLoading(true);
                }
                console.log('🎬 Loading movies from TMDB (page ' + page + ', genre: ' + selectedGenre + ')...');
                let moviesData;
                
                if (selectedGenre) {
                    // Load movies by genre
                    moviesData = await tmdbService.getMoviesByGenre(selectedGenre, page, 'en-US');
                } else {
                    // Load popular movies
                    moviesData = await tmdbService.getPopularMovies(page, 'en-US');
                }
                
                const formattedMovies = moviesData.map(movie => 
                    tmdbService.formatTMDBItem(movie, 'movie')
                );

                if (isInitialLoad) {
                    // First load - replace movies
                    setMovies(formattedMovies);
                    setIsInitialLoad(false);
                } else {
                    // Subsequent loads - append movies
                    setMovies(prevMovies => [...prevMovies, ...formattedMovies]);
                }
                
                setError(null);
                console.log('✅ Movies loaded:', formattedMovies.length);
            } catch (err) {
                console.error('❌ Error loading movies:', err);
                setError('Error loading movies. Please try again.');
            } finally {
                setLoading(false);
                setGenreLoading(false);
            }
        };

        loadMovies();
    }, [page, selectedGenre]);

    // Search movies with debounce
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setIsSearching(false);
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        setSearchLoading(true);

        const searchTimeout = setTimeout(async () => {
            try {
                console.log('🔍 Searching movies:', searchQuery);
                const results = await tmdbService.searchMovies(searchQuery, 1, 'en-US');
                const formattedResults = results.map(movie =>
                    tmdbService.formatTMDBItem(movie, 'movie')
                );
                setSearchResults(formattedResults);
                console.log('✅ Results found:', formattedResults.length);
            } catch (err) {
                console.error('❌ Error searching movies:', err);
                setSearchResults([]);
            } finally {
                setSearchLoading(false);
            }
        }, 500); // Debounce 500ms

        return () => clearTimeout(searchTimeout);
    }, [searchQuery]);

    const handleMovieClick = (movieId) => {
        navigate(`/info/movie/${movieId}`);
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const getGenreLabel = () => {
        if (!selectedGenre) return 'All Genres';
        const genre = genres.find(g => g.id == selectedGenre);
        return genre ? genre.label : 'All Genres';
    };

    return (
        <>
            <BackButton />
            <main className="movies-page">
                {/* Hero Section with Featured Movie */}
                <section className="hero-section-movies hero-films">
                <div className="hero-background-movies" />
                <div className="hero-overlay-movies" />

                <div className="hero-content-main">
                    <div className="hero-text-catalog">
                        <h1>SEARCH MOVIES</h1>
                        {/* <p>
                            Explore thousands of movies
                        </p> */}
                        {/* <div className="hero-cta">
                            <button className="cta-btn primary">Explore Catalog</button>
                            <button className="cta-btn secondary">View Trending</button>
                        </div> */}
                    </div>
                </div>
            </section>

            {/* Filters and Search */}
            <section className="filters-section">
                <div className="container">
                    <div className="filters-container">
                        {/* <div className="filters-header">
                            <h2>Find Your Next Movie</h2>
                            <p>Filter by genre, year, rating and more</p>
                        </div> */}
                        <div className="filters-grid">
                            <div className="filter-group">
                                <div className="search-box">
                                    <FontAwesomeIcon icon={faSearch} />
                                    <input
                                        type="text"
                                        placeholder="Search movies..."
                                        id="movie-search"
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                    />
                                </div>
                            </div>
                            <div className="genre-dropdown">
                                <button className="genre-dropdown-btn" onClick={() => setIsGenreDropdownOpen(!isGenreDropdownOpen)}>
                                    <span>{getGenreLabel()}</span>
                                    <FontAwesomeIcon icon={isGenreDropdownOpen ? faChevronUp : faChevronDown} />
                                </button>
                                <div 
                                    className="genre-dropdown-content"
                                    style={{ 
                                        display: isGenreDropdownOpen ? 'block' : 'none',
                                        visibility: isGenreDropdownOpen ? 'visible' : 'hidden',
                                        opacity: isGenreDropdownOpen ? 1 : 0
                                    }}
                                >
                                    {genres.map(genre => (
                                        <button
                                            key={genre.id}
                                            className={`genre-option ${selectedGenre == genre.id ? 'selected' : ''}`}
                                            onClick={() => {
                                                setSelectedGenre(genre.id);
                                                setPage(1);
                                                setIsGenreDropdownOpen(false);
                                            }}
                                        >
                                            {genre.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Movie Catalog */}
            <section className="catalog-section">
                <div className="container">
                    <div className="catalog-header">
                        {/* <h2>Movie Catalog</h2> */}
                        {/* <div className="view-options">
                            <button className="view-btn active" data-view="grid">
                                <FontAwesomeIcon icon={faTh} />
                            </button>
                            <button className="view-btn" data-view="list">
                                <FontAwesomeIcon icon={faList} />
                            </button>
                        </div> */}
                    </div>
                    <div className="movies-grid" id="movies-container">
                        {isSearching && searchLoading && (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
                                <p style={{ color: '#fff', fontSize: '1.1rem' }}>Searching movies...</p>
                            </div>
                        )}

                        {isSearching && !searchLoading && searchResults.length === 0 && searchQuery.trim() !== '' && (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
                                <p style={{ color: '#fff' }}>No movies found for "{searchQuery}"</p>
                            </div>
                        )}

                        {isSearching && searchResults.length > 0 && !searchLoading && searchResults.map((movie) => (
                            <div key={movie.id} className="movie-card" onClick={() => handleMovieClick(movie.id)} style={{ cursor: 'pointer' }}>
                                <div className="movie-poster">
                                    <img src={movie.poster || '../src/img/poster1.jpg'} alt={movie.title} />
                                    <div className="movie-rating-badge">{(movie.rating / 2).toFixed(1)}</div>
                                </div>
                            </div>
                        ))}

                        {!isSearching && loading && (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
                                <p style={{ color: '#fff', fontSize: '1.1rem' }}>Loading movies...</p>
                            </div>
                        )}
                        
                        {!isSearching && error && (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#e74c3c' }}>
                                <p>{error}</p>
                            </div>
                        )}
                        
                        {!isSearching && !loading && !error && movies.length === 0 && (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
                                <p style={{ color: '#fff' }}>No movies found</p>
                            </div>
                        )}

                        {!isSearching && !loading && movies.map((movie) => (
                            <div key={movie.id} className="movie-card" onClick={() => handleMovieClick(movie.id)} style={{ cursor: 'pointer' }}>
                                <div className="movie-poster">
                                    <img src={movie.poster || '../src/img/poster1.jpg'} alt={movie.title} />
                                    <div className="movie-rating-badge">{(movie.rating / 2).toFixed(1)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="load-more">
                        {!isSearching && (
                            <button className="load-more-btn" onClick={() => setPage(page + 1)} disabled={genreLoading}>
                                <FontAwesomeIcon icon={faPlus} />
                                {genreLoading ? 'Loading...' : 'Load More Movies'}
                            </button>
                        )}
                    </div>
                </div>
            </section>
            </main>
        </>
    );
}

export default Movies;
