import { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { colors, typography } from '../theme'
import Button from '../components/Button'
import { auth } from '../firebase'
import { sendEmailVerification, updateCurrentUser } from 'firebase/auth'

export default function VerifyEmailScreen({ navigation, route }: any) {
  const email = route?.params?.email || 'your@email.com'
  const [checking, setChecking] = useState(false)

  async function handleCheckVerified() {
  setChecking(true)
  try {
    const user = auth.currentUser
    console.log('手機目前登入的 UID:', user?.uid)
    if (!user) {
      Alert.alert('請重新登入', '找不到登入狀態，請重新登入一次')
      return
    }
    await user.reload()
    console.log('reload後的 emailVerified 狀態:', user.emailVerified)   // 加這一行
    if (user.emailVerified) {
    await auth.updateCurrentUser(null)
    await auth.updateCurrentUser(user)
    } else {
      Alert.alert('尚未驗證', '還沒偵測到驗證完成，請確認已點擊信件中的連結，或稍等片刻再試一次')
    }
  } catch (e) {
    Alert.alert('檢查失敗', '請稍後再試')
  } finally {
    setChecking(false)
  }
}

  return (
    <View style={styles.container}>
      <View style={styles.content}>

        <View style={styles.icon}>
          <Text style={styles.iconText}>✉</Text>
        </View>

        <Text style={styles.title}>請驗證您的信箱</Text>
        <Text style={styles.sub}>
          驗證信已寄送至{'\n'}
          <Text style={styles.email}>{email}</Text>{'\n'}
          請點擊信件中的連結完成驗證
        </Text>

        <View style={styles.tealCard}>
          <Text style={styles.tealTitle}>沒收到信？</Text>
          <Text style={styles.tealText}>請確認信箱是否正確，或檢查垃圾郵件資料夾。連結有效期限為 24 小時。</Text>
        </View>

        <Button title={checking ? '檢查中...' : '我已完成驗證'} onPress={handleCheckVerified} disabled={checking} />

        <TouchableOpacity style={styles.skipBtn} onPress={async () => {
          try {
            const user = auth.currentUser
            if (user) {
              await sendEmailVerification(user)
              Alert.alert('已重新傳送', '驗證信已重新寄出，請查收信箱')
            }
          } catch (e) {
            Alert.alert('傳送失敗', '請稍後再試')
          }
        }}>
          <Text style={styles.skipText}>重新傳送驗證信</Text>
        </TouchableOpacity>

      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  icon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  iconText: { fontSize: 36 },
  title: {
    fontSize: typography.sizes.lg, fontWeight: typography.weights.medium,
    color: colors.gray900, marginBottom: 10,
  },
  sub: {
    fontSize: typography.sizes.md, color: colors.gray500,
    textAlign: 'center', lineHeight: 24, marginBottom: 24,
  },
  email: { color: colors.primary, fontWeight: typography.weights.medium },
  tealCard: {
    backgroundColor: colors.primaryLight, borderRadius: 10,
    padding: 12, marginBottom: 20, width: '100%',
  },
  tealTitle: {
    fontSize: typography.sizes.sm, fontWeight: typography.weights.medium,
    color: colors.primary, marginBottom: 4,
  },
  tealText: { fontSize: typography.sizes.xs, color: '#0d7a8f', lineHeight: 18 },
  skipBtn: { marginTop: 12 },
  skipText: { fontSize: typography.sizes.sm, color: colors.gray400 },
})