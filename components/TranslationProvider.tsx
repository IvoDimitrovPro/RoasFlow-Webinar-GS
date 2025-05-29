'use client';

import { ReactNode, createContext, useContext } from 'react';

// Create a context for translations
const TranslationContext = createContext<{
  translate: (key: string, params?: Record<string, string>) => string;
  currentLocale: string;
}>({
  translate: (key) => key, // Default implementation just returns the key
  currentLocale: 'bg', // Default to Bulgarian
});

// Hook to use translations in components
export const useTranslation = () => useContext(TranslationContext);

// Simple provider component that just passes through children
export const TranslationProvider = ({ children }: { children: ReactNode }) => {
  // This is a simplified implementation that doesn't actually translate
  // In a real implementation, this would load translations from JSON files
  const translate = (key: string, params?: Record<string, string>) => {
    // Just return the key for now
    return key;
  };

  return (
    <TranslationContext.Provider
      value={{
        translate,
        currentLocale: 'bg',
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};

export default TranslationProvider;
