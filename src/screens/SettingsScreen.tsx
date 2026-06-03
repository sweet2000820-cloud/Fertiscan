import { View, Text, StyleSheet } from 'react-native'
import { colors } from '../theme'

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>設定</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    color: colors.gray500,
  },
})