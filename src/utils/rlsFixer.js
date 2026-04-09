import { supabase } from '../lib/supabase.js';

// Vérifier et corriger les politiques RLS
export const checkAndFixRLS = async () => {
  console.log('🔒 Vérification des politiques RLS...');
  
  try {
    // Test d'accès aux tables principales
    const tables = ['users', 'patients', 'appointments'];
    const results = {};
    
    for (const table of tables) {
      console.log(`🔍 Test d'accès à la table ${table}...`);
      
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        if (error) {
          console.error(`❌ Erreur d'accès à ${table}:`, error);
          results[table] = { accessible: false, error };
        } else {
          console.log(`✅ Accès à ${table} réussi`);
          results[table] = { accessible: true, data };
        }
      } catch (e) {
        console.error(`❌ Exception pour ${table}:`, e);
        results[table] = { accessible: false, error: e };
      }
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification RLS:', error);
    return { error };
  }
};

// Créer des politiques RLS de base (nécessite la service role key)
export const createBasicRLSPolicies = async () => {
  console.log('🔧 Création des politiques RLS de base...');
  
  try {
    // Note: Ces politiques doivent être créées côté serveur
    // Ici on peut seulement suggérer les commandes SQL
    
    const policies = [
      // Politique pour la table users
      `CREATE POLICY "Enable read access for all users" ON public.users
       FOR SELECT USING (true);`,
      
      // Politique pour la table patients
      `CREATE POLICY "Enable read access for all users" ON public.patients
       FOR SELECT USING (true);`,
      
      // Politique pour la table appointments
      `CREATE POLICY "Enable read access for all users" ON public.appointments
       FOR SELECT USING (true);`,
      
      // Politique pour la table consultations
      `CREATE POLICY "Enable read access for all users" ON public.consultations
       FOR SELECT USING (true);`,
      
      // Politique pour la table prescriptions
      `CREATE POLICY "Enable read access for all users" ON public.prescriptions
       FOR SELECT USING (true);`,
      
      // Politique pour la table invoices
      `CREATE POLICY "Enable read access for all users" ON public.invoices
       FOR SELECT USING (true);`,
      
      // Politique pour la table waiting_queue
      `CREATE POLICY "Enable read access for all users" ON public.waiting_queue
       FOR SELECT USING (true);`
    ];
    
    console.log('📋 Politiques RLS suggérées:');
    policies.forEach((policy, index) => {
      console.log(`\n--- Politique ${index + 1} ---`);
      console.log(policy);
    });
    
    console.log('\n💡 Pour appliquer ces politiques:');
    console.log('1. Allez dans votre interface Supabase');
    console.log('2. SQL Editor');
    console.log('3. Copiez-collez chaque politique');
    console.log('4. Exécutez les commandes');
    
    return { success: true, policies };
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des politiques:', error);
    return { success: false, error };
  }
};

// Vérifier si RLS est activé
export const checkRLSStatus = async () => {
  console.log('🔍 Vérification du statut RLS...');
  
  try {
    // Test simple pour voir si RLS bloque l'accès
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error && error.message.includes('policy')) {
      console.log('⚠️ RLS semble bloquer l\'accès');
      return { rlsEnabled: true, blocking: true, error };
    } else if (error) {
      console.log('❌ Autre erreur:', error);
      return { rlsEnabled: false, blocking: false, error };
    } else {
      console.log('✅ Accès réussi, RLS ne bloque pas');
      return { rlsEnabled: true, blocking: false, data };
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification RLS:', error);
    return { rlsEnabled: false, blocking: false, error };
  }
};

