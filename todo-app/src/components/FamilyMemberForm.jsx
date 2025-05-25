import React, { useState, useEffect } from 'react';

const FamilyMemberForm = ({ member, onSave, onCancel, onDelete, isNew = false }) => {
  const [fullName, setFullName] = useState(member?.fullName || '');
  const [age, setAge] = useState(member?.age || '');
  const [gender, setGender] = useState(member?.gender || '');
  const [medicalConditions, setMedicalConditions] = useState(member?.medicalConditions || []);
  const [otherMedicalCondition, setOtherMedicalCondition] = useState(member?.otherMedicalCondition || '');
  const [role, setRole] = useState(member?.role || []);
  const [otherRole, setOtherRole] = useState(member?.otherRole || '');
  const [email, setEmail] = useState(member?.email || '');
  const [profilePic, setProfilePic] = useState(member?.profilePic || null);
  const [profilePicPreview, setProfilePicPreview] = useState(member?.profilePic || '');

  const medicalConditionsList = [
    'Diabète', 'Hypertension', 'Maladie cœliaque', 'Allergie aux arachides',
    'Intolérance au lactose', 'Végétarien', 'Végétalien', 'Aucun',
  ];

  const familyRoles = [
    'Mère', 'Père', 'Enfant', 'Grand-parent', 'Conjoint(e)', 'Frère/Sœur',
  ];

  const isEmailDisabled = parseInt(age) < 5;

  useEffect(() => {
    if (member) {
      setFullName(member.fullName || '');
      setAge(member.age || '');
      setGender(member.gender || '');
      setMedicalConditions(member.medicalConditions || []);
      setOtherMedicalCondition(member.otherMedicalCondition || '');
      setRole(member.role || []);
      setOtherRole(member.otherRole || '');
      setEmail(member.email || '');
      setProfilePic(member.profilePic || null);
      setProfilePicPreview(member.profilePic || '');
    }
  }, [member]);

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
        setProfilePic(reader.result);
        setProfilePicPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setProfilePic(null);
      setProfilePicPreview('');
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    const memberData = {
      ...(isNew ? {} : { id: member?.id }),
      fullName,
      age: parseInt(age),
      gender,
      email: isEmailDisabled ? '' : email,
      medicalConditions: medicalConditions.includes('Autres')
        ? [...medicalConditions.filter(c => c !== 'Autres'), otherMedicalCondition]
        : medicalConditions,
      role: role.includes('Autres')
        ? [...role.filter(r => r !== 'Autres'), otherRole]
        : role,
      profilePic: profilePic || '',
    };

    // Inclure otherMedicalCondition seulement si "Autres" est sélectionné
    if (medicalConditions.includes('Autres') && otherMedicalCondition) {
      memberData.otherMedicalCondition = otherMedicalCondition;
    }

    // Inclure otherRole seulement si "Autres" est sélectionné
    if (role.includes('Autres') && otherRole) {
      memberData.otherRole = otherRole;
    }

    onSave(memberData);
  };

  return (
    <div className="form-container family-member-form">
      <h2>{isNew ? 'Ajouter un Membre de la Famille' : 'Modifier le Membre de la Famille'}</h2>
      <form onSubmit={handleSave}>
        <div className="form-group">
          <label htmlFor="memberFullName">Nom Complet :</label>
          <input
            type="text"
            id="memberFullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="memberAge">Âge :</label>
          <input
            type="number"
            id="memberAge"
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
                checked={gender === 'Homme'}
                onChange={(e) => setGender(e.target.value)}
                required
              /> Homme
            </label>
            <label>
              <input
                type="radio"
                value="Femme"
                checked={gender === 'Femme'}
                onChange={(e) => setGender(e.target.value)}
                required
              /> Femme
            </label>
            <label>
              <input
                type="radio"
                value="Autre"
                checked={gender === 'Autre'}
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
                checked={medicalConditions.includes('Autres')}
                onChange={handleMedicalConditionChange}
              /> Autres
            </label>
          </div>
          {medicalConditions.includes('Autres') && (
            <input
              type="text"
              className="other-input"
              placeholder="Veuillez spécifier d'autres conditions"
              value={otherMedicalCondition}
              onChange={(e) => setOtherMedicalCondition(e.target.value)}
              required={medicalConditions.includes('Autres')}
            />
          )}
        </div>

        <div className="form-group">
          <label>Rôle dans la famille :</label>
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
                checked={role.includes('Autres')}
                onChange={handleRoleChange}
              /> Autres
            </label>
          </div>
          {role.includes('Autres') && (
            <input
              type="text"
              className="other-input"
              placeholder="Veuillez spécifier le rôle"
              value={otherRole}
              onChange={(e) => setOtherRole(e.target.value)}
              required={role.includes('Autres')}
            />
          )}
        </div>

        <div className="form-group">
          <label htmlFor="memberEmail">Email (désactivé si âge inférieur à 5 ans) :</label>
          <input
            type="email"
            id="memberEmail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isEmailDisabled}
            required={!isEmailDisabled}
            placeholder="Email du membre (optionnel)"
          />
        </div>

        <div className="form-group">
          <label htmlFor="memberProfilePic">Photo de Profil (optionnel) :</label>
          <div className="file-input-wrapper">
            <label htmlFor="memberProfilePic" className="custom-file-upload">
              Choisir une image
            </label>
            <input
              type="file"
              id="memberProfilePic"
              accept="image/*"
              onChange={handleProfilePicChange}
            />
            {profilePicPreview && (
              <img src={profilePicPreview} alt="Aperçu" className="profile-pic-preview" />
            )}
          </div>
        </div>

        <div className="button-group">
          <button type="submit" className="btn-primary">
            {isNew ? 'Ajouter le Membre' : 'Sauvegarder les Modifications'}
          </button>
          {onCancel && <button type="button" className="btn-secondary" onClick={onCancel}>Annuler</button>}
          {!isNew && onDelete && (
            <button type="button" className="btn-secondary delete-btn" onClick={() => onDelete(member.id)}>
              Supprimer
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default FamilyMemberForm;