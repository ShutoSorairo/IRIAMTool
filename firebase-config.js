import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCjHF_8Tw2fcBZy1mLiOuAGIwb1VbQGm7E",
  authDomain: "iriamtool.firebaseapp.com",
  projectId: "iriamtool",
  storageBucket: "iriamtool.firebasestorage.app",
  messagingSenderId: "400067108520",
  appId: "1:400067108520:web:ecefdc3b720661cd2cac9d"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// 管理者の Firebase Authentication UID（Firestore ルールと一致させること）
export const ADMIN_UID = "d05uyXXhBNMoTjwnA9qzwjC5R0R2";
