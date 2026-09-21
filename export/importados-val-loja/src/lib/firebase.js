// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAxBK6w5g_bP_HJv7N8JFGo1somSGPHYIU",
  authDomain: "importadosval-bbcec.firebaseapp.com",
  databaseURL: "https://importadosval-bbcec-default-rtdb.firebaseio.com",
  projectId: "importadosval-bbcec",
  storageBucket: "importadosval-bbcec.firebasestorage.app",
  messagingSenderId: "526954523767",
  appId: "1:526954523767:web:1604a65e9f4035c176ea72"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);

// Dona da loja: sempre tem acesso ao painel admin
export const OWNER_EMAIL = "michelrobertoeletro@gmail.com";