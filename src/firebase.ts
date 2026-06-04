import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCG6Vl2cwN6pVZsdBBgyOEUVgV-0zaBhhI",
  authDomain: "fertiscan-7039b.firebaseapp.com",
  projectId: "fertiscan-7039b",
  storageBucket: "fertiscan-7039b.firebasestorage.app",
  messagingSenderId: "780296736408",
  appId: "1:780296736408:web:734c575ecb6888fae5caed",
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)