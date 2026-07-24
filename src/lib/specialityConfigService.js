// Service pour gérer la configuration du mode spécialité du cabinet
// Récupère la configuration depuis parametres_cabinet et fournit des helpers pour le filtrage
import { supabase } from './supabase.js'
// Cache pour éviter de multiples requêtes
let cachedConfig = null
let cacheTimestamp = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function getCurrentSpeciality() {
  try {
    const now = Date.now()
    if (cachedConfig && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
      return cachedConfig
    }

    const { data: config, error } = await supabase
      .from('parametres_cabinet')
      .select('mode_specialite_id')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !config || !config.mode_specialite_id) {
      const fallback = { mode_specialite_id: null, specialite: null }
      cachedConfig = fallback
      cacheTimestamp = now
      return fallback
    }

    const { data: specialite, error: specialiteError } = await supabase
      .from('specialites')
      .select('id, nom, description, color, actif')
      .eq('id', config.mode_specialite_id)
      .single()

    if (error) {
      const fallback = { mode_specialite_id: null, specialite: null }
      cachedConfig = fallback
      cacheTimestamp = now
      return fallback
    }

    const result = {
      mode_specialite_id: config.mode_specialite_id,
      specialite: specialiteError ? null : specialite
    }

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

export async function isSpecialityMode() {
  const config = await getCurrentSpeciality()
  return config.mode_specialite_id !== null && config.mode_specialite_id !== undefined
}

export async function getSpecialityFilter() {
  const config = await getCurrentSpeciality()
  return config.mode_specialite_id
}

export function invalidateCache() {
  cachedConfig = null
  cacheTimestamp = null
}

export async function getSpecialityDetails() {
  const config = await getCurrentSpeciality()
  return config.specialite
}

/**
 * Récupère l'ID de la spécialité donnée + tous les IDs de ses sous-spécialités directes
 * (hiérarchie à 2 niveaux : une racine peut avoir des enfants, un enfant n'a pas de petit-enfant)
 * @param {number} rootId
 * @returns {Promise<number[]>}
 */
export async function getSpecialiteIdsWithChildren(rootId) {
  if (rootId === null || rootId === undefined) return []

  const { data, error } = await supabase
    .from('specialites')
    .select('id')
    .eq('parent_id', rootId)

  if (error) {
    console.error(`[SPECIALITY_CONFIG] Erreur lors de la récupération des sous-spécialités:`, error)
    return [rootId]
  }

  const childIds = (data || []).map(s => s.id)
  return [rootId, ...childIds]
}

export async function applySpecialityFilter(query) {
  const specialiteId = await getSpecialityFilter()
  if (specialiteId !== null && query) {
    const idsAvecEnfants = await getSpecialiteIdsWithChildren(specialiteId)
    return query.in('specialite_id', idsAvecEnfants)
  }
  return query
}

export async function applySpecialityFilterViaRelation(query, relationPath = 'medecin.specialite_id') {
  const specialiteId = await getSpecialityFilter()
  if (specialiteId !== null && query) {
    const idsAvecEnfants = await getSpecialiteIdsWithChildren(specialiteId)
    return query.in(relationPath, idsAvecEnfants)
  }
  return query
}

export default {
  getCurrentSpeciality,
  isSpecialityMode,
  getSpecialityFilter,
  invalidateCache,
  getSpecialityDetails,
  getSpecialiteIdsWithChildren,
  applySpecialityFilter,
  applySpecialityFilterViaRelation
}
