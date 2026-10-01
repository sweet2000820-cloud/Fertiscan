import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, typography } from '../theme'
import { auth } from '../firebase'
import { deleteMyAccount, finishAccountDeletion } from '../accountApi'

// [新增 2026/10/01] 刪除帳號
// - 先列出會被刪除的內容，勾選「我了解無法復原」並輸入密碼才能刪除
// - 刪除完成後顯示完成畫面，按下按鈕才登出回到登入頁

const DELETED_ITEMS = [
  { icon: 'person-outline', text: '個人資料、生殖健康背景、頭像' },
  { icon: 'document-text-outline', text: '所有檢測紀錄、採樣問卷與問答成績' },
  { icon: 'link-outline', text: '所有報告分享連結，立即失效' },
  { icon: 'business-outline', text: '進行中的診所預約會自動取消，診所端的姓名、電話與報告一併清除' },
  { icon: 'key-outline', text: '登入帳號，之後無法再用這個信箱登入原本的資料' },
] as const

export default function DeleteAccountScreen({ navigation }: any) {
  const [understood, setUnderstood] = useState(false)
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const email = auth.currentUser?.email || ''
  const canSubmit = understood && password.length > 0 && !deleting

  async function handleDelete() {
    if (!canSubmit) return
    setDeleting(true)
    setError(null)
    try {
      await deleteMyAccount(password)
      setDone(true)
    } catch (e: any) {
      setError(e?.message || '刪除失敗，請稍後再試')
    }
    setDeleting(false)
  }

  if (done) {
    return (
      <View style={styles.container}>
        <View style={styles.doneBox}>
          <View style={styles.doneIcon}>
            <Ionicons name="checkmark" size={34} color={colors.white} />
          </View>
          <Text style={styles.doneTitle}>帳號已刪除</Text>
          <Text style={styles.doneText}>你的資料已全部刪除。謝謝你使用 iMotile。</Text>
          <TouchableOpacity style={styles.btnPrimary} onPress={finishAccountDeletion}>
            <Text style={styles.btnPrimaryText}>回到登入頁</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} disabled={deleting}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>刪除帳號</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.warnCard}>
          <Ionicons name="warning-outline" size={20} color={colors.danger} />
          <Text style={styles.warnText}>刪除後無法復原。以下資料會永久刪除：</Text>
        </View>

        <View style={styles.listCard}>
          {DELETED_ITEMS.map((item, i) => (
            <View key={i} style={[styles.itemRow, i === DELETED_ITEMS.length - 1 && { borderBottomWidth: 0 }]}>
              <Ionicons name={item.icon as any} size={18} color={colors.gray500} />
              <Text style={styles.itemText}>{item.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteText}>• 已約好看診時間的話，建議先打電話告知診所。</Text>
          <Text style={styles.noteText}>• 透過 App Store／Google Play 訂閱的方案不會因刪除帳號自動取消，請到商店的訂閱管理取消。</Text>
          <Text style={styles.noteText}>• 想保留紀錄的話，可以先在報告頁匯出 PDF。</Text>
        </View>

        <TouchableOpacity
          style={[styles.consent, understood && styles.consentOn]}
          onPress={() => setUnderstood(v => !v)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: understood }}
          disabled={deleting}
        >
          <Ionicons name={understood ? 'checkbox' : 'square-outline'} size={22} color={understood ? colors.danger : colors.gray400} />
          <Text style={styles.consentText}>我了解刪除後資料無法復原</Text>
        </TouchableOpacity>

        <Text style={styles.label}>輸入密碼確認身分</Text>
        <Text style={styles.emailText}>{email}</Text>
        <View style={styles.pwRow}>
          <TextInput
            style={styles.pwInput}
            value={password}
            onChangeText={t => { setPassword(t); setError(null) }}
            secureTextEntry={!showPw}
            placeholder="密碼"
            placeholderTextColor={colors.gray400}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            editable={!deleting}
          />
          <TouchableOpacity onPress={() => setShowPw(v => !v)} style={styles.eye}>
            <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.gray400} />
          </TouchableOpacity>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.btnDanger, !canSubmit && { opacity: 0.4 }]}
          onPress={handleDelete}
          disabled={!canSubmit}
        >
          {deleting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.btnDangerText}>永久刪除帳號</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnGhost} onPress={() => navigation.goBack()} disabled={deleting}>
          <Text style={styles.btnGhostText}>取消</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  appbar: { flexDirection: 'row', alignItems: 'center', paddingTop: 10, paddingHorizontal: 18, paddingBottom: 14 },
  back: { fontSize: 40, color: colors.primary, marginRight: 6, paddingBottom: 4 },
  appbarTitle: { flex: 1, fontSize: 22, fontWeight: '600', color: colors.gray900 },
  scroll: { flex: 1, paddingHorizontal: 18 },
  warnCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fdecec', borderRadius: 14, padding: 12, marginBottom: 12 },
  warnText: { flex: 1, fontSize: typography.sizes.sm, color: colors.danger, fontWeight: '600' },
  listCard: { borderWidth: 0.5, borderColor: colors.gray200, borderRadius: 16, paddingHorizontal: 14, marginBottom: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 11, borderBottomWidth: 0.5, borderBottomColor: colors.gray100 },
  itemText: { flex: 1, fontSize: typography.sizes.sm, color: colors.gray900, lineHeight: 20 },
  noteCard: { backgroundColor: colors.gray100, borderRadius: 14, padding: 12, marginBottom: 16, gap: 4 },
  noteText: { fontSize: typography.sizes.xs, color: colors.gray500, lineHeight: 18 },
  consent: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 0.5, borderColor: colors.gray200, borderRadius: 14, padding: 12, marginBottom: 18 },
  consentOn: { borderColor: colors.danger },
  consentText: { fontSize: typography.sizes.sm, color: colors.gray900 },
  label: { fontSize: typography.sizes.sm, color: colors.gray500, marginBottom: 2 },
  emailText: { fontSize: typography.sizes.sm, color: colors.gray900, marginBottom: 8 },
  pwRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 0.5, borderColor: colors.gray300, borderRadius: 12, marginBottom: 8 },
  pwInput: { flex: 1, height: 44, paddingHorizontal: 12, fontSize: typography.sizes.md, color: colors.gray900 },
  eye: { paddingHorizontal: 12, height: 44, justifyContent: 'center' },
  error: { fontSize: typography.sizes.sm, color: colors.danger, marginBottom: 6 },
  btnDanger: { height: 48, borderRadius: 24, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  btnDangerText: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.white },
  btnGhost: { height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  btnGhostText: { fontSize: typography.sizes.md, color: colors.gray500 },
  doneBox: { flex: 1, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  doneIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.gray500, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  doneTitle: { fontSize: typography.sizes.lg, fontWeight: '600', color: colors.gray900, marginBottom: 8 },
  doneText: { fontSize: typography.sizes.md, color: colors.gray500, textAlign: 'center', marginBottom: 24 },
  btnPrimary: { alignSelf: 'stretch', height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  btnPrimaryText: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.white },
})
