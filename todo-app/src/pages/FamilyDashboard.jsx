import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, onSnapshot, updateDoc, deleteDoc, addDoc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import FamilyMemberForm from '../components/FamilyMemberForm';
import DishForm from '../components/DishForm';
import IngredientForm from '../components/IngredientForm';

const FamilyDashboard = () => {
  const navigate = useNavigate();
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [mealPlan, setMealPlan] = useState({});
  const [shoppingList, setShoppingList] = useState([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [editingMember, setEditingMember] = useState(null);
  const [editingDish, setEditingDish] = useState(null);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [showDishForm, setShowDishForm] = useState(false);
  const [showIngredientForm, setShowIngredientForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [emailStatus, setEmailStatus] = useState('');

  const weekId = '2025-W22';

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) {
        navigate('/login');
        return;
      }

      try {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setCurrentUserProfile({ id: userDocSnap.id, ...userDocSnap.data() });
        } else {
          setError('Profil principal introuvable.');
        }

        const familyMembersCollectionRef = collection(db, 'users', auth.currentUser.uid, 'familyMembers');
        const unsubscribeMembers = onSnapshot(familyMembersCollectionRef, (snapshot) => {
          const membersList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setFamilyMembers(membersList);
        }, (err) => {
          console.error('Erreur de lecture des membres : ', err);
          setError('Erreur lors du chargement des membres.');
        });

        const dishesCollectionRef = collection(db, 'users', auth.currentUser.uid, 'dishes');
        const unsubscribeDishes = onSnapshot(dishesCollectionRef, (snapshot) => {
          const dishesList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setDishes(dishesList);
        }, (err) => {
          console.error('Erreur de lecture des plats : ', err);
          setError('Erreur lors du chargement des plats.');
        });

        const ingredientsCollectionRef = collection(db, 'users', auth.currentUser.uid, 'ingredients');
        const unsubscribeIngredients = onSnapshot(ingredientsCollectionRef, (snapshot) => {
          const ingredientsList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setIngredients(ingredientsList);
        }, (err) => {
          console.error('Erreur de lecture des ingrédients : ', err);
          setError('Erreur lors du chargement des ingrédients.');
        });

        const mealPlanDocRef = doc(db, 'users', auth.currentUser.uid, 'mealPlans', weekId);
        const unsubscribeMealPlan = onSnapshot(mealPlanDocRef, (doc) => {
          if (doc.exists()) {
            setMealPlan(doc.data());
          } else {
            setMealPlan({ monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '', sunday: '' });
          }
        }, (err) => {
          console.error('Erreur de lecture du plan de repas : ', err);
          setError('Erreur lors du chargement du plan de repas.');
        });

        const shoppingListDocRef = doc(db, 'users', auth.currentUser.uid, 'shoppingLists', weekId);
        const unsubscribeShoppingList = onSnapshot(shoppingListDocRef, (doc) => {
          if (doc.exists()) {
            setShoppingList(doc.data().items || []);
          } else {
            setShoppingList([]);
          }
          setLoading(false);
        }, (err) => {
          console.error('Erreur de lecture de la liste de courses : ', err);
          setError('Erreur lors du chargement de la liste de courses.');
          setLoading(false);
        });

        return () => {
          unsubscribeMembers();
          unsubscribeDishes();
          unsubscribeIngredients();
          unsubscribeMealPlan();
          unsubscribeShoppingList();
        };
      } catch (err) {
        console.error('Erreur lors du chargement du tableau de bord : ', err);
        setError('Erreur lors du chargement des données.');
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleEditMember = (member) => {
    setEditingMember(member);
  };

  const handleSaveEditedMember = async (updatedMemberData) => {
    setLoading(true);
    setError('');
    try {
      if (!auth.currentUser) {
        throw new Error('Aucun utilisateur authentifié.');
      }

      const cleanedData = {};
      const fields = [
        'fullName', 'age', 'gender', 'email', 'medicalConditions',
        'otherMedicalCondition', 'role', 'otherRole', 'profilePic'
      ];
      fields.forEach((field) => {
        if (updatedMemberData[field] !== undefined && updatedMemberData[field] !== null) {
          cleanedData[field] = updatedMemberData[field];
        }
      });

      if (updatedMemberData.id === auth.currentUser.uid) {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userDocRef, cleanedData);
        setCurrentUserProfile({ ...currentUserProfile, ...cleanedData });
      } else {
        const memberDocRef = doc(db, 'users', auth.currentUser.uid, 'familyMembers', updatedMemberData.id);
        await updateDoc(memberDocRef, cleanedData);
      }
      setEditingMember(null);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du membre : ', err);
      setError(`Échec de la sauvegarde : ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (!auth.currentUser) {
        throw new Error('Aucun utilisateur authentifié.');
      }
      if (memberId !== auth.currentUser.uid) {
        const memberDocRef = doc(db, 'users', auth.currentUser.uid, 'familyMembers', memberId);
        await deleteDoc(memberDocRef);
      } else {
        setError('Vous ne pouvez pas supprimer votre profil principal.');
      }
    } catch (err) {
      console.error('Erreur lors de la suppression du membre : ', err);
      setError(`Échec de la suppression : ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDish = async (dishData) => {
    setLoading(true);
    setError('');
    try {
      if (!auth.currentUser) {
        throw new Error('Aucun utilisateur authentifié.');
      }
      const dishesCollectionRef = collection(db, 'users', auth.currentUser.uid, 'dishes');
      await addDoc(dishesCollectionRef, {
        ...dishData,
        ownerId: auth.currentUser.uid,
        createdAt: new Date(),
      });
      setShowDishForm(false);
    } catch (err) {
      console.error('Erreur lors de l\'ajout du plat : ', err);
      setError(`Échec de l'ajout du plat : ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditDish = (dish) => {
    setEditingDish(dish);
    setShowDishForm(true);
  };

  const handleSaveEditedDish = async (updatedDishData) => {
    setLoading(true);
    setError('');
    try {
      if (!auth.currentUser) {
        throw new Error('Aucun utilisateur authentifié.');
      }
      const dishDocRef = doc(db, 'users', auth.currentUser.uid, 'dishes', updatedDishData.id);
      const cleanedData = {
        name: updatedDishData.name,
        type: updatedDishData.type,
        ingredients: updatedDishData.ingredients,
        instructions: updatedDishData.instructions || '',
        prepTime: updatedDishData.prepTime || 0,
        dietaryRestrictions: updatedDishData.dietaryRestrictions || [],
        image: updatedDishData.image || '',
      };
      await updateDoc(dishDocRef, cleanedData);
      setEditingDish(null);
      setShowDishForm(false);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du plat : ', err);
      setError(`Échec de la sauvegarde : ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDish = async (dishId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce plat ?')) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (!auth.currentUser) {
        throw new Error('Aucun utilisateur authentifié.');
      }
      const dishDocRef = doc(db, 'users', auth.currentUser.uid, 'dishes', dishId);
      await deleteDoc(dishDocRef);
    } catch (err) {
      console.error('Erreur lors de la suppression du plat : ', err);
      setError(`Échec de la suppression : ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIngredient = async (ingredientData) => {
    setLoading(true);
    setError('');
    try {
      if (!auth.currentUser) {
        throw new Error('Aucun utilisateur authentifié.');
      }
      const ingredientsCollectionRef = collection(db, 'users', auth.currentUser.uid, 'ingredients');
      await addDoc(ingredientsCollectionRef, {
        ...ingredientData,
        price: parseFloat(ingredientData.price) || 0,
      });
      setShowIngredientForm(false);
    } catch (err) {
      console.error('Erreur lors de l\'ajout de l\'ingrédient : ', err);
      setError(`Échec de l'ajout de l\'ingrédient : ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditIngredient = (ingredient) => {
    setEditingIngredient(ingredient);
    setShowIngredientForm(true);
  };

  const handleSaveEditedIngredient = async (updatedIngredientData) => {
    setLoading(true);
    setError('');
    try {
      if (!auth.currentUser) {
        throw new Error('Aucun utilisateur authentifié.');
      }
      const ingredientDocRef = doc(db, 'users', auth.currentUser.uid, 'ingredients', updatedIngredientData.id);
      const cleanedData = {
        name: updatedIngredientData.name,
        quantity: updatedIngredientData.quantity || 0,
        unit: updatedIngredientData.unit,
        price: parseFloat(updatedIngredientData.price) || 0,
        category: updatedIngredientData.category || 'Autres',
        expirationDate: updatedIngredientData.expirationDate || '',
        notes: updatedIngredientData.notes || '',
      };
      await updateDoc(ingredientDocRef, cleanedData);
      setEditingIngredient(null);
      setShowIngredientForm(false);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde de l\'ingrédient : ', err);
      setError(`Échec de la sauvegarde : ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIngredient = async (ingredientId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet ingrédient ?')) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (!auth.currentUser) {
        throw new Error('Aucun utilisateur authentifié.');
      }
      const ingredientDocRef = doc(db, 'users', auth.currentUser.uid, 'ingredients', ingredientId);
      await deleteDoc(ingredientDocRef);
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'ingrédient : ', err);
      setError(`Échec de la suppression : ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMealPlanChange = async (day, dishId) => {
    const updatedMealPlan = { ...mealPlan, [day]: dishId };
    setMealPlan(updatedMealPlan);
    try {
      const mealPlanDocRef = doc(db, 'users', auth.currentUser.uid, 'mealPlans', weekId);
      await setDoc(mealPlanDocRef, updatedMealPlan, { merge: true });

      if (dishId) {
        const dish = dishes.find(d => d.id === dishId);
        if (dish && dish.ingredients) {
          for (const ing of dish.ingredients) {
            const inventoryItem = ingredients.find(i => i.name === ing.name && i.unit === ing.unit);
            if (inventoryItem) {
              const newQuantity = inventoryItem.quantity - (parseFloat(ing.quantity) || 0);
              const ingredientDocRef = doc(db, 'users', auth.currentUser.uid, 'ingredients', inventoryItem.id);
              await updateDoc(ingredientDocRef, { quantity: newQuantity >= 0 ? newQuantity : 0 });
            }
          }
        }
      }

      await updateShoppingList();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du plan de repas : ', err);
      setError('Échec de la sauvegarde du plan de repas.');
    }
  };

  const generateMealPlan = async () => {
    const availableDishes = selectedMember ? filteredDishes : dishes;
    if (availableDishes.length === 0) {
      setError('Aucun plat disponible pour générer le plan.');
      return;
    }

    const newMealPlan = {
      monday: '',
      tuesday: '',
      wednesday: '',
      thursday: '',
      friday: '',
      saturday: '',
      sunday: '',
    };

    const days = Object.keys(newMealPlan);
    for (const day of days) {
      const randomDish = availableDishes[Math.floor(Math.random() * availableDishes.length)];
      newMealPlan[day] = randomDish ? randomDish.id : '';
      if (randomDish && randomDish.ingredients) {
        for (const ing of randomDish.ingredients) {
          const inventoryItem = ingredients.find(i => i.name === ing.name && i.unit === ing.unit);
          if (inventoryItem) {
            const newQuantity = inventoryItem.quantity - (parseFloat(ing.quantity) || 0);
            const ingredientDocRef = doc(db, 'users', auth.currentUser.uid, 'ingredients', inventoryItem.id);
            await updateDoc(ingredientDocRef, { quantity: newQuantity >= 0 ? newQuantity : 0 });
          }
        }
      }
    }

    setMealPlan(newMealPlan);
    try {
      const mealPlanDocRef = doc(db, 'users', auth.currentUser.uid, 'mealPlans', weekId);
      await setDoc(mealPlanDocRef, newMealPlan, { merge: true });
      await updateShoppingList();
    } catch (err) {
      console.error('Erreur lors de la génération du plan de repas : ', err);
      setError('Échec de la génération du plan de repas.');
    }
  };

  const updateShoppingList = async () => {
    const selectedDishes = Object.values(mealPlan)
      .filter(dishId => dishId)
      .map(dishId => dishes.find(dish => dish.id === dishId))
      .filter(dish => dish);

    const newShoppingList = selectedDishes.reduce((acc, dish) => {
      dish.ingredients.forEach(ing => {
        const key = `${ing.name}-${ing.unit}`;
        const inventoryItem = ingredients.find(i => i.name === ing.name && i.unit === ing.unit);
        const requiredQuantity = parseFloat(ing.quantity) || 0;
        const availableQuantity = inventoryItem ? inventoryItem.quantity : 0;
        const neededQuantity = requiredQuantity - availableQuantity;

        if (neededQuantity > 0) {
          if (!acc[key]) {
            acc[key] = {
              name: ing.name,
              quantity: neededQuantity,
              unit: ing.unit,
              price: inventoryItem ? inventoryItem.price : 500,
              purchased: false,
            };
          } else {
            acc[key].quantity += neededQuantity;
          }
        }
      });
      return acc;
    }, {});

    const shoppingListArray = Object.values(newShoppingList);
    setShoppingList(shoppingListArray);

    try {
      const shoppingListDocRef = doc(db, 'users', auth.currentUser.uid, 'shoppingLists', weekId);
      await setDoc(shoppingListDocRef, { items: shoppingListArray }, { merge: true });
    } catch (err) {
      console.error('Erreur lors de la sauvegarde de la liste de courses : ', err);
      setError('Échec de la sauvegarde de la liste de courses.');
    }
  };

  const handlePriceChange = async (ingredientKey, newPrice) => {
    const [name, unit] = ingredientKey.split('-');
    const inventoryItem = ingredients.find(i => i.name === name && i.unit === unit);
    if (inventoryItem) {
      const ingredientDocRef = doc(db, 'users', auth.currentUser.uid, 'ingredients', inventoryItem.id);
      await updateDoc(ingredientDocRef, { price: parseFloat(newPrice) || 0 });
    } else {
      const ingredientsCollectionRef = collection(db, 'users', auth.currentUser.uid, 'ingredients');
      await addDoc(ingredientsCollectionRef, {
        name,
        unit,
        quantity: 0,
        price: parseFloat(newPrice) || 0,
        category: 'Autres',
        expirationDate: '',
        notes: '',
      });
    }
    await updateShoppingList();
  };

  const handlePurchaseToggle = async (ingredientKey) => {
    const updatedShoppingList = shoppingList.map(item => {
      if (`${item.name}-${item.unit}` === ingredientKey) {
        return { ...item, purchased: !item.purchased };
      }
      return item;
    });
    setShoppingList(updatedShoppingList);

    try {
      const shoppingListDocRef = doc(db, 'users', auth.currentUser.uid, 'shoppingLists', weekId);
      await setDoc(shoppingListDocRef, { items: updatedShoppingList }, { merge: true });
    } catch (err) {
      console.error('Erreur lors de la mise à jour de l\'état d\'achat : ', err);
      setError('Échec de la mise à jour de l\'état d\'achat.');
    }
  };

  const sendMealPlanEmails = async () => {
    setLoading(true);
    setEmailStatus('');
    try {
      const members = [
        ...(currentUserProfile && currentUserProfile.email ? [{
          id: currentUserProfile.id,
          fullName: currentUserProfile.fullName,
          email: currentUserProfile.email,
          age: currentUserProfile.age
        }] : []),
        ...familyMembers.filter(m => m.email)
      ];

      if (members.length === 0) {
        setEmailStatus('Aucun membre avec une adresse email valide.');
        setLoading(false);
        return;
      }

      const mealPlanDetails = Object.entries(mealPlan).reduce((acc, [day, dishId]) => {
        if (dishId) {
          const dish = dishes.find(d => d.id === dishId);
          acc[day] = dish ? dish.name : 'Aucun plat';
        } else {
          acc[day] = 'Aucun plat';
        }
        return acc;
      }, {});

      const response = await fetch('https://us-central1-todo-web-a57a0.cloudfunctions.net/sendMealPlanEmails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: auth.currentUser.uid,
          members,
          mealPlan: mealPlanDetails,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setEmailStatus('Emails envoyés avec succès !');
      } else {
        setEmailStatus(`Échec de l'envoi des emails : ${result.error || 'Erreur inconnue'}`);
      }
    } catch (err) {
      console.error('Erreur lors de l\'envoi des emails : ', err);
      setEmailStatus(`Erreur lors de l'envoi des emails : ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getAllIngredients = () => {
    const allIngredients = dishes.reduce((acc, dish) => {
      dish.ingredients.forEach(ing => {
        const key = `${ing.name}-${ing.unit}`;
        if (!acc[key]) {
          acc[key] = {
            name: ing.name,
            quantity: parseFloat(ing.quantity) || 0,
            unit: ing.unit,
          };
        } else {
          acc[key].quantity += parseFloat(ing.quantity) || 0;
        }
      });
      return acc;
    }, {});
    return Object.values(allIngredients);
  };

  const filteredDishes = selectedMember
    ? dishes.filter(dish => {
        const member = selectedMember === currentUserProfile?.id
          ? currentUserProfile
          : familyMembers.find(m => m.id === selectedMember);
        if (!member) return true;
        const memberRestrictions = [
          ...(member.medicalConditions || []),
          ...(member.otherMedicalCondition ? [member.otherMedicalCondition] : []),
        ].filter(Boolean);
        return memberRestrictions.every(restriction =>
          dish.dietaryRestrictions.includes(restriction) ||
          (restriction === 'Végétarien' && dish.dietaryRestrictions.includes('Végétalien')) ||
          restriction === 'Aucun'
        );
      })
    : dishes;

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger text-center mt-5">{error}</div>;
  }

  return (
    <div className="container my-5">
      <h2 className="mb-4 text-center">Tableau de Bord Familial</h2>
      {editingMember ? (
        <FamilyMemberForm
          member={editingMember}
          onSave={handleSaveEditedMember}
          onCancel={() => setEditingMember(null)}
          onDelete={handleDeleteMember}
        />
      ) : showDishForm ? (
        <DishForm
          dish={editingDish}
          onSave={editingDish ? handleSaveEditedDish : handleAddDish}
          onCancel={() => {
            setShowDishForm(false);
            setEditingDish(null);
          }}
          onDelete={editingDish ? handleDeleteDish : null}
          isNew={!editingDish}
        />
      ) : showIngredientForm ? (
        <IngredientForm
          ingredient={editingIngredient}
          onSave={editingIngredient ? handleSaveEditedIngredient : handleAddIngredient}
          onCancel={() => {
            setShowIngredientForm(false);
            setEditingIngredient(null);
          }}
          onDelete={editingIngredient ? handleDeleteIngredient : null}
          isNew={!editingIngredient}
        />
      ) : (
        <div className="row">
          <div className="col-12">
            {currentUserProfile && (
              <div className="card mb-3 member-card">
                <div className="card-body d-flex align-items-center">
                  {currentUserProfile.profilePic && (
                    <img src={currentUserProfile.profilePic} alt={currentUserProfile.fullName} className="profile-pic-preview me-3" />
                  )}
                  <div className="flex-grow-1">
                    <h3 className="card-title">{currentUserProfile.fullName} (Vous)</h3>
                    <p className="card-text">Âge: {currentUserProfile.age}</p>
                    <p className="card-text">Sexe: {currentUserProfile.gender}</p>
                    <p className="card-text">Email: {currentUserProfile.email}</p>
                    <p className="card-text">Rôle: {currentUserProfile.role?.join(', ')}</p>
                    <p className="card-text">Antécédents: {currentUserProfile.medicalConditions?.join(', ')}</p>
                  </div>
                  <button className="btn btn-warning edit-btn" onClick={() => handleEditMember(currentUserProfile)}>
                    Modifier
                  </button>
                </div>
              </div>
            )}
          </div>

          {familyMembers.length > 0 && <h3 className="mt-4">Autres Membres de la Famille</h3>}
          <div className="row">
            {familyMembers.map((member) => (
              <div key={member.id} className="col-md-6 col-lg-4 mb-3">
                <div className="card member-card">
                  <div className="card-body d-flex align-items-center">
                    {member.profilePic && <img src={member.profilePic} alt={member.fullName} className="profile-pic-preview me-3" />}
                    <div className="flex-grow-1">
                      <h3 className="card-title">{member.fullName}</h3>
                      <p className="card-text">Âge: {member.age}</p>
                      <p className="card-text">Sexe: {member.gender}</p>
                      {member.email && <p className="card-text">Email: {member.email}</p>}
                      <p className="card-text">Rôle: {member.role?.join(', ')}</p>
                      <p className="card-text">Antécédents: {member.medicalConditions?.join(', ')}</p>
                    </div>
                    <div className="d-hook gap-2">
                      <button className="btn btn-warning edit-btn" onClick={() => handleEditMember(member)}>
                        Modifier
                      </button>
                      <button className="btn btn-danger delete-btn" onClick={() => handleDeleteMember(member.id)}>
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <h3 className="mt-4">Filtrer les Plats par Membre</h3>
          <select
            className="form-select mb-4"
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
          >
            <option value="">Tous les plats</option>
            {currentUserProfile && (
              <option value={currentUserProfile.id}>{currentUserProfile.fullName} (Vous)</option>
            )}
            {familyMembers.map((member) => (
              <option key={member.id} value={member.id}>{member.fullName}</option>
            ))}
          </select>

          <h3 className="mt-4">Plats Préparés Fréquemment</h3>
          <div className="row">
            {filteredDishes.length > 0 ? (
              filteredDishes.map((dish) => (
                <div key={dish.id} className="col-md-6 col-lg-4 mb-3">
                  <div className="card dish-card">
                    <div className="card-body d-flex align-items-center">
                      {dish.image && <img src={dish.image} alt={dish.name} className="profile-pic-preview me-3" />}
                      <div className="flex-grow-1">
                        <h3 className="card-title">{dish.name}</h3>
                        <p className="card-text">Type: {dish.type}</p>
                        <p className="card-text">Ingrédients: {dish.ingredients.map(ing => `${ing.name} (${ing.quantity} ${ing.unit})`).join(', ')}</p>
                        {dish.instructions && <p className="card-text">Instructions: {dish.instructions}</p>}
                        <p className="card-text">Temps de préparation: {dish.prepTime} minutes</p>
                        <p className="card-text">Restrictions: {dish.dietaryRestrictions.join(', ') || 'Aucune'}</p>
                      </div>
                      <div className="d-flex gap-2">
                        <button className="btn btn-warning edit-btn" onClick={() => handleEditDish(dish)}>
                          Modifier
                        </button>
                        <button className="btn btn-danger delete-btn" onClick={() => handleDeleteDish(dish.id)}>
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="col-12">Aucun plat compatible pour ce membre.</p>
            )}
          </div>

          <h3 className="mt-4">Liste de Tous les Ingrédients</h3>
          {getAllIngredients().length > 0 ? (
            <div className="row">
              {getAllIngredients().map((item, index) => (
                <div key={index} className="col-md-6 col-lg-4 mb-3">
                  <div className="card ingredient-card">
                    <div className="card-body">
                      <p className="card-text">{item.name}: {item.quantity} {item.unit}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>Aucun ingrédient requis par les plats.</p>
          )}

          <h3 className="mt-4">Inventaire des Ingrédients</h3>
          <div className="row">
            {ingredients.length > 0 ? (
              ingredients.map((ingredient) => (
                <div key={ingredient.id} className="col-md-6 col-lg-4 mb-3">
                  <div className="card ingredient-card">
                    <div className="card-body d-flex align-items-center">
                      <div className="flex-grow-1">
                        <h3 className="card-title">{ingredient.name}</h3>
                        <p className="card-text">Quantité: {ingredient.quantity} {ingredient.unit}</p>
                        <p className="card-text">Prix unitaire: {ingredient.price} FCFA</p>
                        <p className="card-text">Catégorie: {ingredient.category}</p>
                        {ingredient.expirationDate && <p className="card-text">Date d'expiration: {ingredient.expirationDate}</p>}
                        {ingredient.notes && <p className="card-text">Notes: {ingredient.notes}</p>}
                      </div>
                      <div className="d-flex gap-2">
                        <button className="btn btn-warning edit-btn" onClick={() => handleEditIngredient(ingredient)}>
                          Modifier
                        </button>
                        <button className="btn btn-danger delete-btn" onClick={() => handleDeleteIngredient(ingredient.id)}>
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="col-12">Aucun ingrédient dans l'inventaire.</p>
            )}
          </div>
          <button
            className="btn btn-primary mb-4"
            onClick={() => {
              setShowIngredientForm(true);
              setEditingIngredient(null);
            }}
          >
            Ajouter un Ingrédient
          </button>

          <h3 className="mt-4">Plan de Repas Hebdomadaire</h3>
          <div className="d-flex gap-3 mb-4">
            <button className="btn btn-primary" onClick={generateMealPlan}>
              Générer le Plan de Repas
            </button>
            <button className="btn btn-primary" onClick={sendMealPlanEmails} disabled={loading}>
              Envoyer le Plan à la Famille
            </button>
          </div>
          {emailStatus && (
            <p className={`mb-4 ${emailStatus.includes('succès') ? 'text-success' : 'text-danger'}`}>
              {emailStatus}
            </p>
          )}
          <div className="meal-plan">
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
              <div key={day} className="row g-2 mb-2 meal-plan-day">
                <label className="col-md-2 col-form-label text-md-end">{day.charAt(0).toUpperCase() + day.slice(1)}</label>
                <div className="col-md-10">
                  <select
                    className="form-select"
                    value={mealPlan[day] || ''}
                    onChange={(e) => handleMealPlanChange(day, e.target.value)}
                  >
                    <option value="">Aucun plat</option>
                    {filteredDishes.map((dish) => (
                      <option key={dish.id} value={dish.id}>{dish.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <h3 className="mt-4">Liste de Courses</h3>
          {shoppingList.length > 0 ? (
            <div className="shopping-list">
              {shoppingList.map((item) => (
                <div
                  key={`${item.name}-${item.unit}`}
                  className={`row g-2 mb-2 shopping-item ${item.purchased ? 'purchased' : ''}`}
                >
                  <div className="col-md-1 d-flex align-items-center">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={item.purchased}
                      onChange={() => handlePurchaseToggle(`${item.name}-${item.unit}`)}
                    />
                  </div>
                  <div className="col-md-4 d-flex align-items-center">
                    <p className="mb-0">{item.name}: {item.quantity} {item.unit}</p>
                  </div>
                  <div className="col-md-4 d-flex align-items-center">
                    <label className="form-label mb-0 me-2">Prix unitaire (FCFA):</label>
                    <input
                      type="number"
                      className="form-control w-auto"
                      value={item.price}
                      onChange={(e) => handlePriceChange(`${item.name}-${item.unit}`, e.target.value)}
                      min="0"
                      step="1"
                    />
                  </div>
                  <div className="col-md-3 d-flex align-items-center">
                    <p className="mb-0">Coût: {(item.quantity * item.price).toFixed(0)} FCFA</p>
                  </div>
                </div>
              ))}
              <h4 className="mt-3">
                Coût total: {shoppingList.reduce((sum, item) => sum + (item.purchased ? 0 : item.quantity * item.price), 0).toFixed(0)} FCFA
              </h4>
            </div>
          ) : (
            <p>Aucun ingrédient à acheter.</p>
          )}

          <div className="d-flex gap-3 mt-4">
            <button className="btn btn-primary" onClick={() => navigate('/setup-family')}>
              Ajouter un Nouveau Membre
            </button>
            <button className="btn btn-primary" onClick={() => setShowDishForm(true)}>
              Ajouter un Plat
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyDashboard;