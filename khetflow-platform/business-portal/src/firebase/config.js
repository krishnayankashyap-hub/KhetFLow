import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDtGjU-sKguz0iFHunt_VpqUvDByygWCfk",
  authDomain: "khetflow-38a6e.firebaseapp.com",
  projectId: "khetflow-38a6e",
  storageBucket: "khetflow-38a6e.firebasestorage.app",
  messagingSenderId: "338837231132",
  appId: "1:338837231132:web:070ca3b524789030bd31d9",
  measurementId: "G-DGP8CR6GWB"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
