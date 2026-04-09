const fs = require('fs');
const path = require('path');

// Configuration
const PARAMETRAGE_DIR = 'src/pages/parametrage';
const COMPONENTS_DIR = 'src/components';

// Liste des fichiers à ignorer (déjà modifiés)
const IGNORED_FILES = ['Medecins.jsx', 'Specialites.jsx'];

// Pattern de détection pour les pages de paramétrage
const FORM_PATTERN = /<form[^>]*onSubmit[^>]*className="[^"]*mb-8[^"]*"[^>]*>/;
const HEADER_PATTERN = /<h1[^>]*className="[^"]*text-2xl[^"]*"[^>]*>/;

// Fonction pour lire un fichier
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Erreur lors de la lecture de ${filePath}:`, error.message);
    return null;
  }
}

// Fonction pour écrire un fichier
function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${path.basename(filePath)} mis à jour avec succès`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur lors de l'écriture de ${filePath}:`, error.message);
    return false;
  }
}

// Fonction pour analyser et modifier un fichier
function updateParametrageFile(filePath) {
  const fileName = path.basename(filePath);
  
  if (IGNORED_FILES.includes(fileName)) {
    console.log(`⏭️  ${fileName} ignoré (déjà modifié)`);
    return;
  }

  console.log(`🔄 Analyse de ${fileName}...`);
  
  let content = readFile(filePath);
  if (!content) return;

  // Vérifier si c'est une page de paramétrage
  if (!FORM_PATTERN.test(content) || !HEADER_PATTERN.test(content)) {
    console.log(`⏭️  ${fileName} ignoré (pas une page de paramétrage standard)`);
    return;
  }

  // Ajouter les imports nécessaires
  if (!content.includes('ParametrageLayout')) {
    content = content.replace(
      /import React, { useState, useEffect } from 'react';/,
      `import React, { useState, useEffect } from 'react';
import ParametrageLayout from '../../components/ParametrageLayout';
import ParametrageList from '../../components/ParametrageList';`
    );
  }

  // Ajouter l'état showForm
  if (!content.includes('showForm')) {
    content = content.replace(
      /const \[editingId, setEditingId\] = useState\(null\);/,
      `const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);`
    );
  }

  // Ajouter les fonctions handleAddNew et handleCancel
  if (!content.includes('handleAddNew')) {
    // Trouver la fonction handleEdit
    const handleEditMatch = content.match(/const handleEdit = \(([^)]+)\) => {[\s\S]*?};/);
    if (handleEditMatch) {
      const handleEditEnd = content.indexOf(handleEditMatch[0]) + handleEditMatch[0].length;
      const beforeHandleEdit = content.substring(0, handleEditEnd);
      const afterHandleEdit = content.substring(handleEditEnd);
      
      // Extraire le nom de l'entité depuis le nom du fichier
      const entityName = fileName.replace('.jsx', '').toLowerCase();
      const entityNameSingular = entityName.endsWith('s') ? entityName.slice(0, -1) : entityName;
      
      const newFunctions = `
  const handleAddNew = () => {
    setEditingId(null);
    setNew${entityNameSingular.charAt(0).toUpperCase() + entityNameSingular.slice(1)}({ ${getDefaultState(entityNameSingular)} });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setNew${entityNameSingular.charAt(0).toUpperCase() + entityNameSingular.slice(1)}({ ${getDefaultState(entityNameSingular)} });
  };`;

      content = beforeHandleEdit + newFunctions + afterHandleEdit;
    }
  }

  // Modifier handleSubmit pour fermer le formulaire
  content = content.replace(
    /setNew[A-Z][a-zA-Z]*\({[^}]*}\);/g,
    (match) => {
      return match + '\n      setShowForm(false);';
    }
  );

  // Modifier handleEdit pour ouvrir le formulaire
  content = content.replace(
    /setEditingId\([^)]+\);/g,
    (match) => {
      return match + '\n    setShowForm(true);';
    }
  );

  // Remplacer la structure du return
  const returnMatch = content.match(/return \([\s\S]*?\);$/m);
  if (returnMatch) {
    const newReturn = generateNewReturnStructure(fileName);
    content = content.replace(returnMatch[0], newReturn);
  }

  // Écrire le fichier modifié
  writeFile(filePath, content);
}

// Fonction pour générer l'état par défaut selon l'entité
function getDefaultState(entityName) {
  const defaultStates = {
    'medecin': 'nom: \'\', prenom: \'\', email: \'\', telephone: \'\', specialite: \'\', role: \'doctor\', actif: true',
    'specialite': 'nom: \'\', description: \'\', actif: true',
    'assurance': 'nom: \'\', description: \'\', actif: true',
    'typeacte': 'nom: \'\', description: \'\', actif: true',
    'medicament': 'nom: \'\', description: \'\', actif: true',
    'diagnostic': 'nom: \'\', description: \'\', actif: true',
    'examen': 'nom: \'\', description: \'\', actif: true',
    'certificat': 'nom: \'\', description: \'\', actif: true',
    'antecedent': 'nom: \'\', description: \'\', actif: true',
    'synthese': 'nom: \'\', description: \'\', actif: true',
    'appareil': 'nom: \'\', description: \'\', actif: true',
    'constante': 'nom: \'\', description: \'\', actif: true',
    'signe': 'nom: \'\', description: \'\', actif: true',
    'archive': 'nom: \'\', description: \'\', actif: true',
    'vaccin': 'nom: \'\', description: \'\', actif: true',
    'etologie': 'nom: \'\', description: \'\', actif: true',
    'plainte': 'nom: \'\', description: \'\', actif: true',
    'symptome': 'nom: \'\', description: \'\', actif: true',
    'maladie': 'nom: \'\', description: \'\', actif: true',
    'employeur': 'nom: \'\', description: \'\', actif: true',
    'tier': 'nom: \'\', description: \'\', actif: true',
    'couverture': 'nom: \'\', description: \'\', actif: true'
  };
  
  return defaultStates[entityName] || 'nom: \'\', description: \'\', actif: true';
}

// Fonction pour générer la nouvelle structure de return
function generateNewReturnStructure(fileName) {
  const entityName = fileName.replace('.jsx', '').toLowerCase();
  const entityNameSingular = entityName.endsWith('s') ? entityName.slice(0, -1) : entityName;
  const entityNameCapitalized = entityNameSingular.charAt(0).toUpperCase() + entityNameSingular.slice(1);
  const entityNamePlural = entityName.endsWith('s') ? entityName : entityName + 's';
  
  return `  return (
    <div>
      <ParametrageLayout
        title="${entityNameCapitalized}s"
        addButtonText={editingId ? 'Modifier ${entityNameSingular}' : 'Ajouter ${entityNameSingular}'}
        showForm={showForm}
        onAddClick={handleAddNew}
        onCancelClick={handleCancel}
      >
        {/* Le contenu du formulaire sera conservé ici */}
      </ParametrageLayout>

      {/* Liste des ${entityNamePlural} */}
      <ParametrageList
        title="Liste des ${entityNamePlural}"
        itemCount={${entityNamePlural}.length}
        itemName="${entityNamePlural}"
        emptyMessage="Aucun ${entityNameSingular} enregistré. Cliquez sur 'Ajouter ${entityNameSingular}' pour commencer."
      >
        {/* Le contenu de la liste sera conservé ici */}
      </ParametrageList>
    </div>
  );`;
}

// Fonction principale
function main() {
  console.log('🚀 Début de la mise à jour des pages de paramétrage...\n');

  // Vérifier que le répertoire existe
  if (!fs.existsSync(PARAMETRAGE_DIR)) {
    console.error(`❌ Le répertoire ${PARAMETRAGE_DIR} n'existe pas`);
    return;
  }

  // Lire tous les fichiers .jsx dans le répertoire
  const files = fs.readdirSync(PARAMETRAGE_DIR)
    .filter(file => file.endsWith('.jsx'))
    .map(file => path.join(PARAMETRAGE_DIR, file));

  console.log(`📁 ${files.length} fichiers trouvés dans ${PARAMETRAGE_DIR}\n`);

  // Traiter chaque fichier
  files.forEach(file => {
    updateParametrageFile(file);
  });

  console.log('\n✅ Mise à jour terminée !');
  console.log('\n📝 Notes importantes :');
  console.log('- Les fichiers ont été modifiés avec la nouvelle structure');
  console.log('- Vous devrez peut-être ajuster manuellement certains détails');
  console.log('- Vérifiez que les imports et les noms de variables sont corrects');
  console.log('- Testez chaque page pour vous assurer qu\'elle fonctionne correctement');
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = { updateParametrageFile };
