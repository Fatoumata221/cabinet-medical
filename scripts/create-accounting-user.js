// Script pour créer l'utilisateur comptabilité manuellement
// À exécuter avec: node scripts/create-accounting-user.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ VITE_SUPABASE_URL et VITE_SUPABASE_SERVICE_KEY sont requis');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAccountingUser() {
  try {
    console.log('🔧 Création de l\'utilisateur comptabilité...');
    
    // 1. Créer l'utilisateur dans Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'comptabilite@cabinet.com',
      password: 'compta123456',
      email_confirm: true,
      user_metadata: {
        nom: 'Comptabilité',
        prenom: 'Service',
        username: 'comptabilite.service',
        role: 'accounting'
      }
    });

    if (authError) {
      console.error('❌ Erreur création Auth:', authError);
      return;
    }

    console.log('✅ Utilisateur Auth créé:', authData.user.id);

    // 2. Créer l'entrée dans la table users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        email: 'comptabilite@cabinet.com',
        username: 'comptabilite.service',
        nom: 'Comptabilité',
        prenom: 'Service',
        role: 'accounting',
        auth_id: authData.user.id,
        actif: true
      })
      .select()
      .single();

    if (userError) {
      console.error('❌ Erreur création table users:', userError);
      return;
    }

    console.log('✅ Utilisateur table users créé:', userData);
    console.log('🎉 Utilisateur comptabilité créé avec succès!');
    console.log('📝 Identifiants:');
    console.log('   Email: comptabilite@cabinet.com');
    console.log('   Username: comptabilite.service');
    console.log('   Password: compta123456');
    console.log('   Role: accounting');

  } catch (error) {
    console.error('💥 Erreur inattendue:', error);
  }
}

createAccountingUser();
