import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

// 🔑 Connexion Supabase admin
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

// 👥 UTILISATEURS (tenant_id = UUID direct)
const users = [
  {
    email: 'dr.habib.diallo@cabinet.com',
    password: '12345678',
    nom: 'Diallo',
    prenom: 'Habib',
    role: 'doctor',
    tenant_id: 'd1d62ea1-ca84-4693-ba4d-3d6c67719873'
  },
  {
    email: 'aissatou.ndoye@cabinet.com',
    password: '12345678',
    nom: 'Ndoye',
    prenom: 'Aissatou',
    role: 'secretary',
    tenant_id: 'd1d62ea1-ca84-4693-ba4d-3d6c67719873'
  },
  {
    email: 'comptabilite@cabinet.com',
    password: '12345678',
    nom: 'Comptabilité',
    prenom: 'Service',
    role: 'accounting',
    tenant_id: 'd1d62ea1-ca84-4693-ba4d-3d6c67719873'
  },
  {
    email: 'dr.aicha.ndiaye@cabinet.com',
    password: '12345678',
    nom: 'Ndiaye',
    prenom: 'Aicha',
    role: 'doctor',
    tenant_id: 'a9b69401-8d44-4921-9154-81b4135254f4'
  },
  {
    email: 'khadija.diop@cabinet.com',
    password: '12345678',
    nom: 'Diop',
    prenom: 'Khadija',
    role: 'secretary',
    tenant_id: 'a9b69401-8d44-4921-9154-81b4135254f4'
  },
  {
    email: 'aminata.diallo@cabinet-plateau.com',
    password: '12345678',
    nom: 'Diallo',
    prenom: 'Aminata',
    role: 'caissier',
    tenant_id: 'a9b69401-8d44-4921-9154-81b4135254f4'
  }
]

// 🚀 CREATE USERS
async function createUsers() {
  for (const u of users) {
    try {
      console.log(`🔧 Création ${u.email}...`)

      // 1. Vérifier Auth
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
        console.log(`✅ Auth créé ${u.email}`)
      } else {
        authId = already.id
        await supabase.auth.admin.updateUserById(authId, {
          password: u.password
        })
        console.log(`⚠️ existe déjà Auth ${u.email}`)
      }

      // 2. Vérifier table users
      const { data: existsInDb } = await supabase
        .from('users')
        .select('id')
        .eq('email', u.email)
        .maybeSingle()

      if (existsInDb) {
        await supabase
          .from('users')
          .update({
            nom: u.nom,
            prenom: u.prenom,
            role: u.role,
            tenant_id: u.tenant_id,
            auth_id: authId,
            actif: true
          })
          .eq('email', u.email)
        console.log(`⚠️ déjà en DB ${u.email}`)
        continue
      }

      // 3. INSERT FINAL (UUID DIRECT)
      const { error } = await supabase
        .from('users')
        .insert({
          email: u.email,
          nom: u.nom,
          prenom: u.prenom,
          role: u.role,
          tenant_id: u.tenant_id, // ✅ UUID direct
          auth_id: authId,
          actif: true
        })

      if (error) throw error

      console.log(`🎉 OK ${u.email}`)

    } catch (err) {
      console.error(`❌ ${u.email} →`, err.message)
    }
  }

  console.log('🚀 Terminé')
}

createUsers()
