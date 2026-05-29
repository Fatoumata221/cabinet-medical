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

const doctorEmails = [
  // Cabinet Dakar Centre
  'dr.habib.diallo@cabinet.com',
  'dr.mariama.diallo@cabinet-dakar.com',
  'dr.ibou.ndiaye@cabinet-dakar.com',
  // Cabinet Plateau
  'dr.aicha.ndiaye@cabinet.com',
  'dr.aminata.sow@cabinet-plateau.com',
]

const NEW_PASSWORD = '12345678'

async function updatePasswords() {
  console.log('🔑 Mise à jour des mots de passe...\n')

  const { data: allUsers } = await supabase.auth.admin.listUsers()

  for (const email of doctorEmails) {
    try {
      const authUser = allUsers.users.find(u => u.email === email)

      if (!authUser) {
        console.log(`⚠️  Utilisateur non trouvé en Auth : ${email}`)
        continue
      }

      const { error } = await supabase.auth.admin.updateUserById(
        authUser.id,
        { password: NEW_PASSWORD }
      )

      if (error) throw error
      console.log(`✅ Mot de passe mis à jour : ${email}`)

    } catch (err) {
      console.error(`❌ Erreur pour ${email} →`, err.message)
    }
  }

  console.log('\n🎉 Terminé ! Tous les médecins utilisent maintenant le mot de passe : 12345678')
  console.log('\n📋 Identifiants de connexion :')
  console.log('\n  Cabinet Dentaire Dakar Centre :')
  console.log('    - dr.habib.diallo       / 12345678  (Dentiste généraliste)')
  console.log('    - dr.mariama.diallo     / 12345678  (Orthodontiste)')
  console.log('    - dr.ibou.ndiaye        / 12345678  (Chirurgien buccal)')
  console.log('\n  Cabinet Dentaire Plateau :')
  console.log('    - dr.aicha.ndiaye       / 12345678  (Parodontiste)')
  console.log('    - dr.aminata.sow        / 12345678  (Endodontiste)')
}

updatePasswords()
