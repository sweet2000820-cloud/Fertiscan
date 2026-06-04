import { useEffect, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { View } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Navigation from './src/navigation'
import LoginScreen from './src/screens/LoginScreen'

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    AsyncStorage.getItem('isLoggedIn').then(val => {
      if (val === 'true') setLoggedIn(true)
      setLoading(false)
    })
  }, [])

  if (loading) return null

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        {loggedIn
          ? <Navigation />
          : <LoginScreen onLogin={() => { AsyncStorage.setItem('isLoggedIn', 'true'); setLoggedIn(true) }} />
        }
      </View>
      <StatusBar style="dark" backgroundColor="#fff" />
    </SafeAreaProvider>
  )
}