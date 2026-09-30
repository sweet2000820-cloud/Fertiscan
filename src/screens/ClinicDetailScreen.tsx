import { useState, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert, ActivityIndicator, Switch } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { colors, typography } from '../theme'
import { Ionicons } from '@expo/vector-icons'
import {
  fetchMyAppointments, isActiveAppointment, shareReportToAppointment,
  Appointment, PartnerClinic, APPOINTMENT_STATUS_LABEL,
} from '../clinicApi'

// [新增 2026/09/30] 診所資訊
// - 還沒預約：按「預約並分享報告」進入預約申請
// - 已經預約過且預約還在進行中：可以把這次的報告再分享給這家診所（每次都要使用者確認）

export default function ClinicDetailScreen({ navigation, route }: any) {
  const clinic: PartnerClinic = route?.params?.clinic
  const record = route?.params?.record

  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [includeSurvey, setIncludeSurvey] = useState(true)
  const [sharing, setSharing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const mine = await fetchMyAppointments()
      setAppointment(mine.find(a => a.clinicId === clinic?.id && isActiveAppointment(a)) || null)
    } catch (e) {
      setAppointment(null)
    }
    setLoading(false)
  }, [clinic?.id])

  // 從預約頁送出回來時重新讀取
  useFocusEffect(useCallback(() => { load() }, [load]))

  if (!clinic) {
    return <View style={styles.container}><Text style={styles.stateText}>找不到診所資料</Text></View>
  }

  const alreadyShared = !!(appointment && record && appointment.reports.some(r =>
    r.state === 'active' && r.date === record.date && r.time === record.time))

  function open(url: string) {
    Linking.openURL(url).catch(() => Alert.alert('無法開啟', '請稍後再試'))
  }

  async function handleShare() {
    if (!appointment || !record) return
    setSharing(true)
    try {
      await shareReportToAppointment(appointment.id, record, includeSurvey)
      setConfirming(false)
      Alert.alert('已分享', `本次檢測報告已送到 ${clinic.name}，30 天後自動失效，也可以在「我的診所」撤回。`)
      load()
    } catch (e: any) {
      Alert.alert('分享失敗', e?.message || '請稍後再試')
    }
    setSharing(false)
  }

  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>診所資訊</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{clinic.name.slice(0, 2)}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{clinic.name}</Text>
            <View style={styles.partnerBadge}><Text style={styles.partnerText}>合作診所</Text></View>
          </View>
        </View>

        <View style={styles.card}>
          <InfoRow k="地址" v={clinic.area} />
          <InfoRow k="門診時間" v={clinic.hours} />
          <InfoRow k="看診科別" v={clinic.department} />
          <InfoRow k="電話" v={clinic.phone} />
          <InfoRow k="預約方式" v="App 內申請，診所回電確認時間" />
        </View>

        {loading ? (
          <View style={styles.stateBox}><ActivityIndicator color={colors.primary} /></View>
        ) : appointment ? (
          <>
            <View style={styles.bookedCard}>
              <Text style={styles.bookedTitle}>你已向這家診所送出預約</Text>
              <Text style={styles.bookedText}>
                {APPOINTMENT_STATUS_LABEL[appointment.status]}
                {appointment.scheduledText ? `・約診時間 ${appointment.scheduledText}` : ''}
              </Text>
            </View>

            {record && !alreadyShared && !confirming && (
              <TouchableOpacity style={styles.btnPrimary} onPress={() => setConfirming(true)}>
                <Ionicons name="paper-plane-outline" size={16} color={colors.white} />
                <Text style={styles.btnPrimaryText}>分享本次報告給這家診所</Text>
              </TouchableOpacity>
            )}
            {record && alreadyShared && (
              <Text style={styles.hint}>本次檢測報告已經分享給這家診所。</Text>
            )}
            {confirming && (
              <View style={styles.confirmBox}>
                <Text style={styles.confirmTitle}>確認分享給 {clinic.name}？</Text>
                <Text style={styles.confirmText}>
                  診所會看到 {record.date} 這次的 T/C 比值、檢測狀態、試紙批號與 C/T 線訊號強度。連結 30 天後自動失效，也可以隨時撤回。
                </Text>
                {record.preTestSurvey && (
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>附上採樣問卷（禁慾天數、近期發燒、用藥等）</Text>
                    <Switch value={includeSurvey} onValueChange={setIncludeSurvey} trackColor={{ true: colors.primary }} />
                  </View>
                )}
                <View style={styles.btnRow}>
                  <TouchableOpacity style={[styles.btnSecondary, { flex: 1 }]} onPress={() => setConfirming(false)} disabled={sharing}>
                    <Text style={styles.btnSecondaryText}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btnPrimary, { flex: 1, marginBottom: 0 }]} onPress={handleShare} disabled={sharing}>
                    {sharing ? <ActivityIndicator color={colors.white} /> : <Text style={styles.btnPrimaryText}>確認分享</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            )}
            <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.navigate('ClinicList')}>
              <Text style={styles.btnSecondaryText}>查看預約狀態</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.navigate('Booking', { clinic, record })}>
              <Ionicons name="calendar-outline" size={16} color={colors.white} />
              <Text style={styles.btnPrimaryText}>{record ? '預約並分享報告' : '預約諮詢'}</Text>
            </TouchableOpacity>
            {record && <Text style={styles.hint}>預約時可以選擇要不要附上這次的檢測報告，不附上也能預約。</Text>}
          </>
        )}

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.btnSecondary, { flex: 1 }]}
            onPress={() => open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${clinic.name} ${clinic.area}`)}`)}
          >
            <Ionicons name="navigate-outline" size={15} color={colors.primary} />
            <Text style={styles.btnSecondaryText}>地圖導航</Text>
          </TouchableOpacity>
          {!!clinic.url && (
            <TouchableOpacity style={[styles.btnSecondary, { flex: 1 }]} onPress={() => open(clinic.url!)}>
              <Ionicons name="globe-outline" size={15} color={colors.primary} />
              <Text style={styles.btnSecondaryText}>診所官網</Text>
            </TouchableOpacity>
          )}
        </View>
        {!!clinic.phone && (
          <TouchableOpacity style={styles.btnSecondary} onPress={() => open(`tel:${clinic.phone!.replace(/[^\d+]/g, '')}`)}>
            <Ionicons name="call-outline" size={15} color={colors.primary} />
            <Text style={styles.btnSecondaryText}>撥打電話</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

function InfoRow({ k, v }: { k: string, v: string | null | undefined }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoKey}>{k}</Text>
      <Text style={[styles.infoValue, !v && { color: colors.gray400 }]}>{v || '待診所提供'}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  appbar: { flexDirection: 'row', alignItems: 'center', paddingTop: 10, paddingHorizontal: 18, paddingBottom: 14 },
  back: { fontSize: 40, color: colors.primary, marginRight: 6, paddingBottom: 4 },
  appbarTitle: { flex: 1, fontSize: 22, fontWeight: '600', color: colors.gray900 },
  scroll: { flex: 1, paddingHorizontal: 18 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.primary },
  name: { fontSize: typography.sizes.lg, fontWeight: '600', color: colors.gray900, marginBottom: 4 },
  partnerBadge: { alignSelf: 'flex-start', backgroundColor: colors.successLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  partnerText: { fontSize: typography.sizes.xs, color: colors.success, fontWeight: typography.weights.medium },
  card: { borderWidth: 0.5, borderColor: colors.gray200, borderRadius: 18, padding: 14, marginBottom: 14 },
  infoRow: { flexDirection: 'row', gap: 10, paddingVertical: 4 },
  infoKey: { width: 64, fontSize: typography.sizes.sm, color: colors.gray400 },
  infoValue: { flex: 1, fontSize: typography.sizes.sm, color: colors.gray900, lineHeight: 20 },
  stateBox: { padding: 20, alignItems: 'center' },
  stateText: { fontSize: typography.sizes.sm, color: colors.gray500, textAlign: 'center', padding: 24 },
  bookedCard: { backgroundColor: colors.primaryLight, borderRadius: 16, padding: 14, marginBottom: 10 },
  bookedTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.primary, marginBottom: 2 },
  bookedText: { fontSize: typography.sizes.sm, color: colors.gray900 },
  confirmBox: { borderWidth: 1, borderColor: colors.primary, borderRadius: 16, padding: 14, marginBottom: 10 },
  confirmTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900, marginBottom: 6 },
  confirmText: { fontSize: typography.sizes.sm, color: colors.gray500, lineHeight: 20, marginBottom: 10 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  switchLabel: { flex: 1, fontSize: typography.sizes.sm, color: colors.gray900 },
  btnRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  btnPrimary: {
    height: 46, borderRadius: 23, backgroundColor: colors.primary, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  btnPrimaryText: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.white },
  btnSecondary: {
    height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: colors.primary, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  btnSecondaryText: { fontSize: typography.sizes.sm, color: colors.primary, fontWeight: typography.weights.medium },
  hint: { fontSize: typography.sizes.xs, color: colors.gray400, textAlign: 'center', marginBottom: 12, lineHeight: 17 },
})