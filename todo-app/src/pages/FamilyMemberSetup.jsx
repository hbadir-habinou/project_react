"use client"

import { useState, useEffect } from "react"
import { auth, db } from "../firebase"
import { collection, addDoc } from "firebase/firestore"
import { useNavigate } from "react-router-dom"
import FamilyMemberForm from "../components/FamilyMemberForm"
import { motion } from "framer-motion"
import { HiOutlineUserGroup, HiOutlinePlus, HiOutlineArrowRight, HiOutlineExclamation } from "react-icons/hi"
import { toast } from "react-hot-toast"

const FamilyMemberSetup = () => {
  const navigate = useNavigate()
  const [members, setMembers] = useState([])
  const [showNewMemberForm, setShowNewMemberForm] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!auth.currentUser) {
      navigate("/login")
    }
  }, [navigate])

  const handleAddMember = async (newMemberData) => {
    setLoading(true)
    setError("")
    try {
      if (!auth.currentUser) {
        throw new Error("Aucun utilisateur authentifié.")
      }
      const membersCollectionRef = collection(db, "users", auth.currentUser.uid, "familyMembers")
      const docRef = await addDoc(membersCollectionRef, {
        ...newMemberData,
        ownerId: auth.currentUser.uid,
        createdAt: new Date(),
      })
      setMembers((prevMembers) => [...prevMembers, { ...newMemberData, id: docRef.id }])
      setShowNewMemberForm(false)
      toast.success("Membre ajouté avec succès !")
    } catch (err) {
      console.error("Erreur détaillée lors de l'ajout du membre : ", err)
      setError(`Échec de l'ajout du membre : ${err.message}`)
      toast.error("Erreur lors de l'ajout du membre")
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = () => {
    navigate("/family-dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-8 sm:px-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
                <HiOutlineUserGroup className="w-8 h-8 text-indigo-600" />
                Configuration des Membres de la Famille
              </h2>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                <div className="flex items-center">
                  <HiOutlineExclamation className="w-5 h-5 text-red-500 mr-2" />
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            )}

            {members.length > 0 && (
              <div className="mb-8">
                <h4 className="text-xl font-semibold text-gray-900 text-center mb-6">
                  Membres ajoutés
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {members.map((member, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:border-indigo-200 transition-colors duration-200"
                    >
                      <div className="p-6 text-center">
                        {member.profilePic ? (
                          <img
                            src={member.profilePic}
                            alt={member.fullName}
                            className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-2 border-indigo-100"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-gray-100 flex items-center justify-center">
                            <HiOutlineUserGroup className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                        <h5 className="text-lg font-semibold text-gray-900 mb-2">{member.fullName}</h5>
                        <p className="text-gray-600 mb-1">
                          {member.age} ans
                        </p>
                        <p className="text-gray-600">
                          {member.role.join(", ")}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {showNewMemberForm ? (
              <FamilyMemberForm
                member={{}}
                onSave={handleAddMember}
                onCancel={() => setShowNewMemberForm(false)}
                isNew={true}
              />
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <button
                  onClick={() => setShowNewMemberForm(true)}
                  disabled={loading}
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <HiOutlinePlus className="w-5 h-5 mr-2" />
                  Ajouter un autre membre
                </button>
                <button
                  onClick={handleContinue}
                  disabled={loading}
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Chargement...
                    </>
                  ) : (
                    <>
                      <HiOutlineArrowRight className="w-5 h-5 mr-2" />
                      Continuer vers le Tableau de Bord
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default FamilyMemberSetup
