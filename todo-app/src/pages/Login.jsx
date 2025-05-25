import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth, googleProvider, db } from '../firebase';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';

const Login = ({ setIsAuth }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSuccessfulAuth = async (user) => {
    setIsAuth(true);
    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists() || !userDocSnap.data().completedProfile) {
      navigate('/complete-profile');
    } else {
      navigate('/family-dashboard');
    }
  };

  const signInWithEmailAndPasswordHandler = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await handleSuccessfulAuth(userCredential.user);
    } catch (error) {
      alert('Erreur de connexion : ' + error.message);
      console.log(error);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      await handleSuccessfulAuth(userCredential.user);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="container my-5">
      <h2 className="mb-4 text-center">Connexion</h2>
      <div className="form-container">
        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            id="email"
            required
            placeholder="Votre Email..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">Mot de passe</label>
          <input
            type="password"
            className="form-control"
            id="password"
            required
            placeholder="Votre Mot de Passe..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <small className="form-text text-muted mb-3 d-block">
          Le mot de passe doit contenir au moins 6 caractères.
        </small>
        <button className="btn btn-primary w-100 mb-3" onClick={signInWithEmailAndPasswordHandler}>
          Se Connecter
        </button>
        <button className="btn sign-in-with-google w-100 mb-3" onClick={signInWithGoogle}>
          Se Connecter avec Google
        </button>
        <p className="text-center">
          Vous n'avez pas de compte ? <Link to="/signup">S'inscrire</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;