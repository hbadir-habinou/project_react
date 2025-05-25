import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const UserProfileForm = ({ setHasCompletedProfile }) => {
    const navigate = useNavigate();
    const [fullName, setFullName] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [medicalConditions, setMedicalConditions] = useState([]);
    const [otherMedicalCondition, setOtherMedicalCondition] = useState('');
    const [role, setRole] = useState([]);
    const [otherRole, setOtherRole] = useState('');
    const [profilePic, setProfilePic] = useState(null);
    const [profilePicPreview, setProfilePicPreview] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const medicalConditionsList = [
        "Diabète", "Hypertension", "Maladie cœliaque", "Allergie aux arachides",
        "Intolérance au lactose", "Végétarien", "Végétalien", "Aucun"
    ];

    const familyRoles = [
        "Mère", "Père", "Enfant", "Grand-parent"
    ];

    useEffect(() => {
        if (auth.currentUser) {
            // Pré-remplir l'email si l'utilisateur est connecté
            // L'email du profil principal est récupéré automatiquement par Firebase Auth
        } else {
            navigate('/login'); // Rediriger si non authentifié
        }
    }, [navigate]);

    const handleMedicalConditionChange = (e) => {
        const { value, checked } = e.target;
        if (checked) {
            setMedicalConditions([...medicalConditions, value]);
        } else {
            setMedicalConditions(medicalConditions.filter((condition) => condition !== value));
        }
    };

    const handleRoleChange = (e) => {
        const { value, checked } = e.target;
        if (checked) {
            setRole([...role, value]);
        } else {
            setRole(role.filter((r) => r !== value));
        }
    };

    const handleProfilePicChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePic(reader.result); // Base64 string
                setProfilePicPreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setProfilePic(null);
            setProfilePicPreview('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!auth.currentUser) {
            setError("Aucun utilisateur authentifié. Veuillez vous connecter.");
            setLoading(false);
            return;
        }

        const userProfileData = {
            fullName,
            age: parseInt(age),
            gender,
            email: auth.currentUser.email, // Email récupéré automatiquement
            medicalConditions: medicalConditions.includes("Autres") ? [...medicalConditions.filter(c => c !== "Autres"), otherMedicalCondition] : medicalConditions,
            role: role.includes("Autres") ? [...role.filter(r => r !== "Autres"), otherRole] : role,
            profilePic: profilePic, // Stocker l'image en Base64
            completedProfile: true, // Marquer le profil comme complété
            createdAt: new Date(),
            uid: auth.currentUser.uid // Assurez-vous d'avoir l'UID de l'utilisateur
        };

        try {
            await setDoc(doc(db, "users", auth.currentUser.uid), userProfileData, { merge: true });
            setHasCompletedProfile(true); // Mettre à jour l'état dans App.jsx
            navigate("/setup-family"); // Rediriger vers la configuration des membres de la famille
        } catch (err) {
            console.error("Erreur lors de l'enregistrement du profil: ", err);
            setError("Échec de l'enregistrement du profil. Veuillez réessayer.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container user-profile-form">
            <h2>Votre Profil Principal</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="fullName">Nom Complet :</label>
                    <input
                        type="text"
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="age">Âge :</label>
                    <input
                        type="number"
                        id="age"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        min="0"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Sexe :</label>
                    <div className="radio-group">
                        <label>
                            <input
                                type="radio"
                                value="Homme"
                                checked={gender === "Homme"}
                                onChange={(e) => setGender(e.target.value)}
                                required
                            /> Homme
                        </label>
                        <label>
                            <input
                                type="radio"
                                value="Femme"
                                checked={gender === "Femme"}
                                onChange={(e) => setGender(e.target.value)}
                                required
                            /> Femme
                        </label>
                        <label>
                            <input
                                type="radio"
                                value="Autre"
                                checked={gender === "Autre"}
                                onChange={(e) => setGender(e.target.value)}
                            /> Autre
                        </label>
                    </div>
                </div>

                <div className="form-group">
                    <label>Antécédents Médicaux (liés à l'alimentation) :</label>
                    <div className="checkbox-group">
                        {medicalConditionsList.map((condition) => (
                            <label key={condition}>
                                <input
                                    type="checkbox"
                                    value={condition}
                                    checked={medicalConditions.includes(condition)}
                                    onChange={handleMedicalConditionChange}
                                /> {condition}
                            </label>
                        ))}
                        <label>
                            <input
                                type="checkbox"
                                value="Autres"
                                checked={medicalConditions.includes("Autres")}
                                onChange={handleMedicalConditionChange}
                            /> Autres
                        </label>
                    </div>
                    {medicalConditions.includes("Autres") && (
                        <input
                            type="text"
                            className="other-input"
                            placeholder="Veuillez spécifier d'autres conditions"
                            value={otherMedicalCondition}
                            onChange={(e) => setOtherMedicalCondition(e.target.value)}
                            required={medicalConditions.includes("Autres")}
                        />
                    )}
                </div>

                <div className="form-group">
                    <label>Votre Rôle dans la famille :</label>
                    <div className="checkbox-group">
                        {familyRoles.map((roleOption) => (
                            <label key={roleOption}>
                                <input
                                    type="checkbox"
                                    value={roleOption}
                                    checked={role.includes(roleOption)}
                                    onChange={handleRoleChange}
                                /> {roleOption}
                            </label>
                        ))}
                        <label>
                            <input
                                type="checkbox"
                                value="Autres"
                                checked={role.includes("Autres")}
                                onChange={handleRoleChange}
                            /> Autres
                        </label>
                    </div>
                    {role.includes("Autres") && (
                        <input
                            type="text"
                            className="other-input"
                            placeholder="Veuillez spécifier votre rôle"
                            value={otherRole}
                            onChange={(e) => setOtherRole(e.target.value)}
                            required={role.includes("Autres")}
                        />
                    )}
                </div>

                <div className="form-group">
                    <label htmlFor="profilePic">Photo de Profil (optionnel) :</label>
                    <div className="file-input-wrapper">
                        <label htmlFor="profilePic" className="custom-file-upload">
                            Choisir une image
                        </label>
                        <input
                            type="file"
                            id="profilePic"
                            accept="image/*"
                            onChange={handleProfilePicChange}
                        />
                        {profilePicPreview && (
                            <img src={profilePicPreview} alt="Aperçu" className="profile-pic-preview" />
                        )}
                    </div>
                </div>

                {error && <p className="error-message" style={{color: 'red', marginBottom: '15px'}}>{error}</p>}
                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? "Enregistrement..." : "Enregistrer et Continuer"}
                </button>
            </form>
        </div>
    );
};

export default UserProfileForm;