// Script pour créer l'utilisateur Boubacar Bathily (comptabilité)
// À exécuter avec: node scripts/create-boubacar-user.js

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

async function createBoubacarUser() {
  try {
    console.log('🔧 Création de l\'utilisateur Boubacar Bathily (comptabilité)...');
    
    // 1. Créer l'utilisateur dans Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'boubacar.bathily@cabinet.com',
      password: 'Compta1',
      email_confirm: true,
      user_metadata: {
        nom: 'Bathily',
        prenom: 'Boubacar',
        username: 'boubacar.bathily',
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
        email: 'boubacar.bathily@cabinet.com',
        username: 'boubacar.bathily',
        nom: 'Bathily',
        prenom: 'Boubacar',
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
    console.log('🎉 Utilisateur Boubacar Bathily créé avec succès!');
    console.log('📝 Identifiants:');
    console.log('   Email: boubacar.bathily@cabinet.com');
    console.log('   Username: boubacar.bathily');
    console.log('   Password: Compta1');
    console.log('   Role: accounting');
    console.log('');
    console.log('🚀 Vous pouvez maintenant vous connecter avec le bloc "Comptabilité"!');

  } catch (error) {
    console.error('💥 Erreur inattendue:', error);
  }
}

createBoubacarUser();
