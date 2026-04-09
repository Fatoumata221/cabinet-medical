#!/usr/bin/env node

/**
 * Script de diagnostic pour identifier les problèmes de connexion Supabase
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync } from 'fs';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🔍 DIAGNOSTIC DE CONNEXION SUPABASE\n');

// 1. Vérifier l'existence du fichier .env
const envPath = join(projectRoot, '.env');
const envExamplePath = join(projectRoot, '.env.example');

console.log('📁 Vérification des fichiers de configuration:');
console.log(`   .env: ${existsSync(envPath) ? '✅ Existe' : '❌ Manquant'}`);
console.log(`   .env.example: ${existsSync(envExamplePath) ? '✅ Existe' : '❌ Manquant'}`);

if (!existsSync(envPath)) {
  console.log('\n❌ PROBLÈME IDENTIFIÉ: Le fichier .env est manquant !');
  console.log('\n🔧 SOLUTION:');
  console.log('1. Copiez le fichier .env.example vers .env:');
  console.log('   cp .env.example .env');
  console.log('\n2. Éditez le fichier .env avec vos vraies valeurs Supabase');
  console.log('3. Redémarrez l\'application: npm run dev');
  
  if (existsSync(envExamplePath)) {
    console.log('\n📋 Contenu du fichier .env.example:');
    console.log('─'.repeat(50));
    console.log(readFileSync(envExamplePath, 'utf8'));
    console.log('─'.repeat(50));
  }
  
  process.exit(1);
}

// 2. Charger les variables d'environnement
dotenv.config({ path: envPath });

console.log('\n🔑 Variables d\'environnement:');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log(`   VITE_SUPABASE_URL: ${supabaseUrl ? '✅ Définie' : '❌ Manquante'}`);
console.log(`   VITE_SUPABASE_ANON_KEY: ${supabaseKey ? '✅ Définie' : '❌ Manquante'}`);

if (supabaseUrl) {
  console.log(`   URL: ${supabaseUrl}`);
  
  // Vérifier le format de l'URL
  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('supabase.co')) {
    console.log('   ⚠️  Format d\'URL suspect (doit être https://xxx.supabase.co)');
  }
}

if (supabaseKey) {
  console.log(`   Clé: ${supabaseKey.substring(0, 20)}...`);
  
  // Vérifier le format de la clé (JWT)
  if (!supabaseKey.startsWith('eyJ')) {
    console.log('   ⚠️  Format de clé suspect (doit commencer par eyJ)');
  }
}

if (!supabaseUrl || !supabaseKey) {
  console.log('\n❌ PROBLÈME IDENTIFIÉ: Variables d\'environnement manquantes !');
  console.log('\n🔧 SOLUTION:');
  console.log('1. Éditez le fichier .env');
  console.log('2. Ajoutez vos vraies valeurs Supabase:');
  console.log('   VITE_SUPABASE_URL=https://votre-projet.supabase.co');
  console.log('   VITE_SUPABASE_ANON_KEY=votre-cle-anon');
  console.log('3. Redémarrez l\'application');
  process.exit(1);
}

// 3. Tester la connexion Supabase
console.log('\n🌐 Test de connexion Supabase...');

try {
  // Import dynamique pour éviter les erreurs si les variables ne sont pas définies
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Test simple de connexion
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    console.log(`   ❌ Erreur de connexion: ${error.message}`);
    
    if (error.message.includes('Invalid API key')) {
      console.log('\n🔧 SOLUTION: Vérifiez votre VITE_SUPABASE_ANON_KEY');
    } else if (error.message.includes('fetch')) {
      console.log('\n🔧 SOLUTION: Vérifiez votre VITE_SUPABASE_URL');
    }
  } else {
    console.log('   ✅ Connexion Supabase réussie !');
    
    // Test d'une requête simple
    try {
      const { data: tables, error: tablesError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
        
      if (tablesError) {
        console.log(`   ⚠️  Erreur d'accès aux données: ${tablesError.message}`);
        console.log('   💡 Vérifiez que votre base de données est correctement configurée');
      } else {
        console.log('   ✅ Accès aux données réussi !');
      }
    } catch (e) {
      console.log(`   ⚠️  Test des données échoué: ${e.message}`);
    }
  }
  
} catch (error) {
  console.log(`   ❌ Erreur lors du test: ${error.message}`);
}

console.log('\n📋 RÉSUMÉ:');
console.log('─'.repeat(50));

if (existsSync(envPath) && supabaseUrl && supabaseKey) {
  console.log('✅ Configuration de base OK');
  console.log('💡 Si vous avez encore des erreurs:');
  console.log('   1. Redémarrez l\'application (npm run dev)');
  console.log('   2. Vérifiez la console du navigateur (F12)');
  console.log('   3. Vérifiez votre projet Supabase Dashboard');
} else {
  console.log('❌ Configuration incomplète');
  console.log('📖 Consultez le fichier GUIDE_CONFIGURATION_SUPABASE.md');
}

console.log('\n🚀 Pour démarrer l\'application: npm run dev');
