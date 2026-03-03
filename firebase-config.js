// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot, collection } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC-ZS7HNJhsX-LooWu12lStkVpQWEW-mhk",
  authDomain: "fazocar-c723e.firebaseapp.com",
  projectId: "fazocar-c723e",
  storageBucket: "fazocar-c723e.firebasestorage.app",
  messagingSenderId: "218367024149",
  appId: "1:218367024149:web:e91de531376505455ac21c"
};

const fbApp = initializeApp(firebaseConfig);
export const auth = getAuth(fbApp);
export const db = getFirestore(fbApp);

// Exportamos las funciones exactas que necesitas en lugar de colgarlas en `window`
export { 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged, 
    doc, 
    getDoc, 
    setDoc, 
    onSnapshot, 
    collection 
};