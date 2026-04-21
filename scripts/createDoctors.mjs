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

// 🦷 MÉDECINS DENTISTES PAR CABINET
const doctors = [
  // ── Cabinet Dentaire Dakar Centre ──────────────────────────────
  {
    email: 'dr.oumar.fall@cabinet-dakar.com',
    password: 'Dakar2024!',
    username: 'dr.oumar.fall',
    nom: 'Fall',
    prenom: 'Oumar',
    role: 'doctor',
    specialite: 'Dentiste généraliste',
    duree_consultation: 30,
    tenant_id: 'd1d62ea1-ca84-4693-ba4d-3d6c67719873'
  },
  {
    email: 'dr.mariama.diallo@cabinet-dakar.com',
    password: 'Dakar2024!',
    username: 'dr.mariama.diallo',
    nom: 'Diallo',
    prenom: 'Mariama',
    role: 'doctor',
    specialite: 'Orthodontiste',
    duree_consultation: 45,
    tenant_id: 'd1d62ea1-ca84-4693-ba4d-3d6c67719873'
  },
  {
    email: 'dr.ibou.ndiaye@cabinet-dakar.com',
    password: 'Dakar2024!',
    username: 'dr.ibou.ndiaye',
    nom: 'Ndiaye',
    prenom: 'Ibou',
    role: 'doctor',
    specialite: 'Chirurgien buccal',
    duree_consultation: 60,
    tenant_id: 'd1d62ea1-ca84-4693-ba4d-3d6c67719873'
  },

  // ── Cabinet Dentaire Plateau ────────────────────────────────────
  {
    email: 'dr.fatou.seck@cabinet-plateau.com',
    password: 'Plateau2024!',
    username: 'dr.fatou.seck',
    nom: 'Seck',
    prenom: 'Fatou',
    role: 'doctor',
    specialite: 'Dentiste généraliste',
    duree_consultation: 30,
    tenant_id: 'a9b69401-8d44-4921-9154-81b4135254f4'
  },
  {
    email: 'dr.cheikh.ba@cabinet-plateau.com',
    password: 'Plateau2024!',
    username: 'dr.cheikh.ba',
    nom: 'Ba',
    prenom: 'Cheikh',
    role: 'doctor',
    specialite: 'Parodontiste',
    duree_consultation: 45,
    tenant_id: 'a9b69401-8d44-4921-9154-81b4135254f4'
  },
  {
    email: 'dr.aminata.sow@cabinet-plateau.com',
    password: 'Plateau2024!',
    username: 'dr.aminata.sow',
    nom: 'Sow',
    prenom: 'Aminata',
    role: 'doctor',
    specialite: 'Endodontiste',
    duree_consultation: 60,
    tenant_id: 'a9b69401-8d44-4921-9154-81b4135254f4'
  }
]

async function createDoctors() {
  console.log('🦷 Création des médecins dentistes...\n')

  for (const doc of doctors) {
    try {
      console.log(`🔧 Création de ${doc.prenom} ${doc.nom} (${doc.specialite})...`)

      // 1. Vérifier ou créer Auth
      const { data: existing } = await supabase.auth.admin.listUsers()
      const already = existing.users.find(x => x.email === doc.email)
      let authId

      if (!already) {
        const { data, error } = await supabase.auth.admin.createUser({
          email: doc.email,
          password: doc.password,
          email_confirm: true
        })
        if (error) throw error
        authId = data.user.id
        console.log(`  ✅ Auth créé`)
      } else {
        authId = already.id
        console.log(`  ⚠️  Auth existe déjà`)
      }

      // 2. Vérifier si déjà dans la table users
      const { data: existsInDb } = await supabase
        .from('users')
        .select('id')
        .eq('email', doc.email)
        .maybeSingle()

      if (existsInDb) {
        console.log(`  ⚠️  Déjà en base de données, mise à jour de la spécialité...`)
        await supabase
          .from('users')
          .update({ specialite: doc.specialite })
          .eq('email', doc.email)
        console.log(`  ✅ Spécialité mise à jour\n`)
        continue
      }

      // 3. Insérer dans la table users
      const { error } = await supabase
        .from('users')
        .insert({
          email: doc.email,
          username: doc.username,
          nom: doc.nom,
          prenom: doc.prenom,
          role: doc.role,
          specialite: doc.specialite,
          duree_consultation: doc.duree_consultation,
          tenant_id: doc.tenant_id,
          auth_id: authId,
          actif: true
        })

      if (error) throw error
      console.log(`  🎉 ${doc.prenom} ${doc.nom} créé avec succès\n`)

    } catch (err) {
      console.error(`  ❌ Erreur pour ${doc.email} →`, err.message, '\n')
    }
  }

  console.log('✅ Script terminé !')
  console.log('\n📋 Résumé des médecins créés :')
  console.log('  Cabinet Dakar Centre :')
  console.log('    - Dr. Oumar Fall (Dentiste généraliste) — dr.oumar.fall / Dakar2024!')
  console.log('    - Dr. Mariama Diallo (Orthodontiste) — dr.mariama.diallo / Dakar2024!')
  console.log('    - Dr. Ibou Ndiaye (Chirurgien buccal) — dr.ibou.ndiaye / Dakar2024!')
  console.log('  Cabinet Plateau :')
  console.log('    - Dr. Fatou Seck (Dentiste généraliste) — dr.fatou.seck / Plateau2024!')
  console.log('    - Dr. Cheikh Ba (Parodontiste) — dr.cheikh.ba / Plateau2024!')
  console.log('    - Dr. Aminata Sow (Endodontiste) — dr.aminata.sow / Plateau2024!')
}

createDoctors()
