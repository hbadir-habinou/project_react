"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { auth, googleProvider, db } from "../firebase"
import { createUserWithEmailAndPassword, signInWithPopup, signInAnonymously } from "firebase/auth"
import { useNavigate } from "react-router-dom"
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore"
import { useLanguage } from "../contexts/LanguageContext"
import ProfileSelection from "./ProfileSelection"
import { motion } from "framer-motion"
import { FcGoogle } from "react-icons/fc"
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineUserGroup } from "react-icons/hi"

const SignUp = ({ setIsAuth }) => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [familyCode, setFamilyCode] = useState("")
  const [showFamilyCodeInput, setShowFamilyCodeInput] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [members, setMembers] = useState([])
  const [showProfileSelection, setShowProfileSelection] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [isGuestMode, setIsGuestMode] = useState(false)

  const fetchFamilyMembers = async (familyCode) => {
    try {
      const membersCollection = collection(db, "families", familyCode, "members")
      const membersSnapshot = await getDocs(membersCollection)
      const membersList = membersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setMembers(membersList)
      console.log("Membres récupérés:", membersList)
      return membersList.length > 0
    } catch (err) {
      setError("Erreur lors de la récupération des membres : " + err.message)
      return false
    }
  }

  // Fonction pour l'accès direct avec code familial
  const handleFamilyCodeAccess = async () => {
    if (!familyCode.trim()) {
      setError("Veuillez entrer un code familial")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Vérifier si la famille existe
      const familyDoc = await getDoc(doc(db, "families", familyCode))
      if (!familyDoc.exists()) {
        setError("Code familial invalide")
        setLoading(false)
        return
      }

      // Récupérer les membres automatiquement
      const hasMembers = await fetchFamilyMembers(familyCode)
      if (hasMembers) {
        // Créer un utilisateur anonyme pour l'accès invité
        const userCredential = await signInAnonymously(auth)
        setCurrentUser(userCredential.user)
        setIsAuth(true)
        setIsGuestMode(true)
        setShowProfileSelection(true)
        setLoading(false)
        return
      }

      setError("Aucun membre trouvé dans cette famille")
      setLoading(false)
    } catch (err) {
      setError("Erreur lors de l'accès à la famille : " + err.message)
      setLoading(false)
    }
  }

  const handleSuccessfulAuth = async (user) => {
    setIsAuth(true)
    setCurrentUser(user)

    // Si l'utilisateur a coché "Accéder avec un code famille", traiter comme mode invité
    if (showFamilyCodeInput && familyCode.trim()) {
      try {
        // Vérifier si la famille existe
        const familyDoc = await getDoc(doc(db, "families", familyCode))
        if (!familyDoc.exists()) {
          setError("Code familial invalide")
          setLoading(false)
          return
        }

        // Récupérer les membres automatiquement
        const hasMembers = await fetchFamilyMembers(familyCode)
        if (hasMembers) {
          setIsGuestMode(false) // Utilisateur authentifié avec code famille, pas invité
          setShowProfileSelection(true)
          setLoading(false)
          return
        }

        setError("Aucun membre trouvé dans cette famille")
        setLoading(false)
        return
      } catch (err) {
        setError("Erreur lors de la connexion à la famille : " + err.message)
        setLoading(false)
        return
      }
    } else {
      // Inscription normale sans code famille - ACCÈS COMPLET
      navigate("/complete-profile")
    }
  }

  const handleProfileSelect = async (member) => {
    if (!currentUser) return

    try {
      setLoading(true)

      if (isGuestMode) {
        // Mode invité - accès en lecture seule
        try {
          // Récupérer directement les informations de la famille
          const familyDoc = await getDoc(doc(db, "families", familyCode))

          if (!familyDoc.exists()) {
            throw new Error("Famille non trouvée")
          }

          const familyData = familyDoc.data()
          const adminUserId = familyData.adminId || familyData.createdBy

          if (!adminUserId) {
            throw new Error("Impossible de déterminer l'administrateur de la famille")
          }

          const guestUserData = {
            email: `guest_${Date.now()}@family.local`,
            familyCode: familyCode,
            fullName: member.fullName,
            age: member.age,
            gender: member.gender,
            role: "guest",
            medicalConditions: member.medicalConditions || [],
            profilePic: member.profilePic || null,
            completedProfile: true,
            selectedMemberId: member.id,
            isReadOnly: true,
            isGuest: true,
            adminUserId: adminUserId,
            connectionType: "family_code",
          }

          // Créer le profil utilisateur temporaire pour l'invité
          const userDocRef = doc(db, "users", currentUser.uid)
          await setDoc(userDocRef, guestUserData, { merge: true })

          // Stocker également dans le localStorage pour la persistance
          localStorage.setItem("guestUserData", JSON.stringify(guestUserData))
          localStorage.setItem("guestFamilyCode", familyCode)
          localStorage.setItem("guestAdminUserId", adminUserId)
          localStorage.setItem("connectionType", "family_code")
        } catch (err) {
          setError("Erreur lors de la configuration du mode invité : " + err.message)
          setLoading(false)
          return
        }
      } else {
        // Mode normal avec authentification - sélection d'un profil existant = lecture seule
        const userDocRef = doc(db, "users", currentUser.uid)
        await setDoc(
          userDocRef,
          {
            email: currentUser.email,
            familyCode: familyCode,
            fullName: member.fullName,
            age: member.age,
            gender: member.gender,
            role: member.role || "member",
            medicalConditions: member.medicalConditions || [],
            profilePic: member.profilePic || null,
            completedProfile: true,
            selectedMemberId: member.id,
            isReadOnly: true, // Lecture seule car sélection d'un profil existant
            isGuest: false,
            connectionType: "authenticated_with_family_code",
          },
          { merge: true },
        )

        // Mettre à jour le membre dans la famille avec l'ID utilisateur actuel
        await setDoc(doc(db, "families", familyCode, "members", currentUser.uid), {
          ...member,
          email: currentUser.email,
          userId: currentUser.uid,
          lastLogin: new Date(),
        })

        localStorage.setItem("connectionType", "authenticated_with_family_code")
        localStorage.removeItem("guestUserData")
        localStorage.removeItem("guestFamilyCode")
        localStorage.removeItem("guestAdminUserId")
      }

      setShowProfileSelection(false)
      setLoading(false)

      // Redirection avec un petit délai pour l'effet visuel
      setTimeout(() => {
        navigate("/family-dashboard")
      }, 500)
    } catch (err) {
      setError("Erreur lors de la sélection du profil : " + err.message)
      setLoading(false)
    }
  }

  const signUpWithEmailAndPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      await handleSuccessfulAuth(userCredential.user)
    } catch (error) {
      setError("Erreur d'inscription : " + error.message)
      console.log(error)
    } finally {
      if (!showFamilyCodeInput) {
        setLoading(false)
      }
    }
  }

  const signUpWithGoogle = async () => {
    setLoading(true)
    setError("")

    try {
      const userCredential = await signInWithPopup(auth, googleProvider)
      await handleSuccessfulAuth(userCredential.user)
    } catch (error) {
      setError("Erreur d'inscription Google : " + error.message)
      console.log(error)
    } finally {
      if (!showFamilyCodeInput) {
        setLoading(false)
      }
    }
  }

  if (showProfileSelection) {
    return (
      <ProfileSelection
        members={members}
        onSelect={handleProfileSelect}
        onBack={() => {
          setShowProfileSelection(false)
          setIsGuestMode(false)
          setLoading(false)
        }}
        isGuestMode={isGuestMode}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="px-8 py-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800">Inscription</h2>
              <p className="text-gray-600 mt-2">Créez votre compte pour commencer</p>
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

            <div className="space-y-4">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFamilyCodeInput}
                  onChange={(e) => setShowFamilyCodeInput(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Accéder avec un code famille (mode invité)</span>
              </label>

              {showFamilyCodeInput ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-700">
                      Mode accès familial : Entrez simplement le code pour accéder au dashboard en lecture seule
                    </p>
                  </div>

                  <div className="relative">
                    <HiOutlineUserGroup className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Code familial"
                      value={familyCode}
                      onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
                      disabled={loading}
                      required
                    />
                  </div>

                  <button
                    onClick={handleFamilyCodeAccess}
                    disabled={loading || !familyCode.trim()}
                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
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
                        Accès en cours...
                      </div>
                    ) : (
                      "Accéder à la famille"
                    )}
                  </button>
                </div>
              ) : (
                <form onSubmit={signUpWithEmailAndPassword} className="space-y-4">
                  <div className="relative">
                    <HiOutlineMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                      placeholder="Votre Email..."
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="relative">
                    <HiOutlineLockClosed className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                      placeholder="Votre Mot de Passe..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <p className="text-sm text-gray-500">
                    Le mot de passe doit contenir au moins 6 caractères.
                  </p>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
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
                        Inscription...
                      </div>
                    ) : (
                      "S'inscrire"
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={signUpWithGoogle}
                    disabled={loading}
                    className="w-full bg-white text-gray-700 border border-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
                  >
                    <FcGoogle className="w-5 h-5 mr-2" />
                    S'inscrire avec Google
                  </button>
                </form>
              )}

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  {showFamilyCodeInput ? (
                    <>
                      Vous voulez créer un compte ?
                      <Link
                        to="/signup"
                        className="text-indigo-600 hover:text-indigo-500 ml-1 font-medium"
                        onClick={() => setShowFamilyCodeInput(false)}
                      >
                        Inscription normale
                      </Link>
                    </>
                  ) : (
                    <>
                      Vous avez déjà un compte ?
                      <Link to="/login" className="text-indigo-600 hover:text-indigo-500 ml-1 font-medium">
                        Se connecter
                      </Link>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default SignUp
