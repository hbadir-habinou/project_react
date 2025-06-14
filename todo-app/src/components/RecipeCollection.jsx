"use client"

import { useState, useEffect } from "react"
import { auth, db } from "../firebase"
import { collection, onSnapshot, addDoc, updateDoc, doc, arrayUnion, arrayRemove } from "firebase/firestore"
import { useLanguage } from "../contexts/LanguageContext"
import { generateRecipeFromIngredients } from "../services/aiService"
import ReactMarkdown from "react-markdown"

const RecipeCollection = () => {
  const { t } = useLanguage()
  const [recipes, setRecipes] = useState([])
  const [publicDishes, setPublicDishes] = useState([])
  const [userRecipes, setUserRecipes] = useState([])
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [comment, setComment] = useState("")
  const [replyTo, setReplyTo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterBy, setFilterBy] = useState("all") // all, liked, commented
  const [aiRecipe, setAiRecipe] = useState("")
  const [isGeneratingRecipe, setIsGeneratingRecipe] = useState(false)
  const [generatingRecipeId, setGeneratingRecipeId] = useState(null)
  const [showAiModal, setShowAiModal] = useState(false)
  const [currentAiRecipe, setCurrentAiRecipe] = useState(null)

  useEffect(() => {
    // Écouter les recettes globales (recipes)
    const recipesRef = collection(db, "recipes")
    const unsubscribeRecipes = onSnapshot(recipesRef, (snapshot) => {
      const recipesList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        source: "recipes",
      }))
      setRecipes(recipesList)
    })

    // Écouter les plats publics (publicDishes)
    const publicDishesRef = collection(db, "publicDishes")
    const unsubscribePublicDishes = onSnapshot(publicDishesRef, (snapshot) => {
      const publicDishesList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        source: "publicDishes",
      }))
      setPublicDishes(publicDishesList)
    })

    // Écouter les recettes utilisateur
    if (auth.currentUser) {
      const userRecipesRef = collection(db, "users", auth.currentUser.uid, "dishes")
      const unsubscribeUserRecipes = onSnapshot(userRecipesRef, (snapshot) => {
        const userRecipesList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setUserRecipes(userRecipesList)
      })

      return () => {
        unsubscribeRecipes()
        unsubscribePublicDishes()
        unsubscribeUserRecipes()
      }
    }

    return () => {
      unsubscribeRecipes()
      unsubscribePublicDishes()
    }
  }, [])

  const handleLike = async (recipeId, isLiked, source) => {
    if (!auth.currentUser) return

    try {
      const collectionName = source === "recipes" ? "recipes" : "publicDishes"
      const docRef = doc(db, collectionName, recipeId)
      if (isLiked) {
        await updateDoc(docRef, {
          likes: arrayRemove(auth.currentUser.uid),
        })
      } else {
        await updateDoc(docRef, {
          likes: arrayUnion(auth.currentUser.uid),
        })
      }
    } catch (error) {
      console.error("Erreur lors du like :", error)
    }
  }

  const handleComment = async (recipeId, source) => {
    if (!auth.currentUser || !comment.trim()) return

    setLoading(true)
    try {
      const collectionName = source === "recipes" ? "recipes" : "publicDishes"
      const docRef = doc(db, collectionName, recipeId)
      const newComment = {
        id: Date.now().toString(),
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        text: comment.trim(),
        timestamp: new Date(),
        replyTo: replyTo,
      }

      await updateDoc(docRef, {
        comments: arrayUnion(newComment),
      })

      setComment("")
      setReplyTo(null)
    } catch (error) {
      console.error("Erreur lors du commentaire :", error)
    } finally {
      setLoading(false)
    }
  }

  const handleImportRecipe = async (recipe) => {
    if (!auth.currentUser) return

    setLoading(true)
    try {
      const userRecipesRef = collection(db, "users", auth.currentUser.uid, "dishes")
      await addDoc(userRecipesRef, {
        name: recipe.name,
        type: recipe.type,
        ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || "",
        prepTime: recipe.prepTime || "",
        dietaryRestrictions: recipe.dietaryRestrictions || [],
        image: recipe.image || "",
        aliases: recipe.aliases || [],
        importedFrom: {
          originalId: recipe.id,
          importedAt: new Date(),
          source: recipe.source || "community",
          originalAuthor: recipe.authorName || "Anonyme",
        },
        ownerId: auth.currentUser.uid,
        createdAt: new Date(),
      })

      alert("Recette importée avec succès !")
    } catch (error) {
      console.error("Erreur lors de l'importation :", error)
      alert("Erreur lors de l'importation")
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateRecipe = async (recipe) => {
    if (!recipe.ingredients || recipe.ingredients.length === 0) {
      alert("Cette recette n'a pas d'ingrédients définis")
      return
    }

    setIsGeneratingRecipe(true)
    setGeneratingRecipeId(recipe.id)
    try {
      const generatedRecipe = await generateRecipeFromIngredients(recipe)
      setCurrentAiRecipe(generatedRecipe)
      setShowAiModal(true)
    } catch (error) {
      console.error("Erreur lors de la génération de la recette:", error)
      alert("Une erreur s'est produite lors de la génération de la recette")
    } finally {
      setIsGeneratingRecipe(false)
      setGeneratingRecipeId(null)
    }
  }

  const getStarRating = (likes = []) => {
    const likeCount = likes.length
    if (likeCount >= 50) return 5
    if (likeCount >= 30) return 4
    if (likeCount >= 15) return 3
    if (likeCount >= 5) return 2
    if (likeCount >= 1) return 1
    return 0
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <i
        key={i}
        className={`fas fa-star ${i < rating ? "text-warning" : "text-muted"}`}
        style={{ fontSize: "0.8rem" }}
      />
    ))
  }

  // Combiner toutes les recettes (publiques et privées)
  const combinedRecipes = [...recipes, ...publicDishes, ...userRecipes.map(recipe => ({
    ...recipe,
    source: "private",
    authorName: auth.currentUser?.email
  }))]

  const filteredRecipes = combinedRecipes.filter((recipe) => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase())

    if (filterBy === "liked") {
      return matchesSearch && recipe.likes?.includes(auth.currentUser?.uid)
    }
    if (filterBy === "commented") {
      return matchesSearch && recipe.comments?.some((c) => c.userId === auth.currentUser?.uid)
    }
    return matchesSearch
  })

  return (
    <div className="recipe-collection">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>
          <i className="fas fa-book-open me-2 text-primary"></i>
          Collection de Recettes
        </h4>
        <div className="d-flex gap-2">
          <input
            type="text"
            className="form-control"
            placeholder="Rechercher une recette..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "250px" }}
          />
          <select
            className="form-select"
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            style={{ width: "150px" }}
          >
            <option value="all">Toutes</option>
            <option value="liked">Mes favoris</option>
            <option value="commented">Commentées</option>
          </select>
        </div>
      </div>

      <div className="row">
        {filteredRecipes.map((recipe) => {
          const isLiked = recipe.likes?.includes(auth.currentUser?.uid)
          const likeCount = recipe.likes?.length || 0
          const commentCount = recipe.comments?.length || 0
          const starRating = getStarRating(recipe.likes)
          const isPrivate = recipe.source === "private"

          return (
            <div key={`${recipe.source}-${recipe.id}`} className="col-lg-4 col-md-6 mb-4">
              <div className="card h-100 recipe-card-enhanced">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="card-title">
                      {recipe.name}
                      {isPrivate && (
                        <span className="badge bg-secondary ms-2" style={{ fontSize: "0.7rem" }}>
                          <i className="fas fa-lock me-1"></i>
                          Privé
                        </span>
                      )}
                    </h5>
                    <div className="d-flex align-items-center">
                      {!isPrivate && (
                        <>
                          {renderStars(starRating)}
                          <small className="text-muted ms-1">({likeCount})</small>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mb-2">
                    <span className="badge bg-info me-2">{recipe.type}</span>
                    <span className="badge bg-secondary">
                      <i className="fas fa-clock me-1"></i>
                      {recipe.prepTime || "N/A"} min
                    </span>
                    {recipe.authorName && (
                      <small className="text-muted d-block mt-1">Par : {recipe.authorName}</small>
                    )}
                  </div>

                  <p className="card-text small text-muted">{recipe.instructions?.substring(0, 100) || "Aucune description"}...</p>

                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex gap-2">
                      {!isPrivate && (
                        <>
                          <button
                            className={`btn btn-sm ${isLiked ? "btn-danger" : "btn-outline-danger"}`}
                            onClick={() => handleLike(recipe.id, isLiked, recipe.source)}
                          >
                            <i className="fas fa-heart me-1"></i>
                            {likeCount}
                          </button>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => {
                              setSelectedRecipe(recipe)
                              setShowModal(true)
                            }}
                          >
                            <i className="fas fa-comment me-1"></i>
                            {commentCount}
                          </button>
                        </>
                      )}
                    </div>
                    <div className="d-flex gap-2">
                      {!isPrivate && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleImportRecipe(recipe)}
                          disabled={loading}
                        >
                          <i className="fas fa-download me-1"></i>
                          Importer
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-info"
                        onClick={() => handleGenerateRecipe(recipe)}
                        disabled={isGeneratingRecipe && generatingRecipeId === recipe.id || !recipe.ingredients?.length}
                      >
                        <i className="fas fa-robot me-1"></i>
                        {isGeneratingRecipe && generatingRecipeId === recipe.id ? "Génération..." : "Variante IA"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal pour les détails et commentaires */}
      {showModal && selectedRecipe && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{selectedRecipe.name}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowModal(false)
                    setSelectedRecipe(null)
                    setComment("")
                    setReplyTo(null)
                  }}
                ></button>
              </div>
              <div className="modal-body">
                {/* Détails de la recette */}
                <div className="mb-4">
                  <h6>Ingrédients :</h6>
                  <ul>
                    {selectedRecipe.ingredients?.map((ing, index) => (
                      <li key={index}>
                        {ing.name || ing} {ing.quantity && ing.unit ? `- (${ing.quantity} ${ing.unit})` : ""}
                      </li>
                    )) || <p className="text-muted">Aucun ingrédient</p>}
                  </ul>
                  <h6>Instructions :</h6>
                  <p>{selectedRecipe.instructions || "Aucune instruction"}</p>
                  {selectedRecipe.authorName && selectedRecipe.source === "publicDishes" && (
                    <p><small className="text-muted">Partagée par : {selectedRecipe.authorName}</small></p>
                  )}
                </div>

                {/* Section commentaires */}
                <div className="comments-section">
                  <h6>Commentaires ({selectedRecipe.comments?.length || 0})</h6>

                  <div className="mb-3">
                    {replyTo && (
                      <div className="alert alert-light d-flex justify-content-between align-items-center">
                        <small>Réponse à : {replyTo.userEmail}</small>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => setReplyTo(null)}>
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    )}
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ajouter un commentaire..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                      />
                      <button
                        className="btn btn-primary"
                        onClick={() => handleComment(selectedRecipe.id, selectedRecipe.source)}
                        disabled={loading || !comment.trim()}
                      >
                        <i className="fas fa-paper-plane"></i>
                      </button>
                    </div>
                  </div>
                  <div className="mb-4">
                    {selectedRecipe.aiGeneratedVersion && (
                      <div className="mb-4 mt-4">
                        <div className="card">
                          <div className="card-body">
                            <h6 className="card-title d-flex align-items-center">
                              <i className="fas fa-robot me-2 text-info"></i>
                              Variante suggérée par l'IA
                              {selectedRecipe.lastAiGeneration && (
                                <small className="text-muted ms-2">
                                  (Générée le {new Date(selectedRecipe.lastAiGeneration?.seconds * 1000 || selectedRecipe.lastAiGeneration).toLocaleString()})
                                </small>
                              )}
                            </h6>
                            <div className="ai-recipe-content">
                              <ReactMarkdown>{selectedRecipe.aiGeneratedVersion}</ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="comments-list" style={{ maxHeight: "300px", overflowY: "auto" }}>
                    {selectedRecipe.comments?.map((comment) => (
                      <div
                        key={comment.id}
                        className={`comment-item p-2 mb-2 rounded ${comment.replyTo ? "ms-4 bg-light" : "bg-white border"}`}
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <strong className="text-primary">{comment.userEmail}</strong>
                          {comment.replyTo && (
                            <small className="text-muted ms-2">→ {comment.replyTo.userEmail}</small>
                          )}
                          <p className="mb-1">{comment.text}</p>
                          <small className="text-muted">
                            {new Date(comment.timestamp?.seconds * 1000 || comment.timestamp).toLocaleString()}
                          </small>
                        </div>
                        <button className="btn btn-sm btn-outline-primary" onClick={() => setReplyTo(comment)}>
                          <i className="fas fa-reply"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ajouter le modal AI après le modal existant */}
      {showAiModal && currentAiRecipe && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title d-flex align-items-center">
                  <i className="fas fa-robot me-2 text-info"></i>
                  Recette générée par l'IA
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowAiModal(false)
                    setCurrentAiRecipe(null)
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="ai-recipe-content">
                  <ReactMarkdown>{currentAiRecipe}</ReactMarkdown>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAiModal(false)
                    setCurrentAiRecipe(null)
                  }}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RecipeCollection