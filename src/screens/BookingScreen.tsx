import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Switch, KeyboardAvoidingView, Platform } from 'react-native'
import { colors, typography } from '../theme'
import { Ionicons } from '@expo/vector-icons'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { createAppointment, PartnerClinic, SLOT_OPTIONS } from '../clinicApi'

// [新增 2026/09/30] 預約申請
// - 兩個同意分開：預約資料（必填）、檢測報告（選填，預設不勾）
// - 身分證字號等初診資料不在 App 收，到診所再填
// - 送出後在同一頁顯示完成畫面

export default function BookingScreen({ navigation, route }: any) {
  const clinic: PartnerClinic = route?.params?.clinic
  const record = route?.params?.record

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [slots, setSlots] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [agreeBooking, setAgreeBooking] = useState(false)
  const [agreeReport, setAgreeReport] = useState(false)
  const [includeSurvey, setIncludeSurvey] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{ reportShared: boolean } | null>(null)

  // 預先帶入個人資料的姓名
  useEffect(() => {
    const user = auth.currentUser
    if (!user) return
    getDoc(doc(db, 'users', user.uid))
      .then(snap => { const n = snap.exists() ? (snap.data() as any).name : ''; if (n) setName(prev => prev || n) })
      .catch(() => {})
  }, [])

  const phoneOk = /^[0-9+\-() ]{8,20}$/.test(phone.trim())
  const canSubmit = !!name.trim() && phoneOk && slots.length > 0 && agreeBooking && !submitting

  function toggleSlot(s: string) {
    setSlots(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  async function submit() {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await createAppointment({
        clinicId: clinic.id, name, phone, slots, note,
        shareReport: agreeReport, includeSurvey, record: record || null,
      })
      setDone({ reportShared: res.reportShared })
    } catch (e: any) {
      setError(e?.message || '送出失敗，請稍後再試')
    }
    setSubmitting(false)
  }

  if (done) {
    return (
      <View style={styles.container}>
        <View style={styles.appbar}><Text style={styles.appbarTitle}>已送出</Text></View>
        <ScrollView style={styles.scroll}>
          <View style={styles.successHead}>
            <View style={styles.successIcon}><Ionicons name="checkmark" size={34} color={colors.success} /></View>
            <Text style={styles.successTitle}>預約申請已送到診所</Text>
            <Text style={styles.successSub}>{clinic.name} 會以電話和你聯絡，確認看診時間</Text>
          </View>
          <View style={styles.card}>
            <Step ok text="預約申請已送出" sub={`${slots.join('、')}・${phone.trim()}`} />
            <Step ok={done.reportShared}
              text={done.reportShared ? '檢測報告已分享給診所' : '沒有分享檢測報告'}
              sub={done.reportShared ? '30 天後自動失效，可以在「我的診所」撤回' : '之後可以從診所資訊頁補分享'} />
            <Step text="等待診所來電確認時間" last />
          </View>
          <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.navigate('ClinicList')}>
            <Text style={styles.btnPrimaryText}>前往我的診所</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnGhost} onPress={() => navigation.popToTop()}>
            <Text style={styles.btnGhostText}>回到首頁</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>預約申請</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.clinicLine}>預約診所：<Text style={{ color: colors.gray900, fontWeight: '600' }}>{clinic.name}</Text></Text>

        <Text style={styles.label}>姓名 <Text style={styles.req}>*</Text></Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} maxLength={30} placeholder="診所聯絡時稱呼你的名字" placeholderTextColor={colors.gray400} />

        <Text style={styles.label}>聯絡電話 <Text style={styles.req}>*</Text></Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={20} placeholder="例如 0912-345-678" placeholderTextColor={colors.gray400} />
        {phone.length > 0 && !phoneOk && <Text style={styles.fieldError}>請確認電話號碼</Text>}

        <Text style={styles.label}>方便看診的時段（可複選）<Text style={styles.req}>*</Text></Text>
        <View style={styles.chips}>
          {SLOT_OPTIONS.map(s => {
            const on = slots.includes(s)
            return (
              <TouchableOpacity key={s} style={[styles.chip, on && styles.chipOn]} onPress={() => toggleSlot(s)} accessibilityState={{ selected: on }}>
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{s}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <Text style={styles.label}>想讓診所先知道的事（選填）</Text>
        <TextInput style={[styles.input, { height: 72, textAlignVertical: 'top', paddingTop: 10 }]} value={note} onChangeText={setNote} multiline maxLength={300} placeholder="例如：已備孕 8 個月" placeholderTextColor={colors.gray400} />

        <Text style={styles.sectionTitle}>同意事項</Text>
        <Consent
          checked={agreeBooking}
          onPress={() => setAgreeBooking(v => !v)}
          title={`同意將上述姓名、電話與時段提供給 ${clinic.name}，用於聯絡預約`}
          sub="必須勾選才能送出預約"
          required
        />
        {record && (
          <>
            <Consent
              checked={agreeReport}
              onPress={() => setAgreeReport(v => !v)}
              title={`同意將本次檢測報告提供給 ${clinic.name} 的醫師參考`}
              sub="選填，不勾選也能預約"
            />
            {agreeReport && (
              <View style={styles.shareBox}>
                <Text style={styles.shareText}>診所會看到 {record.date} 這次的：</Text>
                <Text style={styles.shareText}>・T/C 比值、檢測狀態、試紙批號</Text>
                <Text style={styles.shareText}>・C 線、T 線訊號強度</Text>
                {record.preTestSurvey && includeSurvey && <Text style={styles.shareText}>・採樣問卷：禁慾天數、近期發燒、用藥、飲酒等</Text>}
                {record.preTestSurvey && (
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>附上採樣問卷</Text>
                    <Switch value={includeSurvey} onValueChange={setIncludeSurvey} trackColor={{ true: colors.primary }} />
                  </View>
                )}
                <Text style={[styles.shareText, { marginTop: 4 }]}>報告 30 天後自動失效，也可以隨時撤回。</Text>
              </View>
            )}
          </>
        )}

        {error && <Text style={styles.submitError}>{error}</Text>}
        <TouchableOpacity style={[styles.btnPrimary, !canSubmit && { opacity: 0.4 }]} onPress={submit} disabled={!canSubmit}>
          {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.btnPrimaryText}>送出預約申請</Text>}
        </TouchableOpacity>
        <Text style={styles.hint}>送出後由診所以電話聯絡確認時間，此時尚未完成掛號。</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function Consent({ checked, onPress, title, sub, required }: { checked: boolean, onPress: () => void, title: string, sub: string, required?: boolean }) {
  return (
    <TouchableOpacity style={[styles.consent, checked && styles.consentOn]} onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked }}>
      <Ionicons name={checked ? 'checkbox' : 'square-outline'} size={20} color={checked ? colors.primary : colors.gray400} />
      <View style={{ flex: 1 }}>
        <Text style={styles.consentTitle}>{title}{required && <Text style={styles.req}> *</Text>}</Text>
        <Text style={styles.consentSub}>{sub}</Text>
      </View>
    </TouchableOpacity>
  )
}

function Step({ ok, text, sub, last }: { ok?: boolean, text: string, sub?: string, last?: boolean }) {
  return (
    <View style={[styles.step, last && { borderBottomWidth: 0 }]}>
      <View style={[styles.dot, ok ? styles.dotOk : styles.dotNext]}>
        {ok && <Ionicons name="checkmark" size={12} color={colors.white} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.stepText}>{text}</Text>
        {!!sub && <Text style={styles.stepSub}>{sub}</Text>}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  appbar: { flexDirection: 'row', alignItems: 'center', paddingTop: 10, paddingHorizontal: 18, paddingBottom: 14 },
  back: { fontSize: 40, color: colors.primary, marginRight: 6, paddingBottom: 4 },
  appbarTitle: { flex: 1, fontSize: 22, fontWeight: '600', color: colors.gray900 },
  scroll: { flex: 1, paddingHorizontal: 18 },
  clinicLine: { fontSize: typography.sizes.sm, color: colors.gray500, marginBottom: 14 },
  label: { fontSize: typography.sizes.sm, color: colors.gray500, marginBottom: 6 },
  req: { color: colors.danger },
  input: {
    height: 44, borderWidth: 0.5, borderColor: colors.gray300, borderRadius: 12,
    paddingHorizontal: 12, fontSize: typography.sizes.md, color: colors.gray900, marginBottom: 14,
  },
  fieldError: { fontSize: typography.sizes.xs, color: colors.danger, marginTop: -10, marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, borderWidth: 0.5, borderColor: colors.gray200 },
  chipOn: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  chipText: { fontSize: typography.sizes.sm, color: colors.gray500 },
  chipTextOn: { color: colors.primary, fontWeight: '600' },
  sectionTitle: { fontSize: typography.sizes.md, fontWeight: '600', color: colors.gray900, marginTop: 6, marginBottom: 10 },
  consent: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', borderWidth: 0.5, borderColor: colors.gray200, borderRadius: 14, padding: 12, marginBottom: 8 },
  consentOn: { borderColor: colors.primary },
  consentTitle: { fontSize: typography.sizes.sm, color: colors.gray900, lineHeight: 20 },
  consentSub: { fontSize: typography.sizes.xs, color: colors.gray400, marginTop: 2 },
  shareBox: { backgroundColor: colors.gray100, borderRadius: 12, padding: 12, marginBottom: 8, marginLeft: 30 },
  shareText: { fontSize: typography.sizes.xs, color: colors.gray500, lineHeight: 18 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  switchLabel: { fontSize: typography.sizes.sm, color: colors.gray900 },
  submitError: { fontSize: typography.sizes.sm, color: colors.danger, textAlign: 'center', marginTop: 6 },
  btnPrimary: { height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 10, marginBottom: 8 },
  btnPrimaryText: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.white },
  btnGhost: { height: 44, borderRadius: 22, borderWidth: 0.5, borderColor: colors.gray200, alignItems: 'center', justifyContent: 'center' },
  btnGhostText: { fontSize: typography.sizes.sm, color: colors.gray500 },
  hint: { fontSize: typography.sizes.xs, color: colors.gray400, textAlign: 'center', lineHeight: 17 },
  successHead: { alignItems: 'center', paddingVertical: 24 },
  successIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.successLight, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  successTitle: { fontSize: typography.sizes.lg, fontWeight: '600', color: colors.gray900, marginBottom: 4 },
  successSub: { fontSize: typography.sizes.sm, color: colors.gray500, textAlign: 'center' },
  card: { borderWidth: 0.5, borderColor: colors.gray200, borderRadius: 18, padding: 14, marginBottom: 14 },
  step: { flexDirection: 'row', gap: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: colors.gray100 },
  dot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  dotOk: { backgroundColor: colors.success },
  dotNext: { backgroundColor: colors.gray100, borderWidth: 1, borderColor: colors.gray200 },
  stepText: { fontSize: typography.sizes.sm, color: colors.gray900 },
  stepSub: { fontSize: typography.sizes.xs, color: colors.gray400, marginTop: 2 },
})