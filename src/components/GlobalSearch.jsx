import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  ArrowRight, 
  Clock, 
  Star,
  Users,
  Calendar,
  Stethoscope,
  Settings,
  BarChart3,
  FileText,
  Receipt,
  Archive,
  UserCheck,
  Activity,
  Shield,
  Pill,
  TestTube,
  Monitor,
  Eye,
  History,
  List,
  Package,
  Briefcase,
  Route,
  FileBarChart,
  FileSearch,
  FileCheck,
  FolderOpen,
  IdCard,
  UserPlus,
  CalendarPlus,
  MessageSquare,
  Bell,
  Scan,
  TrendingUp,
  MoreHorizontal,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import useUserProfile from '../hooks/useUserProfile';
import { searchPages, getPopularSuggestions, getPagesByCategory } from '../data/pagesConfig';

// Mapping des icônes
const ICON_MAP = {
  Users, Calendar, Stethoscope, Settings, BarChart3, FileText, Receipt, Archive,
  UserCheck, Activity, Shield, Pill, TestTube, Monitor, Eye, History, List,
  Package, Briefcase, Route, FileBarChart, FileSearch, FileCheck, FolderOpen,
  IdCard, UserPlus, CalendarPlus, MessageSquare, Bell, Scan, TrendingUp,
  MoreHorizontal, DollarSign, AlertTriangle, Search, Clock, Star, ArrowRight
};

const GlobalSearch = ({ isOpen, onClose, className = "" }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);
  const navigate = useNavigate();
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

  // Focus sur l'input quand le composant s'ouvre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Recherche en temps réel
  useEffect(() => {
    if (!userRole) return;

    if (query.trim().length >= 2) {
      const searchResults = searchPages(query, userRole);
      setResults(searchResults);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } else {
      setResults([]);
      setShowSuggestions(query.length === 0);
      setSelectedIndex(-1);
    }
  }, [query, userRole]);

  // Gestion du clavier
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < (results.length - 1) ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && results[selectedIndex]) {
            handlePageSelect(results[selectedIndex]);
          } else if (results.length > 0) {
            handlePageSelect(results[0]);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  const handlePageSelect = (page) => {
    // Ajouter à l'historique des recherches
    const newSearch = {
      id: page.id,
      title: page.title,
      path: page.path,
      timestamp: Date.now()
    };

    const updatedRecent = [
      newSearch,
      ...recentSearches.filter(item => item.id !== page.id)
    ].slice(0, 5);

    setRecentSearches(updatedRecent);
    localStorage.setItem('recentSearches', JSON.stringify(updatedRecent));

    // Naviguer vers la page
    navigate(page.path);
    onClose();
    setQuery('');
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const getIcon = (iconName) => {
    const IconComponent = ICON_MAP[iconName] || Search;
    return <IconComponent size={18} />;
  };

  const popularSuggestions = userRole ? getPopularSuggestions(userRole) : [];
  const pagesByCategory = userRole ? getPagesByCategory(userRole) : {};

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className={`bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden ${className}`}
      >
        {/* Header de recherche */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Rechercher une page, fonction ou module..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-lg border-0 focus:ring-0 focus:outline-none"
            />
          </div>
        </div>

        {/* Contenu des résultats */}
        <div ref={resultsRef} className="max-h-96 overflow-y-auto">
          {/* Résultats de recherche */}
          {query.length >= 2 && results.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 px-3 py-2 uppercase tracking-wide">
                Résultats ({results.length})
              </div>
              {results.map((page, index) => (
                <motion.div
                  key={page.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center space-x-3 px-3 py-3 rounded-lg cursor-pointer transition-colors ${
                    selectedIndex === index 
                      ? 'bg-medical-primary text-white' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handlePageSelect(page)}
                >
                  <div className={`p-2 rounded-lg ${
                    selectedIndex === index 
                      ? 'bg-white bg-opacity-20' 
                      : 'bg-gray-100'
                  }`}>
                    <div className={selectedIndex === index ? 'text-white' : 'text-gray-600'}>
                      {getIcon(page.icon)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium ${
                      selectedIndex === index ? 'text-white' : 'text-gray-900'
                    }`}>
                      {page.title}
                    </div>
                    <div className={`text-sm truncate ${
                      selectedIndex === index ? 'text-white text-opacity-80' : 'text-gray-500'
                    }`}>
                      {page.description}
                    </div>
                    <div className={`text-xs ${
                      selectedIndex === index ? 'text-white text-opacity-60' : 'text-gray-400'
                    }`}>
                      {page.category}
                    </div>
                  </div>
                  <ArrowRight 
                    size={16} 
                    className={selectedIndex === index ? 'text-white' : 'text-gray-400'} 
                  />
                </motion.div>
              ))}
            </div>
          )}

          {/* Aucun résultat */}
          {query.length >= 2 && results.length === 0 && (
            <div className="p-8 text-center">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Aucun résultat trouvé</p>
              <p className="text-gray-400 text-sm mt-1">
                Essayez avec d'autres mots-clés
              </p>
            </div>
          )}

          {/* Suggestions par défaut */}
          {query.length === 0 && (
            <div className="p-2">
              {/* Recherches récentes */}
              {recentSearches.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Récemment visité
                    </div>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Effacer
                    </button>
                  </div>
                  {recentSearches.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        navigate(item.path);
                        onClose();
                      }}
                    >
                      <Clock size={16} className="text-gray-400" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{item.title}</div>
                      </div>
                      <ArrowRight size={14} className="text-gray-400" />
                    </div>
                  ))}
                </div>
              )}

              {/* Pages populaires */}
              {popularSuggestions.length > 0 && (
                <div className="mb-6">
                  <div className="text-xs font-medium text-gray-500 px-3 py-2 uppercase tracking-wide">
                    Pages populaires
                  </div>
                  {popularSuggestions.map((page) => (
                    <div
                      key={page.id}
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handlePageSelect(page)}
                    >
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <div className="text-gray-600">
                          {getIcon(page.icon)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{page.title}</div>
                        <div className="text-sm text-gray-500">{page.description}</div>
                      </div>
                      <Star size={14} className="text-yellow-400" />
                    </div>
                  ))}
                </div>
              )}

              {/* Navigation par catégories */}
              <div>
                <div className="text-xs font-medium text-gray-500 px-3 py-2 uppercase tracking-wide">
                  Parcourir par catégorie
                </div>
                {Object.entries(pagesByCategory).map(([category, pages]) => (
                  <div key={category} className="mb-4">
                    <div className="text-sm font-medium text-gray-700 px-3 py-1">
                      {category}
                    </div>
                    {pages.filter(page => page.isMainPage).slice(0, 3).map((page) => (
                      <div
                        key={page.id}
                        className="flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ml-4"
                        onClick={() => handlePageSelect(page)}
                      >
                        <div className="text-gray-400">
                          {getIcon(page.icon)}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{page.title}</div>
                        </div>
                        <ArrowRight size={14} className="text-gray-400" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span>↑↓ Naviguer</span>
              <span>↵ Sélectionner</span>
              <span>Esc Fermer</span>
            </div>
            <div>
              {results.length > 0 && `${results.length} résultat${results.length > 1 ? 's' : ''}`}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default GlobalSearch;
