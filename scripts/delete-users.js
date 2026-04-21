import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Emails à supprimer (ceux de ton script)
const emails = [
  'dr.habib.diallo@cabinet.com',
  'aissatou.ndoye@cabinet.com',
  'ibrahima.ba@cabinet.com',
  'dr.aicha.ndiaye@cabinet.com',
  'khadija.diop@cabinet.com',
  'moussa.sow@cabinet.com'
]

async function deleteUsers() {
  for (const email of emails) {
    try {
      console.log(`🧹 Suppression ${email}...`)

      // 1. Trouver user Auth
      const { data: authUsers } = await supabase.auth.admin.listUsers()

      const authUser = authUsers.users.find(u => u.email === email)

      if (authUser) {
        await supabase.auth.admin.deleteUser(authUser.id)
        console.log(`🗑️ Auth supprimé: ${email}`)
      }

      // 2. Supprimer table users
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('email', email)

      if (error) throw error

      console.log(`🗑️ Table users supprimé: ${email}`)

    } catch (err) {
      console.error(`❌ Erreur ${email} →`, err.message)
    }
  }

  console.log('🚀 Suppression terminée')
}

deleteUsers()