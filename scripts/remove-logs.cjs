const fs = require('fs');
const path = require('path');

// Fichiers à nettoyer
const filesToClean = [
  'src/pages/WaitingQueuePage.jsx',
  'src/pages/MyWaitingQueuePage.jsx',
  'src/services/completeRealtimeService.js'
];

// Fonction pour nettoyer les logs
function cleanLogs(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Supprimer tous les console.log sauf ceux du WebSocket/Realtime
    content = content.replace(/console\.log\([^)]*\[(?!.*(?:Realtime|WebSocket|WebSocketDiagnostic))[^\]]*\][^)]*\);?\s*/g, '// Log supprimé\n');
    
    // Supprimer les console.log simples (sans crochets)
    content = content.replace(/console\.log\([^)]*\);?\s*/g, '// Log supprimé\n');
    
    // Nettoyer les lignes vides multiples
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Nettoyé: ${filePath}`);
  } catch (error) {
    console.error(`❌ Erreur lors du nettoyage de ${filePath}:`, error.message);
  }
}

// Nettoyer tous les fichiers
filesToClean.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  if (fs.existsSync(fullPath)) {
    cleanLogs(fullPath);
  } else {
    console.log(`⚠️ Fichier non trouvé: ${fullPath}`);
  }
});

console.log('🎉 Nettoyage des logs terminé!');
