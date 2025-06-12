import { auth, db } from "../firebase"
import { doc, getDoc, collection, onSnapshot, updateDoc, deleteDoc, addDoc, setDoc } from "firebase/firestore"

export const fetchUserData = async (userId) => {
  const userRef = doc(db, "users", userId)
  const userSnap = await getDoc(userRef)
  return userSnap.exists() ? userSnap.data() : null
}

export const setupMembersListener = (userId, callback) => {
  const membersRef = collection(db, `users/${userId}/familyMembers`)
  return onSnapshot(membersRef, (snapshot) => {
    const members = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    callback(members)
  })
}

export const setupDishesListener = (userId, callback) => {
  const dishesRef = collection(db, `users/${userId}/dishes`)
  return onSnapshot(dishesRef, (snapshot) => {
    const dishes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    callback(dishes)
  })
}

export const setupMealPlanListener = (userId, callback) => {
  const mealPlanRef = collection(db, `users/${userId}/mealPlan`)
  return onSnapshot(mealPlanRef, (snapshot) => {
    const mealPlan = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    callback(mealPlan)
  })
}

export const setupShoppingListListener = (userId, callback) => {
  const shoppingListRef = collection(db, `users/${userId}/shoppingList`)
  return onSnapshot(shoppingListRef, (snapshot) => {
    const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    callback(items)
  })
}

export const addMember = async (userId, memberData) => {
  const membersRef = collection(db, `users/${userId}/familyMembers`)
  return await addDoc(membersRef, { ...memberData, createdAt: new Date() })
}

export const updateMember = async (userId, memberId, memberData) => {
  const memberRef = doc(db, `users/${userId}/familyMembers/${memberId}`)
  return await updateDoc(memberRef, { ...memberData, updatedAt: new Date() })
}

export const deleteMember = async (userId, memberId) => {
  const memberRef = doc(db, `users/${userId}/familyMembers/${memberId}`)
  return await deleteDoc(memberRef)
}

// Fonctions similaires pour les plats, le plan de repas et la liste de courses
// ... autres fonctions Firebase 