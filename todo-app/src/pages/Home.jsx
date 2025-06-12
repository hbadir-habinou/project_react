"use client"

import { useEffect } from "react"
import { auth, db } from "../firebase"
import { doc, getDoc } from "firebase/firestore"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { FaUtensils } from "react-icons/fa"

const Home = (props) => {
  const navigate = useNavigate()

  useEffect(() => {
    const checkUserProfile = async () => {
      if (props.isAuth) {
        const userDocRef = doc(db, "users", auth.currentUser.uid)
        const userDocSnap = await getDoc(userDocRef)

        if (!userDocSnap.exists() || !userDocSnap.data().completedProfile) {
          navigate("/complete-profile")
        } else {
          navigate("/family-dashboard")
        }
      } else {
        navigate("/signup")
      }
    }

    const timer = setTimeout(() => {
      checkUserProfile()
    }, 500)

    return () => clearTimeout(timer)
  }, [props.isAuth, navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <FaUtensils className="w-24 h-24 mx-auto text-indigo-600 mb-6" />
          <h1 className="text-5xl font-bold text-gray-800 mb-4">FoodPlanner</h1>
          <p className="text-xl text-gray-600">Planification de repas familiale moderne et intuitive</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col items-center"
        >
          <div className="relative">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Chargement de votre espace familial...</p>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Home
