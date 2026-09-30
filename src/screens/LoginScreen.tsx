import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'
import { useState } from 'react'
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Keyboard, TouchableWithoutFeedback, Image } from 'react-native'
import { colors, typography } from '../theme'
import Button from '../components/Button'


export default function LoginScreen({ onLogin, navigation }: any) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleLogin() {
  if (!email || !password) {
    Alert.alert('請填寫', '請輸入信箱和密碼')
    return
  }
  try {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  if (!userCredential.user.emailVerified) {
      Alert.alert('信箱尚未驗證', '請先完成信箱驗證才能使用')
      navigation?.navigate('VerifyEmail', { email })
      return
    }
    if (onLogin) onLogin()
  } catch (error: any) {
    let message = '登入失敗，請稍後再試'
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') message = '信箱或密碼錯誤'
    else if (error.code === 'auth/user-not-found') message = '找不到此帳號，請先註冊'
    else if (error.code === 'auth/too-many-requests') message = '嘗試次數過多，請稍後再試'
    Alert.alert('登入失敗', message)
  }
}

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.logoArea}>
          <Image source={require('../../assets/login_logo_v3.png')} style={styles.logoCircle} resizeMode="contain" />
          <Text style={styles.subtitle}>生殖功能試紙光學定量</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>電子信箱</Text>
            <TextInput
              style={styles.input}
              placeholder="example@gmail.com"
              placeholderTextColor={colors.gray400}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>密碼</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.gray400}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
          <Text style={styles.loginBtnText}>登入</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.forgotBtn} onPress={() => navigation?.navigate('ForgotPassword')}>
          <Text style={styles.forgotText}>忘記密碼？</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>或</Text>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity style={styles.registerBtn} onPress={() => navigation?.navigate('Register')}>
          <Text style={styles.registerBtnText}>建立新帳號</Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: colors.white,
    padding: 24, paddingTop: 80,
  },
  logoArea: { paddingTop: 20, paddingBottom: 10, alignItems: 'center' },
  logoCircle: { width: 200, height: 200, marginBottom: 30 },
  subtitle: { fontSize: typography.sizes.md, color: colors.gray400, marginTop: -60 },
  form: { gap: 12, marginBottom: 20 },
  field: { gap: 4 },
  label: { fontSize: typography.sizes.lg, color: colors.gray500, fontWeight: typography.weights.medium },
  input: {
    height: 44, borderWidth: 0.5, borderColor: colors.gray300,
    borderRadius: 16, paddingHorizontal: 14,
    fontSize: typography.sizes.lg, color: colors.gray900,
  },
  loginBtn: {
    height: 48, borderRadius: 24, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  loginBtnText: { fontSize: typography.sizes.lg, fontWeight: typography.weights.medium, color: colors.white },
  forgotBtn: { alignItems: 'center', marginTop: 14 },
  forgotText: { fontSize: typography.sizes.lg, color: colors.primary },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 14 },
  divider: { flex: 1, height: 0.5, backgroundColor: colors.gray200 },
  dividerText: { fontSize: typography.sizes.sm, color: colors.gray400 },
  registerBtn: {
    height: 48, borderRadius: 24,
    borderWidth: 1.5, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  registerBtnText: { fontSize: typography.sizes.lg, fontWeight: typography.weights.medium, color: colors.primary },
})