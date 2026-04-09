// Hook React pour gérer la configuration du mode spécialité
// Fournit la configuration de spécialité aux composants

import { useState, useEffect } from 'react'
import { getCurrentSpeciality, isSpecialityMode, invalidateCache } from '../lib/specialityConfigService.js'
import { supabase } from '../lib/supabase.js'

/**
 * Hook pour accéder à la configuration de spécialité
 * @returns {object} { specialityId, speciality, isSpecialityMode, loading, refresh }
 */
export function useSpecialityConfig() {
  const [config, setConfig] = useState({
    mode_specialite_id: null,
    specialite: null,
    isSpecialityMode: false,
    loading: true
  })

  const loadConfig = async () => {
    try {
      console.log(`[SPECIALITY_CONFIG] useSpecialityConfig - Chargement de la configuration...`)
      setConfig(prev => ({ ...prev, loading: true }))
      const currentSpeciality = await getCurrentSpeciality()
      const isMode = await isSpecialityMode()
      
      console.log(`[SPECIALITY_CONFIG] useSpecialityConfig - Configuration chargée`, {
        mode_specialite_id: currentSpeciality.mode_specialite_id,
        specialite_nom: currentSpeciality.specialite?.nom || 'Mode généraliste',
        isSpecialityMode: isMode
      })
      
      setConfig({
        mode_specialite_id: currentSpeciality.mode_specialite_id,
        specialite: currentSpeciality.specialite,
        isSpecialityMode: isMode,
        loading: false
      })
    } catch (error) {
      console.error(`[SPECIALITY_CONFIG] useSpecialityConfig - Erreur lors du chargement:`, error)
      setConfig({
        mode_specialite_id: null,
        specialite: null,
        isSpecialityMode: false,
        loading: false
      })
    }
  }

  useEffect(() => {
    console.log(`[SPECIALITY_CONFIG] useSpecialityConfig - Hook initialisé, chargement de la config...`)
    loadConfig()
    
    // Écouter les changements dans parametres_cabinet via Supabase Realtime
    console.log(`[SPECIALITY_CONFIG] useSpecialityConfig - Abonnement aux changements Realtime...`)
    const channel = supabase
      .channel('speciality-config-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'parametres_cabinet'
        },
        (payload) => {
          console.log(`[SPECIALITY_CONFIG] useSpecialityConfig - Changement détecté dans parametres_cabinet`, {
            event: payload.eventType,
            new_mode_specialite_id: payload.new?.mode_specialite_id || null,
            old_mode_specialite_id: payload.old?.mode_specialite_id || null
          })
          // Invalider le cache et recharger
          invalidateCache()
          loadConfig()
        }
      )
      .subscribe()

    return () => {
      console.log(`[SPECIALITY_CONFIG] useSpecialityConfig - Nettoyage du hook, désabonnement Realtime`)
      supabase.removeChannel(channel)
    }
  }, [])

  const refresh = () => {
    console.log(`[SPECIALITY_CONFIG] useSpecialityConfig - Rafraîchissement manuel de la configuration`)
    invalidateCache()
    loadConfig()
  }

  return {
    specialityId: config.mode_specialite_id,
    speciality: config.specialite,
    isSpecialityMode: config.isSpecialityMode,
    loading: config.loading,
    refresh
  }
}

