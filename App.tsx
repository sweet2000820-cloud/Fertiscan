import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { View } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Navigation from './src/navigation'

export default function App() {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <Navigation
          onLogin={() => AsyncStorage.setItem('isLoggedIn', 'true')}
        />
      </View>
      <StatusBar style="dark" backgroundColor="#fff" />
    </SafeAreaProvider>
  )
}