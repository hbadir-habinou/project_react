import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import recipesData from './recipes.json' with { type: 'json' };

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCDLWSJzeHDztUxUobZBkEIMSrMfLdidRE",
  authDomain: "todo-web-a57a0.firebaseapp.com",
  projectId: "todo-web-a57a0",
  storageBucket: "todo-web-a57a0.firebasestorage.app",
  messagingSenderId: "271944674192",
  appId: "1:271944674192:web:dcaeb44fabce6af407a115",
  measurementId: "G-16DHRLB31K",
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Fonction pour importer les recettes dans une collection globale
async function importRecipes() {
  try {
    // Vérifier si recipesData est valide
    let recipes = recipesData;
    if (!recipes) {
      throw new Error('recipes.json is empty or not found');
    }

    // Si recipesData est un objet avec une propriété recipes
    if (!Array.isArray(recipes) && recipes.recipes) {
      recipes = recipes.recipes;
    }

    if (!Array.isArray(recipes)) {
      throw new Error('recipes.json must contain an array of recipes');
    }

    console.log('Recipes loaded:', JSON.stringify(recipes, null, 2)); // Debug

    const recipesCollectionRef = collection(db, 'recipes'); // Collection globale

    for (const recipe of recipes) {
      // Adapter la structure du JSON au format de DishForm
      const formattedRecipe = {
        name: recipe.name || 'Unnamed Recipe',
        type: recipe.type || 'Plat principal',
        ingredients: (recipe.ingredients || []).map(ing => ({
          name: ing.name || (typeof ing === 'string' ? ing : 'Unknown'),
          quantity: ing.quantity?.toString() || '1',
          unit: ing.unit || 'unité(s)'
        })),
        instructions: recipe.instructions || '',
        prepTime: Number.parseInt(recipe.prepTime) || 30,
        dietaryRestrictions: recipe.dietaryRestrictions || [],
        image: recipe.image || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(recipesCollectionRef, formattedRecipe);
      console.log(`Recette "${formattedRecipe.name}" ajoutée avec succès.`);
    }
    console.log('Importation terminée.');
  } catch (error) {
    console.error('Erreur lors de l\'importation des recettes :', error);
  }
}

// Exécuter l'importation
importRecipes();