import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Your Firebase configuration object from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyCm4QNgtIFPgl7NQ3Q9CokjCXhB8TDN9Lk",
  authDomain: "react-crud-app-6a08f.firebaseapp.com",
  databaseURL: "https://react-crud-app-6a08f-default-rtdb.firebaseio.com",
  projectId: "react-crud-app-6a08f",
  storageBucket: "react-crud-app-6a08f.firebasestorage.app",
  messagingSenderId: "380767383938",
  appId: "1:380767383938:web:61b18af89483e262c75f9b",
  measurementId: "G-4PZ005SFV8"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and export it
const database = getDatabase(app);
export { database };