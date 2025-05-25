import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore } from "firebase/firestore"


const firebaseConfig = {
  apiKey: "AIzaSyCDLWSJzeHDztUxUobZBkEIMSrMfLdidRE",
  authDomain: "todo-web-a57a0.firebaseapp.com",
  projectId: "todo-web-a57a0",
  storageBucket: "todo-web-a57a0.firebasestorage.app",
  messagingSenderId: "271944674192",
  appId: "1:271944674192:web:dcaeb44fabce6af407a115",
  measurementId: "G-16DHRLB31K"
};


const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
