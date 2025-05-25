import React from 'react'
import "./App.css"
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Home from "./pages/Home"
import UserProfileForm from './pages/UserProfileForm' // Nouveau
import FamilyMemberSetup from './pages/FamilyMemberSetup' // Nouveau
import FamilyDashboard from './pages/FamilyDashboard' // Nouveau
import { auth, db } from './firebase'
import { signOut } from "firebase/auth"
import { doc, getDoc } from 'firebase/firestore'
import { useEffect } from 'react'

function App() {
    const [isAuth, setIsAuth] = React.useState(false);
    const [hasCompletedProfile, setHasCompletedProfile] = React.useState(false); // Nouveau état pour vérifier si le profil est rempli

    useEffect(() => {
        const checkAuth = () => {
            const unsubscribe = auth.onAuthStateChanged(async (user) => {
                if (user) {
                    setIsAuth(true);
                    // Vérifier si l'utilisateur a déjà rempli son profil
                    const userDocRef = doc(db, "users", user.uid);
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists() && userDocSnap.data().completedProfile) {
                        setHasCompletedProfile(true);
                    } else {
                        setHasCompletedProfile(false);
                    }
                } else {
                    setIsAuth(false);
                    setHasCompletedProfile(false);
                }
            });
            return () => unsubscribe();
        };
        checkAuth();
    }, []);

    const logOutHandler = async () => {
        try {
            await signOut(auth);
            setIsAuth(false);
            setHasCompletedProfile(false);
            window.location.pathname = "/login"; // Rediriger vers la page de login après déconnexion
        } catch (err) {
            console.log(err);
        }
    };

    return (
        <BrowserRouter>
            <nav className="navbar navbar-expand-lg">
              <div className="container-fluid">
                <Link className="navbar-brand" to="/">FoodPlanner</Link>
                <button
                  className="navbar-toggler"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#navbarNav"
                  aria-controls="navbarNav"
                  aria-expanded="false"
                  aria-label="Toggle navigation"
                >
                  <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                  <ul className="navbar-nav ms-auto">
                    {isAuth && auth.currentUser && (
                      <li className="nav-item">
                        <span className="navbar-text text-capitalize me-3">
                          {auth.currentUser.email.split('@')[0]}
                        </span>
                      </li>
                    )}
                    {isAuth ? (
                      <li className="nav-item">
                        <button className="btn btn-danger" id="logout" onClick={logOutHandler}>
                          Déconnexion
                        </button>
                      </li>
                    ) : (
                      <>
                        <li className="nav-item">
                          <Link className="nav-link" to="/login">Connexion</Link>
                        </li>
                        <li className="nav-item">
                          <Link className="nav-link" to="/signup">Inscription</Link>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </nav>
            <Routes>
                <Route path='/' element={<Home isAuth={isAuth} hasCompletedProfile={hasCompletedProfile} />} />
                <Route path='/signup' element={<SignUp setIsAuth={setIsAuth} />} />
                <Route path='/login' element={<Login setIsAuth={setIsAuth} />} />
                {/* Routes conditionnelles pour le profil et les membres de la famille */}
                <Route path='/complete-profile' element={isAuth ? <UserProfileForm setHasCompletedProfile={setHasCompletedProfile} /> : <Login setIsAuth={setIsAuth} />} />
                <Route path='/setup-family' element={isAuth && hasCompletedProfile ? <FamilyMemberSetup /> : <Login setIsAuth={setIsAuth} />} />
                <Route path='/family-dashboard' element={isAuth && hasCompletedProfile ? <FamilyDashboard /> : <Login setIsAuth={setIsAuth} />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App