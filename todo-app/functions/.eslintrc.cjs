// functions/.eslintrc.cjs
/* eslint-env node */ // Garde cette ligne, elle est toujours utile pour l'environnement Node.js
module.exports = {
  env: {
    node: true, // Active les globals Node.js (process, module, etc.)
    es2021: true, // Supporte les fonctionnalités modernes
  },
  extends: [
    'eslint:recommended', // Règles recommandées
  ],
  parserOptions: {
    ecmaVersion: 12, // Compatible avec ES2021
    sourceType: 'module', // Supporte ES Modules pour tes fichiers de code (comme index.js)
  },
  rules: {
    'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    'no-undef': 'error',
  },
  globals: {
    process: 'readonly', // Définit explicitement process comme global
  },
};