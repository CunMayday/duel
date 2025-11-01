/*
Version: 2.0
Latest changes: Updated to use Firestore instead of Realtime Database
*/

// Firebase configuration - REPLACE WITH YOUR OWN CONFIG FROM FIREBASE CONSOLE
// Your web app's Firebase configuration

const firebaseConfig = {

  apiKey: "AIzaSyA7BGBxixXv3643dSI9kY8AFVIEzE9HzDQ",

  authDomain: "duelengarde.firebaseapp.com",

  projectId: "duelengarde",

  storageBucket: "duelengarde.firebasestorage.app",

  messagingSenderId: "856183123655",

  appId: "1:856183123655:web:dc7162af1dec39416c98e2"

};



// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get a reference to Firestore
const db = firebase.firestore();
