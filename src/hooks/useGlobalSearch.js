import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import useUserProfile from './useUserProfile';
import { searchPages, getPopularSuggestions } from '../data/pagesConfig';

export const useGlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useAuth();
  const { profile: userProfile } = useUserProfile();
  const userRole = userProfile?.role;

  // Charger les recherches récentes depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Erreur lors du chargement des recherches récentes:', error);
      }
    }
  }, []);

  // Recherche avec debounce
  useEffect(() => {
    if (!userRole) return;

    const timeoutId = setTimeout(() => {
      if (query.trim().length >= 2) {
        setIsLoading(true);
        const searchResults = searchPages(query, userRole);
        setResults(searchResults);
        setIsLoading(false);
      } else {
        setResults([]);
        setIsLoading(false);
      }
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [query, userRole]);

  // Ajouter une recherche à l'historique
  const addToRecentSearches = useCallback((page) => {
    const newSearch = {
      id: page.id,
      title: page.title,
      path: page.path,
      category: page.category,
      timestamp: Date.now()
    };

    setRecentSearches(prev => {
      const updated = [
        newSearch,
        ...prev.filter(item => item.id !== page.id)
      ].slice(0, 5);

      localStorage.setItem('recentSearches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Effacer l'historique des recherches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  }, []);

  // Obtenir les suggestions populaires
  const popularSuggestions = useMemo(() => {
    return userRole ? getPopularSuggestions(userRole) : [];
  }, [userRole]);

  // Obtenir les pages par catégorie
  const pagesByCategory = useMemo(() => {
    return userRole ? getPagesByCategory(userRole) : {};
  }, [userRole]);

  // Recherche avancée avec filtres
  const searchWithFilters = useCallback((searchQuery, filters = {}) => {
    if (!userRole) return [];

    let filteredResults = searchPages(searchQuery, userRole);

    // Appliquer les filtres
    if (filters.category) {
      filteredResults = filteredResults.filter(page => 
        page.category.toLowerCase() === filters.category.toLowerCase()
      );
    }

    if (filters.isMainPage !== undefined) {
      filteredResults = filteredResults.filter(page => 
        page.isMainPage === filters.isMainPage
      );
    }

    return filteredResults;
  }, [userRole]);

  return {
    query,
    setQuery,
    results,
    recentSearches,
    isLoading,
    userRole,
    popularSuggestions,
    pagesByCategory,
    addToRecentSearches,
    clearRecentSearches,
    searchWithFilters
  };
};

export default useGlobalSearch;
