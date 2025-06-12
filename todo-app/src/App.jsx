"use client"

import { Routes, Route, Navigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { auth } from "./firebase"
import { onAuthStateChanged } from "firebase/auth"
import { LanguageProvider } from "./contexts/LanguageContext"
import { ThemeProvider } from "./contexts/ThemeContext"
import Home from "./pages/Home"
import Login from "./pages/Login"
import SignUp from "./pages/SignUp"
import FamilyDashboard from "./pages/FamilyDashboard"
import VendorDashboard from "./pages/VendorDashboard"
import VendorProfileForm from "./pages/VendorProfileForm"
import FamilyMemberSetup from "./pages/FamilyMemberSetup"
import UserProfileForm from "./pages/UserProfileForm"
import ProfileSelection from "./pages/ProfileSelection"

function App() {
  const [isAuth, setIsAuth] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuth(true)
        // Récupérer le rôle de l'utilisateur depuis le localStorage
        const role = localStorage.getItem('userRole')
        setUserRole(role)
      } else {
        setIsAuth(false)
        setUserRole(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  return (
    <LanguageProvider>
      <ThemeProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login setIsAuth={setIsAuth} />} />
          <Route path="/signup" element={<SignUp setIsAuth={setIsAuth} />} />
          <Route
            path="/family-dashboard"
            element={
              isAuth && userRole === 'family' ? (
                <FamilyDashboard />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/vendor-dashboard"
            element={
              isAuth && userRole === 'vendor' ? (
                <VendorDashboard />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/vendor-profile"
            element={
              isAuth && userRole === 'vendor' ? (
                <VendorProfileForm />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/family-member-setup"
            element={
              isAuth ? (
                <FamilyMemberSetup />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/complete-profile"
            element={
              isAuth ? (
                <UserProfileForm />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/profile-selection"
            element={
              isAuth ? (
                <ProfileSelection />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </ThemeProvider>
    </LanguageProvider>
  )
}

export default App
