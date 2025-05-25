import React, { useState } from 'react';

const IngredientForm = ({ ingredient, onSave, onCancel, onDelete, isNew = false }) => {
  const [name, setName] = useState(ingredient?.name || '');
  const [quantity, setQuantity] = useState(ingredient?.quantity || '');
  const [unit, setUnit] = useState(ingredient?.unit || '');
  const [price, setPrice] = useState(ingredient?.price || '');
  const [category, setCategory] = useState(ingredient?.category || '');
  const [expirationDate, setExpirationDate] = useState(ingredient?.expirationDate || '');
  const [notes, setNotes] = useState(ingredient?.notes || '');

  const unitOptions = ['g', 'kg', 'ml', 'L', 'unité(s)', 'cuillère(s) à soupe', 'cuillère(s) à café'];
  const categoryOptions = ['Épicerie', 'Produits frais', 'Surgelés', 'Boissons', 'Autres'];

  const handleSave = (e) => {
    e.preventDefault();
    const ingredientData = {
      ...(isNew ? {} : { id: ingredient?.id }),
      name,
      quantity: parseFloat(quantity) || 0,
      unit,
      price: parseInt(price) || 0, // En FCFA, entier
      category: category || 'Autres',
      expirationDate: expirationDate || '',
      notes: notes || '',
    };
    onSave(ingredientData);
  };

  return (
    <div className="form-container ingredient-form">
      <h2>{isNew ? 'Ajouter un Ingrédient' : 'Modifier l\'Ingrédient'}</h2>
      <form onSubmit={handleSave}>
        <div className="form-group">
          <label htmlFor="ingredientName">Nom de l'Ingrédient :</label>
          <input
            type="text"
            id="ingredientName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="ingredientQuantity">Quantité :</label>
          <input
            type="number"
            id="ingredientQuantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="0"
            step="0.01"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="ingredientUnit">Unité :</label>
          <select
            id="ingredientUnit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            required
          >
            <option value="">Sélectionner une unité</option>
            {unitOptions.map((unitOption) => (
              <option key={unitOption} value={unitOption}>
                {unitOption}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="ingredientPrice">Prix unitaire (FCFA) :</label>
          <input
            type="number"
            id="ingredientPrice"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            min="0"
            step="1"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="ingredientCategory">Catégorie :</label>
          <select
            id="ingredientCategory"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="">Sélectionner une catégorie</option>
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="ingredientExpiration">Date d'expiration (optionnel) :</label>
          <input
            type="date"
            id="ingredientExpiration"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="ingredientNotes">Notes (optionnel) :</label>
          <textarea
            id="ingredientNotes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="button-group">
          <button type="submit" className="btn-primary">
            {isNew ? 'Ajouter l\'Ingrédient' : 'Sauvegarder les Modifications'}
          </button>
          {onCancel && (
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Annuler
            </button>
          )}
          {!isNew && onDelete && (
            <button
              type="button"
              className="btn-secondary delete-btn"
              onClick={() => onDelete(ingredient.id)}
            >
              Supprimer
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default IngredientForm;