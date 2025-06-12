import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const generateRecipe = async (dish) => {
  const prompt = `En tant que chef cuisinier expert, générez une recette détaillée pour le plat suivant:
  Nom du plat: ${dish.name}
  Description: ${dish.description || "Non spécifiée"}
  Ingrédients actuels: ${dish.ingredients ? dish.ingredients.map(i => i.name).join(", ") : "Non spécifiés"}
  
  Veuillez fournir:
  1. Une liste complète des ingrédients nécessaires avec les quantités
  2. Les étapes détaillées de préparation
  3. Le temps de préparation et de cuisson
  4. Des conseils et astuces pour réussir la recette
  5. Des suggestions de variations ou d'accompagnements
  
  Formattez la réponse en Markdown pour une meilleure lisibilité.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    return text.trim();
  } catch (error) {
    console.error("Erreur lors de la génération de la recette:", error);
    return "Une erreur s'est produite lors de la génération de la recette. Veuillez réessayer plus tard.";
  }
}; 