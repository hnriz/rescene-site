import { useLanguage } from '../context/LanguageContext';

// Componente para envolver rotas em inglês (sem proteção automática)
export const ProtectedEnRoute = ({ element }) => {
  return element;
};

// Componente para envolver rotas em português (sem proteção automática)
export const ProtectedPTBRRoute = ({ element }) => {
  return element;
};

// Hook para redirecionar baseado em idioma
export const useLanguageRedirect = () => {
  const { language } = useLanguage();
  
  const getLocalizedPath = (enPath, ptbrPath) => {
    return language === 'pt-br' ? ptbrPath : enPath;
  };
  
  return { getLocalizedPath };\
};
