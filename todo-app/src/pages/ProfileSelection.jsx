"use client"

import { motion, AnimatePresence } from "framer-motion"
import { HiOutlineArrowLeft, HiOutlineUser } from "react-icons/hi"
import { useLanguage } from "../contexts/LanguageContext"
import { useState } from "react"
import { toast } from "react-hot-toast"

const ProfileSelection = ({ members, onSelect, onBack, isGuestMode = false }) => {
  const { t } = useLanguage()
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleProfileSelect = async (member) => {
    try {
      if (!member || !member.id) {
        throw new Error("Données du membre invalides")
      }

      setSelectedProfile(member)
      setIsLoading(true)

      // Appeler la fonction onSelect avec le membre sélectionné
      await onSelect(member)

    } catch (error) {
      console.error("Erreur lors de la sélection du profil:", error)
      setIsLoading(false)
      toast.error(error.message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto"
      >
        <div className="text-center mb-12">
          <motion.h2 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold text-white mb-4"
          >
            Qui est-ce ?
          </motion.h2>
          <motion.p 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-400 text-lg"
          >
            {isGuestMode
              ? "Sélectionnez votre profil pour accéder au dashboard en lecture seule"
              : "Sélectionnez votre profil pour continuer"}
          </motion.p>
        </div>

        <AnimatePresence>
          {!isLoading ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8"
            >
              {members.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleProfileSelect(member)}
                  className="group cursor-pointer"
                >
                  <div className="relative">
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-800 group-hover:ring-2 group-hover:ring-white transition-all duration-300">
                      {member.profilePic ? (
                        <img
                          src={member.profilePic}
                          alt={member.fullName}
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600">
                          <HiOutlineUser className="w-16 h-16 text-white opacity-80" />
                </div>
              )}
            </div>
                    <div className="mt-4 text-center">
                      <h3 className="text-xl font-medium text-white group-hover:text-indigo-400 transition-colors duration-300">
                        {member.fullName}
                      </h3>
                      <p className="text-gray-400 mt-1">{member.age} ans</p>
                      <p className="text-sm text-gray-500 mt-1 capitalize">{member.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <div className="relative">
                {selectedProfile?.profilePic ? (
                  <img
                    src={selectedProfile.profilePic}
                    alt={selectedProfile.fullName}
                    className="w-32 h-32 rounded-lg object-cover mb-6"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mb-6">
                    <HiOutlineUser className="w-16 h-16 text-white opacity-80" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
              <h3 className="text-2xl font-medium text-white mb-2">{selectedProfile?.fullName}</h3>
              <p className="text-gray-400">Accès au dashboard en lecture seule...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {!isLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 flex justify-center"
          >
        <button
          onClick={onBack}
              className="inline-flex items-center px-6 py-3 border border-gray-600 text-base font-medium rounded-lg text-white bg-transparent hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-300"
            >
              <HiOutlineArrowLeft className="w-5 h-5 mr-2" />
          Retour
        </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

export default ProfileSelection
