"use client"

import { useState } from "react"

const IngredientForm = ({ ingredient, onSave, onCancel, onDelete, isNew = false }) => {
  const [name, setName] = useState(ingredient?.name || "")
  const [quantity, setQuantity] = useState(ingredient?.quantity || "")
  const [unit, setUnit] = useState(ingredient?.unit || "")
  const [price, setPrice] = useState(ingredient?.price || "")
  const [category, setCategory] = useState(ingredient?.category || "")
  const [expirationDate, setExpirationDate] = useState(ingredient?.expirationDate || "")
  const [notes, setNotes] = useState(ingredient?.notes || "")
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const unitOptions = ["g", "kg", "ml", "L", "unité(s)", "cuillère(s) à soupe", "cuillère(s) à café"]
  const categoryOptions = ["Épicerie", "Produits frais", "Surgelés", "Boissons", "Autres"]

  const validateForm = () => {
    const newErrors = {}

    if (!name.trim()) {
      newErrors.name = "Le nom est requis"
    }
    if (!quantity || quantity <= 0) {
      newErrors.quantity = "La quantité doit être positive"
    }
    if (!unit) {
      newErrors.unit = "L'unité est requise"
    }
    if (!price || price < 0) {
      newErrors.price = "Le prix ne peut pas être négatif"
    }
    if (!category) {
      newErrors.category = "La catégorie est requise"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    const ingredientData = {
      ...(isNew ? {} : { id: ingredient?.id }),
      name,
      quantity: Number.parseFloat(quantity) || 0,
      unit,
      price: Number.parseInt(price) || 0,
      category: category || "Autres",
      expirationDate: expirationDate || "",
      notes: notes || "",
    }

    try {
      await onSave(ingredientData)
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (onDelete && ingredient?.id && window.confirm("Êtes-vous sûr de vouloir supprimer cet ingrédient ?")) {
      setLoading(true)
      try {
        await onDelete(ingredient.id)
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
          <i className="fas fa-carrot me-2"></i>
          {isNew ? "Ajouter un Ingrédient" : "Modifier l'Ingrédient"}
        </h4>
      </div>
      <div className="card-body">
        <form onSubmit={handleSave}>
          <div className="row">
            <div className="col-md-6">
              <div className="form-group">
                <label htmlFor="ingredientName" className="form-label">
                  <i className="fas fa-tag me-1"></i>
                  Nom de l'Ingrédient *
                </label>
                <input
                  type="text"
                  className={`form-control ${errors.name ? "is-invalid" : name ? "is-valid" : ""}`}
                  id="ingredientName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Ex: Tomates"
                />
                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                {name && !errors.name && (
                  <div className="validation-icon text-success">
                    <i className="fas fa-check"></i>
                  </div>
                )}
              </div>
            </div>

            <div className="col-md-6">
              <div className="form-group">
                <label htmlFor="ingredientCategory" className="form-label">
                  <i className="fas fa-folder me-1"></i>
                  Catégorie *
                </label>
                <select
                  className={`form-select ${errors.category ? "is-invalid" : category ? "is-valid" : ""}`}
                  id="ingredientCategory"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  disabled={loading}
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {errors.category && <div className="invalid-feedback">{errors.category}</div>}
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-4">
              <div className="form-group">
                <label htmlFor="ingredientQuantity" className="form-label">
                  <i className="fas fa-weight me-1"></i>
                  Quantité *
                </label>
                <input
                  type="number"
                  className={`form-control ${errors.quantity ? "is-invalid" : quantity ? "is-valid" : ""}`}
                  id="ingredientQuantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="0"
                  step="0.01"
                  required
                  disabled={loading}
                />
                {errors.quantity && <div className="invalid-feedback">{errors.quantity}</div>}
              </div>
            </div>

            <div className="col-md-4">
              <div className="form-group">
                <label htmlFor="ingredientUnit" className="form-label">
                  <i className="fas fa-ruler me-1"></i>
                  Unité *
                </label>
                <select
                  className={`form-select ${errors.unit ? "is-invalid" : unit ? "is-valid" : ""}`}
                  id="ingredientUnit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  required
                  disabled={loading}
                >
                  <option value="">Sélectionner une unité</option>
                  {unitOptions.map((unitOption) => (
                    <option key={unitOption} value={unitOption}>
                      {unitOption}
                    </option>
                  ))}
                </select>
                {errors.unit && <div className="invalid-feedback">{errors.unit}</div>}
              </div>
            </div>

            <div className="col-md-4">
              <div className="form-group">
                <label htmlFor="ingredientPrice" className="form-label">
                  <i className="fas fa-money-bill me-1"></i>
                  Prix unitaire (FCFA) *
                </label>
                <input
                  type="number"
                  className={`form-control ${errors.price ? "is-invalid" : price >= 0 ? "is-valid" : ""}`}
                  id="ingredientPrice"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0"
                  step="1"
                  required
                  disabled={loading}
                />
                {errors.price && <div className="invalid-feedback">{errors.price}</div>}
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <div className="form-group">
                <label htmlFor="ingredientExpiration" className="form-label">
                  <i className="fas fa-calendar me-1"></i>
                  Date d'expiration (optionnel)
                </label>
                <input
                  type="date"
                  className="form-control"
                  id="ingredientExpiration"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="col-md-6">
              <div className="form-group">
                <label htmlFor="ingredientNotes" className="form-label">
                  <i className="fas fa-sticky-note me-1"></i>
                  Notes (optionnel)
                </label>
                <textarea
                  className="form-control"
                  id="ingredientNotes"
                  rows="3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={loading}
                  placeholder="Notes optionnelles..."
                />
              </div>
            </div>
          </div>

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
                  {isNew ? "Ajouter l'Ingrédient" : "Sauvegarder les Modifications"}
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

export default IngredientForm
