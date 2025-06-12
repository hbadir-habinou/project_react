import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// nécessaire pour __dirname en ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const excludedDirs = ['node_modules', 'functions', 'backend', 'dist'];

function getStructure(dir) {
  const result = {};
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!excludedDirs.includes(file)) {
        result[file] = getStructure(fullPath);
      }
    } else {
      result[file] = 'file';
    }
  }

  return result;
}

const structure = getStructure(path.join(__dirname, './'));
console.log(JSON.stringify(structure, null, 2));
