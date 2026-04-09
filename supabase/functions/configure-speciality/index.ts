// Edge Function pour la configuration du mode spécialité du cabinet
// Permet à iaitaskmanager de configurer l'application en mode spécialité
// Quand une spécialité est configurée, seules les données liées à cette spécialité seront affichées

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

interface SetSpecialityRequest {
  specialite_id: number
}

serve(async (req) => {
  // Log de la requête reçue
  const requestStartTime = Date.now()
  const requestUrl = new URL(req.url)
  const timestamp = new Date().toISOString()
  
  // Logs structurés avec séparateurs visuels
  console.log('')
  console.log('========================================')
  console.log(`[${timestamp}] REQUÊTE REÇUE`)
  console.log('========================================')
  console.log(`Method: ${req.method}`)
  console.log(`Path: ${requestUrl.pathname}`)
  console.log(`Origin: ${req.headers.get('origin') || 'unknown'}`)
  console.log(`User-Agent: ${req.headers.get('user-agent')?.substring(0, 50) || 'unknown'}`)
  console.log(`Headers disponibles: ${Array.from(req.headers.keys()).join(', ')}`)
  console.log('========================================')
  console.log('')
  
  // Gérer les requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    console.log(`[${timestamp}] OPTIONS - CORS preflight - Retour 204`)
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    })
  }

  try {
    // Récupérer l'API key depuis les headers
    const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '')
    
    // Vérifier l'API key
    const expectedApiKey = Deno.env.get('IATASKMANAGER_API_KEY') || Deno.env.get('SPECIALITY_CONFIG_API_KEY')
    
    // Logs de débogage détaillés (sans exposer les clés complètes)
    console.log('')
    console.log('========================================')
    console.log(`[${timestamp}] VÉRIFICATION API KEY`)
    console.log('========================================')
    console.log(`API key présente: ${!!apiKey}`)
    console.log(`API key préfixe: ${apiKey ? apiKey.substring(0, 10) + '...' : 'AUCUNE'}`)
    console.log(`API key longueur: ${apiKey ? apiKey.length : 0}`)
    console.log(`API key configurée côté serveur: ${!!expectedApiKey}`)
    console.log(`API key préfixe attendu: ${expectedApiKey ? expectedApiKey.substring(0, 10) + '...' : 'NON CONFIGURÉE'}`)
    console.log(`API key longueur attendue: ${expectedApiKey ? expectedApiKey.length : 0}`)
    console.log('========================================')
    console.log('')
    
    if (!apiKey) {
      console.log('')
      console.log('❌ ERREUR 401 - API key manquante dans les headers')
      console.log(`Headers reçus: ${Array.from(req.headers.keys()).join(', ')}`)
      console.log('')
      return new Response(
        JSON.stringify({ 
          error: 'API key manquante',
          message: 'Veuillez fournir une API key dans le header "x-api-key"',
          hint: 'Headers requis: { "x-api-key": "votre-api-key" }'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (!expectedApiKey) {
      console.error('')
      console.error('❌ ERREUR 500 - API key non configurée côté serveur')
      console.error('Configurez IATASKMANAGER_API_KEY ou SPECIALITY_CONFIG_API_KEY dans les secrets Supabase')
      console.error('')
      return new Response(
        JSON.stringify({ 
          error: 'Configuration serveur manquante',
          message: 'L\'API key n\'est pas configurée côté serveur',
          hint: 'Configurez la variable d\'environnement IATASKMANAGER_API_KEY ou SPECIALITY_CONFIG_API_KEY dans les secrets de l\'edge function Supabase'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (apiKey !== expectedApiKey) {
      console.warn('')
      console.warn('❌ ERREUR 401 - API key invalide')
      console.warn(`Préfixe reçu: ${apiKey.substring(0, 10)}`)
      console.warn(`Préfixe attendu: ${expectedApiKey.substring(0, 10)}`)
      console.warn(`Longueur reçue: ${apiKey.length}, Longueur attendue: ${expectedApiKey.length}`)
      console.warn('Les clés ne correspondent pas!')
      console.warn('')
      return new Response(
        JSON.stringify({ 
          error: 'API key invalide',
          message: 'L\'API key fournie ne correspond pas à la clé configurée',
          hint: 'Vérifiez que l\'API key dans votre application correspond à celle configurée dans les secrets Supabase'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log('')
    console.log('✅ API key validée - Traitement de la requête')
    console.log('')

    // Créer le client Supabase avec la clé de service
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Configuration Supabase manquante' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Traiter les différentes méthodes HTTP
    let response: Response
    
    try {
      if (req.method === 'GET') {
        response = await getSpecialityConfig(supabaseAdmin)
      } else if (req.method === 'POST') {
        response = await setSpecialityConfig(req, supabaseAdmin)
      } else if (req.method === 'DELETE') {
        response = await resetSpecialityConfig(supabaseAdmin)
      } else {
        response = new Response(
          JSON.stringify({ error: 'Méthode HTTP non supportée. Utilisez GET, POST ou DELETE' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Log de la réponse envoyée à la fin
      const responseClone = response.clone()
      const responseBody = await responseClone.json().catch(() => ({}))
      const totalDuration = Date.now() - requestStartTime
      
      console.log(`[${new Date().toISOString()}] Réponse envoyée - Fin de traitement`, {
        method: req.method,
        path: requestUrl.pathname,
        status: response.status,
        totalDurationMs: totalDuration,
        responseKeys: Object.keys(responseBody),
        hasError: !!responseBody.error,
        hasSuccess: !!responseBody.success,
        mode: responseBody.mode || null,
        specialiteId: responseBody.mode_specialite_id || null,
        specialitesCount: responseBody.specialites_disponibles?.length || 0,
        message: responseBody.message || responseBody.error || 'OK'
      })
      
      return response
      
    } catch (error) {
      const totalDuration = Date.now() - requestStartTime
      const errorTimestamp = new Date().toISOString()
      console.error('')
      console.error('========================================')
      console.error(`[${errorTimestamp}] ERREUR DANS TRAITEMENT`)
      console.error('========================================')
      console.error(`Method: ${req.method}`)
      console.error(`Path: ${requestUrl.pathname}`)
      console.error(`Erreur: ${error.message || 'Erreur serveur'}`)
      console.error(`Stack: ${error.stack || 'Pas de stack trace'}`)
      console.error(`Durée: ${totalDuration}ms`)
      console.error('========================================')
      console.error('')
      
      return new Response(
        JSON.stringify({ error: error.message || 'Erreur serveur' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    const totalDuration = Date.now() - requestStartTime
    const errorTimestamp = new Date().toISOString()
    console.error('')
    console.error('========================================')
    console.error(`[${errorTimestamp}] ERREUR FATALE`)
    console.error('========================================')
    console.error(`Method: ${req.method || 'UNKNOWN'}`)
    console.error(`Path: ${requestUrl?.pathname || 'UNKNOWN'}`)
    console.error(`Erreur: ${error.message || 'Erreur serveur'}`)
    console.error(`Stack: ${error.stack || 'Pas de stack trace'}`)
    console.error(`Durée: ${totalDuration}ms`)
    console.error('========================================')
    console.error('')
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Fonction pour récupérer la configuration actuelle
async function getSpecialityConfig(supabaseAdmin: any) {
  const startTime = Date.now()
  try {
    console.log(`[${new Date().toISOString()}] GET - Début récupération configuration spécialité`)
    
    // Récupérer la configuration du cabinet
    const { data: config, error: configError } = await supabaseAdmin
      .from('parametres_cabinet')
      .select('id, mode_specialite_id')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (configError) {
      console.error('Erreur lors de la récupération de la config:', configError)
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la récupération de la configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Récupérer toutes les spécialités disponibles (actives)
    const { data: specialites, error: specialitesError } = await supabaseAdmin
      .from('specialites')
      .select('id, nom, description, color, actif')
      .eq('actif', true)
      .order('nom', { ascending: true })

    if (specialitesError) {
      console.error('Erreur lors de la récupération des spécialités:', specialitesError)
    }

    // Si aucune configuration n'existe, retourner mode généraliste avec la liste des spécialités
    if (!config || config.mode_specialite_id === null) {
      const duration = Date.now() - startTime
      console.log(`[${new Date().toISOString()}] GET - Mode généraliste actif`, {
        specialitesCount: specialites?.length || 0,
        durationMs: duration
      })
      
      return new Response(
        JSON.stringify({ 
          mode_specialite_id: null,
          mode: 'generaliste',
          specialite: null,
          specialites_disponibles: specialites || [],
          message: 'Mode généraliste actif (toutes les spécialités)'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Récupérer les détails de la spécialité configurée
    const { data: specialite, error: specialiteError } = await supabaseAdmin
      .from('specialites')
      .select('id, nom, description, color, actif')
      .eq('id', config.mode_specialite_id)
      .single()

    if (specialiteError || !specialite) {
      console.error('Erreur lors de la récupération de la spécialité:', specialiteError)
      return new Response(
        JSON.stringify({ 
          mode_specialite_id: config.mode_specialite_id,
          mode: 'specialite',
          specialite: null,
          specialites_disponibles: specialites || [],
          warning: 'Spécialité configurée mais détails non disponibles'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const duration = Date.now() - startTime
    console.log(`[${new Date().toISOString()}] GET - Mode spécialité actif: ${specialite.nom}`, {
      specialiteId: specialite.id,
      specialiteNom: specialite.nom,
      specialitesCount: specialites?.length || 0,
      durationMs: duration
    })
    
    return new Response(
      JSON.stringify({ 
        mode_specialite_id: config.mode_specialite_id,
        mode: 'specialite',
        specialite: {
          id: specialite.id,
          nom: specialite.nom,
          description: specialite.description,
          color: specialite.color,
          actif: specialite.actif
        },
        specialites_disponibles: specialites || [],
        message: `Mode spécialité actif: ${specialite.nom}`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[${new Date().toISOString()}] Erreur dans getSpecialityConfig:`, {
      error: error.message,
      stack: error.stack,
      durationMs: duration
    })
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur lors de la récupération de la configuration' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// Fonction pour configurer une spécialité
async function setSpecialityConfig(req: Request, supabaseAdmin: any) {
  const startTime = Date.now()
  try {
    console.log(`[${new Date().toISOString()}] POST - Début configuration spécialité`)
    
    const body = await req.json().catch(() => ({}))
    const { specialite_id } = body as SetSpecialityRequest
    
    console.log(`[${new Date().toISOString()}] POST - Données reçues:`, {
      specialite_id: specialite_id,
      bodyKeys: Object.keys(body)
    })

    // Validation
    if (!specialite_id || typeof specialite_id !== 'number') {
      return new Response(
        JSON.stringify({ error: 'specialite_id est requis et doit être un nombre' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Vérifier que la spécialité existe
    const { data: specialite, error: specialiteError } = await supabaseAdmin
      .from('specialites')
      .select('id, nom, actif')
      .eq('id', specialite_id)
      .single()

    if (specialiteError || !specialite) {
      return new Response(
        JSON.stringify({ error: `Spécialité avec l'ID ${specialite_id} non trouvée` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!specialite.actif) {
      return new Response(
        JSON.stringify({ error: `La spécialité "${specialite.nom}" n'est pas active` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Récupérer ou créer la configuration du cabinet
    const { data: existingConfig, error: fetchError } = await supabaseAdmin
      .from('parametres_cabinet')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (fetchError) {
      console.error(`[${new Date().toISOString()}] Erreur lors de la récupération de la config:`, fetchError)
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la récupération de la configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let configId: number

    if (existingConfig) {
      // Mettre à jour la configuration existante
      const { data: updatedConfig, error: updateError } = await supabaseAdmin
        .from('parametres_cabinet')
        .update({ 
          mode_specialite_id: specialite_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingConfig.id)
        .select()
        .single()

      if (updateError || !updatedConfig) {
        console.error('Erreur lors de la mise à jour:', updateError)
        return new Response(
          JSON.stringify({ error: 'Erreur lors de la mise à jour de la configuration' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      configId = updatedConfig.id
    } else {
      // Créer une nouvelle configuration
      const { data: newConfig, error: createError } = await supabaseAdmin
        .from('parametres_cabinet')
        .insert([{ 
          mode_specialite_id: specialite_id,
          nom_cabinet: 'Cabinet Médical',
          pays: 'Niger',
          devise: 'FCFA',
          fuseau_horaire: 'Africa/Niamey',
          langue: 'fr',
          format_date: 'DD/MM/YYYY'
        }])
        .select()
        .single()

      if (createError || !newConfig) {
        console.error('Erreur lors de la création:', createError)
        return new Response(
          JSON.stringify({ error: 'Erreur lors de la création de la configuration' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      configId = newConfig.id
    }

    // Logger le changement
    const duration = Date.now() - startTime
    console.log(`[${new Date().toISOString()}] POST - Configuration spécialité mise à jour`, {
      specialiteId: specialite_id,
      specialiteNom: specialite.nom,
      configId: configId,
      wasNewConfig: !existingConfig,
      durationMs: duration
    })

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Mode spécialité configuré: ${specialite.nom}`,
        mode_specialite_id: specialite_id,
        specialite: {
          id: specialite.id,
          nom: specialite.nom
        },
        config_id: configId
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[${new Date().toISOString()}] Erreur dans setSpecialityConfig:`, {
      error: error.message,
      stack: error.stack,
      durationMs: duration
    })
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur lors de la configuration de la spécialité' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// Fonction pour réinitialiser en mode généraliste
async function resetSpecialityConfig(supabaseAdmin: any) {
  const startTime = Date.now()
  try {
    console.log(`[${new Date().toISOString()}] DELETE - Début réinitialisation mode généraliste`)
    
    // Récupérer la configuration existante
    const { data: existingConfig, error: fetchError } = await supabaseAdmin
      .from('parametres_cabinet')
      .select('id, mode_specialite_id')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (fetchError) {
      console.error(`[${new Date().toISOString()}] Erreur lors de la récupération:`, fetchError)
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la récupération de la configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!existingConfig || existingConfig.mode_specialite_id === null) {
      const duration = Date.now() - startTime
      console.log(`[${new Date().toISOString()}] DELETE - Mode généraliste déjà actif`, {
        durationMs: duration
      })
      
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Le mode généraliste est déjà actif',
          mode_specialite_id: null,
          mode: 'generaliste'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Récupérer le nom de la spécialité avant réinitialisation pour le log
    const { data: oldSpecialite } = await supabaseAdmin
      .from('specialites')
      .select('nom')
      .eq('id', existingConfig.mode_specialite_id)
      .single()

    // Réinitialiser en mode généraliste
    const { error: updateError } = await supabaseAdmin
      .from('parametres_cabinet')
      .update({ 
        mode_specialite_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingConfig.id)

    if (updateError) {
      console.error('Erreur lors de la réinitialisation:', updateError)
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la réinitialisation de la configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Logger le changement
    const oldSpecialiteNom = oldSpecialite?.nom || `ID ${existingConfig.mode_specialite_id}`
    const duration = Date.now() - startTime
    console.log(`[${new Date().toISOString()}] DELETE - Configuration spécialité réinitialisée`, {
      previousSpecialiteId: existingConfig.mode_specialite_id,
      previousSpecialiteNom: oldSpecialiteNom,
      configId: existingConfig.id,
      durationMs: duration
    })

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Mode généraliste activé (toutes les spécialités)',
        mode_specialite_id: null,
        mode: 'generaliste',
        previous_specialite: oldSpecialiteNom
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[${new Date().toISOString()}] Erreur dans resetSpecialityConfig:`, {
      error: error.message,
      stack: error.stack,
      durationMs: duration
    })
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur lors de la réinitialisation' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

