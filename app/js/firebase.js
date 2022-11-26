import { initializeApp } from "https://www.gstatic.com/firebasejs/9.13.0/firebase-app.js";
import {
    getFirestore,
    collection,
    doc,
    addDoc,
    setDoc,
    getDoc,
    getDocs,
    deleteDoc,
} from "https://www.gstatic.com/firebasejs/9.13.0/firebase-firestore.js";

import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged,
    signOut,
} from "https://www.gstatic.com/firebasejs/9.13.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAmfGQm_kPienEAWw6FQRRx06MQbtVya6s",
    authDomain: "in-browser-markdown-edit-71ddd.firebaseapp.com",
    projectId: "in-browser-markdown-edit-71ddd",
    storageBucket: "in-browser-markdown-edit-71ddd.appspot.com",
    messagingSenderId: "937361821732",
    appId: "1:937361821732:web:b2d2fd381b1cf91e0d48b1",
    measurementId: "G-62DP07YDBE",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export {
    collection,
    doc,
    addDoc,
    setDoc,
    getDoc,
    getDocs,
    deleteDoc,
    db,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    getAuth,
    signOut,
};
