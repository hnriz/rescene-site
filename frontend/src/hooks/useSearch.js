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
      // Usar o endpoint unificado de busca
      const response = await api.get('/search', {
        params: { q: query }
      });

      const results = [];

      // Processar resultados da API
      if (response.data.results && Array.isArray(response.data.results)) {
        response.data.results.forEach(item => {
          // Determinar o tipo e link baseado no media_type
          let link = '';
          let type = '';

          if (item.mediaType === 'movie') {
            link = `/filme/${item.externalId}`;
            type = 'Filme';
          } else if (item.mediaType === 'tv') {
            link = `/serie/${item.externalId}`;
            type = 'Série';
          }

          if (link) {
            results.push({
              id: item.id,
              type: type,
              title: item.title,
              year: item.year,
              image: item.poster,
              link: link,
              rating: item.rating
            });
          }
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
