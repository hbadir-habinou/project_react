import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { auth, db } from '../firebase'
import { doc, getDoc } from 'firebase/firestore'
import { useTheme } from '../contexts/ThemeContext'
import { useLanguage } from '../contexts/LanguageContext'

const Navbar = () => {
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [userProfile, setUserProfile] = useState(null)
  const { theme, toggleTheme } = useTheme()
  const { t, language, setLanguage } = useLanguage()
  const currentUser = auth.currentUser

  const logOutHandler = async () => {
    try {
      await auth.signOut()
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error)
    }
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/" className="navbar-logo">
            <img src="/logo.svg" alt="Logo" className="logo" />
            <span className="brand-name">FamilyMeal</span>
          </Link>
        </div>

        <div className="navbar-menu">
          {currentUser ? (
            <>
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

      {/* Modal Profil */}
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

export default Navbar 