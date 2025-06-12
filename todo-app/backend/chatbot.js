import { GoogleGenerativeAI } from "@google/generative-ai"
import dotenv from "dotenv"

dotenv.config()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_APIKEY)

export const handleChatRequest = async (req, res) => {
  try {
    const { userDishes, userIngredients, availableRecipes, userMessage } = req.body

    // Préparer le contexte pour l'IA
    const context = `
Tu es un assistant culinaire spécialisé dans la cuisine camerounaise et internationale. 
Tu as accès aux données suivantes de l'utilisateur :

PLATS DE L'UTILISATEUR (${userDishes.length} plats) :
${userDishes.map((dish) => `- ${dish.name} (${dish.type}, ${dish.prepTime}min) : ${dish.ingredients?.map((ing) => ing.name).join(", ")}`).join("\n")}

INGRÉDIENTS DISPONIBLES (${userIngredients.length} ingrédients) :
${userIngredients.map((ing) => `- ${ing.name} : ${ing.quantity} ${ing.unit} (expire: ${ing.expirationDate || "N/A"})`).join("\n")}

RECETTES DISPONIBLES (${availableRecipes.length} recettes) :
${availableRecipes
  .slice(0, 20)
  .map((recipe) => `- ${recipe.name} (${recipe.type}) : ${recipe.ingredients?.map((ing) => ing.name).join(", ")}`)
  .join("\n")}

RÈGLES :
1. Réponds en français
2. Sois créatif et propose des recettes adaptées aux ingrédients disponibles
3. Mentionne les recettes camerounaises quand c'est pertinent
4. Donne des conseils pratiques de cuisine
5. Si l'utilisateur demande une recette spécifique, adapte-la aux ingrédients disponibles
6. Propose des alternatives si certains ingrédients manquent
7. Mentionne les temps de préparation
8. Donne des conseils nutritionnels quand approprié

MESSAGE DE L'UTILISATEUR : "${userMessage}"
`

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
    const result = await model.generateContent(context)
    const response = result.response.text()

    // Générer des suggestions basées sur le contexte
    const suggestions = generateSuggestions(userMessage, userIngredients, availableRecipes)

    res.json({
      response: response,
      suggestions: suggestions,
    })
  } catch (error) {
    console.error("Erreur chatbot:", error)
    res.status(500).json({
      response: "Désolé, je rencontre des difficultés techniques. Veuillez réessayer plus tard.",
      suggestions: [],
    })
  }
}

const generateSuggestions = (userMessage, userIngredients, availableRecipes) => {
  const suggestions = []

  // Suggestions basées sur les ingrédients qui expirent bientôt
  const expiringIngredients = userIngredients.filter((ing) => {
    if (!ing.expirationDate) return false
    const expDate = new Date(ing.expirationDate)
    const today = new Date()
    const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24))
    return diffDays <= 3 && diffDays >= 0
  })

  if (expiringIngredients.length > 0) {
    suggestions.push(`Que puis-je faire avec ${expiringIngredients[0].name} qui expire bientôt ?`)
  }

  // Suggestions de recettes populaires
  const popularRecipes = availableRecipes
    .filter(
      (recipe) =>
        recipe.name.toLowerCase().includes("ndolé") ||
        recipe.name.toLowerCase().includes("poulet") ||
        recipe.name.toLowerCase().includes("poisson"),
    )
    .slice(0, 2)

  popularRecipes.forEach((recipe) => {
    suggestions.push(`Comment préparer ${recipe.name} ?`)
  })

  // Suggestions générales
  if (suggestions.length < 3) {
    suggestions.push(
      "Propose-moi un menu équilibré pour cette semaine",
      "Quelles sont les spécialités camerounaises que je peux faire ?",
      "Donne-moi une recette rapide avec mes ingrédients",
    )
  }

  return suggestions.slice(0, 3)
}
