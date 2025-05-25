import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import FamilyMemberForm from '../components/FamilyMemberForm';

const FamilyMemberSetup = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [showNewMemberForm, setShowNewMemberForm] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/login');
    }
  }, [navigate]);

  const handleAddMember = async (newMemberData) => {
    setLoading(true);
    setError('');
    try {
      if (!auth.currentUser) {
        throw new Error('Aucun utilisateur authentifié.');
      }
      const membersCollectionRef = collection(db, 'users', auth.currentUser.uid, 'familyMembers');
      const docRef = await addDoc(membersCollectionRef, {
        ...newMemberData,
        ownerId: auth.currentUser.uid,
        createdAt: new Date(),
      });
      setMembers((prevMembers) => [...prevMembers, { ...newMemberData, id: docRef.id }]);
      setShowNewMemberForm(false);
    } catch (err) {
      console.error('Erreur détaillée lors de l\'ajout du membre : ', err);
      setError(`Échec de l'ajout du membre : ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    navigate('/family-dashboard');
  };

  return (
    <div className="form-container family-setup-page">
      <h2>Configuration des Membres de la Famille</h2>
      {error && <p className="error-message" style={{ color: 'red', marginBottom: '15px' }}>{error}</p>}

      {members.length > 0 && (
        <div style={{ marginBottom: '20px', width: '100%', textAlign: 'center' }}>
          <h3>Membres ajoutés :</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
            {members.map((member, index) => (
              <div key={index} className="member-card">
                {member.profilePic && <img src={member.profilePic} alt={member.fullName} className="profile-pic-preview" />}
                <div>
                  <h4>{member.fullName}</h4>
                  <p>Âge: {member.age}</p>
                  <p>Rôle: {member.role.join(', ')}</p>
                </div>
              </div>
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
        <div className="button-group" style={{ marginTop: '30px', width: '100%', justifyContent: 'center' }}>
          <button className="btn-secondary" onClick={() => setShowNewMemberForm(true)} disabled={loading}>
            Ajouter un autre membre
          </button>
          <button className="btn-primary" onClick={handleContinue} disabled={loading}>
            {loading ? 'Chargement...' : 'Continuer vers le Tableau de Bord'}
          </button>
        </div>
      )}
    </div>
  );
};

export default FamilyMemberSetup;