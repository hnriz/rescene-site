import { useState, useCallback, useRef } from 'react';
import { api } from '../services/axiosConfig';
import { useLanguage } from '../context/LanguageContext';

export const useSearch = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimerRef = useRef(null);
  const { language } = useLanguage();

  const search = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);

    try {
      // Usar o endpoint unificado de busca
      const lang = language === 'en' ? 'en-US' : 'pt-BR';
      const response = await api.get('/search', {
        params: { q: query, language: lang }
      });

      const results = [];

      // Processar resultados da API
      if (response.data.results && Array.isArray(response.data.results)) {
        response.data.results.forEach(item => {
          // Limitar a 4 resultados
          if (results.length >= 4) return;
          
          // Determinar o tipo e link baseado no media_type ou tipo de usuario
          let link = '';
          let type = '';
          let mediaType = '';
          
          if (item.type === 'User') {
            // É um usuário
            const baseRoute = language === 'en' ? '/user' : '/usuario';
            link = `${baseRoute}/${item.username}`;
            type = language === 'en' ? 'User' : 'Usuário';
            
            results.push({
              id: item.id,
              type: type,
              title: item.title,
              username: item.username,
              image: item.poster,
              link: link
            });
          } else {
            // É filme ou série
            const baseRoute = language === 'en' ? '/info' : '/info-ptbr';

            if (item.mediaType === 'movie') {
              mediaType = 'movie';
              link = `${baseRoute}/movie/${item.externalId}`;
              type = language === 'en' ? 'Movie' : 'Filme';
            } else if (item.mediaType === 'tv') {
              mediaType = 'tv';
              link = `${baseRoute}/tv/${item.externalId}`;
              type = language === 'en' ? 'TV Show' : 'Série';
            }

            if (link) {
              results.push({
                id: item.id,
                type: type,
                title: item.title,
                year: item.year,
                image: item.poster,
                link: link,
                rating: item.rating,
                mediaType: mediaType
              });
            }
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
  }, [language]);

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
