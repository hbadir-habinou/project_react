"use client"

import { useState, useEffect } from "react"
import { auth, db } from "../firebase"
import { doc, getDoc, collection, onSnapshot, updateDoc, deleteDoc, addDoc, setDoc } from "firebase/firestore"
import { useNavigate } from "react-router-dom"
import FamilyMemberForm from "../components/FamilyMemberForm"
import DishForm from "../components/DishForm"
import IngredientForm from "../components/IngredientForm"
import RecipeCollection from "../components/RecipeCollection"
import FamilyProfileSharing from "../components/FamilyProfileSharing"
import { useLanguage } from "../contexts/LanguageContext"
import { jsPDF } from "jspdf"
import AIChat from "../components/AIChat"
import { notificationService } from "../services/notificationService"

const FamilyDashboard = () => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [currentUserProfile, setCurrentUserProfile] = useState(null)
  const [familyMembers, setFamilyMembers] = useState([])
  const [dishes, setDishes] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [mealPlan, setMealPlan] = useState({})
  const [shoppingList, setShoppingList] = useState([])
  const [selectedMember, setSelectedMember] = useState("")
  const [editingMember, setEditingMember] = useState(null)
  const [editingDish, setEditingDish] = useState(null)
  const [editingIngredient, setEditingIngredient] = useState(null)
  const [showDishForm, setShowDishForm] = useState(false)
  const [showIngredientForm, setShowIngredientForm] = useState(false)
  const [showMemberForm, setShowMemberForm] = useState(false)
  const [showWhatsAppShare, setShowWhatsAppShare] = useState(false)
  const [activeTab, setActiveTab] = useState("members")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [emailStatus, setEmailStatus] = useState("")
  const [recipes, setRecipes] = useState([])
  const [dbRecipes, setDbRecipes] = useState([])
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [showRecipeDetails, setShowRecipeDetails] = useState(false)
  const [combinedDishes, setCombinedDishes] = useState([])
  const [isCombining, setIsCombining] = useState(false)
  const [isMealPlanConfirmed, setIsMealPlanConfirmed] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [sharedRecipes, setSharedRecipes] = useState([])
  const [publicDishes, setPublicDishes] = useState([])
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission)
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(false)
  const [showNotificationPanel, setShowNotificationPanel] = useState(false)
  const [showChatbot, setShowChatbot] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isReadOnly, setIsReadOnly] = useState(false)
  const [familyCode, setFamilyCode] = useState("")
  const [isGuestMode, setIsGuestMode] = useState(false)

  const weekId = "2025-W22"

  const getCurrentUserId = () => {
    const guestData = localStorage.getItem("guestUserData")
    if (guestData) {
      try {
        const guestUserData = JSON.parse(guestData)
        // Retourner l'UID de l'utilisateur invité ou l'UID Firebase actuel
        return guestUserData.uid || auth.currentUser?.uid
      } catch (err) {
        console.error("Erreur lors du parsing des données invité:", err)
        return auth.currentUser?.uid
      }
    }
    return auth.currentUser?.uid
  }

  const getDataSourceUserId = async () => {
    const guestAdminId = localStorage.getItem("guestAdminUserId")
    const guestFamilyCode = localStorage.getItem("guestFamilyCode")

    if (guestAdminId) {
      console.log("Utilisation de l'ID admin stocké:", guestAdminId)
      return guestAdminId
    }

    if (guestFamilyCode && !guestAdminId) {
      try {
        const familyDoc = await getDoc(doc(db, "families", guestFamilyCode))
        if (familyDoc.exists()) {
          const familyData = familyDoc.data()
          const adminId = familyData.adminId || familyData.createdBy
          if (adminId) {
            console.log("ID admin récupéré depuis la famille:", adminId)
            localStorage.setItem("guestAdminUserId", adminId)
            return adminId
          }
        }
      } catch (err) {
        console.error("Erreur lors de la récupération de l'admin:", err)
      }
    }

    return auth.currentUser?.uid
  }

  const dashboardTranslations = {
    fr: {
      checkAll: "Tout cocher",
      combineDishes: "Combiner des plats",
      uncheckAll: "Tout décocher",
      exportPDF: "Exporter en PDF",
      exportText: "Exporter en texte",
      item: "Article",
      purchased: "Acheté",
      combined: "Combiné",
      confirmMealPlan: "Confirmer le plan de repas",
      error: {
        jsPDFNotLoaded: "Erreur : jsPDF non chargé",
      },
      cameroonianRecipes: "Recettes Camerounaises",
      noRecipes: "Aucune recette disponible",
      proposeRecipePrompt: "Cliquez sur 'Proposer une recette' pour voir les suggestions.",
      viewDetails: "Voir détails",
      ingredientsList: "Ingrédients",
      instructions: "Instructions",
      type: "Type",
      prepTime: "Temps de préparation",
      restrictions: "Restrictions",
      close: "Fermer",
      generatePlanRecipes: "Générer plan (Recettes)",
      details: {
        noIngredients: "Aucun ingrédient disponible",
        noData: "Aucune donnée disponible",
        title: "Détails",
        ingredients: "Ingrédients",
        instructions: "Instructions",
        close: "Fermer",
      },
      sharedRecipes: "Recettes Partagées",
      importSuccess: "Recette importée avec succès !",
      importError: "Erreur lors de l'importation",
      shareSuccess: "Recette partagée avec succès !",
      shareError: "Erreur lors du partage",
      allIngredientsInStock: "Tous les ingrédients sont en stock",
      allIngredientsInStockPrompt: "Tous les ingrédients nécessaires sont disponibles dans votre inventaire.",
      enableNotifications: "Activer les notifications",
      disableNotifications: "Désactiver les notifications",
      notificationPermissionDenied: "Permission de notification refusée",
      notificationPermissionGranted: "Notifications activées avec succès",
      notificationTitle: "🍽️ Planificateur Familial",
      ingredientExpiringToday: "expire aujourd'hui !",
      ingredientExpiringTomorrow: "expire demain !",
      ingredientExpiringIn: "expire dans",
      days: "jours !",
      useInDishes: "Utilisez-le dans vos plats.",
      noRecipeUsingIngredient: "Aucun plat n'utilise cet ingrédient.",
      testNotificationTitle: "🔔 Système de notifications activé",
      testNotificationMessage:
        "Les notifications sont maintenant configurées. Ajoutez des ingrédients pour recevoir des alertes d'expiration.",
      refreshNotifications: "Actualiser les notifications",
      notifications: "Notifications",
      noNotifications: "Aucune notification",
      noNotificationsMessage: "Vous n'avez aucune notification pour le moment.",
      markAllAsRead: "Tout marquer comme lu",
      viewIngredient: "Voir l'ingrédient",
      dismiss: "Ignorer",
      now: "maintenant",
      minutesAgo: "il y a {minutes} min",
      hoursAgo: "il y a {hours}h",
      daysAgo: "il y a {days}j",
      recipeCollection: "Collection de Recettes",
      familySharing: "Partage Familial",
      whatsappShare: "Partager sur WhatsApp",
      aiAssistant: "Assistant IA",
      readOnlyMode: "Mode Lecture Seule",
      readOnlyMessage:
        "Vous consultez les données en mode lecture seule. Seul l'administrateur peut modifier les données.",
      actionNotAllowed: "Action non autorisée : mode lecture seule",
      guestMode: "Mode Invité",
      guestModeMessage: "Vous êtes connecté en mode invité avec accès en lecture seule.",
      normalMode: "Mode Normal",
      normalModeMessage: "Vous avez un accès complet au dashboard familial.",
    },
    en: {
      checkAll: "Check All",
      combineDishes: "Combine Dishes",
      uncheckAll: "Uncheck All",
      exportPDF: "Export to PDF",
      exportText: "Export to Text",
      item: "Item",
      purchased: "Purchased",
      combined: "Combined",
      confirmMealPlan: "Confirm Meal Plan",
      error: {
        jsPDFNotLoaded: "Error: jsPDF not loaded",
      },
      cameroonianRecipes: "Cameroonian Recipes",
      noRecipes: "No recipes available",
      proposeRecipePrompt: "Click 'Propose Recipe' to see suggestions.",
      viewDetails: "View Details",
      ingredientsList: "Ingredients",
      instructions: "Instructions",
      type: "Type",
      prepTime: "Preparation Time",
      restrictions: "Restrictions",
      close: "Close",
      generatePlanRecipes: "Generate Plan (Recipes)",
      details: {
        noIngredients: "No ingredients available",
        noData: "No data available",
        title: "Details",
        ingredients: "Ingredients",
        instructions: "Instructions",
        close: "Close",
      },
      sharedRecipes: "Shared Recipes",
      importSuccess: "Recipe imported successfully!",
      importError: "Import error",
      shareSuccess: "Recipe shared successfully!",
      shareError: "Share error",
      allIngredientsInStock: "All ingredients in stock",
      allIngredientsInStockPrompt: "All required ingredients are available in your inventory.",
      enableNotifications: "Enable Notifications",
      disableNotifications: "Disable Notifications",
      notificationPermissionDenied: "Notification permission denied",
      notificationPermissionGranted: "Notifications enabled successfully",
      notificationTitle: "🍽️ Family Meal Planner",
      ingredientExpiringToday: "expires today!",
      ingredientExpiringTomorrow: "expires tomorrow!",
      ingredientExpiringIn: "expires in",
      days: "days!",
      useInDishes: "Use it in your dishes.",
      noRecipeUsingIngredient: "No recipe uses this ingredient.",
      testNotificationTitle: "🔔 Notification system activated",
      testNotificationMessage: "Notifications are now configured. Add ingredients to receive expiration alerts.",
      refreshNotifications: "Refresh notifications",
      notifications: "Notifications",
      noNotifications: "No notifications",
      noNotificationsMessage: "You have no notifications at the moment.",
      markAllAsRead: "Mark all as read",
      viewIngredient: "View ingredient",
      dismiss: "Dismiss",
      now: "now",
      minutesAgo: "{minutes} min ago",
      hoursAgo: "{hours}h ago",
      daysAgo: "{days}d ago",
      recipeCollection: "Recipe Collection",
      familySharing: "Family Sharing",
      whatsappShare: "Share on WhatsApp",
      aiAssistant: "AI Assistant",
      readOnlyMode: "Read Only Mode",
      readOnlyMessage: "You are viewing data in read-only mode. Only the administrator can modify data.",
      actionNotAllowed: "Action not allowed: read-only mode",
      guestMode: "Guest Mode",
      guestModeMessage: "You are connected in guest mode with read-only access.",
    },
  }

  const tDashboard = (key) => {
    const lang = t("language.fr") === "Français" ? "fr" : "en"
    const keys = key.split(".")
    let value = dashboardTranslations[lang]

    for (const k of keys) {
      value = value?.[k]
      if (value === undefined) break
    }

    return value !== undefined ? value : key
  }

  const fetchUserData = async () => {
    console.log("Début de fetchUserData")

    // Vérifier d'abord les données d'invité dans localStorage
    const guestData = localStorage.getItem("guestUserData")
    const connectionType = localStorage.getItem("connectionType")

    console.log("Données invité trouvées:", !!guestData)
    console.log("Type de connexion:", connectionType)

    if (guestData && connectionType === "family_code") {
      try {
        const guestUserData = JSON.parse(guestData)
        console.log("Configuration du mode invité avec les données:", guestUserData)

        setCurrentUserProfile(guestUserData)
        setIsAdmin(false)
        setIsReadOnly(true)
        setIsGuestMode(true)
        setFamilyCode(guestUserData.familyCode || "")

        setEmailStatus(tDashboard("guestModeMessage"))

        const adminUserId = await getDataSourceUserId()
        console.log("ID Admin récupéré:", adminUserId)

        if (adminUserId) {
          setupDataListeners(adminUserId)
        } else {
          setError("Impossible de récupérer l'ID de l'administrateur. Veuillez vous reconnecter.")
          setLoading(false)
        }
        return
      } catch (err) {
        console.error("Erreur lors du parsing des données invité:", err)
        // Nettoyer les données corrompues
        localStorage.removeItem("guestUserData")
        localStorage.removeItem("connectionType")
      }
    }

    // Vérifier l'authentification Firebase
    if (!auth.currentUser) {
      console.log("Aucun utilisateur Firebase authentifié, redirection vers login")
      navigate("/login")
      return
    }

    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid)
      const userDocSnap = await getDoc(userDocRef)

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data()
        console.log("Données utilisateur récupérées:", userData)

        setCurrentUserProfile({ id: userDocSnap.id, ...userData })

        // Déterminer les permissions basées sur le type de connexion et le rôle
        const userIsAdmin = userData.role === "admin"
        let userIsReadOnly = false
        let userIsGuest = false

        // Logique corrigée pour déterminer les permissions
        if (connectionType === "authenticated_with_family_code") {
          // Utilisateur authentifié qui a sélectionné un profil existant = lecture seule
          userIsReadOnly = true
          userIsGuest = false
        } else if (connectionType === "normal" || !connectionType) {
          // Connexion normale (inscription/connexion sans code famille) = accès complet
          userIsReadOnly = false
          userIsGuest = false
          // Marquer comme admin si c\'est le créateur de la famille
          if (!userData.familyCode) {
            // Pas de code famille = créateur = admin
            setIsAdmin(true)
            userIsReadOnly = false
          }
        } else {
          // Autres cas = lecture seule par sécurité
          userIsReadOnly = true
          userIsGuest = false
        }

        setIsAdmin(userIsAdmin)
        setIsReadOnly(userIsReadOnly)
        setIsGuestMode(userIsGuest)
        setFamilyCode(userData.familyCode || "")

        if (userIsReadOnly) {
          setEmailStatus(tDashboard("readOnlyMessage"))
        }

        let dataSourceUserId = auth.currentUser.uid

        if (!userIsAdmin && userData.familyCode) {
          try {
            const familyDoc = await getDoc(doc(db, "families", userData.familyCode))
            if (familyDoc.exists()) {
              const familyData = familyDoc.data()
              dataSourceUserId = familyData.createdBy
            }
          } catch (err) {
            console.error("Erreur lors de la récupération des données de famille:", err)
          }
        }

        setupDataListeners(dataSourceUserId)
      } else {
        setError("Profil utilisateur non trouvé")
        setLoading(false)
      }
    } catch (err) {
      console.error("Erreur lors du chargement du tableau de bord : ", err)
      setError("Erreur lors du chargement du tableau de bord")
      setLoading(false)
    }
  }

  const setupDataListeners = (dataSourceUserId) => {
    console.log("Configuration des listeners avec l'ID:", dataSourceUserId)

    if (!dataSourceUserId) {
      setError("Impossible de déterminer la source des données")
      setLoading(false)
      return
    }

    const familyMembersCollectionRef = collection(db, "users", dataSourceUserId, "familyMembers")
    const unsubscribeMembers = onSnapshot(
      familyMembersCollectionRef,
      (snapshot) => {
        const membersList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setFamilyMembers(membersList)
        console.log("Membres chargés:", membersList.length)
      },
      (err) => {
        console.error("Erreur de lecture des membres : ", err)
        setError("Erreur lors du chargement des membres")
      },
    )

    const sharedRecipesCollectionRef = collection(db, "sharedRecipes")
    const unsubscribeSharedRecipes = onSnapshot(
      sharedRecipesCollectionRef,
      (snapshot) => {
        const sharedList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setSharedRecipes(sharedList)
      },
      (err) => {
        console.error("Erreur lors de la lecture des recettes partagées : ", err)
        setError("Erreur lors du chargement des recettes partagées")
      },
    )

    const dishesCollectionRef = collection(db, "users", dataSourceUserId, "dishes")
    const unsubscribeDishes = onSnapshot(
      dishesCollectionRef,
      (snapshot) => {
        const dishesList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setDishes(dishesList)
        console.log("Plats chargés:", dishesList.length)
      },
      (err) => {
        console.error("Erreur de lecture des plats : ", err)
        setError("Erreur lors du chargement des plats")
      },
    )

    const combinedDishesCollectionRef = collection(db, "users", dataSourceUserId, "combinedDishes")
    const unsubscribeCombinedDishes = onSnapshot(
      combinedDishesCollectionRef,
      (snapshot) => {
        const combinedDishesList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setCombinedDishes(combinedDishesList)
      },
      (err) => {
        console.error("Erreur de lecture des plats combinés : ", err)
        setError("Erreur lors du chargement des plats combinés")
      },
    )

    const ingredientsCollectionRef = collection(db, "users", dataSourceUserId, "ingredients")
    const unsubscribeIngredients = onSnapshot(
      ingredientsCollectionRef,
      (snapshot) => {
        const ingredientsList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setIngredients(ingredientsList)
        setTimeout(() => checkExpiringIngredients(), 100)
      },
      (err) => {
        console.error("Erreur de lecture des ingrédients : ", err)
        setError("Erreur lors du chargement des ingrédients")
      },
    )

    const mealPlanDocRef = doc(db, "users", dataSourceUserId, "mealPlans", weekId)
    const unsubscribeMealPlan = onSnapshot(
      mealPlanDocRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data()
          setMealPlan({
            monday: data.monday || "",
            tuesday: data.tuesday || "",
            wednesday: data.wednesday || "",
            thursday: data.thursday || "",
            friday: data.friday || "",
            saturday: data.saturday || "",
            sunday: data.sunday || "",
          })
          setIsMealPlanConfirmed(data.isConfirmed || false)
        } else {
          setMealPlan({
            monday: "",
            tuesday: "",
            wednesday: "",
            thursday: "",
            friday: "",
            saturday: "",
            sunday: "",
          })
          setIsMealPlanConfirmed(false)
        }
      },
      (err) => {
        console.error("Erreur de lecture du plan de repas : ", err)
        setError("Erreur lors du chargement du plan de repas")
      },
    )

    const shoppingListDocRef = doc(db, "users", dataSourceUserId, "shoppingLists", weekId)
    const unsubscribeShoppingList = onSnapshot(
      shoppingListDocRef,
      (doc) => {
        if (doc.exists()) {
          setShoppingList(doc.data().items || [])
        } else {
          setShoppingList([])
        }
        setLoading(false)
        console.log("Dashboard chargé avec succès")
      },
      (err) => {
        console.error("Erreur de lecture de la liste de courses : ", err)
        setError("Erreur lors du chargement de la liste de courses")
        setLoading(false)
      },
    )

    const recipesCollectionRef = collection(db, "recipes")
    const unsubscribeRecipes = onSnapshot(
      recipesCollectionRef,
      (snapshot) => {
        const recipesList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setDbRecipes(recipesList)
      },
      (err) => {
        console.error("Erreur de lecture des recettes : ", err)
        setError("Erreur lors du chargement des recettes")
      },
    )

    const publicDishesCollectionRef = collection(db, "publicDishes")
    const unsubscribePublicDishes = onSnapshot(
      publicDishesCollectionRef,
      (snapshot) => {
        const publicDishesList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setPublicDishes(publicDishesList)
      },
      (err) => {
        console.error("Erreur de lecture des plats publics : ", err)
        setError("Erreur lors du chargement des plats publics.")
      },
    )

    return () => {
      unsubscribeMembers()
      unsubscribeDishes()
      unsubscribeCombinedDishes()
      unsubscribeIngredients()
      unsubscribeMealPlan()
      unsubscribeShoppingList()
      unsubscribeRecipes()
      unsubscribeSharedRecipes()
      unsubscribePublicDishes()
    }
  }

  useEffect(() => {
    console.log("useEffect déclenché")
    fetchUserData()
  }, [navigate, t])

  const formatRelativeTime = (timestamp) => {
    const now = new Date()
    const diff = now - new Date(timestamp)
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return tDashboard("now")
    if (minutes < 60) return tDashboard("minutesAgo").replace("{minutes}", minutes)
    if (hours < 24) return tDashboard("hoursAgo").replace("{hours}", hours)
    return tDashboard("daysAgo").replace("{days}", days)
  }

  const requestNotificationPermission = async () => {
    const granted = await notificationService.requestPermission();
    if (granted) {
      setPushNotificationsEnabled(true);
      setEmailStatus(tDashboard("notificationPermissionGranted"));
      return true;
    } else {
      setEmailStatus(tDashboard("notificationPermissionDenied"));
      return false;
    }
  }

  const sendPushNotification = (title, body, icon = "🍽️") => {
    if (!pushNotificationsEnabled) {
      return;
    }

    notificationService.sendLocalNotification(title, {
      body,
      icon: "/logo192.png",
      badge: "/logo192.png",
      tag: "ingredient-expiration",
      requireInteraction: true,
      actions: [
        {
          action: "view",
          title: "Voir les ingrédients",
        },
        {
          action: "dismiss",
          title: "Ignorer",
        },
      ],
      onClick: () => {
        setActiveTab("ingredients");
      }
    });
  }

  const togglePushNotifications = async () => {
    if (!pushNotificationsEnabled) {
      const granted = await requestNotificationPermission()
      if (granted) {
        sendPushNotification(
          tDashboard("notificationTitle"),
          "Notifications activées ! Vous recevrez des alertes pour les ingrédients qui expirent.",
        )

        const testNotification = {
          id: "test-notification-" + Date.now(),
          message: tDashboard("testNotificationMessage"),
          daysLeft: null,
          ingredientName: "Test",
          expirationDate: new Date().toLocaleDateString("fr-FR"),
          isUsedInDishes: false,
          isTest: true,
          timestamp: new Date(),
          priority: "info",
        }
        setNotifications((prev) => [testNotification, ...prev])
      }
    } else {
      setPushNotificationsEnabled(false)
      setEmailStatus("Notifications désactivées")
      setNotifications((prev) => prev.filter((notif) => !notif.isTest))
    }
  }

  const checkExpiringIngredients = () => {
    const thresholdDays = 3
    const today = new Date()
    const thresholdDate = new Date(today)
    thresholdDate.setDate(today.getDate() + thresholdDays)

    if (ingredients.length === 0) {
      const testNotification = {
        id: "no-ingredients-" + Date.now(),
        message:
          "ℹ️ Aucun ingrédient dans votre inventaire. Ajoutez des ingrédients pour recevoir des alertes d'expiration.",
        daysLeft: null,
        ingredientName: "Information",
        expirationDate: new Date().toLocaleDateString("fr-FR"),
        isUsedInDishes: false,
        isInfo: true,
        timestamp: new Date(),
        priority: "info",
      }
      setNotifications([testNotification])
      return
    }

    const expiring = ingredients.filter((ing) => {
      if (!ing.expirationDate) {
        return false
      }
      let expDate
      if (ing.expirationDate._seconds) {
        expDate = new Date(ing.expirationDate._seconds * 1000)
      } else if (typeof ing.expirationDate === "string") {
        expDate = new Date(ing.expirationDate)
      } else if (ing.expirationDate instanceof Date) {
        expDate = ing.expirationDate
      } else {
        return false
      }

      return expDate <= thresholdDate && expDate >= today && !isNaN(expDate.getTime())
    })

    if (expiring.length === 0 && ingredients.length > 0) {
      const infoNotification = {
        id: "all-good-" + Date.now(),
        message: "✅ Tous vos ingrédients sont encore frais ! Aucune expiration dans les 3 prochains jours.",
        daysLeft: null,
        ingredientName: "Information",
        expirationDate: new Date().toLocaleDateString("fr-FR"),
        isUsedInDishes: false,
        isInfo: true,
        timestamp: new Date(),
        priority: "success",
      }
      setNotifications([infoNotification])
      return
    }

    const newNotifications = expiring.map((ing) => {
      let formattedDate = ""
      if (ing.expirationDate._seconds) {
        formattedDate = new Date(ing.expirationDate._seconds * 1000).toLocaleDateString("fr-FR")
      } else if (typeof ing.expirationDate === "string") {
        formattedDate = new Date(ing.expirationDate).toLocaleDateString("fr-FR")
      } else if (ing.expirationDate instanceof Date) {
        formattedDate = ing.expirationDate.toLocaleDateString("fr-FR")
      } else {
        formattedDate = ing.expirationDate.toString()
      }

      const expDate = ing.expirationDate._seconds
        ? new Date(ing.expirationDate._seconds * 1000)
        : new Date(ing.expirationDate)
      const daysLeft = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24))

      const usedInDishes = [...dishes, ...combinedDishes, ...dbRecipes].some((item) =>
        item.ingredients?.some((i) => i.name === ing.name),
      )

      let message = ""
      let pushMessage = ""
      let priority = "medium"

      if (daysLeft === 0) {
        priority = "high"
        message = usedInDishes
          ? `⚠️ ${ing.name} expire aujourd'hui (${formattedDate}). Utilisez-le rapidement dans vos plats !`
          : `⚠️ ${ing.name} expire aujourd'hui (${formattedDate}). Aucun plat n'utilise cet ingrédient.`
        pushMessage = `${ing.name} ${tDashboard("ingredientExpiringToday")} ${usedInDishes ? tDashboard("useInDishes") : tDashboard("noRecipeUsingIngredient")}`
      } else if (daysLeft === 1) {
        priority = "high"
        message = usedInDishes
          ? `⚠️ ${ing.name} expire demain (${formattedDate}). Utilisez-le dans vos plats !`
          : `⚠️ ${ing.name} expire demain (${formattedDate}). Aucun plat n'utilise cet ingrédient.`
        pushMessage = `${ing.name} ${tDashboard("ingredientExpiringTomorrow")} ${usedInDishes ? tDashboard("useInDishes") : tDashboard("noRecipeUsingIngredient")}`
      } else {
        priority = "medium"
        message = usedInDishes
          ? `⚠️ ${ing.name} expire dans ${daysLeft} jours (${formattedDate}). Utilisez-le dans vos plats !`
          : `⚠️ ${ing.name} expire dans ${daysLeft} jours (${formattedDate}). Aucun plat n'utilise cet ingrédient.`
        pushMessage = `${ing.name} ${tDashboard("ingredientExpiringIn")} ${daysLeft} ${tDashboard("days")} ${usedInDishes ? tDashboard("useInDishes") : tDashboard("noRecipeUsingIngredient")}`
      }

      if (pushNotificationsEnabled && daysLeft <= 1) {
        sendPushNotification(tDashboard("notificationTitle"), pushMessage)
      }

      return {
        id: ing.id,
        message: message,
        daysLeft: daysLeft,
        ingredientName: ing.name,
        expirationDate: formattedDate,
        isUsedInDishes: usedInDishes,
        timestamp: new Date(),
        priority: priority,
      }
    })

    setNotifications(newNotifications)

    if (pushNotificationsEnabled && newNotifications.length > 1) {
      const criticalCount = newNotifications.filter((n) => n.daysLeft <= 1).length
      if (criticalCount > 1) {
        sendPushNotification(
          tDashboard("notificationTitle"),
          `⚠️ ${criticalCount} ingrédients expirent bientôt ! Vérifiez votre inventaire.`,
        )
      }
    }
  }

  const handleShareDish = async (dish) => {
    if (isReadOnly) {
      setError(tDashboard("actionNotAllowed"))
      return
    }

    setLoading(true)
    setError("")
    try {
      const currentUserId = getCurrentUserId()
      if (!currentUserId) {
        throw new Error("Aucun utilisateur authentifié.")
      }

      const publicDishesCollectionRef = collection(db, "publicDishes")
      await addDoc(publicDishesCollectionRef, {
        ...dish,
        authorId: currentUserId,
        authorName: currentUserProfile.fullName || "Utilisateur anonyme",
        authorEmail: currentUserProfile.email || "email@example.com",
        sharedAt: new Date(),
        isPublic: true,
        likes: [],
        comments: [],
      })

      const dishDocRef = doc(db, "users", currentUserId, "dishes", dish.id)
      await updateDoc(dishDocRef, {
        isPublic: true,
      })

      setEmailStatus(tDashboard("shareSuccess"))
    } catch (err) {
      console.error("Erreur lors du partage : ", err)
      setError(`${tDashboard("shareError")} ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleImportDish = async (publicDish) => {
    if (isReadOnly) {
      setError(tDashboard("actionNotAllowed"))
      return
    }

    setLoading(true)
    setError("")
    try {
      const currentUserId = getCurrentUserId()
      if (!currentUserId) {
        throw new Error("Aucun utilisateur authentifié.")
      }

      const dishesCollectionRef = collection(db, "users", currentUserId, "dishes")
      await addDoc(dishesCollectionRef, {
        name: publicDish.name,
        type: publicDish.type,
        ingredients: publicDish.ingredients,
        instructions: publicDish.instructions,
        prepTime: publicDish.prepTime,
        dietaryRestrictions: publicDish.dietaryRestrictions,
        image: publicDish.image,
        aliases: publicDish.aliases || [],
        ownerId: currentUserId,
        createdAt: new Date().toISOString(),
        isPublic: false,
        importedFrom: {
          originalAuthor: publicDish.authorName,
          originalAuthorId: publicDish.authorId,
          importedAt: new Date().toISOString(),
        },
      })

      setEmailStatus(tDashboard("importSuccess"))
    } catch (err) {
      console.error("Erreur lors de l'importation : ", err)
      setError(`${tDashboard("importError")} ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleImportSharedRecipe = async (sharedRecipe) => {
    if (isReadOnly) {
      setError(tDashboard("actionNotAllowed"))
      return
    }

    setLoading(true)
    setError("")
    try {
      const currentUserId = getCurrentUserId()
      if (!currentUserId) {
        throw new Error("Aucun utilisateur authentifié")
      }
      const collectionName = sharedRecipe.source === "dish" ? "dishes" : "recipes"
      const collectionRef = collection(db, "users", currentUserId, collectionName)
      await addDoc(collectionRef, {
        ...sharedRecipe,
        ownerId: currentUserId,
        createdAt: new Date().toISOString(),
        isPublic: false,
      })
      setEmailStatus(tDashboard("importSuccess"))
    } catch (err) {
      console.error("Erreur lors de l'importation : ", err)
      setError(`${tDashboard("importError")} ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const markNotificationAsRead = (notificationId) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId))
  }

  const markAllNotificationsAsRead = () => {
    setNotifications([])
    setShowNotificationPanel(false)
  }

  const goToIngredient = (ingredientName) => {
    setActiveTab("ingredients")
    setSearchQuery(ingredientName)
    setShowNotificationPanel(false)
  }

  const forceCheckNotifications = () => {
    checkExpiringIngredients()
  }

  const shareOnWhatsApp = () => {
    const mealPlanDetails = Object.entries(mealPlan).reduce((acc, [day, itemId]) => {
      if (itemId) {
        const item =
          dishes.find((d) => d.id === itemId) ||
          combinedDishes.find((d) => d.id === itemId) ||
          dbRecipes.find((r) => r.id === itemId)
        acc[day] = item ? item.name : "Aucun plat"
      } else {
        acc[day] = "Aucun plat"
      }
      return acc
    }, {})

    setShowWhatsAppShare(true)
  }

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission)
      setPushNotificationsEnabled(Notification.permission === "granted")
    }
  }, [])

  const handleAddMember = async (memberData) => {
    if (isReadOnly) {
      setError(tDashboard("actionNotAllowed"))
      return
    }

    setLoading(true)
    setError("")
    try {
      const currentUserId = getCurrentUserId()
      if (!currentUserId) {
        throw new Error("Aucun utilisateur authentifié")
      }
      const familyMembersCollectionRef = collection(db, "users", currentUserId, "familyMembers")
      await addDoc(familyMembersCollectionRef, {
        ...memberData,
        ownerId: currentUserId,
        createdAt: new Date(),
      })
      setShowMemberForm(false)
    } catch (err) {
      console.error("Erreur lors de l'ajout du membre : ", err)
      setError(`Erreur lors de l'ajout du membre : ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleEditMember = (member) => {
    if (isReadOnly) {
      setError(tDashboard("actionNotAllowed"))
      return
    }

    setEditingMember(member)
    setShowMemberForm(true)
    setActiveTab("members")
  }

  const handleSaveEditedMember = async (updatedMemberData) => {
    if (isReadOnly) {
      setError(tDashboard("actionNotAllowed"))
      return
    }

    setLoading(true)
    setError("")
    try {
      const currentUserId = getCurrentUserId()
      if (!currentUserId) {
        throw new Error("Aucun utilisateur authentifié")
      }

      const cleanedData = {}
      const fields = [
        "fullName",
        "age",
        "gender",
        "email",
        "medicalConditions",
        "otherMedicalCondition",
        "role",
        "otherRole",
        "profilePic",
      ]
      fields.forEach((field) => {
        if (updatedMemberData[field] !== undefined && updatedMemberData[field] !== null) {
          cleanedData[field] = updatedMemberData[field]
        }
      })

      if (updatedMemberData.id === currentUserId) {
        const userDocRef = doc(db, "users", currentUserId)
        await updateDoc(userDocRef, cleanedData)
        setCurrentUserProfile({ ...currentUserProfile, ...cleanedData })
      } else {
        const memberDocRef = doc(db, "users", currentUserId, "familyMembers", updatedMemberData.id)
        await updateDoc(memberDocRef, cleanedData)
      }
      setEditingMember(null)
      setShowMemberForm(false)
    } catch (err) {
      console.error("Erreur lors de la sauvegarde du membre : ", err)
      setError(`Erreur lors de la sauvegarde du membre : ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMember = async (memberId) => {
    if (isReadOnly) {
      setError(tDashboard("actionNotAllowed"))
      return
    }

    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce membre ?")) {
      return
    }
    setLoading(true)
    setError("")
    try {
      const currentUserId = getCurrentUserId()
      if (!currentUserId) {
        throw new Error("Aucun utilisateur authentifié")
      }
      if (memberId !== currentUserId) {
        const memberDocRef = doc(db, "users", currentUserId, "familyMembers", memberId)
        await deleteDoc(memberDocRef)
      } else {
        setError("Impossible de supprimer votre propre profil")
      }
    } catch (err) {
      console.error("Erreur lors de la suppression du membre : ", err)
      setError(`Erreur lors de la suppression du membre : ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDish = async (dishData, isCombined = false) => {
    if (isReadOnly) {
      setError(tDashboard("actionNotAllowed"))
      return
    }

    setLoading(true)
    setError("")
    try {
      const currentUserId = getCurrentUserId()
      if (!currentUserId) {
        throw new Error("Aucun utilisateur authentifié")
      }
      const collectionName = isCombined ? "combinedDishes" : "dishes"
      const dishesCollectionRef = collection(db, "users", currentUserId, collectionName)
      await addDoc(dishesCollectionRef, {
        ...dishData,
        ownerId: currentUserId,
        createdAt: new Date().toISOString(),
        aliases: dishData.aliases || [],
        isCombined: isCombined,
      })
      setShowDishForm(false)
      setIsCombining(false)
    } catch (err) {
      console.error("Erreur lors de l'ajout du plat : ", err)
      setError(`Erreur lors de l'ajout du plat : ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleEditDish = (dish) => {
    if (isReadOnly) {
      setError(tDashboard("actionNotAllowed"))
      return
    }

    setEditingDish(dish)
    setShowDishForm(true)
    setActiveTab("dishes")
  }

  const handleSaveEditedDish = async (updatedDishData, isCombined = false) => {
    if (isReadOnly) {
      setError(tDashboard("actionNotAllowed"))
      return
    }

    setLoading(true)
    setError("")
    try {
      const currentUserId = getCurrentUserId()
      if (!currentUserId) {
        throw new Error("Aucun utilisateur authentifié")
      }
      const collectionName = isCombined ? "combinedDishes" : "dishes"
      const dishDocRef = doc(db, "users", currentUserId, collectionName, updatedDishData.id)
      const cleanedData = {
        name: updatedDishData.name,
        type: updatedDishData.type,
        ingredients: updatedDishData.ingredients,
        instructions: updatedDishData.instructions || "",
        prepTime: updatedDishData.prepTime || 0,
        dietaryRestrictions: updatedDishData.dietaryRestrictions || [],
        image: updatedDishData.image || "",
        aliases: updatedDishData.aliases || [],
        isCombined: isCombined,
        combinedFrom: updatedDishData.combinedFrom || [],
      }
      await updateDoc(dishDocRef, cleanedData)
      setEditingDish(null)
      setShowDishForm(false)
      setIsCombining(false)
    } catch (err) {
      console.error("Erreur lors de la sauvegarde du plat : ", err)
      setError(`Erreur lors de la sauvegarde du plat : ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDish = async (dishId, isCombined = false) => {
    if (isReadOnly) {
      setError(tDashboard("actionNotAllowed"))
      return
    }

    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce plat ?")) {
      return
    }
    setLoading(true)
    setError("")
    try {
      const currentUserId = getCurrentUserId()
      if (!currentUserId) {
        throw new Error("Aucun utilisateur authentifié")
      }
      const collectionName = isCombined ? "combinedDishes" : "dishes"
      const dishDocRef = doc(db, "users", currentUserId, collectionName, dishId)
      await deleteDoc(dishDocRef)
    } catch (err) {
      console.error("Erreur lors de la suppression du plat : ", err)
      setError(`Erreur lors de la suppression du plat : ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAddIngredient = async (ingredientData) => {
    if (isReadOnly) {
      setError(tDashboard("actionNotAllowed"))
      return
    }

    setLoading(true)
    setError("")
    try {
      const currentUserId = getCurrentUserId()
      if (!currentUserId) {
        throw new Error("Aucun utilisateur authentifié")
      }
      const ingredientsCollectionRef = collection(db, "users", currentUserId, "ingredients")
      await addDoc(ingredientsCollectionRef, {
        ...ingredientData,
        price: Number.parseFloat(ingredientData.price) || 0,
      })
      setShowIngredientForm(false)
    } catch (err) {
      console.error("Erreur lors de l'ajout de l'ingrédient : ", err)
      setError(`Erreur lors de l'ajout de l'ingrédient : ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleEditIngredient = (ingredient) => {
    if (isReadOnly) {
      setError(tDashboard("actionNotAllowed"))
      return
    }

    setEditingIngredient(ingredient)
    setShowIngredientForm(true)
    setActiveTab("ingredients")
  }

  const handleSaveEditedIngredient = async (updatedIngredientData) => {
    if (isReadOnly) {
      setError(tDashboard("actionNotAllowed"))
      return
    }

    setLoading(true)
    setError("")
    try {
      const currentUserId = getCurrentUserId()
      if (!currentUserId) {
        throw new Error("Aucun utilisateur authentifié")
      }
      const ingredientDocRef = doc(db, "users", currentUserId, "ingredients", updatedIngredientData.id)
      const cleanedData = {
        name: updatedIngredientData.name,
        quantity: updatedIngredientData.quantity || 0,
        unit: updatedIngredientData.unit,
        price: Number.parseFloat(updatedIngredientData.price) || 0,
        category: updatedIngredientData.category || "Autres",
        expirationDate: updatedIngredientData.expirationDate || "",
        notes: updatedIngredientData.notes || "",
      }
      await updateDoc(ingredientDocRef, cleanedData)
      setEditingIngredient(null)
      setShowIngredientForm(false)
    } catch (err) {
      console.error("Erreur lors de la sauvegarde de l'ingrédient : ", err)
      setError(`Erreur lors de la sauvegarde de l'ingrédient : ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteIngredient = async (ingredientId) => {
    if (isReadOnly) {
      setError(tDashboard("actionNotAllowed"))
      return
    }

    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet ingrédient ?")) {
      return
    }
    setLoading(true)
    setError("")
    try {
      const currentUserId = getCurrentUserId()
      if (!currentUserId) {
        throw new Error("Aucun utilisateur authentifié")
      }
      const ingredientDocRef = doc(db, "users", currentUserId, "ingredients", ingredientId)
      await deleteDoc(ingredientDocRef)
    } catch (err) {
      console.error("Erreur lors de la suppression de l'ingrédient : ", err)
      setError(`Erreur lors de la suppression de l'ingrédient : ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleMealPlanChange = async (day, itemId) => {
    if (isReadOnly) {
      setError(tDashboard("actionNotAllowed"))
      return
    }

    const updatedMealPlan = { ...mealPlan, [day]: itemId }
    setMealPlan(updatedMealPlan)
    try {
      const currentUserId = getCurrentUserId()
      const mealPlanDocRef = doc(db, "users", currentUserId, "mealPlans", weekId)
      await setDoc(mealPlanDocRef, updatedMealPlan, { merge: true })
      await updateShoppingList()
    } catch (err) {
      console.error("Erreur lors de la sauvegarde du plan de repas : ", err)
      setError("Erreur lors de la sauvegarde du plan de repas")
    }
  }

  const generateMealPlan = async () => {
    if (isReadOnly) {
      setError(tDashboard("actionNotAllowed"))
      return
    }

    const availableDishes = selectedMember ? filteredDishes : [...dishes, ...combinedDishes]
    if (availableDishes.length === 0) {
      setError("Aucun plat disponible pour générer un plan")
      return
    }

    const newMealPlan = {
      monday: "",
      tuesday: "",
      wednesday: "",
      thursday: "",
      friday: "",
      saturday: "",
      sunday: "",
    }

    const days = Object.keys(newMealPlan)
    for (const day of days) {
      const randomDish = availableDishes[Math.floor(Math.random() * availableDishes.length)]
      newMealPlan[day] = randomDish ? randomDish.id : ""
    }

    setMealPlan(newMealPlan)
    setIsMealPlanConfirmed(false)
    try {
      const currentUserId = getCurrentUserId()
      const mealPlanDocRef = doc(db, "users", currentUserId, "mealPlans", weekId)
      await setDoc(mealPlanDocRef, { ...newMealPlan, isConfirmed: false }, { merge: true })
      await updateShoppingList()
    } catch (err) {
      console.error("Erreur lors de la génération du plan de repas : ", err)
      setError("Erreur lors de la génération du plan de repas")
    }
  }

  const generateMealPlanFromRecipes = async () => {
    if (isReadOnly) {
      setError(tDashboard("actionNotAllowed"))
      return
    }

    if (dbRecipes.length === 0) {
      setError("Aucune recette disponible")
      return
    }

    const newMealPlan = {
      monday: "",
      tuesday: "",
      wednesday: "",
      thursday: "",
      friday: "",
      saturday: "",
      sunday: "",
    }

    const days = Object.keys(newMealPlan)
    for (const day of days) {
      const randomRecipe = dbRecipes[Math.floor(Math.random() * dbRecipes.length)]
      newMealPlan[day] = randomRecipe ? randomRecipe.id : ""
    }

    setMealPlan(newMealPlan)
    setIsMealPlanConfirmed(false)
    try {
      const currentUserId = getCurrentUserId()
      const mealPlanDocRef = doc(db, "users", currentUserId, "mealPlans", weekId)
      await setDoc(mealPlanDocRef, { ...newMealPlan, isConfirmed: false }, { merge: true })
      await updateShoppingList()
    } catch (err) {
      console.error("Erreur lors de la génération du plan de repas : ", err)
      setError("Erreur lors de la génération du plan de repas")
    }
  }

  const handleConfirmMealPlan = async () => {
    if (isReadOnly) {
      setError(tDashboard("actionNotAllowed"))
      return
    }

    if (!window.confirm("Êtes-vous sûr de vouloir confirmer ce plan de repas ?")) {
      return
    }
    setLoading(true)
    setError("")
    try {
      const currentUserId = getCurrentUserId()
      if (!currentUserId) {
        throw new Error("Aucun utilisateur authentifié")
      }
      const selectedItems = Object.values(mealPlan)
        .filter((itemId) => itemId)
        .map(
          (itemId) =>
            [...dishes, ...combinedDishes].find((dish) => dish.id === itemId) ||
            dbRecipes.find((recipe) => recipe.id === itemId),
        )
        .filter((item) => item)

      for (const item of selectedItems) {
        if (item.ingredients) {
          for (const ing of item.ingredients) {
            const inventoryItem = ingredients.find((i) => i.name === ing.name && i.unit === ing.unit)
            if (inventoryItem) {
              const newQuantity = inventoryItem.quantity - (Number.parseFloat(ing.quantity) || 0)
              const ingredientDocRef = doc(db, "users", currentUserId, "ingredients", inventoryItem.id)
              await updateDoc(ingredientDocRef, { quantity: newQuantity >= 0 ? newQuantity : 0 })
            }
          }
        }
      }

      const mealPlanDocRef = doc(db, "users", currentUserId, "mealPlans", weekId)
      await updateDoc(mealPlanDocRef, { isConfirmed: true })
      setIsMealPlanConfirmed(true)
      await updateShoppingList()
    } catch (err) {
      console.error("Erreur lors de la confirmation du plan de repas : ", err)
      setError(`Erreur lors de la confirmation du plan de repas : ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const updateShoppingList = async () => {
    const selectedItems = Object.values(mealPlan)
      .filter((itemId) => itemId)
      .map(
        (itemId) =>
          [...dishes, ...combinedDishes].find((dish) => dish.id === itemId) ||
          dbRecipes.find((recipe) => recipe.id === itemId),
      )
      .filter((item) => item && item.ingredients)

    const ingredientMap = selectedItems.reduce((acc, item) => {
      item.ingredients.forEach((ing) => {
        const key = `${ing.name}-${ing.unit}`
        const requiredQuantity = Number.parseFloat(ing.quantity) || 0
        if (!acc[key]) {
          acc[key] = {
            name: ing.name,
            unit: ing.unit,
            quantity: requiredQuantity,
          }
        } else {
          acc[key].quantity += requiredQuantity
        }
      })
      return acc
    }, {})

    const newShoppingList = []
    for (const [key, ing] of Object.entries(ingredientMap)) {
      const inventoryItem = ingredients.find((i) => i.name === ing.name && i.unit === ing.unit)
      const availableQuantity = inventoryItem ? Number.parseFloat(inventoryItem.quantity) || 0 : 0
      const neededQuantity = ing.quantity - availableQuantity

      if (neededQuantity > 0) {
        newShoppingList.push({
          name: ing.name,
          quantity: Number.parseFloat(neededQuantity.toFixed(2)),
          unit: ing.unit,
          price: inventoryItem ? Number.parseFloat(inventoryItem.price) || 500 : 500,
          purchased: false,
        })
      }
    }

    setShoppingList(newShoppingList)

    try {
      const currentUserId = getCurrentUserId()
      const shoppingListDocRef = doc(db, "users", currentUserId, "shoppingLists", weekId)
      await setDoc(shoppingListDocRef, { items: newShoppingList }, { merge: true })
    } catch (err) {
      console.error("Erreur lors de la sauvegarde de la liste de courses : ", err)
      setError("Erreur lors de la sauvegarde de la liste de courses")
    }
  }

  const handlePriceChange = async (ingredientKey, newPrice) => {
    if (isReadOnly) {
      setError(tDashboard("actionNotAllowed"))
      return
    }

    const [name, unit] = ingredientKey.split("-")
    const inventoryItem = ingredients.find((i) => i.name === name && i.unit === unit)
    const currentUserId = getCurrentUserId()

    if (inventoryItem) {
      const ingredientDocRef = doc(db, "users", currentUserId, "ingredients", inventoryItem.id)
      await updateDoc(ingredientDocRef, { price: Number.parseFloat(newPrice) || 0 })
    } else {
      const ingredientsCollectionRef = collection(db, "users", currentUserId, "ingredients")
      await addDoc(ingredientsCollectionRef, {
        name,
        unit,
        quantity: 0,
        price: Number.parseFloat(newPrice) || 0,
        category: "Autres",
        expirationDate: "",
        notes: "",
      })
    }
    await updateShoppingList()
  }

  const handlePurchaseToggle = async (ingredientKey) => {
    if (isReadOnly) {
      setError(tDashboard("actionNotAllowed"))
      return
    }

    const updatedShoppingList = shoppingList.map((item) => {
      if (`${item.name}-${item.unit}` === ingredientKey) {
        return { ...item, purchased: !item.purchased }
      }
      return item
    })
    setShoppingList(updatedShoppingList)

    try {
      const currentUserId = getCurrentUserId()
      const [name, unit] = ingredientKey.split("-")
      const purchasedItem = shoppingList.find((item) => `${item.name}-${item.unit}` === ingredientKey)
      if (purchasedItem) {
        const inventoryItem = ingredients.find((i) => i.name === name && i.unit === unit)
        if (inventoryItem) {
          const newQuantity = purchasedItem.purchased
            ? inventoryItem.quantity - (purchasedItem.quantity || 0)
            : inventoryItem.quantity + (purchasedItem.quantity || 0)
          const ingredientDocRef = doc(db, "users", currentUserId, "ingredients", inventoryItem.id)
          await updateDoc(ingredientDocRef, { quantity: newQuantity >= 0 ? newQuantity : 0 })
        } else if (!purchasedItem.purchased) {
          const ingredientsCollectionRef = collection(db, "users", currentUserId, "ingredients")
          await addDoc(ingredientsCollectionRef, {
            name,
            unit,
            quantity: purchasedItem.quantity,
            price: purchasedItem.price,
            category: "Autres",
            expirationDate: "",
            notes: "",
          })
        }
      }
      const shoppingListDocRef = doc(db, "users", currentUserId, "shoppingLists", weekId)
      await setDoc(shoppingListDocRef, { items: updatedShoppingList }, { merge: true })
    } catch (err) {
      console.error("Erreur lors de la mise à jour de l'état d'achat : ", err)
      setError("Erreur lors de la mise à jour de l'état d'achat")
    }
  }

  const handleCheckAll = async () => {
    if (isReadOnly) {
      setError(tDashboard("actionNotAllowed"))
      return
    }

    const updatedShoppingList = shoppingList.map((item) => ({ ...item, purchased: true }))
    setShoppingList(updatedShoppingList)
    try {
      const currentUserId = getCurrentUserId()
      for (const item of updatedShoppingList) {
        if (!item.purchased) {
          const inventoryItem = ingredients.find((i) => i.name === item.name && i.unit === item.unit)
          if (inventoryItem) {
            const newQuantity = inventoryItem.quantity + (item.quantity || 0)
            const ingredientDocRef = doc(db, "users", currentUserId, "ingredients", inventoryItem.id)
            await updateDoc(ingredientDocRef, { quantity: newQuantity })
          } else {
            const ingredientsCollectionRef = collection(db, "users", currentUserId, "ingredients")
            await addDoc(ingredientsCollectionRef, {
              name: item.name,
              unit: item.unit,
              quantity: item.quantity,
              price: item.price,
              category: "Autres",
              expirationDate: "",
              notes: "",
            })
          }
        }
      }
      const shoppingListDocRef = doc(db, "users", currentUserId, "shoppingLists", weekId)
      await setDoc(shoppingListDocRef, { items: updatedShoppingList }, { merge: true })
    } catch (err) {
      console.error("Erreur lors de la mise à jour de l'état d'achat : ", err)
      setError("Erreur lors de la mise à jour de l'état d'achat")
    }
  }

  const handleUncheckAll = async () => {
    if (isReadOnly) {
      setError(tDashboard("actionNotAllowed"))
      return
    }

    const updatedShoppingList = shoppingList.map((item) => ({ ...item, purchased: false }))
    setShoppingList(updatedShoppingList)
    try {
      const currentUserId = getCurrentUserId()
      for (const item of shoppingList) {
        if (item.purchased) {
          const inventoryItem = ingredients.find((i) => i.name === item.name && i.unit === item.unit)
          if (inventoryItem) {
            const newQuantity = inventoryItem.quantity - (item.quantity || 0)
            const ingredientDocRef = doc(db, "users", currentUserId, "ingredients", inventoryItem.id)
            await updateDoc(ingredientDocRef, { quantity: newQuantity >= 0 ? newQuantity : 0 })
          }
        }
      }
      const shoppingListDocRef = doc(db, "users", currentUserId, "shoppingLists", weekId)
      await setDoc(shoppingListDocRef, { items: updatedShoppingList }, { merge: true })
    } catch (err) {
      console.error("Erreur lors de la mise à jour de l'état d'achat : ", err)
      setError("Erreur lors de la mise à jour de l'état d'achat")
    }
  }

  const handleViewDetails = (itemId) => {
    const dish = dishes.find((d) => d.id === itemId) || combinedDishes.find((d) => d.id === itemId)
    const recipe = dbRecipes.find((r) => r.id === itemId)
    setSelectedItem(dish || recipe || null)
    setShowDetailsModal(true)
  }

  const exportToText = () => {
    let textContent = `Liste de courses (Semaine ${weekId})\n\n`
    const filteredShoppingList = shoppingList.filter((item) => !item.purchased)
    filteredShoppingList.forEach((item, index) => {
      textContent += `${index + 1}. ${item.name} - ${item.quantity} ${item.unit} - ${item.price} FCFA/unit${
        item.purchased ? " (acheté)" : ""
      }\n`
    })
    textContent += `\nTotal estimé: ${filteredShoppingList
      .reduce((sum, item) => sum + item.price * item.quantity, 0)
      .toFixed(2)} FCFA`

    const blob = new Blob([textContent], { type: "text/plain" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `shopping_list_${weekId}.txt`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const exportToPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const pageWidth = 210
      const margin = 15
      const colWidths = [80, 30, 30, 30, 20]
      let y = margin

      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text("Liste de courses", margin, y)
      y += 10
      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      doc.text(`Week ${weekId}`, margin, y)
      y += 10

      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      const headers = [
        tDashboard("item"),
        "Quantité",
        "Unité",
        tDashboard("price") + " (FCFA)",
        tDashboard("purchased"),
      ]
      headers.forEach((header, i) => {
        doc.text(header, margin + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y)
      })
      y += 2
      doc.line(margin, y, pageWidth - margin, y)
      y += 5

      doc.setFont("helvetica", "normal")
      const filteredShoppingList = shoppingList.filter((item) => !item.purchased)
      filteredShoppingList.forEach((item) => {
        const itemNameLines = doc.splitTextToSize(item.name, colWidths[0] - 5)
        const row = [
          itemNameLines[0] || "",
          item.quantity.toString(),
          item.unit,
          item.price.toFixed(2),
          item.purchased ? "✓" : "",
        ]
        row.forEach((cell, i) => {
          doc.text(cell, margin + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y)
        })
        for (let i = 1; i < itemNameLines.length; i++) {
          y += 6
          doc.text(itemNameLines[i], margin, y)
        }
        y += 6
        if (y > 270) {
          doc.addPage()
          y = margin
        }
      })

      y += 5
      doc.line(margin, y, pageWidth - margin, y)
      y += 5
      doc.setFont("helvetica", "bold")
      const total = filteredShoppingList.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)
      doc.text(`Total estimé: ${total} FCFA`, margin, y)

      doc.save(`shopping_list_${weekId}.pdf`)
    } catch (err) {
      console.error("Erreur lors de l'exportation en PDF : ", err)
      alert(tDashboard("error.jsPDFNotLoaded"))
    }
  }

  const sendMealPlanEmails = async () => {
    setLoading(true)
    setEmailStatus("")
    try {
      const members = [
        ...(currentUserProfile && currentUserProfile.email
          ? [
              {
                id: currentUserProfile.id,
                fullName: currentUserProfile.fullName,
                email: currentUserProfile.email,
                age: currentUserProfile.age,
              },
            ]
          : []),
        ...familyMembers.filter((m) => m.email),
      ]

      if (members.length === 0) {
        setEmailStatus("Aucun email valide trouvé")
        setLoading(false)
        return
      }

      const mealPlanDetails = Object.entries(mealPlan).reduce((acc, [day, itemId]) => {
        if (itemId) {
          const item =
            dishes.find((d) => d.id === itemId) ||
            combinedDishes.find((d) => d.id === itemId) ||
            dbRecipes.find((r) => r.id === itemId)
          acc[day] = item ? item.name : "Aucun plat"
        } else {
          acc[day] = "Aucun plat"
        }
        return acc
      }, {})

      const currentUserId = getCurrentUserId()
      const response = await fetch("http://localhost:3001/send-meal-plan-emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: currentUserId,
          members,
          mealPlan: mealPlanDetails,
        }),
      })

      const result = await response.json()
      if (response.ok) {
        setEmailStatus("Emails envoyés avec succès")
        
        // Envoyer une notification de succès
        if (pushNotificationsEnabled) {
          const recipientCount = members.length;
          const notificationTitle = "✉️ Envoi des menus réussi";
          const notificationBody = `Le plan de repas a été envoyé avec succès à ${recipientCount} membre${recipientCount > 1 ? 's' : ''} de la famille.`;
          
          notificationService.sendLocalNotification(notificationTitle, {
            body: notificationBody,
            tag: "meal-plan-email",
            data: {
              type: "meal-plan-email",
              weekId: weekId,
              recipientCount: recipientCount
            },
            onClick: () => {
              setActiveTab("members");
            }
          });
        }
      } else {
        const errorMessage = `Erreur lors de l'envoi des emails: ${result.error || "Erreur inconnue"}`;
        setEmailStatus(errorMessage)
        
        // Envoyer une notification d'erreur
        if (pushNotificationsEnabled) {
          notificationService.sendLocalNotification("❌ Échec de l'envoi des menus", {
            body: errorMessage,
            tag: "meal-plan-email-error",
            requireInteraction: true
          });
        }
      }
    } catch (err) {
      const errorMessage = `Erreur lors de l'envoi des emails: ${err.message}`;
      console.error(errorMessage, err)
      setEmailStatus(errorMessage)
      
      // Envoyer une notification d'erreur
      if (pushNotificationsEnabled) {
        notificationService.sendLocalNotification("❌ Échec de l'envoi des menus", {
          body: errorMessage,
          tag: "meal-plan-email-error",
          requireInteraction: true
        });
      }
    } finally {
      setLoading(false)
    }
  }

  const proposeRecipes = async () => {
    setIsLoadingRecipes(true)
    setError("")
    try {
      const response = await fetch("http://localhost:3001/propose-recipes")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setRecipes(data.recipes)
    } catch (err) {
      console.error("Erreur lors de la récupération des recettes:", err)
      setError(`Erreur lors de la récupération des recettes: ${err.message}`)
    } finally {
      setIsLoadingRecipes(false)
    }
  }

  const openRecipePdf = () => {
    window.open("http://localhost:3001/get-recipe-pdf", "_blank")
  }

  const showRecipeDetailsModal = (recipeId) => {
    const recipe = dbRecipes.find((r) => r.id === recipeId)
    if (recipe) {
      setSelectedRecipe(recipe)
      setShowRecipeDetails(true)
    }
  }

  const getAllIngredients = () => {
    const allIngredients = [...dishes, ...combinedDishes].reduce((acc, dish) => {
      dish.ingredients?.forEach((ing) => {
        const key = `${ing.name}-${ing.unit}`
        if (!acc[key]) {
          acc[key] = {
            name: ing.name,
            quantity: Number.parseFloat(ing.quantity) || 0,
            unit: ing.unit,
          }
        } else {
          acc[key].quantity += Number.parseFloat(ing.quantity) || 0
        }
      })
      return acc
    }, {})
    return Object.values(allIngredients)
  }

  const filteredDishes = [...dishes, ...combinedDishes].filter((dish) => {
    if (!dish || !dish.name) return false

    const searchLower = searchQuery.toLowerCase()
    const nameMatch = dish.name.toLowerCase().includes(searchLower)
    const aliasMatch = dish.aliases?.some((alias) => alias && alias.toLowerCase().includes(searchLower)) || false

    return (
      (!selectedMember ||
        !dish.dietaryRestrictions ||
        !familyMembers
          .find((member) => member.id === selectedMember)
          ?.medicalConditions?.some((condition) => dish.dietaryRestrictions.includes(condition))) &&
      (!searchQuery || nameMatch || aliasMatch)
    )
  })

  const filteredDbRecipes = selectedMember
    ? dbRecipes.filter((recipe) => {
        const member =
          selectedMember === currentUserProfile?.id
            ? currentUserProfile
            : familyMembers.find((m) => m.id === selectedMember)
        if (!member) return true
        const memberRestrictions = [
          ...(member.medicalConditions || []),
          ...(member.otherMedicalCondition ? [member.otherMedicalCondition] : []),
        ].filter(Boolean)
        return memberRestrictions.every(
          (restriction) =>
            recipe.dietaryRestrictions?.includes(restriction) ||
            (restriction === "Végétarien" && recipe.dietaryRestrictions?.includes("Végétalien")) ||
            restriction === "Aucun",
        )
      })
    : dbRecipes

  const filteredMembers = familyMembers.filter(
    (member) => member && member.fullName && member.fullName.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredIngredients = ingredients.filter(
    (ingredient) => ingredient && ingredient.name && ingredient.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredShoppingList = shoppingList.filter(
    (item) => item && item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredRecipes = recipes.filter(
    (recipe) => recipe && recipe.name && recipe.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (loading) {
    return (
      <div
        className="container-fluid vh-100 d-flex justify-content-center align-items-center"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <div className="text-center text-white">
          <div className="spinner-border text-white mb-3" role="status" style={{ width: "3rem", height: "3rem" }}>
            <span className="visually-hidden">Chargement...</span>
          </div>
          <h4 className="fw-bold">Chargement du tableau de bord...</h4>
          <p className="opacity-75">Chargement de vos données...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger text-center shadow-lg border-0" style={{ borderRadius: "15px" }}>
          <i className="fas fa-exclamation-triangle me-2 fa-2x"></i>
          <h5 className="mt-2">{error}</h5>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-vh-100"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <div className="container py-4">
        {showNotificationPanel && (
          <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-start justify-content-end p-3"
            style={{ zIndex: 1050, backgroundColor: "rgba(0,0,0,0.3)" }}
          >
            <div
              className="bg-white shadow-lg"
              style={{
                width: "400px",
                maxHeight: "80vh",
                marginTop: "60px",
                borderRadius: "20px",
                overflow: "hidden",
              }}
            >
              <div
                className="d-flex align-items-center justify-content-between p-3 text-white"
                style={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                }}
              >
                <h5 className="mb-0 fw-bold">
                  <i className="fas fa-bell me-2"></i>
                  {tDashboard("notifications")}
                </h5>
                <button
                  className="btn btn-sm text-white"
                  onClick={() => setShowNotificationPanel(false)}
                  style={{
                    background: "rgba(255, 255, 255, 0.2)",
                    border: "none",
                    borderRadius: "50%",
                    width: "30px",
                    height: "30px",
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="p-3" style={{ maxHeight: "60vh", overflowY: "auto" }}>
                {notifications.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="fas fa-bell-slash fa-3x text-muted mb-3"></i>
                    <h6 className="text-muted">{tDashboard("noNotifications")}</h6>
                    <p className="text-muted">{tDashboard("noNotificationsMessage")}</p>
                  </div>
                ) : (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <small className="text-muted">
                        {notifications.length} notification{notifications.length > 1 ? "s" : ""}
                      </small>
                      <button className="btn btn-sm btn-outline-primary" onClick={markAllNotificationsAsRead}>
                        <i className="fas fa-check-double me-1"></i>
                        {tDashboard("markAllAsRead")}
                      </button>
                    </div>

                    <div className="d-flex flex-column gap-2">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-3 border-start border-4 ${
                            notif.priority === "high"
                              ? "bg-danger bg-opacity-10 border-danger"
                              : notif.priority === "medium"
                                ? "bg-warning bg-opacity-10 border-warning"
                                : notif.priority === "success"
                                  ? "bg-success bg-opacity-10 border-success"
                                  : "bg-info bg-opacity-10 border-info"
                          }`}
                          style={{ borderRadius: "10px" }}
                        >
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div className="flex-grow-1">
                              <p className="mb-1 fw-medium small">{notif.message}</p>
                              <small className="text-muted">
                                <i className="fas fa-clock me-1"></i>
                                {formatRelativeTime(notif.timestamp)}
                              </small>
                            </div>
                            <div className="d-flex gap-1">
                              {notif.isUsedInDishes && (
                                <span className="badge bg-success">
                                  <i className="fas fa-utensils"></i>
                                </span>
                              )}
                              {notif.daysLeft !== null && (
                                <span
                                  className={`badge ${
                                    notif.daysLeft === 0
                                      ? "bg-danger"
                                      : notif.daysLeft === 1
                                        ? "bg-warning text-dark"
                                        : "bg-secondary"
                                  }`}
                                >
                                  {notif.daysLeft === 0
                                    ? "Aujourd'hui"
                                    : notif.daysLeft === 1
                                      ? "Demain"
                                      : `${notif.daysLeft}j`}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="d-flex gap-2">
                            {notif.ingredientName && !notif.isTest && !notif.isInfo && (
                              <button
                                className="btn btn-sm btn-outline-primary"
                                style={{ borderRadius: "15px" }}
                                onClick={() => goToIngredient(notif.ingredientName)}
                              >
                                <i className="fas fa-eye me-1"></i>
                                {tDashboard("viewIngredient")}
                              </button>
                            )}
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              style={{ borderRadius: "15px" }}
                              onClick={() => markNotificationAsRead(notif.id)}
                            >
                              <i className="fas fa-times me-1"></i>
                              {tDashboard("dismiss")}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="p-3 border-top bg-light">
                <button
                  className="btn btn-sm btn-outline-primary w-100"
                  onClick={forceCheckNotifications}
                  style={{ borderRadius: "15px" }}
                >
                  <i className="fas fa-sync-alt me-2"></i>
                  {tDashboard("refreshNotifications")}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <h1 className="display-5 fw-bold text-white mb-0">
              <i className="fas fa-tachometer-alt me-3"></i>
              Tableau de Bord Familial
              {isGuestMode && (
                <span className="badge bg-info text-dark ms-3">
                  <i className="fas fa-user-friends me-1"></i>
                  {tDashboard("guestMode")}
                </span>
              )}
              {isReadOnly && !isGuestMode && (
                <span className="badge bg-warning text-dark ms-3">
                  <i className="fas fa-eye me-1"></i>
                  {tDashboard("readOnlyMode")}
                </span>
              )}
            </h1>
            <div className="d-flex gap-2 align-items-center flex-wrap">
              <div className="position-relative">
                <button
                  className={`btn ${notifications.length > 0 ? "btn-warning" : "btn-outline-light"} position-relative shadow-sm`}
                  onClick={() => setShowNotificationPanel(!showNotificationPanel)}
                  title={tDashboard("notifications")}
                  style={{ borderRadius: "15px" }}
                >
                  <i className={`fas fa-bell ${notifications.length > 0 ? "fa-shake" : ""}`}></i>
                  {notifications.length > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                      {notifications.length > 99 ? "99+" : notifications.length}
                      <span className="visually-hidden">notifications non lues</span>
                    </span>
                  )}
                </button>
              </div>

              <button
                className="btn btn-success shadow-sm"
                onClick={shareOnWhatsApp}
                title={tDashboard("whatsappShare")}
                style={{ borderRadius: "15px" }}
              >
                <i className="fab fa-whatsapp me-2"></i>
                {tDashboard("whatsappShare")}
              </button>

              <button
                className={`btn ${pushNotificationsEnabled ? "btn-success" : "btn-outline-warning"} btn-sm shadow-sm`}
                onClick={togglePushNotifications}
                title={
                  pushNotificationsEnabled ? tDashboard("disableNotifications") : tDashboard("enableNotifications")
                }
                style={{ borderRadius: "15px" }}
              >
                <i className={`fas ${pushNotificationsEnabled ? "fa-bell" : "fa-bell-slash"} me-2`}></i>
                {pushNotificationsEnabled ? tDashboard("disableNotifications") : tDashboard("enableNotifications")}
              </button>

              {!isReadOnly && (
                <>
                  <button
                    className="btn btn-success shadow-sm"
                    onClick={() => {
                      setEditingMember(null)
                      setShowMemberForm(true)
                      setActiveTab("members")
                    }}
                    style={{ borderRadius: "15px" }}
                  >
                    <i className="fas fa-user-plus me-2"></i>
                    Ajouter Membre
                  </button>
                  <button
                    className="btn btn-warning shadow-sm"
                    onClick={() => {
                      setEditingIngredient(null)
                      setShowIngredientForm(true)
                      setActiveTab("ingredients")
                    }}
                    style={{ borderRadius: "15px" }}
                  >
                    <i className="fas fa-plus me-2"></i>
                    Ajouter Ingrédient
                  </button>
                  <button
                    className="btn btn-primary shadow-sm"
                    onClick={() => {
                      setEditingDish(null)
                      setShowDishForm(true)
                      setActiveTab("dishes")
                    }}
                    style={{ borderRadius: "15px" }}
                  >
                    <i className="fas fa-plus me-2"></i>
                    Ajouter Plat
                  </button>
                </>
              )}
            </div>
          </div>

          {(isReadOnly || isGuestMode) && (
            <div className="alert alert-info mt-3" style={{ borderRadius: "15px" }}>
              <i className="fas fa-info-circle me-2"></i>
              {isGuestMode ? tDashboard("guestModeMessage") : tDashboard("readOnlyMessage")}
            </div>
          )}
        </div>

        <div className="row">
          <div className="col-12">
            <div className="mb-4">
              <input
                type="text"
                className="form-control shadow-sm border-0"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  borderRadius: "15px",
                  padding: "12px 20px",
                  fontSize: "16px",
                  background: "rgba(255, 255, 255, 0.9)",
                  backdropFilter: "blur(10px)",
                }}
              />
            </div>

            <ul
              className="nav nav-pills mb-4 p-3 shadow-lg"
              style={{
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(10px)",
                borderRadius: "20px",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "members" ? "active" : ""}`}
                  onClick={() => setActiveTab("members")}
                  style={{ borderRadius: "15px" }}
                >
                  <i className="fas fa-users me-2"></i>
                  Membres
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "dishes" ? "active" : ""}`}
                  onClick={() => setActiveTab("dishes")}
                  style={{ borderRadius: "15px" }}
                >
                  <i className="fas fa-utensils me-2"></i>
                  Plats
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "ingredients" ? "active" : ""}`}
                  onClick={() => setActiveTab("ingredients")}
                  style={{ borderRadius: "15px" }}
                >
                  <i className="fas fa-carrot me-2"></i>
                  Ingrédients
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "planning" ? "active" : ""}`}
                  onClick={() => setActiveTab("planning")}
                  style={{ borderRadius: "15px" }}
                >
                  <i className="fas fa-calendar me-2"></i>
                  Planning
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "shopping" ? "active" : ""}`}
                  onClick={() => setActiveTab("shopping")}
                  style={{ borderRadius: "15px" }}
                >
                  <i className="fas fa-shopping-cart me-2"></i>
                  Liste de Courses
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "recipes" ? "active" : ""}`}
                  onClick={() => setActiveTab("recipes")}
                  style={{ borderRadius: "15px" }}
                >
                  <i className="fas fa-book-open me-2"></i>
                  Recettes
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "sharedRecipes" ? "active" : ""}`}
                  onClick={() => setActiveTab("sharedRecipes")}
                  style={{ borderRadius: "15px" }}
                >
                  <i className="fas fa-share-alt me-2"></i>
                  {tDashboard("sharedRecipes")}
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "recipeCollection" ? "active" : ""}`}
                  onClick={() => setActiveTab("recipeCollection")}
                  style={{ borderRadius: "15px" }}
                >
                  <i className="fas fa-book me-2"></i>
                  {tDashboard("recipeCollection")}
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "familySharing" ? "active" : ""}`}
                  onClick={() => setActiveTab("familySharing")}
                  style={{ borderRadius: "15px" }}
                >
                  <i className="fas fa-users me-2"></i>
                  {tDashboard("familySharing")}
                </button>
              </li>
              {!isReadOnly && (
                <li className="nav-item">
                  <button
                    className="btn btn-info btn-sm"
                    onClick={() => {
                      setEditingDish(null)
                      setShowDishForm(true)
                      setActiveTab("dishes")
                      setIsCombining(true)
                    }}
                    style={{ borderRadius: "15px" }}
                  >
                    <i className="fas fa-link me-2"></i>
                    {tDashboard("combineDishes")}
                  </button>
                </li>
              )}
            </ul>

            <div className="tab-content">
              {activeTab === "members" && (
                <div>
                  {showMemberForm && !isReadOnly ? (
                    <FamilyMemberForm
                      member={editingMember}
                      onSave={editingMember ? handleSaveEditedMember : handleAddMember}
                      onCancel={() => {
                        setShowMemberForm(false)
                        setEditingMember(null)
                      }}
                      onDelete={
                        editingMember && editingMember.id !== getCurrentUserId() ? handleDeleteMember : undefined
                      }
                      isNew={!editingMember}
                    />
                  ) : (
                    <div className="row">
                      {currentUserProfile && (
                        <div className="col-lg-6 col-xl-4 mb-4">
                          <div
                            className="card h-100 shadow-lg border-0"
                            style={{
                              borderRadius: "20px",
                              background: "rgba(255, 255, 255, 0.95)",
                              backdropFilter: "blur(10px)",
                            }}
                          >
                            <div className="card-body p-4">
                              <div className="d-flex align-items-start mb-3">
                                <div className="me-3">
                                  <img
                                    src={currentUserProfile.profilePic || "/placeholder.svg?height=100&width=100"}
                                    alt={currentUserProfile.fullName}
                                    className="rounded-circle"
                                    style={{ width: "60px", height: "60px", objectFit: "cover" }}
                                  />
                                </div>
                                <div className="flex-grow-1">
                                  <h5 className="card-title d-flex align-items-center mb-2">
                                    {currentUserProfile.fullName}
                                    <span
                                      className="badge ms-2"
                                      style={{
                                        background:
                                          currentUserProfile.role === "admin"
                                            ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                                            : isGuestMode
                                              ? "linear-gradient(135deg, #17a2b8 0%, #138496 100%)"
                                              : "linear-gradient(135deg, #28a745 0%, #20c997 100%)",
                                        color: "white",
                                        borderRadius: "10px",
                                      }}
                                    >
                                      <i className="fas fa-user me-1"></i>
                                      {isGuestMode
                                        ? "Invité"
                                        : currentUserProfile.role === "admin"
                                          ? "Admin"
                                          : "Membre"}
                                    </span>
                                  </h5>
                                  <div className="mb-2">
                                    <small className="text-muted">
                                      <i className="fas fa-birthday-cake me-1"></i>
                                      {currentUserProfile.age} ans • {currentUserProfile.gender}
                                    </small>
                                  </div>
                                  {currentUserProfile.email && !isGuestMode && (
                                    <div className="mb-2">
                                      <small className="text-muted">
                                        <i className="fas fa-envelope me-1"></i>
                                        {currentUserProfile.email}
                                      </small>
                                    </div>
                                  )}
                                  <div className="mb-3">
                                    <small className="text-muted">
                                      <i className="fas fa-heartbeat me-1"></i>
                                      {currentUserProfile.medicalConditions?.join(", ") || "Aucune restriction"}
                                    </small>
                                  </div>
                                </div>
                              </div>
                              {!isReadOnly && !isGuestMode && (
                                <div className="d-flex gap-2">
                                  <button
                                    className="btn btn-warning btn-sm flex-fill"
                                    onClick={() => handleEditMember({ ...currentUserProfile, id: getCurrentUserId() })}
                                    style={{ borderRadius: "15px" }}
                                  >
                                    <i className="fas fa-edit me-1"></i>
                                    Modifier
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {filteredMembers.map((member) => (
                        <div key={member.id} className="col-lg-6 col-xl-4 mb-4">
                          <div
                            className="card h-100 shadow-lg border-0"
                            style={{
                              borderRadius: "20px",
                              background: "rgba(255, 255, 255, 0.95)",
                              backdropFilter: "blur(10px)",
                            }}
                          >
                            <div className="card-body p-4">
                              <div className="d-flex align-items-start mb-3">
                                <div className="me-3">
                                  <img
                                    src={member.profilePic || "/placeholder.svg?height=100&width=100"}
                                    alt={member.fullName}
                                    className="rounded-circle"
                                    style={{ width: "60px", height: "60px", objectFit: "cover" }}
                                  />
                                </div>
                                <div className="flex-grow-1">
                                  <h5 className="card-title mb-2">{member.fullName}</h5>
                                  <div className="mb-2">
                                    <small className="text-muted">
                                      <i className="fas fa-birthday-cake me-1"></i>
                                      {member.age} ans • {member.gender}
                                    </small>
                                  </div>
                                  {member.email && (
                                    <div className="mb-2">
                                      <small className="text-muted">
                                        <i className="fas fa-envelope me-1"></i>
                                        {member.email}
                                      </small>
                                    </div>
                                  )}
                                  <div className="mb-2">
                                    <small className="text-muted">
                                      <i className="fas fa-users me-1"></i>
                                      {member.role?.join(", ") || "Aucun rôle"}
                                    </small>
                                  </div>
                                  <div className="mb-3">
                                    <small className="text-muted">
                                      <i className="fas fa-heartbeat me-1"></i>
                                      {member.medicalConditions?.join(", ") || "Aucune restriction"}
                                    </small>
                                  </div>
                                </div>
                              </div>
                              {!isReadOnly && (
                                <div className="d-flex gap-2">
                                  <button
                                    className="btn btn-warning btn-sm flex-fill"
                                    onClick={() => handleEditMember(member)}
                                    style={{ borderRadius: "15px" }}
                                  >
                                    <i className="fas fa-edit me-1"></i>
                                    Modifier
                                  </button>
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDeleteMember(member.id)}
                                    style={{ borderRadius: "15px" }}
                                  >
                                    <i className="fas fa-trash"></i>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "familySharing" && <FamilyProfileSharing />}

              {activeTab === "dishes" && (
                <div>
                  {showDishForm && !isReadOnly ? (
                    <DishForm
                      dish={editingDish}
                      onSave={editingDish ? handleSaveEditedDish : handleAddDish}
                      onCancel={() => {
                        setShowDishForm(false)
                        setEditingDish(null)
                        setIsCombining(false)
                      }}
                      onDelete={
                        editingDish ? () => handleDeleteDish(editingDish.id, editingDish.isCombined) : undefined
                      }
                      isNew={!editingDish}
                      isCombining={isCombining}
                      availableDishes={[...dishes, ...combinedDishes]}
                    />
                  ) : (
                    <div>
                      <div className="mb-4">
                        <label className="form-label text-white fw-bold">
                          <i className="fas fa-filter me-1"></i>
                          Filtrer par membre:
                        </label>
                        <select
                          className="form-select shadow-sm border-0"
                          value={selectedMember}
                          onChange={(e) => setSelectedMember(e.target.value)}
                          style={{
                            borderRadius: "15px",
                            background: "rgba(255, 255, 255, 0.9)",
                          }}
                        >
                          <option value="">Tous les membres</option>
                          {currentUserProfile && (
                            <option value={currentUserProfile.id}>{currentUserProfile.fullName} (Vous)</option>
                          )}
                          {familyMembers.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.fullName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="row">
                        {filteredDishes.map((dish) => (
                          <div key={dish.id} className="col-lg-6 col-md-12 mb-4">
                            <div
                              className="card h-100 shadow-lg border-0"
                              style={{
                                borderRadius: "20px",
                                background: "rgba(255, 255, 255, 0.95)",
                                backdropFilter: "blur(10px)",
                              }}
                            >
                              <div className="card-body p-4">
                                <div className="d-flex align-items-start mb-3">
                                  {dish.image && (
                                    <div className="me-3">
                                      <img
                                        src={dish.image || "/placeholder.svg"}
                                        alt={dish.name}
                                        className="rounded"
                                        style={{
                                          width: "80px",
                                          height: "80px",
                                          objectFit: "cover",
                                          borderRadius: "15px",
                                        }}
                                      />
                                    </div>
                                  )}
                                  <div className="flex-grow-1">
                                    <h5 className="card-title mb-2">
                                      {dish.name}
                                      {dish.isCombined && (
                                        <span className="badge bg-info ms-2" style={{ borderRadius: "10px" }}>
                                          <i className="fas fa-link me-1"></i>
                                          Combiné
                                        </span>
                                      )}
                                    </h5>
                                    <div className="mb-2">
                                      <span className="badge bg-info me-2" style={{ borderRadius: "10px" }}>
                                        <i className="fas fa-utensils me-1"></i>
                                        {dish.type}
                                      </span>
                                      <span className="badge bg-secondary" style={{ borderRadius: "10px" }}>
                                        <i className="fas fa-clock me-1"></i>
                                        {dish.prepTime} min
                                      </span>
                                    </div>
                                    {dish.importedFrom && (
                                      <div className="mb-2">
                                        <small className="text-muted">
                                          <i className="fas fa-download me-1"></i>
                                          Importé de: {dish.importedFrom.originalAuthor}
                                        </small>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="mb-3">
                                  <h6 className="text-muted mb-2">
                                    <i className="fas fa-list me-1"></i>
                                    Ingrédients:
                                  </h6>
                                  <div className="small">
                                    {dish.ingredients?.slice(0, 3).map((ing, index) => (
                                      <div key={index} className="text-muted">
                                        • {ing.name} ({ing.quantity} {ing.unit})
                                      </div>
                                    ))}
                                    {dish.ingredients?.length > 3 && (
                                      <div className="text-muted">... et {dish.ingredients.length - 3} autres</div>
                                    )}
                                  </div>
                                </div>

                                {dish.dietaryRestrictions?.length > 0 && (
                                  <div className="mb-3">
                                    <h6 className="text-muted mb-2">
                                      <i className="fas fa-shield-alt me-1"></i>
                                      Restrictions:
                                    </h6>
                                    <div className="d-flex flex-wrap gap-1">
                                      {dish.dietaryRestrictions.map((restriction, index) => (
                                        <span
                                          key={index}
                                          className="badge bg-warning text-dark"
                                          style={{ borderRadius: "10px" }}
                                        >
                                          {restriction}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {!isReadOnly && (
                                  <div className="d-flex gap-2">
                                    <button
                                      className="btn btn-warning btn-sm flex-fill"
                                      onClick={() => handleEditDish(dish)}
                                      style={{ borderRadius: "15px" }}
                                    >
                                      <i className="fas fa-edit me-1"></i>
                                      Modifier
                                    </button>
                                    <button
                                      className="btn btn-success btn-sm"
                                      onClick={() => handleShareDish(dish)}
                                      disabled={dish.isPublic}
                                      style={{ borderRadius: "15px" }}
                                    >
                                      <i className="fas fa-share-alt me-1"></i>
                                      {dish.isPublic ? "Partagé" : "Partager"}
                                    </button>
                                    <button
                                      className="btn btn-danger btn-sm"
                                      onClick={() => handleDeleteDish(dish.id, dish.isCombined)}
                                      style={{ borderRadius: "15px" }}
                                    >
                                      <i className="fas fa-trash"></i>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "sharedRecipes" && (
                <div
                  className="card shadow-lg border-0"
                  style={{
                    borderRadius: "20px",
                    background: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <div className="card-body p-4">
                    <h4 className="card-title mb-4">
                      <i className="fas fa-share-alt me-2"></i>
                      Recettes Partagées par la Communauté
                    </h4>

                    {publicDishes.length > 0 ? (
                      <div className="row">
                        {publicDishes
                          .filter((dish) => dish.authorId !== getCurrentUserId())
                          .map((dish) => (
                            <div key={dish.id} className="col-lg-6 col-md-12 mb-4">
                              <div
                                className="card h-100 shadow border-0"
                                style={{
                                  borderRadius: "15px",
                                  background: "rgba(255, 255, 255, 0.9)",
                                }}
                              >
                                <div className="card-body p-3">
                                  <div className="d-flex align-items-start mb-3">
                                    {dish.image && (
                                      <div className="me-3">
                                        <img
                                          src={dish.image || "/placeholder.svg"}
                                          alt={dish.name}
                                          className="rounded"
                                          style={{
                                            width: "60px",
                                            height: "60px",
                                            objectFit: "cover",
                                            borderRadius: "10px",
                                          }}
                                        />
                                      </div>
                                    )}
                                    <div className="flex-grow-1">
                                      <h5 className="card-title mb-2">{dish.name}</h5>
                                      <div className="mb-2">
                                        <span className="badge bg-info me-2" style={{ borderRadius: "8px" }}>
                                          <i className="fas fa-utensils me-1"></i>
                                          {dish.type}
                                        </span>
                                        <span className="badge bg-secondary" style={{ borderRadius: "8px" }}>
                                          <i className="fas fa-clock me-1"></i>
                                          {dish.prepTime} min
                                        </span>
                                      </div>
                                      <div className="mb-2">
                                        <small className="text-muted">
                                          <i className="fas fa-user me-1"></i>
                                          Par: {dish.authorName}
                                        </small>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="mb-3">
                                    <h6 className="text-muted mb-2">
                                      <i className="fas fa-list me-1"></i>
                                      Ingrédients:
                                    </h6>
                                    <div className="small">
                                      {dish.ingredients?.slice(0, 3).map((ing, index) => (
                                        <div key={index} className="text-muted">
                                          • {ing.name} ({ing.quantity} {ing.unit})
                                        </div>
                                      ))}
                                      {dish.ingredients?.length > 3 && (
                                        <div className="text-muted">... et {dish.ingredients.length - 3} autres</div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="d-flex gap-2">
                                    {!isReadOnly && (
                                      <button
                                        className="btn btn-primary btn-sm flex-fill"
                                        onClick={() => handleImportDish(dish)}
                                        style={{ borderRadius: "12px" }}
                                      >
                                        <i className="fas fa-download me-1"></i>
                                        Importer
                                      </button>
                                    )}
                                    <button
                                      className="btn btn-info btn-sm"
                                      onClick={() => handleViewDetails(dish.id)}
                                      style={{ borderRadius: "12px" }}
                                    >
                                      <i className="fas fa-eye me-1"></i>
                                      Détails
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-5">
                        <i className="fas fa-share-alt fa-4x text-muted mb-3"></i>
                        <h5 className="text-muted">Aucune recette partagée</h5>
                        <p className="text-muted">Soyez le premier à partager une recette avec la communauté !</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "recipeCollection" && <RecipeCollection />}

              {activeTab === "ingredients" && (
                <div>
                  {showIngredientForm && !isReadOnly ? (
                    <IngredientForm
                      ingredient={editingIngredient}
                      onSave={editingIngredient ? handleSaveEditedIngredient : handleAddIngredient}
                      onCancel={() => {
                        setShowIngredientForm(false)
                        setEditingIngredient(null)
                      }}
                      onDelete={editingIngredient ? handleDeleteIngredient : undefined}
                      isNew={!editingIngredient}
                    />
                  ) : (
                    <div>
                      <h4 className="mb-4 text-white fw-bold">
                        <i className="fas fa-warehouse me-2"></i>
                        Inventaire des Ingrédients
                        {(isReadOnly || isGuestMode) && (
                          <span className="badge bg-info ms-2">
                            <i className="fas fa-eye me-1"></i>
                            Consultation
                          </span>
                        )}
                      </h4>
                      <div className="row">
                        {filteredIngredients.map((ingredient) => (
                          <div key={ingredient.id} className="col-lg-6 col-xl-3 mb-4">
                            <div
                              className="card h-100 shadow-lg border-0"
                              style={{
                                borderRadius: "20px",
                                background: "rgba(255, 255, 255, 0.95)",
                                backdropFilter: "blur(10px)",
                              }}
                            >
                              <div className="card-body p-4">
                                <h5 className="card-title d-flex align-items-center mb-3">
                                  <i className="fas fa-carrot me-2 text-success"></i>
                                  {ingredient.name}
                                </h5>
                                <div className="mb-3">
                                  <div className="d-flex justify-content-between mb-2">
                                    <span>Quantité:</span>
                                    <strong>
                                      {ingredient.quantity} {ingredient.unit}
                                    </strong>
                                  </div>
                                  <div className="d-flex justify-content-between mb-2">
                                    <span>Prix:</span>
                                    <strong>{ingredient.price} FCFA</strong>
                                  </div>
                                  <div className="d-flex justify-content-between mb-2">
                                    <span>Catégorie:</span>
                                    <span className="badge bg-info" style={{ borderRadius: "10px" }}>
                                      {ingredient.category}
                                    </span>
                                  </div>
                                  {ingredient.expirationDate && (
                                    <div className="d-flex justify-content-between">
                                      <span>Expiration:</span>
                                      <span className="text-warning fw-bold">{ingredient.expirationDate}</span>
                                    </div>
                                  )}
                                </div>
                                {!isReadOnly && (
                                  <div className="d-flex gap-2">
                                    <button
                                      className="btn btn-warning btn-sm flex-fill"
                                      onClick={() => handleEditIngredient(ingredient)}
                                      style={{ borderRadius: "15px" }}
                                    >
                                      <i className="fas fa-edit me-1"></i>
                                      Modifier
                                    </button>
                                    <button
                                      className="btn btn-danger btn-sm"
                                      onClick={() => handleDeleteIngredient(ingredient.id)}
                                      style={{ borderRadius: "15px" }}
                                    >
                                      <i className="fas fa-trash"></i>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <h4 className="mt-5 mb-4 text-white fw-bold">
                        <i className="fas fa-list-ul me-2"></i>
                        Ingrédients Requis
                      </h4>
                      <div className="row">
                        {getAllIngredients().map((item, index) => (
                          <div key={index} className="col-lg-6 col-md-12 mb-3">
                            <div
                              className="card shadow border-0"
                              style={{
                                borderRadius: "15px",
                                background: "rgba(255, 255, 255, 0.9)",
                                backdropFilter: "blur(10px)",
                              }}
                            >
                              <div className="card-body p-3">
                                <h6 className="card-title d-flex align-items-center mb-2">
                                  <i className="fas fa-shopping-basket me-2 text-primary"></i>
                                  {item.name}
                                </h6>
                                <p className="card-text d-flex align-items-center mb-0">
                                  Total requis:{" "}
                                  <strong className="ms-auto">
                                    {item.quantity} {item.unit}
                                  </strong>
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "planning" && (
                <div
                  className="card shadow-lg border-0"
                  style={{
                    borderRadius: "20px",
                    background: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <div className="card-body p-4">
                    <h4 className="card-title mb-4">
                      <i className="fas fa-calendar-week me-2"></i>
                      Plan de Repas Hebdomadaire
                      {(isReadOnly || isGuestMode) && (
                        <span className="badge bg-info ms-2">
                          <i className="fas fa-eye me-1"></i>
                          Consultation
                        </span>
                      )}
                    </h4>

                    <div className="mb-4">
                      <label className="form-label">
                        <i className="fas fa-filter me-1"></i>
                        Filtrer par membre:
                      </label>
                      <select
                        className="form-select shadow-sm border-0"
                        value={selectedMember}
                        onChange={(e) => setSelectedMember(e.target.value)}
                        style={{ borderRadius: "15px" }}
                      >
                        <option value="">Tous les membres</option>
                        {currentUserProfile && (
                          <option value={currentUserProfile.id}>{currentUserProfile.fullName} (Vous)</option>
                        )}
                        {familyMembers.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.fullName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="row">
                      {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map(
                        (day, index) => {
                          const dayLabels = {
                            monday: "Lundi",
                            tuesday: "Mardi",
                            wednesday: "Mercredi",
                            thursday: "Jeudi",
                            friday: "Vendredi",
                            saturday: "Samedi",
                            sunday: "Dimanche",
                          }
                          const dayLabel = dayLabels[day]
                          const selectedDish = dishes.find((d) => d.id === mealPlan[day])
                          const selectedRecipe = dbRecipes.find((r) => r.id === mealPlan[day])

                          return (
                            <div key={day} className="col-lg-6 col-md-12 mb-3">
                              <div
                                className="card shadow border-0"
                                style={{
                                  borderRadius: "15px",
                                  background: "rgba(255, 255, 255, 0.9)",
                                }}
                              >
                                <div className="card-body p-3">
                                  <h5 className="fw-bold mb-3">{dayLabel}</h5>
                                  {isReadOnly || isGuestMode ? (
                                    <div className="p-3 bg-light rounded" style={{ borderRadius: "12px" }}>
                                      <strong>
                                        {selectedDish?.name || selectedRecipe?.name || "Aucun plat sélectionné"}
                                      </strong>
                                    </div>
                                  ) : (
                                    <select
                                      className="form-select mb-3 shadow-sm border-0"
                                      value={mealPlan[day] || ""}
                                      onChange={(e) => handleMealPlanChange(day, e.target.value)}
                                      style={{ borderRadius: "12px" }}
                                    >
                                      <option value="">Sélectionner un plat</option>
                                      <optgroup label="Mes Plats">
                                        {filteredDishes.map((dish) => (
                                          <option key={dish.id} value={dish.id}>
                                            {dish.name}
                                          </option>
                                        ))}
                                      </optgroup>
                                      <optgroup label={tDashboard("cameroonianRecipes")}>
                                        {filteredDbRecipes.map((recipe) => (
                                          <option key={recipe.id} value={recipe.id}>
                                            {recipe.name}
                                          </option>
                                        ))}
                                      </optgroup>
                                    </select>
                                  )}
                                  {(selectedDish || selectedRecipe) && (
                                    <button
                                      className="btn btn-info btn-sm w-100"
                                      onClick={() => handleViewDetails(mealPlan[day])}
                                      style={{ borderRadius: "12px" }}
                                    >
                                      <i className="fas fa-eye me-1"></i>
                                      {tDashboard("viewDetails")}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        },
                      )}
                    </div>

                    {!isReadOnly && !isGuestMode && (
                      <div className="mt-4 d-flex flex-wrap gap-2">
                        <button className="btn btn-success" onClick={generateMealPlan} style={{ borderRadius: "15px" }}>
                          <i className="fas fa-magic me-1"></i>
                          Générer un Plan (Mes Plats)
                        </button>
                        <button
                          className="btn btn-warning"
                          onClick={generateMealPlanFromRecipes}
                          style={{ borderRadius: "15px" }}
                        >
                          <i className="fas fa-star me-1"></i>
                          {tDashboard("generatePlanRecipes")}
                        </button>
                        <button
                          className="btn btn-info"
                          onClick={sendMealPlanEmails}
                          disabled={loading}
                          style={{ borderRadius: "15px" }}
                        >
                          <i className="fas fa-envelope me-1"></i>
                          Envoyer à la Famille
                        </button>
                        <button
                          className="btn btn-success"
                          onClick={handleConfirmMealPlan}
                          disabled={isMealPlanConfirmed || !Object.values(mealPlan).some((id) => id)}
                          style={{ borderRadius: "15px" }}
                        >
                          <i className="fas fa-check me-2"></i>
                          {tDashboard("confirmMealPlan")}
                        </button>
                      </div>
                    )}

                    {emailStatus && (
                      <div className="mt-3">
                        <div
                          className={`alert ${emailStatus.includes("succès") ? "alert-success" : "alert-warning"} shadow-sm`}
                          style={{ borderRadius: "15px" }}
                        >
                          {emailStatus}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "shopping" && (
                <div
                  className="card shadow-lg border-0"
                  style={{
                    borderRadius: "20px",
                    background: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <div className="card-body p-4">
                    <h4 className="card-title mb-4">
                      <i className="fas fa-shopping-cart me-2"></i>
                      Liste de Courses
                      {(isReadOnly || isGuestMode) && (
                        <span className="badge bg-info ms-2">
                          <i className="fas fa-eye me-1"></i>
                          Consultation
                        </span>
                      )}
                    </h4>

                    {filteredShoppingList.length === 0 ? (
                      <div className="text-center py-5">
                        <i className="fas fa-shopping-cart fa-4x text-muted mb-3"></i>
                        <h4 className="text-muted">
                          {shoppingList.length === 0 && Object.values(mealPlan).some((id) => id)
                            ? tDashboard("allIngredientsInStock")
                            : "Aucun article dans la liste"}
                        </h4>
                        <p className="text-muted">
                          {shoppingList.length === 0 && Object.values(mealPlan).some((id) => id)
                            ? tDashboard("allIngredientsInStockPrompt")
                            : "Planifiez vos repas pour générer une liste de courses"}
                        </p>
                      </div>
                    ) : (
                      <div>
                        {!isReadOnly && !isGuestMode && (
                          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-success btn-sm"
                                onClick={handleCheckAll}
                                disabled={filteredShoppingList.every((item) => item.purchased)}
                                style={{ borderRadius: "12px" }}
                              >
                                <i className="fas fa-check-double me-2"></i>
                                {tDashboard("checkAll")}
                              </button>
                              <button
                                className="btn btn-warning btn-sm"
                                onClick={handleUncheckAll}
                                disabled={filteredShoppingList.every((item) => !item.purchased)}
                                style={{ borderRadius: "12px" }}
                              >
                                <i className="fas fa-times-circle me-2"></i>
                                {tDashboard("uncheckAll")}
                              </button>
                            </div>
                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={exportToPDF}
                                style={{ borderRadius: "12px" }}
                              >
                                <i className="fas fa-file-pdf me-2"></i>
                                {tDashboard("exportPDF")}
                              </button>
                              <button
                                className="btn btn-info btn-sm"
                                onClick={exportToText}
                                style={{ borderRadius: "12px" }}
                              >
                                <i className="fas fa-file-alt me-2"></i>
                                {tDashboard("exportText")}
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="table-responsive">
                          <table className="table table-hover">
                            <thead className="table-light">
                              <tr>
                                <th>{tDashboard("item")}</th>
                                <th>Quantité</th>
                                <th>Unité</th>
                                <th>Prix (FCFA)</th>
                                <th>{tDashboard("purchased")}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredShoppingList.map((item, index) => {
                                const itemKey = `${item.name}-${item.unit}`
                                return (
                                  <tr
                                    key={index}
                                    className={item.purchased ? "table-success" : ""}
                                    style={{ verticalAlign: "middle" }}
                                  >
                                    <td>{item.name}</td>
                                    <td>{item.quantity}</td>
                                    <td>{item.unit}</td>
                                    <td>
                                      {isReadOnly || isGuestMode ? (
                                        <span>{item.price}</span>
                                      ) : (
                                        <input
                                          type="number"
                                          className="form-control form-control-sm shadow-sm"
                                          style={{ width: "100px", borderRadius: "10px" }}
                                          value={item.price}
                                          onChange={(e) => handlePriceChange(itemKey, e.target.value)}
                                        />
                                      )}
                                    </td>
                                    <td>
                                      <div className="form-check">
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          checked={item.purchased}
                                          disabled={isReadOnly || isGuestMode}
                                          onChange={() => !(isReadOnly || isGuestMode) && handlePurchaseToggle(itemKey)}
                                        />
                                      </div>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>

                        <div
                          className="mt-4 p-4 rounded-4 shadow-sm"
                          style={{
                            background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
                          }}
                        >
                          <h5 className="d-flex align-items-center justify-content-between">
                            <span>
                              <i className="fas fa-calculator me-2"></i>
                              Total estimé:
                            </span>
                            <span className="badge bg-primary fs-5 px-3 py-2" style={{ borderRadius: "10px" }}>
                              {filteredShoppingList
                                .reduce((total, item) => total + item.price * item.quantity, 0)
                                .toFixed(0)}{" "}
                              FCFA
                            </span>
                          </h5>
                          <div className="progress mt-3" style={{ height: "10px", borderRadius: "5px" }}>
                            <div
                              className="progress-bar bg-success"
                              role="progressbar"
                              style={{
                                width: `${
                                  (filteredShoppingList.filter((item) => item.purchased).length /
                                    filteredShoppingList.length) *
                                  100
                                }%`,
                                borderRadius: "5px",
                              }}
                              aria-valuenow={
                                (filteredShoppingList.filter((item) => item.purchased).length /
                                  filteredShoppingList.length) *
                                100
                              }
                              aria-valuemin="0"
                              aria-valuemax="100"
                            ></div>
                          </div>
                          <small className="text-muted d-block text-center mt-2">
                            Articles achetés: {filteredShoppingList.filter((item) => item.purchased).length}/
                            {filteredShoppingList.length}
                          </small>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "recipes" && (
                <div
                  className="card shadow-lg border-0"
                  style={{
                    borderRadius: "20px",
                    background: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <div className="card-body p-4">
                    <h4 className="card-title mb-4">
                      <i className="fas fa-book-open me-2"></i>
                      Recettes Camerounaises
                    </h4>
                    <div className="mb-4">
                      <button
                        className="btn btn-primary me-3"
                        onClick={proposeRecipes}
                        disabled={isLoadingRecipes}
                        style={{ borderRadius: "15px" }}
                      >
                        <i className="fas fa-utensils me-2"></i>
                        {isLoadingRecipes ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Chargement...
                          </>
                        ) : (
                          "Proposer une recette"
                        )}
                      </button>
                      <button className="btn btn-info" onClick={openRecipePdf} style={{ borderRadius: "15px" }}>
                        <i className="fas fa-file-pdf me-2"></i>
                        Lire le document de recettes
                      </button>
                    </div>
                    {recipes.length > 0 ? (
                      <div className="row">
                        {filteredRecipes.map((recipe, index) => (
                          <div key={index} className="col-lg-6 col-md-12 mb-4">
                            <div
                              className="card h-100 shadow border-0"
                              style={{
                                borderRadius: "15px",
                                background: "rgba(255, 255, 255, 0.9)",
                              }}
                            >
                              <div className="card-body p-3">
                                <h5 className="card-title mb-3">{recipe.name}</h5>
                                <div className="mb-3">
                                  <h6 className="text-muted mb-2">
                                    <i className="fas fa-list me-1"></i>
                                    {tDashboard("ingredientsList")}:
                                  </h6>
                                  <ul className="mb-3 ps-3">
                                    {recipe.ingredients.map((ingredient, i) => (
                                      <li key={i} className="text-muted small mb-1">
                                        {ingredient}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <h6 className="text-muted mb-2">
                                    <i className="fas fa-utensils me-1"></i>
                                    {tDashboard("instructions")}:
                                  </h6>
                                  <p className="small text-muted">{recipe.instructions}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-5">
                        <i className="fas fa-book-open fa-4x text-muted mb-3"></i>
                        <h5 className="text-muted">{tDashboard("noRecipes")}</h5>
                        <p className="text-muted">{tDashboard("proposeRecipePrompt")}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {showWhatsAppShare && (
              <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
                <div className="modal-dialog modal-lg">
                  <div className="modal-content border-0 shadow" style={{ borderRadius: "20px", overflow: "hidden" }}>
                    <div
                      className="modal-header text-white"
                      style={{ background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)" }}
                    >
                      <h5 className="modal-title">
                        <i className="fab fa-whatsapp me-2"></i>
                        {tDashboard("whatsappShare")}
                      </h5>
                      <button
                        type="button"
                        className="btn-close btn-close-white"
                        onClick={() => setShowWhatsAppShare(false)}
                      ></button>
                    </div>
                    <div className="modal-body p-4">
                      <div className="mb-4">
                        <h6 className="mb-3">Partagez votre plan de repas via WhatsApp</h6>
                        <div className="d-grid gap-3">
                          {Object.entries(mealPlan).map(([day, itemId]) => {
                            const dayLabels = {
                              monday: "Lundi",
                              tuesday: "Mardi",
                              wednesday: "Mercredi",
                              thursday: "Jeudi",
                              friday: "Vendredi",
                              saturday: "Samedi",
                              sunday: "Dimanche",
                            }
                            const dayLabel = dayLabels[day]
                            const item =
                              dishes.find((d) => d.id === itemId) ||
                              combinedDishes.find((d) => d.id === itemId) ||
                              dbRecipes.find((r) => r.id === itemId)
                            const mealName = item ? item.name : "Aucun plat"

                            return (
                              <div key={day} className="d-flex align-items-center">
                                <div className="fw-bold" style={{ width: "100px" }}>
                                  {dayLabel}:
                                </div>
                                <div className="flex-grow-1 ms-3">{mealName}</div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      <div className="d-grid gap-2">
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(
                            `🍽️ Mon plan de repas pour la semaine ${weekId}:\n\n${Object.entries(mealPlan)
                              .map(([day, itemId]) => {
                                const dayLabels = {
                                  monday: "Lundi",
                                  tuesday: "Mardi",
                                  wednesday: "Mercredi",
                                  thursday: "Jeudi",
                                  friday: "Vendredi",
                                  saturday: "Samedi",
                                  sunday: "Dimanche",
                                }
                                const dayLabel = dayLabels[day]
                                const item =
                                  dishes.find((d) => d.id === itemId) ||
                                  combinedDishes.find((d) => d.id === itemId) ||
                                  dbRecipes.find((r) => r.id === itemId)
                                return `${dayLabel}: ${item ? item.name : "Aucun plat"}`
                              })
                              .join("\n")}`,
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-success btn-lg"
                          style={{ borderRadius: "15px" }}
                        >
                          <i className="fab fa-whatsapp me-2"></i>
                          Partager sur WhatsApp
                        </a>

                        <button
                          className="btn btn-secondary"
                          onClick={() => setShowWhatsAppShare(false)}
                          style={{ borderRadius: "15px" }}
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showRecipeDetails && selectedRecipe && (
              <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
                <div className="modal-dialog modal-lg">
                  <div className="modal-content border-0 shadow" style={{ borderRadius: "20px", overflow: "hidden" }}>
                    <div
                      className="modal-header text-white"
                      style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
                    >
                      <h5 className="modal-title">{selectedRecipe.name}</h5>
                      <button
                        type="button"
                        className="btn-close btn-close-white"
                        onClick={() => setShowRecipeDetails(false)}
                      ></button>
                    </div>
                    <div className="modal-body p-4">
                      <div className="row">
                        <div className="col-md-6 mb-4 mb-md-0">
                          <div className="mb-4">
                            <h6 className="text-muted mb-2">
                              <i className="fas fa-tag me-1"></i>
                              {tDashboard("type")}:
                            </h6>
                            <p>{selectedRecipe.type || "N/A"}</p>
                          </div>
                          <div className="mb-4">
                            <h6 className="text-muted mb-2">
                              <i className="fas fa-clock me-1"></i>
                              {tDashboard("prepTime")}:
                            </h6>
                            <p>{selectedRecipe.prepTime ? `${selectedRecipe.prepTime} min` : "N/A"}</p>
                          </div>
                          {selectedRecipe.dietaryRestrictions?.length > 0 && (
                            <div className="mb-4">
                              <h6 className="text-muted mb-2">
                                <i className="fas fa-shield-alt me-1"></i>
                                {tDashboard("restrictions")}:
                              </h6>
                              <div className="d-flex flex-wrap gap-1">
                                {selectedRecipe.dietaryRestrictions.map((restriction, index) => (
                                  <span
                                    key={index}
                                    className="badge bg-warning text-dark"
                                    style={{ borderRadius: "10px" }}
                                  >
                                    {restriction}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="col-md-6">
                          <div className="mb-4">
                            <h6 className="text-muted mb-2">
                              <i className="fas fa-list me-1"></i>
                              {tDashboard("ingredientsList")}:
                            </h6>
                            {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 ? (
                              <ul className="ps-3">
                                {selectedRecipe.ingredients.map((ing, index) => (
                                  <li key={index} className="mb-1">
                                    {ing.name} ({ing.quantity} {ing.unit})
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-muted">{tDashboard("details.noIngredients")}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <h6 className="text-muted mb-2">
                          <i className="fas fa-utensils me-1"></i>
                          {tDashboard("details.instructions")}:
                        </h6>
                        <p className="mb-0">{selectedRecipe.instructions || "N/A"}</p>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowRecipeDetails(false)}
                        style={{ borderRadius: "15px" }}
                      >
                        {tDashboard("close")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showDetailsModal && (
              <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
                <div className="modal-dialog modal-lg">
                  <div className="modal-content border-0 shadow" style={{ borderRadius: "20px", overflow: "hidden" }}>
                    <div
                      className="modal-header text-white"
                      style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
                    >
                      <h5 className="modal-title">{selectedItem ? selectedItem.name : tDashboard("details.title")}</h5>
                      <button
                        type="button"
                        className="btn-close btn-close-white"
                        onClick={() => setShowDetailsModal(false)}
                      ></button>
                    </div>
                    <div className="modal-body p-4">
                      {selectedItem ? (
                        <div className="row">
                          <div className="col-md-6 mb-4 mb-md-0">
                            <div className="mb-4">
                              <h6 className="text-muted mb-2">
                                <i className="fas fa-tag me-1"></i>
                                {tDashboard("type")}:
                              </h6>
                              <p>{selectedItem.type || "N/A"}</p>
                            </div>
                            <div className="mb-4">
                              <h6 className="text-muted mb-2">
                                <i className="fas fa-clock me-1"></i>
                                {tDashboard("prepTime")}:
                              </h6>
                              <p>{selectedItem.prepTime ? `${selectedItem.prepTime} min` : "N/A"}</p>
                            </div>
                            {selectedItem.dietaryRestrictions?.length > 0 && (
                              <div className="mb-4">
                                <h6 className="text-muted mb-2">
                                  <i className="fas fa-shield-alt me-1"></i>
                                  {tDashboard("restrictions")}:
                                </h6>
                                <div className="d-flex flex-wrap gap-1">
                                  {selectedItem.dietaryRestrictions.map((restriction, index) => (
                                    <span
                                      key={index}
                                      className="badge bg-warning text-dark"
                                      style={{ borderRadius: "10px" }}
                                    >
                                      {restriction}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {selectedItem.isCombined && (
                              <div className="mb-4">
                                <h6 className="text-muted mb-2">
                                  <i className="fas fa-link me-1"></i>
                                  {tDashboard("combined")}:
                                </h6>
                                <p className="badge bg-info" style={{ borderRadius: "10px" }}>
                                  {tDashboard("combined")}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="col-md-6">
                            <div className="mb-4">
                              <h6 className="text-muted mb-2">
                                <i className="fas fa-list me-1"></i>
                                {tDashboard("details.ingredients")}:
                              </h6>
                              {selectedItem.ingredients && selectedItem.ingredients.length > 0 ? (
                                <ul className="ps-3">
                                  {selectedItem.ingredients.map((ing, index) => (
                                    <li key={index} className="mb-1">
                                      {ing.name} ({ing.quantity} {ing.unit})
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-muted">{tDashboard("details.noIngredients")}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-center py-4">{tDashboard("details.noData")}</p>
                      )}

                      {selectedItem?.instructions && (
                        <div className="mb-3">
                          <h6 className="text-muted mb-2">
                            <i className="fas fa-utensils me-1"></i>
                            {tDashboard("details.instructions")}:
                          </h6>
                          <p className="mb-0">{selectedItem.instructions}</p>
                        </div>
                      )}
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowDetailsModal(false)}
                        style={{ borderRadius: "15px" }}
                      >
                        {tDashboard("details.close")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="chatbot-toggle">
              <button
                className="btn btn-primary rounded-circle shadow-lg"
                style={{
                  position: "fixed",
                  bottom: "20px",
                  right: "20px",
                  width: "60px",
                  height: "60px",
                  zIndex: 1000,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  border: "none",
                  transition: "box-shadow 0.3s ease, transform 0.3s ease",
                }}
                onClick={() => {
                  console.log("Bouton chatbot cliqué, showChatbot:", !showChatbot)
                  setShowChatbot(!showChatbot)
                }}
              >
                <i className={`fas ${showChatbot ? "fa-times" : "fa-robot"} fa-lg`}></i>
              </button>
              <style jsx>{`
                .chatbot-toggle button:hover {
                  transform: translateY(-3px);
                  box-shadow: 0 12px 24px rgba(102, 126, 234, 0.4);
                }
                .chatbot-toggle button:active {
                  transform: scale(0.95);
                  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
                }
                .chatbot-toggle button i {
                  transition: transform 0.3s ease;
                }
                .chatbot-toggle button:hover i {
                  transform: scale(1.2);
                }
              `}</style>
            </div>
            {showChatbot && (
              <AIChat
                onClose={() => {
                  console.log("Fermeture via AIChat")
                  setShowChatbot(false)
                }}
              />
            )}
          </div>
        </div>

        <style jsx global>{`
          body {
            font-family: 'Poppins', sans-serif;
          }

          .card {
            transition: transform 0.3s, box-shadow 0.3s;
          }

          .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1) !important;
          }

          .btn {
            transition: all 0.3s;
          }

          .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }

          .nav-pills .nav-link {
            transition: all 0.3s;
            margin: 0 3px;
          }

          .nav-pills .nav-link.active {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            box-shadow: 0 4px 10px rgba(118, 75, 162, 0.3);
          }

          .form-control:focus, .form-select:focus {
            border-color: #764ba2;
            box-shadow: 0 0 0 0.25rem rgba(118, 75, 162, 0.25);
          }

          @keyframes shake {
            0% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            50% { transform: translateX(5px); }
            75% { transform: translateX(-5px); }
            100% { transform: translateX(0); }
          }
        `}</style>
      </div>
    </div>
  )
}

export default FamilyDashboard
