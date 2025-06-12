"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { HiOutlineUser, HiOutlineCake, HiOutlineUserGroup, HiOutlineMail, HiOutlinePhotograph, HiOutlinePlus, HiOutlineTrash, HiOutlineHeart } from "react-icons/hi"
import { toast } from "react-hot-toast"

const FamilyMemberForm = ({ member, onSave, onCancel, onDelete, isNew = false }) => {
  const [fullName, setFullName] = useState(member?.fullName || "")
  const [age, setAge] = useState(member?.age || "")
  const [gender, setGender] = useState(member?.gender || "")
  const [medicalConditions, setMedicalConditions] = useState(member?.medicalConditions || [])
  const [otherMedicalCondition, setOtherMedicalCondition] = useState(member?.otherMedicalCondition || "")
  const [role, setRole] = useState(member?.role || [])
  const [otherRole, setOtherRole] = useState(member?.otherRole || "")
  const [email, setEmail] = useState(member?.email || "")
  const [profilePic, setProfilePic] = useState(member?.profilePic || null)
  const [profilePicPreview, setProfilePicPreview] = useState(member?.profilePic || "")
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

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

  const familyRoles = ["Mère", "Père", "Enfant", "Grand-parent", "Conjoint(e)", "Frère/Sœur"]

  const isEmailDisabled = Number.parseInt(age) < 5

  useEffect(() => {
    if (member) {
      setFullName(member.fullName || "")
      setAge(member.age || "")
      setGender(member.gender || "")
      setMedicalConditions(member.medicalConditions || [])
      setOtherMedicalCondition(member.otherMedicalCondition || "")
      setRole(member.role || [])
      setOtherRole(member.otherRole || "")
      setEmail(member.email || "")
      setProfilePic(member.profilePic || null)
      setProfilePicPreview(member.profilePic || "")
    }
  }, [member])

  const validateForm = () => {
    const newErrors = {}

    if (!fullName.trim()) {
      newErrors.fullName = "Le nom est requis"
    }
    if (!age || age < 0) {
      newErrors.age = "L'âge est requis et doit être positif"
    }
    if (!gender) {
      newErrors.gender = "Le sexe est requis"
    }
    if (role.length === 0) {
      newErrors.role = "Au moins un rôle est requis"
    }
    if (!isEmailDisabled && email && !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email invalide"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

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

  const handleSave = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    const memberData = {
      ...(isNew ? {} : { id: member?.id }),
      fullName,
      age: Number.parseInt(age),
      gender,
      email: isEmailDisabled ? "" : email,
      medicalConditions: medicalConditions.includes("Autres")
        ? [...medicalConditions.filter((c) => c !== "Autres"), otherMedicalCondition]
        : medicalConditions,
      role: role.includes("Autres") ? [...role.filter((r) => r !== "Autres"), otherRole] : role,
      profilePic: profilePic || "",
    }

    if (medicalConditions.includes("Autres") && otherMedicalCondition) {
      memberData.otherMedicalCondition = otherMedicalCondition
    }

    if (role.includes("Autres") && otherRole) {
      memberData.otherRole = otherRole
    }

    try {
      await onSave(memberData)
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (onDelete && member?.id && window.confirm("Êtes-vous sûr de vouloir supprimer ce membre ?")) {
      setLoading(true)
      try {
        await onDelete(member.id)
      } catch (error) {
        console.error("Erreur lors de la suppression:", error)
      } finally {
        setLoading(false)
      }
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
              <HiOutlineUserGroup className="w-12 h-12 mx-auto text-indigo-600 mb-4" />
              <h2 className="text-3xl font-bold text-gray-800">
                {isNew ? "Ajouter un Membre de la Famille" : "Modifier le Membre de la Famille"}
              </h2>
              <p className="text-gray-600 mt-2">Complétez les informations du membre</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                  <div className="relative">
                    <HiOutlineUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      className={`w-full pl-10 pr-4 py-2 border ${
                        errors.fullName ? "border-red-500" : fullName ? "border-green-500" : "border-gray-300"
                      } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Âge</label>
                  <div className="relative">
                    <HiOutlineCake className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      className={`w-full pl-10 pr-4 py-2 border ${
                        errors.age ? "border-red-500" : age ? "border-green-500" : "border-gray-300"
                      } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      min="0"
                      required
                      disabled={loading}
                    />
                  </div>
                  {errors.age && <p className="mt-1 text-sm text-red-600">{errors.age}</p>}
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
                {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
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
                  Rôle dans la famille
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
                    placeholder="Veuillez spécifier le rôle"
                    value={otherRole}
                    onChange={(e) => setOtherRole(e.target.value)}
                    required={role.includes("Autres")}
                    disabled={loading}
                  />
                )}
                {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <HiOutlineMail className="inline-block w-5 h-5 mr-1" />
                  Email {!isEmailDisabled && "*"}
                </label>
                <div className="relative">
                  <HiOutlineMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    className={`w-full pl-10 pr-4 py-2 border ${
                      errors.email ? "border-red-500" : email ? "border-green-500" : "border-gray-300"
                    } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isEmailDisabled || loading}
                    required={!isEmailDisabled}
                  />
                </div>
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <HiOutlinePhotograph className="inline-block w-5 h-5 mr-1" />
                  Photo de Profil (optionnel)
                </label>
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
                      <HiOutlinePhotograph className="w-5 h-5" />
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

              <div className="flex justify-end space-x-4 pt-4">
                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={loading}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                  >
                    Annuler
                  </button>
                )}
                {onDelete && !isNew && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={loading}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200 flex items-center"
                  >
                    <HiOutlineTrash className="w-5 h-5 mr-2" />
                    Supprimer
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 flex items-center"
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
                    <>
                      <HiOutlinePlus className="w-5 h-5 mr-2" />
                      {isNew ? "Ajouter" : "Mettre à jour"}
                    </>
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

export default FamilyMemberForm
