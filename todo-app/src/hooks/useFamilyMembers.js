import { useState, useEffect } from "react"
import { setupMembersListener, addMember, updateMember, deleteMember } from "../services/firebaseService"

export const useFamilyMembers = (userId) => {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!userId) return

    const unsubscribe = setupMembersListener(userId, (newMembers) => {
      setMembers(newMembers)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [userId])

  const addNewMember = async (memberData) => {
    try {
      await addMember(userId, memberData)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const editMember = async (memberId, memberData) => {
    try {
      await updateMember(userId, memberId, memberData)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const removeMember = async (memberId) => {
    try {
      await deleteMember(userId, memberId)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  return {
    members,
    loading,
    error,
    addNewMember,
    editMember,
    removeMember
  }
} 