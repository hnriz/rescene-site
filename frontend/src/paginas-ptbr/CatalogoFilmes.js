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
import BackButtonPTBR from '../componentes-ptbr/BackButtonPTBR';
import * as tmdbService from '../services/tmdbService';
import '../css/movies.css';

function CatalogoFilmes() {
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
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [isGenreDropdownOpen, setIsGenreDropdownOpen] = useState(false);

    // Fechar dropdown ao clicar fora
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

    // Resetar página quando gênero muda (além da URL)
    useEffect(() => {
        setPage(1);
        setIsInitialLoad(true);
        setMovies([]); // Limpar filmes quando gênero muda
    }, [selectedGenre]);

    // Mapeamento de gêneros (IDs TMDB)
    const genres = [
        { id: '', label: 'Todos os Gêneros' },
        { id: 28, label: 'Ação' },
        { id: 12, label: 'Aventura' },
        { id: 16, label: 'Animação' },
        { id: 35, label: 'Comédia' },
        { id: 80, label: 'Crime' },
        { id: 99, label: 'Documentário' },
        { id: 18, label: 'Drama' },
        { id: 10751, label: 'Família' },
        { id: 14, label: 'Fantasia' },
        { id: 36, label: 'História' },
        { id: 27, label: 'Terror' },
        { id: 10402, label: 'Música' },
        { id: 10749, label: 'Romance' },
        { id: 878, label: 'Ficção Científica' },
        { id: 10770, label: 'Filme para TV' },
        { id: 53, label: 'Thriller' },
        { id: 10752, label: 'Guerra' },
        { id: 37, label: 'Faroeste' }
    ];

    // Carregar filmes da API TMDB
    useEffect(() => {
        const loadMovies = async () => {
            try {
                if (isInitialLoad) {
                    setLoading(true);
                }
                console.log('📽️ Carregando filmes do TMDB (página ' + page + ', gênero: ' + selectedGenre + ')...');
                let moviesData;
                
                if (selectedGenre) {
                    // Carregar filmes por gênero
                    moviesData = await tmdbService.getMoviesByGenre(selectedGenre, page, 'pt-BR');
                } else {
                    // Carregar filmes populares
                    moviesData = await tmdbService.getPopularMovies(page, 'pt-BR');
                }
                
                const formattedMovies = moviesData.map(movie => 
                    tmdbService.formatTMDBItem(movie, 'movie')
                );

                if (isInitialLoad) {
                    // Primeira carga - substituir filmes
                    setMovies(formattedMovies);
                    setIsInitialLoad(false);
                } else {
                    // Cargas subsequentes - adicionar filmes
                    setMovies(prevMovies => [...prevMovies, ...formattedMovies]);
                }
                
                setError(null);
                console.log('✅ Filmes carregados:', formattedMovies.length);
            } catch (err) {
                console.error('❌ Erro ao carregar filmes:', err);
                setError('Erro ao carregar filmes. Tente novamente.');
            } finally {
                setLoading(false);
            }
        };

        loadMovies();
    }, [page, selectedGenre]);

    // Buscar filmes com debounce
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
                console.log('🔍 Buscando filmes:', searchQuery);
                const results = await tmdbService.searchMovies(searchQuery, 'pt-BR');
                const formattedResults = results.map(movie =>
                    tmdbService.formatTMDBItem(movie, 'movie')
                );
                setSearchResults(formattedResults);
                console.log('✅ Resultados encontrados:', formattedResults.length);
            } catch (err) {
                console.error('❌ Erro ao buscar filmes:', err);
                setSearchResults([]);
            } finally {
                setSearchLoading(false);
            }
        }, 500); // Debounce de 500ms

        return () => clearTimeout(searchTimeout);
    }, [searchQuery]);

    const handleMovieClick = (movieId) => {
        navigate(`/info-ptbr/movie/${movieId}`);
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const getGenreLabel = () => {
        if (!selectedGenre) return 'Todos os Gêneros';
        const genre = genres.find(g => g.id == selectedGenre);
        return genre ? genre.label : 'Todos os Gêneros';
    };

    return (
        <>
            <BackButtonPTBR />
            <main className="movies-page">
                {/* Seção Herói com Filme em Destaque */}
                <section className="hero-section-movies hero-films">
                <div className="hero-background-movies" />
                <div className="hero-overlay-movies" />

                <div className="hero-content-main">
                    <div className="hero-text-catalog">
                        <h1>PESQUISE FILMES</h1>
                        {/* <p>
                            Explore nosso catálogo com milhares de filmes, avaliações da
                            comunidade e recomendações personalizadas.
                        </p> */}
                        {/* <div className="hero-cta">
                            <button className="cta-btn primary">Explorar Catálogo</button>
                            <button className="cta-btn secondary">Ver Tendências</button>
                        </div> */}
                    </div>
                </div>
            </section>

            {/* Filtros e Busca */}
            <section className="filters-section">
                <div className="container">
                    <div className="filters-container">
                        <div className="filters-grid">
                            <div className="filter-group">
                                <div className="search-box">
                                    <FontAwesomeIcon icon={faSearch} />
                                    <input
                                        type="text"
                                        placeholder="Buscar filmes..."
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

            {/* Catálogo de Filmes */}
            <section className="catalog-section">
                <div className="container">
                    <div className="catalog-header">
                        {/* <h2>Catálogo de Filmes</h2> */}
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
                                <p style={{ color: '#fff', fontSize: '1.1rem' }}>Buscando filmes...</p>
                            </div>
                        )}

                        {isSearching && !searchLoading && searchResults.length === 0 && searchQuery.trim() !== '' && (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
                                <p style={{ color: '#fff' }}>Nenhum filme encontrado para "{searchQuery}"</p>
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
                                <p style={{ color: '#fff', fontSize: '1.1rem' }}>Carregando filmes...</p>
                            </div>
                        )}
                        
                        {!isSearching && error && (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#e74c3c' }}>
                                <p>{error}</p>
                            </div>
                        )}
                        
                        {!isSearching && !loading && !error && movies.length === 0 && (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
                                <p style={{ color: '#fff' }}>Nenhum filme encontrado</p>
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
                            <button className="load-more-btn" onClick={() => setPage(page + 1)}>
                                <FontAwesomeIcon icon={faPlus} />
                                Carregar Mais Filmes
                            </button>
                        )}
                    </div>
                </div>
            </section>
            </main>
        </>
    );
}

export default CatalogoFilmes;
