import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const SpecialityConfigContext = createContext();

export const SpecialityConfigProvider = ({ children }) => {
  const [specialityConfig, setSpecialityConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      // Tentative de récupération de la configuration depuis Supabase
      // On suppose une table 'cabinet_settings' ou similaire
      const { data, error } = await supabase
        .from('cabinet_config')
        .select('mode, mode_specialite_id, specialite:specialites(nom)')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      // Valeur par défaut si aucune config n'est trouvée
      setSpecialityConfig(data || { mode: 'generaliste', specialite: null });
    } catch (error) {
      console.error('Erreur configuration spécialité:', error);
      setSpecialityConfig({ mode: 'generaliste', specialite: null });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <SpecialityConfigContext.Provider value={{ specialityConfig, loading, refreshConfig: fetchConfig }}>
      {children}
    </SpecialityConfigContext.Provider>
  );
};

export const useSpecialityConfig = () => {
  const context = useContext(SpecialityConfigContext);
  if (context === undefined) {
    return { specialityConfig: { mode: 'generaliste' }, loading: false };
  }
  return context;
};