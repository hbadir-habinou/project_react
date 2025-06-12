"use client"

import { useState, useEffect } from "react"
import { auth, db } from "../firebase"
import { doc, setDoc } from "firebase/firestore"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { HiOutlineUser, HiOutlineMail, HiOutlinePhone, HiOutlineCake, HiOutlineHeart, HiOutlineUserGroup } from "react-icons/hi"
import { toast } from "react-hot-toast"

const UserProfileForm = ({ setHasCompletedProfile }) => {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState("")
  const [age, setAge] = useState("")
  const [gender, setGender] = useState("")
  const [medicalConditions, setMedicalConditions] = useState([])
  const [otherMedicalCondition, setOtherMedicalCondition] = useState("")
  const [role, setRole] = useState([])
  const [otherRole, setOtherRole] = useState("")
  const [profilePic, setProfilePic] = useState(null)
  const [profilePicPreview, setProfilePicPreview] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const medicalConditionsList = [
    "Diabète",
    "Hypertension",
    "Maladie cœliaque",
    "Allergie aux arachides",
    "Intolérance au lactose",
    "Végétarien",
    "Végétalien",
    "Aucun",
  ]

  const familyRoles = ["Mère", "Père", "Enfant", "Grand-parent"]

  useEffect(() => {
    if (auth.currentUser) {
      // Pré-remplir l'email si l'utilisateur est connecté
    } else {
      navigate("/login")
    }
  }, [navigate])

  const handleMedicalConditionChange = (e) => {
    const { value, checked } = e.target
    if (checked) {
      setMedicalConditions([...medicalConditions, value])
    } else {
      setMedicalConditions(medicalConditions.filter((condition) => condition !== value))
    }
  }

  const handleRoleChange = (e) => {
    const { value, checked } = e.target
    if (checked) {
      setRole([...role, value])
    } else {
      setRole(role.filter((r) => r !== value))
    }
  }

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePic(reader.result)
        setProfilePicPreview(reader.result)
      }
      reader.readAsDataURL(file)
    } else {
      setProfilePic(null)
      setProfilePicPreview("")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!auth.currentUser) {
      setError("Aucun utilisateur authentifié. Veuillez vous connecter.")
      setLoading(false)
      return
    }

    const userProfileData = {
      fullName,
      age: Number.parseInt(age),
      gender,
      email: auth.currentUser.email,
      medicalConditions: medicalConditions.includes("Autres")
        ? [...medicalConditions.filter((c) => c !== "Autres"), otherMedicalCondition]
        : medicalConditions,
      role: role.includes("Autres") ? [...role.filter((r) => r !== "Autres"), otherRole] : role,
      profilePic: profilePic,
      completedProfile: true,
      createdAt: new Date(),
      uid: auth.currentUser.uid,
    }

    try {
      await setDoc(doc(db, "users", auth.currentUser.uid), userProfileData, { merge: true })
      setHasCompletedProfile(true)
      navigate("/setup-family")
    } catch (err) {
      console.error("Erreur lors de l'enregistrement du profil: ", err)
      setError("Échec de l'enregistrement du profil. Veuillez réessayer.")
    } finally {
      setLoading(false)
    }
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
          <div className="px-8 py-6">
            <div className="text-center mb-8">
              <HiOutlineUser className="w-12 h-12 mx-auto text-indigo-600 mb-4" />
              <h2 className="text-3xl font-bold text-gray-800">Votre Profil Principal</h2>
              <p className="text-gray-600 mt-2">Complétez vos informations personnelles</p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                  <div className="relative">
                    <HiOutlineUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Âge</label>
                  <div className="relative">
                    <HiOutlineCake className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      min="0"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sexe</label>
                <div className="flex flex-wrap gap-4">
                  {["Homme", "Femme", "Autre"].map((option) => (
                    <label key={option} className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio text-indigo-600 focus:ring-indigo-500"
                        value={option}
                        checked={gender === option}
                        onChange={(e) => setGender(e.target.value)}
                        required={option !== "Autre"}
                        disabled={loading}
                      />
                      <span className="ml-2 text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <HiOutlineHeart className="inline-block w-5 h-5 mr-1" />
                  Antécédents Médicaux (liés à l'alimentation)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {medicalConditionsList.map((condition) => (
                    <label key={condition} className="inline-flex items-center">
                      <input
                        type="checkbox"
                        className="form-checkbox text-indigo-600 focus:ring-indigo-500"
                        value={condition}
                        checked={medicalConditions.includes(condition)}
                        onChange={handleMedicalConditionChange}
                        disabled={loading}
                      />
                      <span className="ml-2 text-gray-700">{condition}</span>
                    </label>
                  ))}
                </div>
                {medicalConditions.includes("Autres") && (
                  <input
                    type="text"
                    className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Veuillez spécifier d'autres conditions"
                    value={otherMedicalCondition}
                    onChange={(e) => setOtherMedicalCondition(e.target.value)}
                    required={medicalConditions.includes("Autres")}
                    disabled={loading}
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <HiOutlineUserGroup className="inline-block w-5 h-5 mr-1" />
                  Votre Rôle dans la famille
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {familyRoles.map((roleOption) => (
                    <label key={roleOption} className="inline-flex items-center">
                      <input
                        type="checkbox"
                        className="form-checkbox text-indigo-600 focus:ring-indigo-500"
                        value={roleOption}
                        checked={role.includes(roleOption)}
                        onChange={handleRoleChange}
                        disabled={loading}
                      />
                      <span className="ml-2 text-gray-700">{roleOption}</span>
                    </label>
                  ))}
                </div>
                {role.includes("Autres") && (
                  <input
                    type="text"
                    className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Veuillez spécifier votre rôle"
                    value={otherRole}
                    onChange={(e) => setOtherRole(e.target.value)}
                    required={role.includes("Autres")}
                    disabled={loading}
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Photo de Profil (optionnel)</label>
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 group-hover:border-indigo-500 transition-colors duration-200">
                      {profilePicPreview ? (
                        <img
                          src={profilePicPreview}
                          alt="Aperçu"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <HiOutlineUser className="w-16 h-16 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <label
                      htmlFor="profilePic"
                      className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700 transition-colors duration-200 shadow-lg"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </label>
                    <input
                      type="file"
                      id="profilePic"
                      className="hidden"
                      accept="image/*"
                      onChange={handleProfilePicChange}
                      disabled={loading}
                    />
                  </div>
                  <p className="text-sm text-gray-500 text-center">
                    Cliquez sur l'icône de caméra pour ajouter une photo
                  </p>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Enregistrement...
                    </div>
                  ) : (
                    "Enregistrer et Continuer"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default UserProfileForm
