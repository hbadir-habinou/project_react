import { initializeApp } from "firebase/app"
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { getAnalytics } from "firebase/analytics"
import { GoogleAuthProvider } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyCDLWSJzeHDztUxUobZBkEIMSrMfLdidRE",
  authDomain: "todo-web-a57a0.firebaseapp.com",
  projectId: "todo-web-a57a0",
  storageBucket: "todo-web-a57a0.appspot.com",
  messagingSenderId: "271944674192",
  appId: "1:271944674192:web:dcaeb44fabce6af407a115",
  measurementId: "G-16DHRLB31K",
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)
const analytics = getAnalytics(app)

// Enable persistence
enableIndexedDbPersistence(db)
  .then(() => {
    console.log("Persistence Firestore activée")
  })
  .catch((err) => {
    if (err.code === "failed-precondition") {
      console.warn(
        "La persistence n'a pas pu être activée car plusieurs onglets sont ouverts"
      )
    } else if (err.code === "unimplemented") {
      console.warn(
        "Le navigateur ne supporte pas toutes les fonctionnalités requises pour la persistence"
      )
    }
  })

export const googleProvider = new GoogleAuthProvider()
export { db, auth, analytics, app }