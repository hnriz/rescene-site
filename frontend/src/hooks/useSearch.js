import { useState, useCallback, useRef } from 'react';
import { api } from '../services/axiosConfig';

export const useSearch = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimerRef = useRef(null);

  const search = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);

    try {
      // Buscar filmes
      const moviesResponse = await api.get('/movies', {
        params: { search: query, limit: 5 }
      }).catch(() => ({ data: { movies: [] } }));

      // Buscar séries
      const seriesResponse = await api.get('/series', {
        params: { search: query, limit: 5 }
      }).catch(() => ({ data: { series: [] } }));

      // Buscar usuários
      const usersResponse = await api.get('/users/search', {
        params: { query, limit: 5 }
      }).catch(() => ({ data: { users: [] } }));

      const results = [];

      // Adicionar filmes
      if (moviesResponse.data.movies) {
        moviesResponse.data.movies.forEach(movie => {
          results.push({
            id: `movie-${movie.id}`,
            type: 'Filme',
            title: movie.title,
            year: movie.year,
            image: movie.poster,
            link: `/filme/${movie.id}`
          });
        });
      }

      // Adicionar séries
      if (seriesResponse.data.series) {
        seriesResponse.data.series.forEach(series => {
          results.push({
            id: `series-${series.id}`,
            type: 'Série',
            title: series.title,
            year: series.year,
            image: series.poster,
            link: `/serie/${series.id}`
          });
        });
      }

      // Adicionar usuários
      if (usersResponse.data.users) {
        usersResponse.data.users.forEach(user => {
          results.push({
            id: `user-${user.id}`,
            type: 'Usuário',
            title: user.displayName,
            username: `@${user.username}`,
            image: user.avatar,
            link: `/perfil/${user.username}`
          });
        });
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Erro ao buscar:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearchInput = useCallback((query) => {
    // Limpar o timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Definir novo timer com debounce de 300ms
    debounceTimerRef.current = setTimeout(() => {
      search(query);
    }, 300);
  }, [search]);

  return {
    searchResults,
    isLoading,
    handleSearchInput,
    clearResults: () => setSearchResults([])
  };
};
