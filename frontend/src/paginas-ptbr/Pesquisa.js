import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/axiosConfig';
import BackButtonPTBR from '../componentes-ptbr/BackButtonPTBR';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar as faStarFull } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarEmpty } from '@fortawesome/free-regular-svg-icons';

function Pesquisa() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filter, setFilter] = useState('all');
    const query = searchParams.get('q') || '';

    // Função para converter rating 0-10 do TMDB para 0-5
    const convertRating = (rating) => {
        if (!rating || typeof rating !== 'number') return 0;
        return Math.min(rating / 2, 5);
    };

    useEffect(() => {
        if (query.length > 0) {
            fetchResults();
        }
    }, [query, filter]);

    const fetchResults = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/search', {
                params: { 
                    q: query,
                    language: 'pt-BR'
                }
            });

            let data = response.data.results || [];

            // Aplicar filtro
            if (filter !== 'all') {
                data = data.filter(item => {
                    if (filter === 'movie') return item.mediaType === 'movie';
                    if (filter === 'tv') return item.mediaType === 'tv';
                    if (filter === 'user') return item.type === 'User';
                    return true;
                });
            }

            setResults(data);
        } catch (error) {
            console.error('Erro ao buscar:', error);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResultClick = (item) => {
        if (item.type === 'User') {
            navigate(`/usuario/${item.username}`);
        } else if (item.mediaType === 'movie') {
            navigate(`/info-ptbr/movie/${item.externalId}`);
        } else if (item.mediaType === 'tv') {
            navigate(`/info-ptbr/tv/${item.externalId}`);
        }
    };

    return (
        <>
            <BackButtonPTBR />
            <main>
                <div className="searchResultsContainer">
                    <div className="resultsTitle">
                        <h2>Mostrando correspondências para "{query}"</h2>
                        {results.length > 0 && (
                            <p className="results-count">{results.length} resultados encontrados</p>
                        )}
                    </div>

                    <div className="resultsContent">
                        <div className="resultsLeft">
                            {isLoading ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#fff' }}>
                                    <p>Carregando...</p>
                                </div>
                            ) : results.length > 0 ? (
                                results.map((result) => (
                                    <div
                                        key={result.id}
                                        className="resultCard"
                                        onClick={() => handleResultClick(result)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="thumbnail" style={result.type === 'User' ? { width: '120px', height: '120px', minWidth: '120px', borderRadius: '100%' } : {}}>
                                            {result.poster && (
                                                <img 
                                                    src={result.poster} 
                                                    alt={result.title}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: result.type === 'User' ? '100%' : '0' }}
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                            )}
                                        </div>
                                        <div className="resultInfo">
                                            <h3>{result.title}</h3>
                                            {result.year && (
                                                <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '-8px 0 0 0' }}>
                                                    {result.year}
                                                </p>
                                            )}
                                            {result.type !== 'User' && (
                                                <p>
                                                    <strong>Tipo:</strong> {result.mediaType === 'movie' ? 'Filme' : 'Série'}
                                                </p>
                                            )}
                                            {result.username && (
                                                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                                                    @{result.username}
                                                </p>
                                            )}
                                            {result.description && !result.username && (
                                                <p>
                                                    <strong>Sinopse:</strong> {result.description.substring(0, 150)}...
                                                </p>
                                            )}
                                            {result.rating && typeof result.rating === 'number' && (
                                                <p>
                                                    <span className="stars-container" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                        <FontAwesomeIcon icon={faStarFull} style={{ color: '#fada5e', fontSize: '16px' }} />
                                                        <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                                                            {convertRating(result.rating).toFixed(1)}/5
                                                        </span>
                                                    </span>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#fff' }}>
                                    <p>Nenhum resultado encontrado para "{query}"</p>
                                </div>
                            )}
                        </div>

                        <aside className="resultsSidebar">
                            <h3>Filtrar por tipo</h3>
                            <ul className="filterList">
                                <li 
                                    onClick={() => setFilter('all')}
                                    style={{ 
                                        cursor: 'pointer',
                                        fontWeight: filter === 'all' ? 'bold' : 'normal',
                                        color: filter === 'all' ? '#fada5e' : 'inherit'
                                    }}
                                >
                                    Todos
                                </li>
                                <li 
                                    onClick={() => setFilter('movie')}
                                    style={{ 
                                        cursor: 'pointer',
                                        fontWeight: filter === 'movie' ? 'bold' : 'normal',
                                        color: filter === 'movie' ? '#fada5e' : 'inherit'
                                    }}
                                >
                                    Filmes
                                </li>
                                <li 
                                    onClick={() => setFilter('tv')}
                                    style={{ 
                                        cursor: 'pointer',
                                        fontWeight: filter === 'tv' ? 'bold' : 'normal',
                                        color: filter === 'tv' ? '#fada5e' : 'inherit'
                                    }}
                                >
                                    Séries
                                </li>
                                <li 
                                    onClick={() => setFilter('user')}
                                    style={{ 
                                        cursor: 'pointer',
                                        fontWeight: filter === 'user' ? 'bold' : 'normal',
                                        color: filter === 'user' ? '#fada5e' : 'inherit'
                                    }}
                                >
                                    Usuários
                                </li>
                            </ul>
                        </aside>
                    </div>
                </div>
            </main>
        </>
    );
}

export default Pesquisa;