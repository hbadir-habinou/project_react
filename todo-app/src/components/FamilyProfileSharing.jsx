"use client"

import { useState, useEffect } from "react"
import { auth, db } from "../firebase"
import { doc, getDoc, setDoc, collection, onSnapshot, getDocs } from "firebase/firestore"
import { useLanguage } from "../contexts/LanguageContext"

const FamilyProfileSharing = () => {
  const { t } = useLanguage()
  const [familyCode, setFamilyCode] = useState("")
  const [isFirstUser, setIsFirstUser] = useState(false)
  const [familyMembers, setFamilyMembers] = useState([])
  const [joinCode, setJoinCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [currentUserRole, setCurrentUserRole] = useState("member")

  useEffect(() => {
    checkFamilyStatus()
  }, [])

  const checkFamilyStatus = async () => {
    if (!auth.currentUser) return

    try {
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid))
      const userData = userDoc.data()

      if (userData?.familyCode) {
        setFamilyCode(userData.familyCode)
        setCurrentUserRole(userData.role || "member")
        listenToFamilyMembers(userData.familyCode)
      } else {
        setIsFirstUser(true)
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du statut familial:", error)
    }
  }

  const listenToFamilyMembers = (code) => {
    const familyRef = collection(db, "families", code, "members")
    const unsubscribe = onSnapshot(familyRef, (snapshot) => {
      const members = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setFamilyMembers(members)
    })
    return unsubscribe
  }

  const createFamilyProfile = async () => {
    if (!auth.currentUser) return

    setLoading(true)
    try {
      const code = generateFamilyCode()

      // Créer le profil familial
      await setDoc(doc(db, "families", code), {
        createdBy: auth.currentUser.uid,
        adminId: auth.currentUser.uid,
        createdAt: new Date(),
        familyName: `Famille de ${auth.currentUser.email.split("@")[0]}`,
        code: code,
      })

      // Récupérer les données utilisateur existantes
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid))
      const userData = userDoc.data() || {}

      // Récupérer les membres de famille existants de l'utilisateur
      const familyMembersRef = collection(db, "users", auth.currentUser.uid, "familyMembers")
      const familyMembersSnapshot = await getDocs(familyMembersRef)
      const existingFamilyMembers = familyMembersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      // Créer la liste des membres à ajouter à la famille
      const membersToAdd = [
        // Ajouter l'utilisateur créateur comme admin
        {
          id: auth.currentUser.uid,
          fullName: userData.fullName || `${auth.currentUser.email.split("@")[0]} (Admin)`,
          email: auth.currentUser.email,
          age: userData.age || 30,
          gender: userData.gender || "Non spécifié",
          role: "admin",
          profilePic: userData.profilePic || "/placeholder.svg?height=100&width=100",
          medicalConditions: userData.medicalConditions || [],
          joinedAt: new Date(),
        },
        // Ajouter les membres de famille existants comme membres
        ...existingFamilyMembers.map((member) => ({
          ...member,
          role: "member",
          joinedAt: new Date(),
        })),
      ]

      // Si aucun membre de famille n'existe, créer quelques membres d'exemple
      if (existingFamilyMembers.length === 0) {
        const exampleMembers = [
          {
            id: `member_${Date.now()}_1`,
            fullName: "Marie Dupont",
            email: "marie.dupont@example.com",
            age: 28,
            gender: "Femme",
            role: "member",
            profilePic: "/placeholder.svg?height=100&width=100",
            medicalConditions: ["Végétarien"],
            joinedAt: new Date(),
          },
          {
            id: `member_${Date.now()}_2`,
            fullName: "Pierre Martin",
            email: "pierre.martin@example.com",
            age: 35,
            gender: "Homme",
            role: "member",
            profilePic: "/placeholder.svg?height=100&width=100",
            medicalConditions: [],
            joinedAt: new Date(),
          },
          {
            id: `member_${Date.now()}_3`,
            fullName: "Sophie Dubois",
            email: "sophie.dubois@example.com",
            age: 25,
            gender: "Femme",
            role: "member",
            profilePic: "/placeholder.svg?height=100&width=100",
            medicalConditions: ["Sans gluten"],
            joinedAt: new Date(),
          },
        ]
        membersToAdd.push(...exampleMembers)
      }

      // Ajouter tous les membres à la famille
      for (const member of membersToAdd) {
        await setDoc(doc(db, "families", code, "members", member.id), {
          ...member,
          userId: member.id === auth.currentUser.uid ? auth.currentUser.uid : member.id,
        })
      }

      // Mettre à jour le profil utilisateur avec le code familial ET le type de connexion normale
      await setDoc(
        doc(db, "users", auth.currentUser.uid),
        {
          ...userData,
          familyCode: code,
          role: "admin",
          connectionType: "normal", // Marquer comme connexion normale
          isReadOnly: false,
          isGuest: false,
        },
        { merge: true },
      )

      // Stocker le type de connexion dans localStorage
      localStorage.setItem("connectionType", "normal")
      localStorage.removeItem("guestUserData")
      localStorage.removeItem("guestFamilyCode")
      localStorage.removeItem("guestAdminUserId")

      setFamilyCode(code)
      setCurrentUserRole("admin")
      setIsFirstUser(false)

      const memberCount = existingFamilyMembers.length
      if (memberCount > 0) {
        setMessage(
          `Profil familial créé avec succès avec ${memberCount + 1} membres (vous + ${memberCount} membres existants) !`,
        )
      } else {
        setMessage(
          "Profil familial créé avec succès avec des membres d'exemple ! Vous pouvez les modifier dans l'onglet Membres.",
        )
      }

      listenToFamilyMembers(code)
    } catch (error) {
      console.error("Erreur lors de la création du profil familial:", error)
      setMessage("Erreur lors de la création du profil familial")
    } finally {
      setLoading(false)
    }
  }

  const joinFamily = async () => {
    if (!auth.currentUser || !joinCode.trim()) return

    setLoading(true)
    try {
      // Vérifier si la famille existe
      const familyDoc = await getDoc(doc(db, "families", joinCode))
      if (!familyDoc.exists()) {
        setMessage("Code familial invalide")
        setLoading(false)
        return
      }

      // Récupérer les données utilisateur existantes
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid))
      const userData = userDoc.data() || {}

      // Ajouter l'utilisateur à la famille comme membre
      await setDoc(doc(db, "families", joinCode, "members", auth.currentUser.uid), {
        ...userData,
        email: auth.currentUser.email,
        joinedAt: new Date(),
        role: "member",
        fullName: userData.fullName || auth.currentUser.email.split("@")[0],
      })

      // Mettre à jour le profil utilisateur avec connexion normale en tant que membre
      await setDoc(
        doc(db, "users", auth.currentUser.uid),
        {
          ...userData,
          familyCode: joinCode,
          role: "member",
          connectionType: "normal", // Connexion normale en tant que membre
          isReadOnly: false, // Les membres authentifiés ne sont pas en lecture seule
          isGuest: false,
        },
        { merge: true },
      )

      // Stocker le type de connexion
      localStorage.setItem("connectionType", "normal")
      localStorage.removeItem("guestUserData")
      localStorage.removeItem("guestFamilyCode")
      localStorage.removeItem("guestAdminUserId")

      setFamilyCode(joinCode)
      setCurrentUserRole("member")
      setMessage("Vous avez rejoint la famille avec succès !")
      listenToFamilyMembers(joinCode)
    } catch (error) {
      console.error("Erreur lors de l'adhésion à la famille:", error)
      setMessage("Erreur lors de l'adhésion à la famille")
    } finally {
      setLoading(false)
    }
  }

  const generateFamilyCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const copyFamilyCode = () => {
    navigator.clipboard.writeText(familyCode)
    setMessage("Code familial copié dans le presse-papiers !")
    setTimeout(() => setMessage(""), 3000)
  }

  if (familyCode) {
    return (
      <div className="card family-sharing-card">
        <div className="card-body">
          <h5 className="card-title">
            <i className="fas fa-users me-2 text-primary"></i>
            Profil Familial Partagé
          </h5>

          <div className="mb-3">
            <label className="form-label">Code de la famille:</label>
            <div className="input-group">
              <input type="text" className="form-control" value={familyCode} readOnly />
              <button className="btn btn-outline-primary" onClick={copyFamilyCode}>
                <i className="fas fa-copy"></i>
              </button>
            </div>
            <small className="text-muted">
              Partagez ce code avec les membres de votre famille pour qu'ils puissent rejoindre votre profil.
            </small>
          </div>

          <div className="family-members">
            <h6>Membres de la famille ({familyMembers.length})</h6>
            <div className="row">
              {familyMembers.map((member) => (
                <div key={member.id} className="col-md-6 mb-2">
                  <div className="d-flex align-items-center p-2 bg-light rounded">
                    <img
                      src={member.profilePic || "/placeholder.svg?height=40&width=40"}
                      alt={member.fullName}
                      className="rounded-circle me-2"
                      style={{ width: "40px", height: "40px", objectFit: "cover" }}
                    />
                    <div>
                      <div className="fw-bold">{member.fullName}</div>
                      <small className="text-muted">
                        {member.role === "admin" ? "Administrateur" : "Membre"}
                        {member.id === auth.currentUser?.uid && " (Vous)"}
                      </small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {currentUserRole === "member" && (
            <div className="alert alert-info mt-3">
              <i className="fas fa-info-circle me-2"></i>
              Vous êtes connecté en tant que membre. Seul l'administrateur peut modifier certaines données.
            </div>
          )}

          {message && <div className="alert alert-info mt-3">{message}</div>}
        </div>
      </div>
    )
  }

  return (
    <div className="card family-sharing-card">
      <div className="card-body">
        <h5 className="card-title">
          <i className="fas fa-users me-2 text-primary"></i>
          Partage de Profil Familial
        </h5>

        {isFirstUser ? (
          <div>
            <p>
              Vous êtes le premier utilisateur ! Créez un profil familial pour permettre aux autres membres de votre
              famille de rejoindre votre espace.
            </p>
            <button className="btn btn-primary" onClick={createFamilyProfile} disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Création...
                </>
              ) : (
                <>
                  <i className="fas fa-plus me-2"></i>
                  Créer le Profil Familial
                </>
              )}
            </button>
          </div>
        ) : (
          <div>
            <p>Rejoignez une famille existante en entrant le code familial:</p>
            <div className="input-group mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Entrez le code familial"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              />
              <button className="btn btn-success" onClick={joinFamily} disabled={loading || !joinCode.trim()}>
                {loading ? (
                  <span className="spinner-border spinner-border-sm"></span>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt me-2"></i>
                    Rejoindre
                  </>
                )}
              </button>
            </div>
            <div className="text-center">
              <button className="btn btn-outline-primary" onClick={() => setIsFirstUser(true)}>
                Ou créer un nouveau profil familial
              </button>
            </div>
          </div>
        )}

        {message && <div className="alert alert-info mt-3">{message}</div>}
      </div>
    </div>
  )
}

export default FamilyProfileSharing
