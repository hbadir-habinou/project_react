"use client"

import { useState, useEffect, createContext, useContext } from "react"
import "./App.css"
import { Routes, Route, Link } from "react-router-dom"
import Login from "./pages/Login"
import SignUp from "./pages/SignUp"
import Home from "./pages/Home"
import UserProfileForm from "./pages/UserProfileForm"
import FamilyMemberSetup from "./pages/FamilyMemberSetup"
import FamilyDashboard from "./pages/FamilyDashboard"
import { auth, db } from "./firebase"
import { signOut } from "firebase/auth"
import { doc, getDoc, collection, getDocs } from "firebase/firestore"
import { LanguageProvider, useLanguage } from "./contexts/LanguageContext"

// Context pour le thème
const ThemeContext = createContext()

// Hook pour le thème
export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

// Composant Navbar amélioré
const Navbar = () => {
  const { theme, toggleTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()
  const [isAuth, setIsAuth] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setIsAuth(!!user)
      setCurrentUser(user)
      if (user) {
        const userDocRef = doc(db, "users", user.uid)
        const userDocSnap = await getDoc(userDocRef)
        if (userDocSnap.exists()) {
          setUserProfile(userDocSnap.data())
        }
      } else {
        setUserProfile(null)
      }
    })
    return () => unsubscribe()
  }, [])

  const logOutHandler = async () => {
    try {
      await signOut(auth)
      setIsAuth(false)
      setCurrentUser(null)
      setUserProfile(null)
      window.location.pathname = "/login"
    } catch (err) {
      console.log(err)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      try {
        const dishesCollectionRef = collection(db, "users", auth.currentUser.uid, "dishes")
        const querySnapshot = await getDocs(dishesCollectionRef)
        const matchingDishes = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((dish) => {
            const searchLower = searchQuery.toLowerCase()
            const nameMatch = dish.name.toLowerCase().includes(searchLower)
            const aliasMatch = dish.aliases?.some((alias) => alias.toLowerCase().includes(searchLower)) || false
            return nameMatch || aliasMatch
          })
        console.log("Résultats de recherche:", matchingDishes)
      } catch (err) {
        console.error("Erreur de recherche:", err)
      }
    }
  }

  return (
    <nav className="modern-navbar">
      <div className="navbar-container">
        <Link className="navbar-brand" to="/">
          <div className="brand-icon">
            <i className="fas fa-utensils"></i>
          </div>
          <span className="brand-text">{t("app.title")}</span>
        </Link>

        <div className="navbar-content">
          <ul className="navbar-nav">
            {isAuth && (
              <li className="nav-item">
                <Link className="nav-link" to="/family-dashboard">
                  <i className="fas fa-tachometer-alt me-1"></i>
                  {t("nav.dashboard")}
                </Link>
              </li>
            )}
          </ul>

          <div className="navbar-actions">
            {isAuth && currentUser ? (
              <>
                <form className="search-form" onSubmit={handleSearch}>
                  <div className="search-input-container">
                    <input
                      className="search-input"
                      type="search"
                      placeholder={t("nav.search")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button className="search-button" type="submit">
                      <i className="fas fa-search"></i>
                    </button>
                  </div>
                </form>

                <div className="user-menu">
                  <button className="user-menu-trigger" data-bs-toggle="dropdown">
                    <img
                      src={userProfile?.profilePic || "/placeholder.svg?height=32&width=32"}
                      alt="Profile"
                      className="user-avatar"
                    />
                    <span className="user-name">{currentUser.email?.split("@")[0] || "Utilisateur"}</span>
                    <i className="fas fa-chevron-down"></i>
                  </button>

                  <ul className="dropdown-menu">
                    <li>
                      <button className="dropdown-item" onClick={() => setShowProfileModal(true)}>
                        <i className="fas fa-user me-2"></i>
                        {t("profile.view")}
                      </button>
                    </li>
                    <li>
                      <button className="dropdown-item" onClick={() => setLanguage(language === "fr" ? "en" : "fr")}>
                        <i className="fas fa-globe me-2"></i>
                        {language === "fr" ? t("language.en") : t("language.fr")}
                      </button>
                    </li>
                    <li>
                      <button className="dropdown-item" onClick={toggleTheme}>
                        <i className={`fas ${theme === "light" ? "fa-moon" : "fa-sun"} me-2`}></i>
                        {theme === "light" ? t("theme.dark") : t("theme.light")}
                      </button>
                    </li>
                    <li>
                      <hr className="dropdown-divider" />
                    </li>
                    <li>
                      <button className="dropdown-item text-danger" onClick={logOutHandler}>
                        <i className="fas fa-sign-out-alt me-2"></i>
                        {t("nav.logout")}
                      </button>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="auth-buttons">
                <Link className="btn btn-outline-primary" to="/login">
                  {t("nav.login")}
                </Link>
                <Link className="btn btn-primary" to="/signup">
                  {t("nav.signup")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Profil amélioré */}
      {showProfileModal && userProfile && (
        <div className="profile-modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h5 className="profile-modal-title">{t("profile.view")}</h5>
              <button className="profile-modal-close" onClick={() => setShowProfileModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="profile-modal-body">
              <div className="profile-avatar-section">
                <img
                  src={userProfile.profilePic || "/placeholder.svg?height=100&width=100"}
                  alt={userProfile.fullName}
                  className="profile-avatar-large"
                />
                <h5 className="profile-name">{userProfile.fullName || userProfile.email?.split("@")[0] || "Utilisateur"}</h5>
              </div>

              <div className="profile-details">
                <div className="profile-detail-item">
                  <strong>{t("profile.email")}:</strong>
                  <span>{userProfile.email || "N/A"}</span>
                </div>
                <div className="profile-detail-item">
                  <strong>{t("profile.age")}:</strong>
                  <span>{userProfile.age || "N/A"} ans</span>
                </div>
                <div className="profile-detail-item">
                  <strong>{t("profile.gender")}:</strong>
                  <span>{userProfile.gender || "N/A"}</span>
                </div>
                <div className="profile-detail-item">
                  <strong>{t("profile.role")}:</strong>
                  <span>{Array.isArray(userProfile.role) ? userProfile.role.join(", ") : userProfile.role || "Aucun"}</span>
                </div>
                <div className="profile-detail-item">
                  <strong>{t("profile.medicalConditions")}:</strong>
                  <span>{userProfile.medicalConditions?.join(", ") || "Aucun"}</span>
                </div>
              </div>
            </div>

            <div className="profile-modal-footer">
              <Link to="/user-profile-form" className="btn btn-warning" onClick={() => setShowProfileModal(false)}>
                <i className="fas fa-edit me-1"></i>
                {t("profile.edit")}
              </Link>
              <button className="btn btn-secondary" onClick={() => setShowProfileModal(false)}>
                {t("profile.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

function App() {
  const [isAuth, setIsAuth] = useState(false)
  const [hasCompletedProfile, setHasCompletedProfile] = useState(false)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light"
  })

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
    localStorage.setItem("theme", theme)
  }, [theme])

  useEffect(() => {
    const checkAuth = () => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          setIsAuth(true)
          const userDocRef = doc(db, "users", user.uid)
          const userDocSnap = await getDoc(userDocRef)
          if (userDocSnap.exists() && userDocSnap.data().completedProfile) {
            setHasCompletedProfile(true)
          } else {
            setHasCompletedProfile(false)
          }
        } else {
          setIsAuth(false)
          setHasCompletedProfile(false)
        }
      })
      return () => unsubscribe()
    }
    checkAuth()
  }, [])

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"))
  }

  const themeValue = {
    theme,
    toggleTheme,
  }

  return (
    <ThemeContext.Provider value={themeValue}>
      <LanguageProvider>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home isAuth={isAuth} hasCompletedProfile={hasCompletedProfile} />} />
              <Route path="/signup" element={<SignUp setIsAuth={setIsAuth} />} />
              <Route path="/login" element={<Login setIsAuth={setIsAuth} />} />
              
              <Route
                path="/complete-profile"
                element={
                  isAuth ? (
                    <UserProfileForm setHasCompletedProfile={setHasCompletedProfile} />
                  ) : (
                    <Login setIsAuth={setIsAuth} />
                  )
                }
              />
              <Route
                path="/setup-family"
                element={isAuth && hasCompletedProfile ? <FamilyMemberSetup /> : <Login setIsAuth={setIsAuth} />}
              />
              <Route
                path="/family-dashboard"
                element={isAuth && hasCompletedProfile ? <FamilyDashboard /> : <Login setIsAuth={setIsAuth} />}
              />
            </Routes>
          </main>
        </div>
      </LanguageProvider>
    </ThemeContext.Provider>
  )
}

export default App
