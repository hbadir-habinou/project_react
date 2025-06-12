"use client"

import { createContext, useContext, useState, useEffect } from "react"

const LanguageContext = createContext()

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}

// Traductions centralisées
const translations = {
  fr: {
    // Navigation
    "app.title": "FoodPlanner",
    "nav.dashboard": "Tableau de Bord",
    "nav.logout": "Déconnexion",
    "nav.login": "Connexion",
    "nav.signup": "Inscription",
    "nav.settings": "Paramètres",
    "nav.search": "Rechercher",

    // Thème et langue
    "theme.light": "Mode Clair",
    "theme.dark": "Mode Sombre",
    "language.fr": "Français",
    "language.en": "English",

    // Profil
    "profile.view": "Voir le Profil",
    "profile.edit": "Modifier le Profil",
    "profile.close": "Fermer",
    "profile.email": "Email",
    "profile.name": "Nom",
    "profile.age": "Âge",
    "profile.gender": "Genre",
    "profile.role": "Rôle",
    "profile.medicalConditions": "Conditions médicales",

    // Dashboard
    Dashboard: "Tableau de Bord",
    overview: "Vue d'ensemble",
    members: "Membres",
    dishes: "Plats",
    ingredients: "Ingrédients",
    planning: "Planification",
    shoppingList: "Liste de Courses",
    recipes: "Recettes",
    notifications: "Notifications",

    // Actions
    addMember: "Ajouter Membre",
    addDish: "Ajouter Plat",
    addIngredient: "Ajouter Ingrédient",
    edit: "Modifier",
    delete: "Supprimer",
    save: "Sauvegarder",
    cancel: "Annuler",
    close: "Fermer",
    share: "Partager",
    import: "Importer",
    export: "Exporter",

    // États
    loading: "Chargement...",
    loadingDashboard: "Chargement du tableau de bord",
    error: "Erreur",
    success: "Succès",
    you: "Vous",
    none: "Aucun",
    noRole: "Aucun rôle",
    years: "ans",
    and: "et",
    others: "autres",

    // Filtres
    filterByMember: "Filtrer par membre",
    allMembers: "Tous les membres",
    selectDish: "Sélectionner un plat",

    // Planification
    weeklyMealPlan: "Plan de Repas Hebdomadaire",
    generatePlan: "Générer Plan",
    sendToFamily: "Envoyer à la Famille",
    confirmMealPlan: "Confirmer le plan de repas",

    // Jours de la semaine
    "days.monday": "Lundi",
    "days.tuesday": "Mardi",
    "days.wednesday": "Mercredi",
    "days.thursday": "Jeudi",
    "days.friday": "Vendredi",
    "days.saturday": "Samedi",
    "days.sunday": "Dimanche",

    // Ingrédients
    ingredientInventory: "Inventaire des Ingrédients",
    quantity: "Quantité",
    price: "Prix",
    category: "Catégorie",
    expiration: "Expiration",
    requiredIngredients: "Ingrédients Requis",
    totalRequired: "Total requis",

    // Liste de courses
    checkAll: "Tout cocher",
    uncheckAll: "Tout décocher",
    exportPDF: "Exporter en PDF",
    exportText: "Exporter en texte",
    item: "Article",
    purchased: "Acheté",
    estimatedTotal: "Total estimé",
    purchasedItems: "Articles achetés",
    noItems: "Aucun article",
    planMeals: "Planifiez vos repas pour générer une liste de courses",

    // Recettes
    cameroonianRecipes: "Recettes Camerounaises",
    noRecipes: "Aucune recette disponible",
    proposeRecipe: "Proposer une recette",
    proposeRecipePrompt: "Cliquez sur 'Proposer une recette' pour voir les suggestions.",
    readRecipeDoc: "Lire le document de recettes",
    viewDetails: "Voir détails",
    ingredientsList: "Ingrédients",
    instructions: "Instructions",
    type: "Type",
    prepTime: "Temps de préparation",
    restrictions: "Restrictions",
    generatePlanRecipes: "Générer plan (Recettes)",

    // Notifications
    enableNotifications: "Activer les notifications",
    disableNotifications: "Désactiver les notifications",
    noNotifications: "Aucune notification",
    noNotificationsMessage: "Vous n'avez aucune notification pour le moment.",
    markAllAsRead: "Tout marquer comme lu",
    viewIngredient: "Voir l'ingrédient",
    dismiss: "Ignorer",
    refreshNotifications: "Actualiser les notifications",

    // Partage
    sharedRecipes: "Recettes Partagées",
    whatsappShare: "Partager sur WhatsApp",
    familySharing: "Partage Familial",
    recipeCollection: "Collection de Recettes",
    aiAssistant: "Assistant IA",
    combineDishes: "Combiner des plats",
    combined: "Combiné",

    // Messages
    importSuccess: "Recette importée avec succès !",
    importError: "Erreur lors de l'importation",
    shareSuccess: "Recette partagée avec succès !",
    shareError: "Erreur lors du partage",
    allIngredientsInStock: "Tous les ingrédients sont en stock",
    allIngredientsInStockPrompt: "Tous les ingrédients nécessaires sont disponibles dans votre inventaire.",

    // Erreurs
    "error.jsPDFNotLoaded": "Erreur : jsPDF non chargé",
    "error.noAuthUser": "Aucun utilisateur authentifié",
    "error.profileNotFound": "Profil non trouvé",
    "error.loadMembers": "Erreur lors du chargement des membres",
    "error.loadDishes": "Erreur lors du chargement des plats",
    "error.loadIngredients": "Erreur lors du chargement des ingrédients",
    "error.loadMealPlan": "Erreur lors du chargement du plan de repas",
    "error.loadShoppingList": "Erreur lors du chargement de la liste de courses",
    "error.loadRecipes": "Erreur lors du chargement des recettes",
    "error.loadDashboard": "Erreur lors du chargement du tableau de bord",
    "error.addMember": "Erreur lors de l'ajout du membre",
    "error.saveMember": "Erreur lors de la sauvegarde du membre",
    "error.deleteMember": "Erreur lors de la suppression du membre",
    "error.addDish": "Erreur lors de l'ajout du plat",
    "error.saveDish": "Erreur lors de la sauvegarde du plat",
    "error.deleteDish": "Erreur lors de la suppression du plat",
    "error.addIngredient": "Erreur lors de l'ajout de l'ingrédient",
    "error.saveIngredient": "Erreur lors de la sauvegarde de l'ingrédient",
    "error.deleteIngredient": "Erreur lors de la suppression de l'ingrédient",
    "error.saveMealPlan": "Erreur lors de la sauvegarde du plan de repas",
    "error.generateMealPlan": "Erreur lors de la génération du plan de repas",
    "error.confirmMealPlan": "Erreur lors de la confirmation du plan de repas",
    "error.saveShoppingList": "Erreur lors de la sauvegarde de la liste de courses",
    "error.updatePurchaseStatus": "Erreur lors de la mise à jour de l'état d'achat",
    "error.fetchRecipes": "Erreur lors de la récupération des recettes",
    "error.sendEmails": "Erreur lors de l'envoi des emails",
    "error.noValidEmail": "Aucun email valide trouvé",
    "error.unknown": "Erreur inconnue",
    "error.noDishesAvailable": "Aucun plat disponible",
    "error.noRecipesAvailable": "Aucune recette disponible",
    "error.deleteMainProfile": "Impossible de supprimer le profil principal",

    // Confirmations
    "confirm.deleteMember": "Êtes-vous sûr de vouloir supprimer ce membre ?",
    "confirm.deleteDish": "Êtes-vous sûr de vouloir supprimer ce plat ?",
    "confirm.deleteIngredient": "Êtes-vous sûr de vouloir supprimer cet ingrédient ?",
    "confirm.confirmMealPlan": "Êtes-vous sûr de vouloir confirmer ce plan de repas ?",

    // Succès
    "success.emailsSent": "Emails envoyés avec succès",

    // Autres
    noDish: "Aucun plat",
    unit: "Unité",
  },
  en: {
    // Navigation
    "app.title": "FoodPlanner",
    "nav.dashboard": "Dashboard",
    "nav.logout": "Logout",
    "nav.login": "Login",
    "nav.signup": "Sign Up",
    "nav.settings": "Settings",
    "nav.search": "Search",

    // Theme and language
    "theme.light": "Light Mode",
    "theme.dark": "Dark Mode",
    "language.fr": "Français",
    "language.en": "English",

    // Profile
    "profile.view": "View Profile",
    "profile.edit": "Edit Profile",
    "profile.close": "Close",
    "profile.email": "Email",
    "profile.name": "Name",
    "profile.age": "Age",
    "profile.gender": "Gender",
    "profile.role": "Role",
    "profile.medicalConditions": "Medical Conditions",

    // Dashboard
    Dashboard: "Dashboard",
    overview: "Overview",
    members: "Members",
    dishes: "Dishes",
    ingredients: "Ingredients",
    planning: "Planning",
    shoppingList: "Shopping List",
    recipes: "Recipes",
    notifications: "Notifications",

    // Actions
    addMember: "Add Member",
    addDish: "Add Dish",
    addIngredient: "Add Ingredient",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    close: "Close",
    share: "Share",
    import: "Import",
    export: "Export",

    // States
    loading: "Loading...",
    loadingDashboard: "Loading dashboard",
    error: "Error",
    success: "Success",
    you: "You",
    none: "None",
    noRole: "No role",
    years: "years",
    and: "and",
    others: "others",

    // Filters
    filterByMember: "Filter by member",
    allMembers: "All members",
    selectDish: "Select dish",

    // Planning
    weeklyMealPlan: "Weekly Meal Plan",
    generatePlan: "Generate Plan",
    sendToFamily: "Send to Family",
    confirmMealPlan: "Confirm meal plan",

    // Days of the week
    "days.monday": "Monday",
    "days.tuesday": "Tuesday",
    "days.wednesday": "Wednesday",
    "days.thursday": "Thursday",
    "days.friday": "Friday",
    "days.saturday": "Saturday",
    "days.sunday": "Sunday",

    // Ingredients
    ingredientInventory: "Ingredient Inventory",
    quantity: "Quantity",
    price: "Price",
    category: "Category",
    expiration: "Expiration",
    requiredIngredients: "Required Ingredients",
    totalRequired: "Total required",

    // Shopping list
    checkAll: "Check All",
    uncheckAll: "Uncheck All",
    exportPDF: "Export to PDF",
    exportText: "Export to Text",
    item: "Item",
    purchased: "Purchased",
    estimatedTotal: "Estimated Total",
    purchasedItems: "Purchased items",
    noItems: "No items",
    planMeals: "Plan your meals to generate a shopping list",

    // Recipes
    cameroonianRecipes: "Cameroonian Recipes",
    noRecipes: "No recipes available",
    proposeRecipe: "Propose Recipe",
    proposeRecipePrompt: "Click 'Propose Recipe' to see suggestions.",
    readRecipeDoc: "Read Recipe Document",
    viewDetails: "View Details",
    ingredientsList: "Ingredients",
    instructions: "Instructions",
    type: "Type",
    prepTime: "Preparation Time",
    restrictions: "Restrictions",
    generatePlanRecipes: "Generate Plan (Recipes)",

    // Notifications
    enableNotifications: "Enable Notifications",
    disableNotifications: "Disable Notifications",
    noNotifications: "No notifications",
    noNotificationsMessage: "You have no notifications at the moment.",
    markAllAsRead: "Mark all as read",
    viewIngredient: "View ingredient",
    dismiss: "Dismiss",
    refreshNotifications: "Refresh notifications",

    // Sharing
    sharedRecipes: "Shared Recipes",
    whatsappShare: "Share on WhatsApp",
    familySharing: "Family Sharing",
    recipeCollection: "Recipe Collection",
    aiAssistant: "AI Assistant",
    combineDishes: "Combine Dishes",
    combined: "Combined",

    // Messages
    importSuccess: "Recipe imported successfully!",
    importError: "Import error",
    shareSuccess: "Recipe shared successfully!",
    shareError: "Share error",
    allIngredientsInStock: "All ingredients in stock",
    allIngredientsInStockPrompt: "All required ingredients are available in your inventory.",

    // Errors
    "error.jsPDFNotLoaded": "Error: jsPDF not loaded",
    "error.noAuthUser": "No authenticated user",
    "error.profileNotFound": "Profile not found",
    "error.loadMembers": "Error loading members",
    "error.loadDishes": "Error loading dishes",
    "error.loadIngredients": "Error loading ingredients",
    "error.loadMealPlan": "Error loading meal plan",
    "error.loadShoppingList": "Error loading shopping list",
    "error.loadRecipes": "Error loading recipes",
    "error.loadDashboard": "Error loading dashboard",
    "error.addMember": "Error adding member",
    "error.saveMember": "Error saving member",
    "error.deleteMember": "Error deleting member",
    "error.addDish": "Error adding dish",
    "error.saveDish": "Error saving dish",
    "error.deleteDish": "Error deleting dish",
    "error.addIngredient": "Error adding ingredient",
    "error.saveIngredient": "Error saving ingredient",
    "error.deleteIngredient": "Error deleting ingredient",
    "error.saveMealPlan": "Error saving meal plan",
    "error.generateMealPlan": "Error generating meal plan",
    "error.confirmMealPlan": "Error confirming meal plan",
    "error.saveShoppingList": "Error saving shopping list",
    "error.updatePurchaseStatus": "Error updating purchase status",
    "error.fetchRecipes": "Error fetching recipes",
    "error.sendEmails": "Error sending emails",
    "error.noValidEmail": "No valid email found",
    "error.unknown": "Unknown error",
    "error.noDishesAvailable": "No dishes available",
    "error.noRecipesAvailable": "No recipes available",
    "error.deleteMainProfile": "Cannot delete main profile",

    // Confirmations
    "confirm.deleteMember": "Are you sure you want to delete this member?",
    "confirm.deleteDish": "Are you sure you want to delete this dish?",
    "confirm.deleteIngredient": "Are you sure you want to delete this ingredient?",
    "confirm.confirmMealPlan": "Are you sure you want to confirm this meal plan?",

    // Success
    "success.emailsSent": "Emails sent successfully",

    // Others
    noDish: "No dish",
    unit: "Unit",
  },
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("language") || "fr"
  })

  useEffect(() => {
    localStorage.setItem("language", language)
  }, [language])

  const t = (key) => {
    return translations[language][key] || key
  }

  const value = {
    language,
    setLanguage,
    t,
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
