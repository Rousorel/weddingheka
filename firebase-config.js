// Importa los módulos de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Configuración de tu proyecto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA-7uWJe3uTA_HvK8aEGyhgm-3bO8XC0V4",
  authDomain: "confirmacionesboda-e63a9.firebaseapp.com",
  projectId: "confirmacionesboda-e63a9",
  storageBucket: "confirmacionesboda-e63a9.appspot.com",
  messagingSenderId: "380261495413",
  appId: "1:380261495413:web:5a2f66775b224283563e3c",
  measurementId: "G-BFHXFY79VT"
};

// Inicializa Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
