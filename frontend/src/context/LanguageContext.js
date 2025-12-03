import React, { createContext, useState, useContext, useEffect } from 'react';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState('en'); // 'en' ou 'pt-br'
  const [loading, setLoading] = useState(true);

  // Carregar idioma salvo ou do navegador
  useEffect(() => {
    const savedLanguage = localStorage.getItem('userLanguage');
    if (savedLanguage) {
      setLanguageState(savedLanguage);
    } else {
      // Detectar idioma do navegador
      const browserLang = navigator.language.toLowerCase();
      const detectedLang = browserLang.startsWith('pt') ? 'pt-br' : 'en';
      setLanguageState(detectedLang);
      localStorage.setItem('userLanguage', detectedLang);
    }
    setLoading(false);
  }, []);

  const setLanguage = (newLanguage) => {
    console.log('🌐 Mudando idioma para:', newLanguage);
    setLanguageState(newLanguage);
    localStorage.setItem('userLanguage', newLanguage);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, loading }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage deve ser usado dentro de LanguageProvider');
  }
  return context;
};
