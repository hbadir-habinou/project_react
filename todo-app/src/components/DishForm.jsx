import React, { useState } from 'react';

const DishForm = ({ dish, onSave, onCancel, onDelete, isNew = false }) => {
  const [name, setName] = useState(dish?.name || '');
  const [type, setType] = useState(dish?.type || 'Plat principal');
  const [ingredients, setIngredients] = useState(dish?.ingredients || [{ name: '', quantity: '', unit: '' }]);
  const [instructions, setInstructions] = useState(dish?.instructions || '');
  const [prepTime, setPrepTime] = useState(dish?.prepTime || '');
  const [dietaryRestrictions, setDietaryRestrictions] = useState(dish?.dietaryRestrictions || []);
  const [image, setImage] = useState(dish?.image || '');
  const [imagePreview, setImagePreview] = useState(dish?.image || '');

  const dishTypes = ['Entrée', 'Plat principal', 'Dessert', 'Collation'];
  const dietaryOptions = ['Végétarien', 'Végétalien', 'Sans gluten', 'Sans lactose', 'Sans arachides'];
  const unitOptions = ['g', 'kg', 'ml', 'L', 'unité(s)', 'cuillère(s) à soupe', 'cuillère(s) à café'];

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: '', unit: '' }]);
  };

  const removeIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleDietaryRestrictionChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setDietaryRestrictions([...dietaryRestrictions, value]);
    } else {
      setDietaryRestrictions(dietaryRestrictions.filter((restriction) => restriction !== value));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImage('');
      setImagePreview('');
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    const dishData = {
      ...(isNew ? {} : { id: dish?.id }),
      name,
      type,
      ingredients: ingredients.filter(ing => ing.name && ing.quantity && ing.unit),
      instructions: instructions || '',
      prepTime: parseInt(prepTime) || 0,
      dietaryRestrictions,
      image: image || '',
    };
    onSave(dishData);
  };

  return (
    <div className="form-container">
      <h2>{isNew ? 'Ajouter un Plat' : 'Modifier le Plat'}</h2>
      <form onSubmit={handleSave}>
        <div className="mb-3">
          <label htmlFor="dishName" className="form-label">Nom du Plat</label>
          <input
            type="text"
            className="form-control"
            id="dishName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="dishType" className="form-label">Type de Plat</label>
          <select
            className="form-select"
            id="dishType"
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
          >
            {dishTypes.map((typeOption) => (
              <option key={typeOption} value={typeOption}>
                {typeOption}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Ingrédients</label>
          {ingredients.map((ingredient, index) => (
            <div key={index} className="row g-2 mb-2 ingredient-row">
              <div className="col-md-4">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nom de l'ingrédient"
                  value={ingredient.name}
                  onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                  required
                />
              </div>
              <div className="col-md-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Quantité"
                  value={ingredient.quantity}
                  onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                  required
                />
              </div>
              <div className="col-md-3">
                <select
                  className="form-select"
                  value={ingredient.unit}
                  onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                  required
                >
                  <option value="">Sélectionner une unité</option>
                  {unitOptions.map((unit) => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
              {ingredients.length > 1 && (
                <div className="col-md-2">
                  <button
                    type="button"
                    className="btn btn-danger w-100 remove-btn"
                    onClick={() => removeIngredient(index)}
                  >
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          ))}
          <button type="button" className="btn btn-outline-secondary" onClick={addIngredient}>
            Ajouter un ingrédient
          </button>
        </div>

        <div className="mb-3">
          <label htmlFor="instructions" className="form-label">Instructions (optionnel)</label>
          <textarea
            className="form-control"
            id="instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="prepTime" className="form-label">Temps de préparation (minutes)</label>
          <input
            type="number"
            className="form-control"
            id="prepTime"
            value={prepTime}
            onChange={(e) => setPrepTime(e.target.value)}
            min="1"
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Restrictions alimentaires</label>
          <div className="d-flex flex-wrap gap-3">
            {dietaryOptions.map((option) => (
              <div className="form-check" key={option}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  value={option}
                  checked={dietaryRestrictions.includes(option)}
                  onChange={handleDietaryRestrictionChange}
                  id={`dietary-${option}`}
                />
                <label className="form-check-label" htmlFor={`dietary-${option}`}>
                  {option}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="dishImage" className="form-label">Image du Plat (optionnel)</label>
          <div className="d-flex align-items-center gap-3">
            <input
              type="file"
              className="form-control"
              id="dishImage"
              accept="image/*"
              onChange={handleImageChange}
            />
            {imagePreview && (
              <img src={imagePreview} alt="Aperçu" className="profile-pic-preview" />
            )}
          </div>
        </div>

        <div className="d-flex gap-3">
          <button type="submit" className="btn btn-primary">
            {isNew ? 'Ajouter le Plat' : 'Sauvegarder les Modifications'}
          </button>
          {onCancel && (
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Annuler
            </button>
          )}
          {!isNew && onDelete && (
            <button
              type="button"
              className="btn btn-danger delete-btn"
              onClick={() => onDelete(dish.id)}
            >
              Supprimer
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default DishForm;