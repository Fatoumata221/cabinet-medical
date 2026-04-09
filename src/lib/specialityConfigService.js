// Service pour gérer la configuration du mode spécialité du cabinet
// Récupère la configuration depuis parametres_cabinet et fournit des helpers pour le filtrage

import { supabase } from './supabase.js'

// Cache pour éviter de multiples requêtes
let cachedConfig = null
let cacheTimestamp = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Récupère la configuration actuelle du mode spécialité
 * @returns {Promise<{mode_specialite_id: number|null, specialite: object|null}>}
 */
export async function getCurrentSpeciality() {
  try {
    // Vérifier le cache
    const now = Date.now()
    if (cachedConfig && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log(`[SPECIALITY_CONFIG] Configuration récupérée depuis le cache`, {
        mode_specialite_id: cachedConfig.mode_specialite_id,
        specialite_nom: cachedConfig.specialite?.nom || 'Mode généraliste',
        cache_age_ms: now - cacheTimestamp
      })
      return cachedConfig
    }

    console.log(`[SPECIALITY_CONFIG] Récupération de la configuration depuis la base de données...`)

    // Récupérer la configuration depuis la base de données
    const { data: config, error } = await supabase
      .from('parametres_cabinet')
      .select('mode_specialite_id')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    if (error || !config || !config.mode_specialite_id) {
      console.log(`[SPECIALITY_CONFIG] Mode généraliste détecté`, {
        error: error?.message || null,
        has_config: !!config,
        mode_specialite_id: config?.mode_specialite_id || null
      })
      const fallback = { mode_specialite_id: null, specialite: null }
      cachedConfig = fallback
      cacheTimestamp = now
      return fallback
    }
    
    console.log(`[SPECIALITY_CONFIG] Mode spécialité détecté`, {
      mode_specialite_id: config.mode_specialite_id
    })
    
    // Récupérer les détails de la spécialité séparément
    const { data: specialite, error: specialiteError } = await supabase
      .from('specialites')
      .select('id, nom, description, color, actif')
      .eq('id', config.mode_specialite_id)
      .single()

    if (error) {
      console.error(`[SPECIALITY_CONFIG] Erreur lors de la récupération de la configuration spécialité:`, error)
      // Retourner mode généraliste en cas d'erreur
      const fallback = { mode_specialite_id: null, specialite: null }
      cachedConfig = fallback
      cacheTimestamp = now
      return fallback
    }
    
    if (specialiteError) {
      console.error(`[SPECIALITY_CONFIG] Erreur lors de la récupération de la spécialité:`, specialiteError)
    }

    const result = {
      mode_specialite_id: config.mode_specialite_id,
      specialite: specialiteError ? null : specialite
    }

    console.log(`[SPECIALITY_CONFIG] Configuration chargée avec succès`, {
      mode_specialite_id: result.mode_specialite_id,
      specialite_nom: result.specialite?.nom || 'Non disponible',
      specialite_id: result.specialite?.id || null,
      specialite_actif: result.specialite?.actif || false
    })

    // Mettre en cache
    cachedConfig = result
    cacheTimestamp = now

    return result
  } catch (error) {
    console.error(`[SPECIALITY_CONFIG] Erreur dans getCurrentSpeciality:`, error)
    const fallback = { mode_specialite_id: null, specialite: null }
    cachedConfig = fallback
    cacheTimestamp = Date.now()
    return fallback
  }
}

/**
 * Vérifie si l'application est en mode spécialité
 * @returns {Promise<boolean>}
 */
export async function isSpecialityMode() {
  const config = await getCurrentSpeciality()
  return config.mode_specialite_id !== null && config.mode_specialite_id !== undefined
}

/**
 * Retourne le filtre de spécialité à appliquer
 * @returns {Promise<number|null>} L'ID de la spécialité ou null pour mode généraliste
 */
export async function getSpecialityFilter() {
  const config = await getCurrentSpeciality()
  const filterId = config.mode_specialite_id
  console.log(`[SPECIALITY_CONFIG] Filtre de spécialité demandé`, {
    specialite_id: filterId,
    mode: filterId !== null ? 'Spécialité' : 'Généraliste',
    specialite_nom: config.specialite?.nom || null
  })
  return filterId
}

/**
 * Invalide le cache (à appeler après une modification de la configuration)
 */
export function invalidateCache() {
  console.log(`[SPECIALITY_CONFIG] Cache invalidé - La prochaine requête rechargera la configuration`)
  cachedConfig = null
  cacheTimestamp = null
}

/**
 * Récupère les détails complets de la spécialité configurée
 * @returns {Promise<object|null>}
 */
export async function getSpecialityDetails() {
  const config = await getCurrentSpeciality()
  return config.specialite
}

/**
 * Applique le filtre de spécialité à une requête Supabase pour une table avec specialite_id direct
 * @param {object} query - La requête Supabase
 * @returns {Promise<object>} La requête avec le filtre appliqué si nécessaire
 */
export async function applySpecialityFilter(query) {
  const specialiteId = await getSpecialityFilter()
  if (specialiteId !== null && query) {
    console.log(`[SPECIALITY_CONFIG] Filtre appliqué à la requête`, {
      specialite_id: specialiteId,
      type: 'direct (specialite_id)'
    })
    return query.eq('specialite_id', specialiteId)
  }
  console.log(`[SPECIALITY_CONFIG] Aucun filtre appliqué (mode généraliste)`)
  return query
}

/**
 * Applique le filtre de spécialité à une requête Supabase pour une table avec relation via medecin_id
 * @param {object} query - La requête Supabase
 * @param {string} relationPath - Le chemin de la relation (ex: 'medecin.specialite_id')
 * @returns {Promise<object>} La requête avec le filtre appliqué si nécessaire
 */
export async function applySpecialityFilterViaRelation(query, relationPath = 'medecin.specialite_id') {
  const specialiteId = await getSpecialityFilter()
  if (specialiteId !== null && query) {
    return query.eq(relationPath, specialiteId)
  }
  return query
}

// Export par défaut avec toutes les fonctions
export default {
  getCurrentSpeciality,
  isSpecialityMode,
  getSpecialityFilter,
  invalidateCache,
  getSpecialityDetails,
  applySpecialityFilter,
  applySpecialityFilterViaRelation
}

