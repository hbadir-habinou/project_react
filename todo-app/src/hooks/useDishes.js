import { useState, useEffect } from "react"
import { setupDishesListener } from "../services/firebaseService"

export const useDishes = (userId) => {
  const [dishes, setDishes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!userId) return

    const unsubscribe = setupDishesListener(userId, (newDishes) => {
      setDishes(newDishes)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [userId])

  const addDish = async (dishData) => {
    try {
      // Implémentation à faire
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const editDish = async (dishId, dishData) => {
    try {
      // Implémentation à faire
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const deleteDish = async (dishId) => {
    try {
      // Implémentation à faire
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  return {
    dishes,
    loading,
    error,
    addDish,
    editDish,
    deleteDish
  }
} 