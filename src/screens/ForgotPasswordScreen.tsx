import { useState } from 'react'
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { colors, typography } from '../theme'
import Button from '../components/Button'

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  function handleSend() {
    if (!email) {
      Alert.alert('請填寫', '請輸入您的電子信箱')
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <View style={styles.container}>
        <View style={styles.appbar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.appbarTitle}>確認信箱</Text>
        </View>
        <View style={styles.successContent}>
          <View style={styles.successIcon}>
            <Text style={styles.successIconText}>✉</Text>
          </View>
          <Text style={styles.successTitle}>重設連結已寄出</Text>
          <Text style={styles.successSub}>已寄送至{'\n'}<Text style={styles.emailText}>{email}</Text>{'\n'}請查看收件匣並點擊連結重設密碼</Text>
          <View style={styles.tealCard}>
            <Text style={styles.tealTitle}>沒收到信？</Text>
            <Text style={styles.tealText}>請確認信箱是否正確，或檢查垃圾郵件資料夾。連結有效期限為 30 分鐘。</Text>
          </View>
          <Button title="重新傳送" onPress={() => setSent(false)} variant="secondary" />
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.backBtnText}>返回登入</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>忘記密碼</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconArea}>
          <View style={styles.iconBox}>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>
          <Text style={styles.title}>重設密碼</Text>
          <Text style={styles.sub}>輸入您的註冊信箱{'\n'}我們將寄送重設連結給您</Text>
        </View>

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

        <Button title="傳送重設連結" onPress={handleSend} />
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>返回登入</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  appbar: {
    height: 46, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: colors.gray200,
  },
  back: { fontSize: 22, color: colors.primary, marginRight: 6 },
  appbarTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  content: { flex: 1, padding: 24 },
  iconArea: { alignItems: 'center', paddingVertical: 24, gap: 8, marginBottom: 16 },
  iconBox: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  lockIcon: { fontSize: 32 },
  title: { fontSize: typography.sizes.lg, fontWeight: typography.weights.medium, color: colors.gray900 },
  sub: { fontSize: typography.sizes.sm, color: colors.gray400, textAlign: 'center', lineHeight: 20 },
  field: { marginBottom: 16 },
  label: { fontSize: typography.sizes.xs, color: colors.gray500, fontWeight: typography.weights.medium, marginBottom: 4 },
  input: {
    height: 42, borderWidth: 0.5, borderColor: colors.gray300,
    borderRadius: 8, paddingHorizontal: 12,
    fontSize: typography.sizes.md, color: colors.gray900,
  },
  backBtn: { alignItems: 'center', marginTop: 12 },
  backBtnText: { fontSize: typography.sizes.sm, color: colors.gray500 },
  successContent: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  successIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.successLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  successIconText: { fontSize: 32 },
  successTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.medium, color: colors.success, marginBottom: 8 },
  successSub: { fontSize: typography.sizes.md, color: colors.gray500, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  emailText: { color: colors.primary, fontWeight: typography.weights.medium },
  tealCard: { backgroundColor: colors.primaryLight, borderRadius: 10, padding: 12, marginBottom: 20, width: '100%' },
  tealTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.primary, marginBottom: 4 },
  tealText: { fontSize: typography.sizes.xs, color: '#0d7a8f', lineHeight: 18 },
})