import { initializeApp } from 'firebase/app'
import { initializeAuth, getReactNativePersistence } from 'firebase/auth'
import AsyncStorage from '@react-native-async-storage/async-storage'

const firebaseConfig = {
  apiKey: "AIzaSyCG6Vl2cwN6pVZsdBBgyOEUVgV-0zaBhhI",
  authDomain: "fertiscan-7039b.firebaseapp.com",
  projectId: "fertiscan-7039b",
  storageBucket: "fertiscan-7039b.firebasestorage.app",
  messagingSenderId: "780296736408",
  appId: "1:780296736408:web:88d1550018ac5cc9e5caed",
}

const app = initializeApp(firebaseConfig)
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
})