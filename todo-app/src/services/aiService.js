import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  "AIzaSyD3gFI7eGKBejGYuvrZ1DFgj4y1MQndpkQ"
);

export const generateRecipeFromIngredients = async (recipe) => {
  const formattedIngredients = recipe.ingredients.map(ing => 
    `${ing.name || ing} ${ing.quantity ? `(${ing.quantity} ${ing.unit || 'unité'})` : ''}`
  ).join('\n');

  const prompt = `En tant que chef cuisinier expérimenté, créez une variante de la recette "${recipe.name}" en utilisant ces ingrédients:
${formattedIngredients}

La recette originale est de type "${recipe.type}" et prend environ ${recipe.prepTime || 'N/A'} minutes de préparation.
${recipe.instructions ? `\nVoici les instructions originales pour référence:\n${recipe.instructions}\n` : ''}

Veuillez fournir une variante créative qui reste fidèle à l'esprit de la recette originale mais avec une touche unique.

Format de réponse souhaité en Markdown:
# Variante de ${recipe.name}
**Temps de préparation:** [durée similaire à l'original]

## Ingrédients
[utiliser les mêmes ingrédients avec possibilité d'ajustements mineurs]

## Instructions
[étapes numérotées avec votre approche unique]

## Ce qui rend cette variante spéciale
[expliquez les différences clés avec la recette originale]

## Présentation
[suggestions adaptées à cette variante]

## Astuces du Chef
[conseils pratiques spécifiques à cette variante]`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    return text.trim();
  } catch (error) {
    console.error("Erreur lors de la génération de la recette:", error);
    return "Une erreur s'est produite lors de la génération de la recette. Veuillez réessayer plus tard.";
  }
}; 