"use client"

import { useState, useEffect } from "react"
import { auth, db } from "../firebase"
import { collection, getDocs, onSnapshot } from "firebase/firestore"

const DishForm = ({ dish, onSave, onCancel, onDelete, isNew = false }) => {
  const [name, setName] = useState(dish?.name || "")
  const [type, setType] = useState(dish?.type || "Plat principal")
  const [ingredients, setIngredients] = useState(dish?.ingredients || [{ name: "", quantity: "", unit: "" }])
  const [instructions, setInstructions] = useState(dish?.instructions || "")
  const [prepTime, setPrepTime] = useState(dish?.prepTime || "")
  const [dietaryRestrictions, setDietaryRestrictions] = useState(dish?.dietaryRestrictions || [])
  const [image, setImage] = useState(dish?.image || "")
  const [imagePreview, setImagePreview] = useState(dish?.image || "")
  const [aliases, setAliases] = useState(dish?.aliases?.join(", ") || "")
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [isCombining, setIsCombining] = useState(false)
  const [availableDishes, setAvailableDishes] = useState([])
  const [availableRecipes, setAvailableRecipes] = useState([]) // Nouvelle état pour recettes Firestore
  const [selectedItems, setSelectedItems] = useState([])
  const [suggestedPairs, setSuggestedPairs] = useState([])

  const dishTypes = ["Entrée", "Plat principal", "Dessert", "Collation", "Complément", "Boisson"]
  const dietaryOptions = ["Végétarien", "Végétalien", "Sans gluten", "Sans lactose", "Sans arachides"]
  const unitOptions = ["g", "kg", "ml", "L", "unité(s)", "cuillère(s) à soupe", "cuillère(s) à café"]

  // Charger les plats et recettes depuis Firestore
  useEffect(() => {
    if (!auth.currentUser) return

    // Charger les plats utilisateur
    const dishesCollectionRef = collection(db, "users", auth.currentUser.uid, "dishes")
    const unsubscribeDishes = onSnapshot(dishesCollectionRef, (snapshot) => {
      const dishesList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), source: "dish" }))
      setAvailableDishes(dishesList)

      // Générer les suggestions après avoir chargé plats et recettes
      generateSuggestions(dishesList, availableRecipes)
    })

    // Charger les recettes globales
    const recipesCollectionRef = collection(db, "recipes")
    const unsubscribeRecipes = onSnapshot(recipesCollectionRef, (snapshot) => {
      const recipesList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), source: "recipe" }))
      setAvailableRecipes(recipesList)

      // Générer les suggestions après avoir chargé plats et recettes
      generateSuggestions(availableDishes, recipesList)
    })

    return () => {
      unsubscribeDishes()
      unsubscribeRecipes()
    }
  }, [])

  // Fonction pour générer des suggestions de combinaisons
  const generateSuggestions = (dishes, recipes) => {
    const pairs = []
    const complements = [...dishes, ...recipes].filter((item) => item.type === "Complément")
    const mains = [...dishes, ...recipes].filter((item) => item.type === "Plat principal")
    complements.forEach((comp) => {
      mains.forEach((main) => {
        pairs.push([comp, main])
      })
    })
    setSuggestedPairs(pairs.slice(0, 5)) // Limiter à 5 suggestions
  }

  const validateForm = () => {
    const newErrors = {}
    if (!isCombining) {
      if (!name.trim()) newErrors.name = "Le nom du plat est requis"
      if (!prepTime || prepTime <= 0) newErrors.prepTime = "Le temps de préparation doit être positif"
      const validIngredients = ingredients.filter((ing) => ing.name && ing.quantity && ing.unit)
      if (validIngredients.length === 0) newErrors.ingredients = "Au moins un ingrédient complet est requis"
    } else {
      if (selectedItems.length < 2) newErrors.combination = "Sélectionnez au moins deux plats à combiner"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...ingredients]
    newIngredients[index][field] = value
    setIngredients(newIngredients)
  }

  const addIngredient = () => {
    setIngredients([...ingredients, { name: "", quantity: "", unit: "" }])
  }

  const removeIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  const handleDietaryRestrictionChange = (e) => {
    const { value, checked } = e.target
    if (checked) {
      setDietaryRestrictions([...dietaryRestrictions, value])
    } else {
      setDietaryRestrictions(dietaryRestrictions.filter((restriction) => restriction !== value))
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImage(reader.result)
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    } else {
      setImage("")
      setImagePreview("")
    }
  }

  const handleCombineItems = () => {
    if (selectedItems.length < 2) {
      setErrors({ combination: "Sélectionnez au moins deux plats à combiner" })
      return
    }

    // Générer le plat combiné
    const combinedName = selectedItems.map((item) => item.name).join(" à la ")
    const combinedIngredients = selectedItems.reduce((acc, item) => {
      item.ingredients.forEach((ing) => {
        const key = `${ing.name}-${ing.unit}`
        const existing = acc.find((i) => `${i.name}-${i.unit}` === key)
        if (existing) {
          existing.quantity = (Number.parseFloat(existing.quantity) || 0) + (Number.parseFloat(ing.quantity) || 0)
        } else {
          acc.push({ ...ing, quantity: Number.parseFloat(ing.quantity) || 0 })
        }
      })
      return acc
    }, [])
    const combinedInstructions = selectedItems.map((item) => item.instructions).filter(Boolean).join("\n---\n")
    const combinedPrepTime = selectedItems.reduce((sum, item) => sum + (Number.parseInt(item.prepTime) || 0), 0)
    const combinedRestrictions = [...new Set(selectedItems.flatMap((item) => item.dietaryRestrictions || []))]
    const combinedAliases = [...new Set(selectedItems.flatMap((item) => item.aliases || []))]
    const combinedImage = selectedItems[0]?.image || ""

    // Mettre à jour le formulaire
    setName(combinedName)
    setIngredients(combinedIngredients)
    setInstructions(combinedInstructions)
    setPrepTime(combinedPrepTime.toString())
    setDietaryRestrictions(combinedRestrictions)
    setImage(combinedImage)
    setImagePreview(combinedImage)
    setAliases(combinedAliases.join(", "))
    setType("Plat principal")
    setIsCombining(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setLoading(true)

    const aliasArray = aliases
      .split(",")
      .map((alias) => alias.trim())
      .filter((alias) => alias)

    const dishData = {
      ...(isNew ? {} : { id: dish?.id }),
      name,
      type,
      ingredients: ingredients.filter((ing) => ing.name && ing.quantity && ing.unit),
      instructions: instructions || "",
      prepTime: Number.parseInt(prepTime) || 0,
      dietaryRestrictions,
      image: image || "",
      aliases: aliasArray,
      ...(selectedItems.length > 0
        ? {
            isCombined: true,
            combinedFrom: selectedItems.map((item) => ({
              type: item.source,
              id: item.id,
            })),
          }
        : {}),
    }

    try {
      await onSave(dishData, selectedItems.length > 0)
      setSelectedItems([])
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (onDelete && dish?.id && window.confirm("Êtes-vous sûr de vouloir supprimer ce plat ?")) {
      setLoading(true)
      try {
        await onDelete(dish.id)
      } catch (error) {
        console.error("Erreur lors de la suppression:", error)
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="card glass-effect fade-in">
      <div className="card-header">
        <h4 className="mb-0">
          <i className="fas fa-utensils me-2"></i>
          {isNew ? "Ajouter un Plat" : "Modifier le Plat"}
        </h4>
      </div>
      <div className="card-body">
        <form onSubmit={handleSave}>
          <div className="mb-3">
            <button
              type="button"
              className="btn btn-info"
              onClick={() => setIsCombining(!isCombining)}
            >
              {isCombining ? "Mode Normal" : "Combiner des Plats"}
            </button>
          </div>

          {isCombining ? (
            <div className="form-group mb-3">
              <label className="form-label">
                <i className="fas fa-link me-1"></i>
                Sélectionner les plats à combiner
              </label>
              <select
                multiple
                className="form-select"
                value={selectedItems.map((item) => `${item.source}-${item.id}`)}
                onChange={(e) =>
                  setSelectedItems(
                    Array.from(e.target.selectedOptions, (option) => {
                      const [source, id] = option.value.split("-")
                      return source === "dish"
                        ? availableDishes.find((d) => d.id === id)
                        : availableRecipes.find((r) => r.id === id)
                    })
                  )
                }
              >
                {availableDishes.map((d) => (
                  <option key={`dish-${d.id}`} value={`dish-${d.id}`}>
                    {d.name} (Plat)
                  </option>
                ))}
                {availableRecipes.map((r) => (
                  <option key={`recipe-${r.id}`} value={`recipe-${r.id}`}>
                    {r.name} (Recette)
                  </option>
                ))}
              </select>
              {errors.combination && <div className="text-danger small">{errors.combination}</div>}
              <div className="mt-2">
                <h6>Suggestions de combinaisons :</h6>
                {suggestedPairs.map(([item1, item2], index) => (
                  <button
                    key={index}
                    type="button"
                    className="btn btn-outline-primary btn-sm me-2 mb-2"
                    onClick={() => setSelectedItems([item1, item2])}
                  >
                    {item1.name} + {item2.name}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="btn btn-primary mt-2"
                onClick={handleCombineItems}
                disabled={selectedItems.length < 2}
              >
                Générer le plat combiné
              </button>
            </div>
          ) : (
            <>
              <div className="row">
                <div className="col-md-8">
                  <div className="form-group">
                    <label htmlFor="dishName" className="form-label">
                      <i className="fas fa-tag me-1"></i>
                      Nom du Plat *
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.name ? "is-invalid" : name ? "is-valid" : ""}`}
                      id="dishName"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={!isCombining}
                      disabled={loading}
                      placeholder="Ex: Spaghetti Bolognaise"
                    />
                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                    {name && !errors.name && (
                      <div className="validation-icon text-success">
                        <i className="fas fa-check"></i>
                      </div>
                    )}
                  </div>
                  <div className="form-group mt-3">
                    <label htmlFor="dishAliases" className="form-label">
                      <i className="fas fa-tags me-1"></i>
                      Noms alternatifs (séparés par des virgules)
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="dishAliases"
                      value={aliases}
                      onChange={(e) => setAliases(e.target.value)}
                      disabled={loading}
                      placeholder="Ex: Pâtes bolognaise, Spag bol"
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group">
                    <label htmlFor="dishType" className="form-label">
                      <i className="fas fa-list me-1"></i>
                      Type de Plat *
                    </label>
                    <select
                      className="form-select"
                      id="dishType"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      required={!isCombining}
                      disabled={loading}
                    >
                      {dishTypes.map((typeOption) => (
                        <option key={typeOption} value={typeOption}>
                          {typeOption}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-shopping-basket me-1"></i>
                  Ingrédients *
                </label>
                {errors.ingredients && <div className="text-danger small mb-2">{errors.ingredients}</div>}
                {ingredients.map((ingredient, index) => (
                  <div key={index} className="ingredient-row">
                    <div className="row g-2 align-items-center">
                      <div className="col-md-4">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Nom de l'ingrédient"
                          value={ingredient.name}
                          onChange={(e) => handleIngredientChange(index, "name", e.target.value)}
                          disabled={loading}
                        />
                      </div>
                      <div className="col-md-3">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Quantité"
                          value={ingredient.quantity}
                          onChange={(e) => handleIngredientChange(index, "quantity", e.target.value)}
                          disabled={loading}
                        />
                      </div>
                      <div className="col-md-3">
                        <select
                          className="form-select"
                          value={ingredient.unit}
                          onChange={(e) => handleIngredientChange(index, "unit", e.target.value)}
                          disabled={loading}
                        >
                          <option value="">Unité</option>
                          {unitOptions.map((unit) => (
                            <option key={unit} value={unit}>
                              {unit}
                            </option>
                          ))}
                        </select>
                      </div>
                      {ingredients.length > 1 && (
                        <div className="col-md-2">
                          <button
                            type="button"
                            className="btn btn-danger w-100"
                            onClick={() => removeIngredient(index)}
                            disabled={loading}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <button type="button" className="btn btn-success mt-2" onClick={addIngredient} disabled={loading}>
                  <i className="fas fa-plus me-2"></i>
                  Ajouter un ingrédient
                </button>
              </div>

              <div className="row">
                <div className="col-md-8">
                  <div className="form-group">
                    <label htmlFor="instructions" className="form-label">
                      <i className="fas fa-clipboard-list me-1"></i>
                      Instructions (optionnel)
                    </label>
                    <textarea
                      className="form-control"
                      id="instructions"
                      rows="4"
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      disabled={loading}
                      placeholder="Décrivez les étapes de préparation..."
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group">
                    <label htmlFor="prepTime" className="form-label">
                      <i className="fas fa-clock me-1"></i>
                      Temps de préparation (minutes) *
                    </label>
                    <input
                      type="number"
                      className={`form-control ${errors.prepTime ? "is-invalid" : prepTime ? "is-valid" : ""}`}
                      id="prepTime"
                      value={prepTime}
                      onChange={(e) => setPrepTime(e.target.value)}
                      min="1"
                      required={!isCombining}
                      disabled={loading}
                    />
                    {errors.prepTime && <div className="invalid-feedback">{errors.prepTime}</div>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="dishImage" className="form-label">
                      <i className="fas fa-camera me-1"></i>
                      Image du Plat (optionnel)
                    </label>
                    <div className="d-flex align-items-center gap-3">
                      <input
                        type="file"
                        className="form-control"
                        id="dishImage"
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={loading}
                      />
                      {imagePreview && (
                        <img
                          src={imagePreview || "/placeholder.svg"}
                          alt="Aperçu"
                          className="rounded"
                          style={{ width: "60px", height: "60px", objectFit: "cover" }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-shield-alt me-1"></i>
                  Restrictions alimentaires
                </label>
                <div className="row">
                  {dietaryOptions.map((option) => (
                    <div className="col-md-6 col-lg-4" key={option}>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          value={option}
                          checked={dietaryRestrictions.includes(option)}
                          onChange={handleDietaryRestrictionChange}
                          id={`dietary-${option}`}
                          disabled={loading}
                        />
                        <label className="form-check-label" htmlFor={`dietary-${option}`}>
                          {option}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
            
          )}
          

          <div className="d-flex gap-3 mt-4">
            <button type="submit" className="btn btn-success flex-fill" disabled={loading}>
              {loading ? (
                <>
                  <span className="loading-spinner me-2"></span>
                  Sauvegarde...
                </>
              ) : (
                <>
                  <i className="fas fa-save me-2"></i>
                  {isNew ? "Ajouter le Plat" : "Sauvegarder les Modifications"}
                </>
              )}
            </button>
            {onCancel && (
              <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
                <i className="fas fa-times me-2"></i>
                Annuler
              </button>
            )}
            {!isNew && onDelete && (
              <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={loading}>
                <i className="fas fa-trash me-2"></i>
                Supprimer
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default DishForm