import { Navigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

// Componente para proteger rotas em inglês
export const ProtectedEnRoute = ({ element }) => {
  const { language } = useLanguage();
  
  if (language !== 'en') {
    // Redirecionar para a página PT-BR equivalente
    return <Navigate to="/PTBR/" replace />;
  }
  
  return element;
};

// Componente para proteger rotas em português
export const ProtectedPTBRRoute = ({ element }) => {
  const { language } = useLanguage();
  
  if (language !== 'pt-br') {
    // Redirecionar para a página EN equivalente
    return <Navigate to="/" replace />;
  }
  
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
