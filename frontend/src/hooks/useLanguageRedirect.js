import { Navigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useEffect, useState } from 'react';

// Componente para proteger rotas em inglês
export const ProtectedEnRoute = ({ element }) => {
  const { language, loading } = useLanguage();
  const [shouldRender, setShouldRender] = useState(false);
  
  useEffect(() => {
    console.log('🔍 ProtectedEnRoute - Language:', language, 'Loading:', loading);
    if (!loading) {
      setShouldRender(true);
    }
  }, [language, loading]);

  if (loading) {
    return <div>Carregando...</div>;
  }
  
  if (language !== 'en') {
    console.log('⛔ Redirecionando para PT-BR porque language é:', language);
    // Redirecionar para a página PT-BR equivalente
    return <Navigate to="/PTBR/" replace />;
  }
  
  console.log('✅ Renderizando rota em inglês');
  return element;
};

// Componente para proteger rotas em português
export const ProtectedPTBRRoute = ({ element }) => {
  const { language, loading } = useLanguage();
  const [shouldRender, setShouldRender] = useState(false);
  
  useEffect(() => {
    console.log('🔍 ProtectedPTBRRoute - Language:', language, 'Loading:', loading);
    if (!loading) {
      setShouldRender(true);
    }
  }, [language, loading]);

  if (loading) {
    return <div>Carregando...</div>;
  }
  
  if (language !== 'pt-br') {
    console.log('⛔ Redirecionando para EN porque language é:', language);
    // Redirecionar para a página EN equivalente
    return <Navigate to="/" replace />;
  }
  
  console.log('✅ Renderizando rota em português');
  return element;
};

// Hook para redirecionar baseado em idioma
export const useLanguageRedirect = () => {
  const { language } = useLanguage();
  
  const getLocalizedPath = (enPath, ptbrPath) => {
    return language === 'pt-br' ? ptbrPath : enPath;
  };
  
  return { getLocalizedPath };
};
