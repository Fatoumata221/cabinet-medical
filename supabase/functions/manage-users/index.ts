// Edge Function pour la gestion des utilisateurs par l'administrateur
// Permet de créer des utilisateurs et de modifier leurs mots de passe

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

interface CreateUserRequest {
  email: string
  password: string
  nom: string
  prenom: string
  username: string
  role: 'admin' | 'doctor' | 'secretary' | 'accounting' | 'cashier' | 'caissier'
  specialite?: string
  specialite_id?: number
  telephone?: string
  horaires_travail?: any
  duree_consultation?: number
}

interface UpdatePasswordRequest {
  userId?: number
  userEmail?: string
  newPassword: string
}

serve(async (req) => {
  // Gérer les requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    })
  }

  try {
    // Récupérer le token d'authentification
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token d\'authentification manquant' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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

    // Créer le client Supabase avec le token utilisateur pour vérifier les permissions
    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Vérifier l'utilisateur actuel et son rôle
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentification invalide' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Vérifier que l'utilisateur est admin
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('role, actif')
      .eq('auth_id', user.id)
      .single()

    if (profileError || !userProfile || userProfile.role !== 'admin' || !userProfile.actif) {
      return new Response(
        JSON.stringify({ error: 'Accès refusé. Seuls les administrateurs peuvent gérer les utilisateurs.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parser le body de la requête une seule fois
    const body = await req.json().catch(() => ({}))
    const { action } = body

    // Traiter les différentes actions
    if (action === 'create') {
      return await createUser(body, supabaseAdmin)
    } else if (action === 'update-password') {
      return await updatePassword(body, supabaseAdmin)
    } else {
      return new Response(
        JSON.stringify({ error: 'Action non reconnue. Utilisez "create" ou "update-password"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Erreur dans manage-users:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Fonction pour créer un utilisateur
async function createUser(body: any, supabaseAdmin: any) {
  try {
    const { email, password, nom, prenom, username, role, specialite, specialite_id, telephone, horaires_travail, duree_consultation } = body as CreateUserRequest

    // Validation des données
    if (!email || !password || !nom || !prenom || !role || !username) {
      return new Response(
        JSON.stringify({ error: 'Email, mot de passe, nom, prénom, rôle et nom d\'utilisateur sont requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Vérifier que le rôle est valide (accepte 'caissier' mais le normalise en 'cashier')
    const normalizedRole = role === 'caissier' ? 'cashier' : role

    if (!['admin', 'doctor', 'secretary', 'accounting', 'cashier'].includes(normalizedRole)) {
      return new Response(
        JSON.stringify({ error: 'Rôle invalide. Utilisez "admin", "doctor", "secretary", "accounting", "cashier" (ou "caissier")' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Vérifier que le mot de passe est suffisamment fort
    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Le mot de passe doit contenir au moins 6 caractères' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Vérifier que l'email n'existe pas déjà dans la table users
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, email, auth_id')
      .eq('email', email)
      .maybeSingle()

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'Un utilisateur avec cet email existe déjà' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Vérifier que le username n'existe pas déjà dans la table users
    const { data: existingUsername } = await supabaseAdmin
      .from('users')
      .select('id, username')
      .eq('username', username)
      .maybeSingle()

    if (existingUsername) {
      return new Response(
        JSON.stringify({ error: 'Ce nom d\'utilisateur est déjà utilisé' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Vérifier que l'email n'existe pas déjà dans Supabase Auth
    try {
      const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers()
      const emailExists = existingAuthUser.users.some((u: any) => u.email === email)
      if (emailExists) {
        return new Response(
          JSON.stringify({ error: 'Un compte avec cet email existe déjà dans le système d\'authentification' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des utilisateurs Auth:', error)
    }

    // Créer l'utilisateur dans Supabase Auth uniquement
    let authId: string | null = null
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmer l'email automatiquement
      user_metadata: {
        nom,
        prenom,
        username,
        role: normalizedRole,
        specialite: specialite || null,
        telephone: telephone || null
      }
    })

    if (authError || !authData.user) {
      return new Response(
        JSON.stringify({ error: `Erreur lors de la création du compte Auth: ${authError?.message || 'Erreur inconnue'}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    authId = authData.user.id

    // Préparer les données pour la table users
    const userData: any = {
      email,
      nom,
      prenom,
      username,
      role: normalizedRole,
      auth_id: authId,
      actif: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Ajouter les champs optionnels
    if (specialite) userData.specialite = specialite
    if (specialite_id) userData.specialite_id = specialite_id
    if (telephone) userData.telephone = telephone
    if (horaires_travail) userData.horaires_travail = horaires_travail
    if (duree_consultation) userData.duree_consultation = duree_consultation

    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert([userData])
      .select()
      .single()

    if (userError || !newUser) {
      // Si l'utilisateur a été créé dans Auth mais pas dans users, nettoyer
      try {
        await supabaseAdmin.auth.admin.deleteUser(authId)
      } catch (deleteError) {
        console.error('Erreur lors du nettoyage de l\'utilisateur Auth:', deleteError)
      }
      
      return new Response(
        JSON.stringify({ error: `Erreur lors de la création du profil: ${userError?.message || 'Erreur inconnue'}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: newUser.id,
          email: newUser.email,
          nom: newUser.nom,
          prenom: newUser.prenom,
          role: newUser.role,
          specialite: newUser.specialite,
          specialite_id: newUser.specialite_id,
          telephone: newUser.telephone,
          auth_id: newUser.auth_id
        },
        message: 'Utilisateur créé avec succès'
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erreur dans createUser:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur lors de la création de l\'utilisateur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// Fonction pour modifier le mot de passe
async function updatePassword(body: any, supabaseAdmin: any) {
  try {
    const { userId, userEmail, newPassword } = body as UpdatePasswordRequest

    if (!newPassword || newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Le mot de passe doit contenir au moins 6 caractères' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Trouver l'utilisateur
    let user
    if (userId) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, email, auth_id, role')
        .eq('id', userId)
        .single()
      
      if (error || !data) {
        return new Response(
          JSON.stringify({ error: 'Utilisateur non trouvé' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      user = data
    } else if (userEmail) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, email, auth_id, role')
        .eq('email', userEmail)
        .single()
      
      if (error || !data) {
        return new Response(
          JSON.stringify({ error: 'Utilisateur non trouvé' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      user = data
    } else {
      return new Response(
        JSON.stringify({ error: 'userId ou userEmail requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Vérifier que l'utilisateur a un auth_id (utilise Supabase Auth)
    if (!user.auth_id) {
      return new Response(
        JSON.stringify({ error: 'Cet utilisateur n\'a pas de compte Supabase Auth. Impossible de modifier le mot de passe.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Mettre à jour le mot de passe dans Supabase Auth
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.auth_id,
      { password: newPassword }
    )

    if (updateError) {
      return new Response(
        JSON.stringify({ error: `Erreur lors de la mise à jour du mot de passe: ${updateError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Mot de passe modifié avec succès',
        userId: user.id,
        email: user.email
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erreur dans updatePassword:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur lors de la modification du mot de passe' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

