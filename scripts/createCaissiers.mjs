import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

const caissiers = [
  // Cabinet Dakar Centre
  {
    email: 'moussa.fall@cabinet-dakar.com',
    password: '12345678',
    nom: 'Fall',
    prenom: 'Moussa',
    role: 'caissier',
    username: 'moussa.fall',
    tenant_id: 'd1d62ea1-ca84-4693-ba4d-3d6c67719873'
  },
  // Cabinet Plateau
  {
    email: 'aminata.diallo@cabinet-plateau.com',
    password: '12345678',
    nom: 'Diallo',
    prenom: 'Aminata',
    role: 'caissier',
    username: 'aminata.diallo',
    tenant_id: 'a9b69401-8d44-4921-9154-81b4135254f4'
  }
]

async function createCaissiers() {
  console.log('💰 Création des caissiers...\n')

  for (const u of caissiers) {
    try {
      console.log(`🔧 Création de ${u.prenom} ${u.nom} (${u.role})...`)

      // 1. Vérifier si auth existe déjà
      const { data: existing } = await supabase.auth.admin.listUsers()
      const already = existing.users.find(x => x.email === u.email)
      let authId

      if (!already) {
        const { data, error } = await supabase.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true
        })
        if (error) throw error
        authId = data.user.id
        console.log(`  ✅ Auth créé`)
      } else {
        authId = already.id
        // Mettre à jour le mot de passe
        await supabase.auth.admin.updateUserById(authId, { password: u.password })
        console.log(`  ⚠️  Auth existant, mot de passe mis à jour`)
      }

      // 2. Vérifier si déjà en DB
      const { data: existsInDb } = await supabase
        .from('users')
        .select('id')
        .eq('email', u.email)
        .maybeSingle()

      if (existsInDb) {
        // Mettre à jour auth_id si manquant
        await supabase
          .from('users')
          .update({ auth_id: authId, role: u.role })
          .eq('email', u.email)
        console.log(`  ⚠️  Déjà en DB, mis à jour`)
        continue
      }

      // 3. Insérer dans users
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          email: u.email,
          nom: u.nom,
          prenom: u.prenom,
          role: u.role,
          username: u.username,
          tenant_id: u.tenant_id,
          auth_id: authId,
          actif: true
        })

      if (insertError) throw insertError
      console.log(`  🎉 ${u.prenom} ${u.nom} créé avec succès`)

    } catch (err) {
      console.error(`  ❌ Erreur pour ${u.email} →`, err.message)
    }
  }

  console.log('\n✅ Script terminé !')
  console.log('\n📋 Résumé des caissiers créés :')
  console.log('  Cabinet Dakar Centre :')
  console.log('    - Moussa Fall (caissier) — moussa.fall / 12345678')
  console.log('  Cabinet Plateau :')
  console.log('    - Aminata Diallo (caissier) — aminata.diallo / 12345678')
}

createCaissiers()
