import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as fs from 'fs';
import * as path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Chemins à nettoyer
const pathsToClean = [
  'dist',
  'dev-dist',
  '.cache',
  'node_modules/.vite',
  'node_modules/.cache'
];

// Fonction pour supprimer un dossier récursivement
function deleteFolderRecursive(pathToDelete) {
  if (fs.existsSync(pathToDelete)) {
    fs.readdirSync(pathToDelete).forEach((file) => {
      const curPath = path.join(pathToDelete, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(pathToDelete);
    console.log(`✔️ Supprimé: ${pathToDelete}`);
  }
}

// Nettoyer les dossiers
console.log('🧹 Nettoyage des caches...');
pathsToClean.forEach(p => {
  const fullPath = path.join(process.cwd(), p);
  try {
    deleteFolderRecursive(fullPath);
  } catch (err) {
    console.log(`❌ Erreur lors de la suppression de ${p}:`, err.message);
  }
});

console.log('✨ Nettoyage terminé!'); 