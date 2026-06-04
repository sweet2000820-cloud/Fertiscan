import { useState } from 'react'
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'
import { colors, typography } from '../theme'
import Button from '../components/Button'

export default function LoginScreen() {
  const insets = useSafeAreaInsets()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('請填寫', '請輸入信箱和密碼')
      return
    }
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error: any) {
      Alert.alert('登入失敗', '信箱或密碼錯誤')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      
      {/* Logo */}
      <View style={styles.logoArea}>
        <View style={styles.logoBox}>
          <Text style={styles.logoIcon}>⊞</Text>
        </View>
        <Text style={styles.appName}>FertiScan</Text>
        <Text style={styles.subtitle}>生殖功能試紙光學定量</Text>
      </View>

      {/* 表單 */}
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

      <Button title={loading ? '登入中...' : '登入'} onPress={handleLogin} />
      
      <TouchableOpacity style={styles.forgotBtn}>
        <Text style={styles.forgotText}>忘記密碼？</Text>
      </TouchableOpacity>

      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>或</Text>
        <View style={styles.divider} />
      </View>

      <Button title="建立新帳號" onPress={() => {}} variant="secondary" />

    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 24,
    justifyContent: 'center',
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoIcon: {
    fontSize: 28,
    color: colors.white,
  },
  appName: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.medium,
    color: colors.primary,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.gray400,
    marginTop: 4,
  },
  form: {
    gap: 12,
    marginBottom: 16,
  },
  field: {
    gap: 4,
  },
  label: {
    fontSize: typography.sizes.xs,
    color: colors.gray500,
    fontWeight: typography.weights.medium,
  },
  input: {
    height: 40,
    borderWidth: 0.5,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: typography.sizes.md,
    color: colors.gray900,
  },
  forgotBtn: {
    alignItems: 'center',
    marginTop: 10,
  },
  forgotText: {
    fontSize: typography.sizes.md,
    color: colors.primary,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 10,
  },
  divider: {
    flex: 1,
    height: 0.5,
    backgroundColor: colors.gray200,
  },
  dividerText: {
    fontSize: typography.sizes.sm,
    color: colors.gray400,
  },
})