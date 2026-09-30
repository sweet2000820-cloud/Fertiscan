import { useState, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { colors, typography } from '../theme'
import { Ionicons } from '@expo/vector-icons'
import {
  fetchMyAppointments, cancelAppointment, revokeReport,
  Appointment, SharedReport, APPOINTMENT_STATUS_LABEL,
} from '../clinicApi'

// [改版 2026/09/30] 我的診所（沿用路由名稱 ClinicList，設定頁的入口不用改）
// 取代原本的「診所連結管理」：
// - 顯示預約申請與診所回報的狀態、約診時間
// - 列出分享給每家診所的報告，可以撤回
// - 拿掉「自動分享」：之後的報告要分享，由使用者在診所資訊頁逐次確認

const STATUS_STYLE: Record<string, { bg: string, fg: string }> = {
  new: { bg: colors.warningLight, fg: colors.warning },
  contacted: { bg: colors.primaryLight, fg: colors.primary },
  booked: { bg: colors.successLight, fg: colors.success },
  closed: { bg: colors.gray100, fg: colors.gray500 },
  cancelled: { bg: colors.gray100, fg: colors.gray500 },
}

function formatDate(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

function reportStateLabel(r: SharedReport) {
  if (r.state === 'revoked') return { text: '已撤回', color: colors.gray400 }
  if (r.state === 'expired') return { text: '已過期', color: colors.gray400 }
  if (r.viewed) return { text: '診所已查看', color: colors.success }
  return { text: '已送達', color: colors.primary }
}

export default function ClinicListScreen({ navigation }: any) {
  const [items, setItems] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true)
    setError(null)
    try {
      setItems(await fetchMyAppointments())
    } catch (e: any) {
      setError(e?.message || '讀取失敗')
    }
    isRefresh ? setRefreshing(false) : setLoading(false)
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  function handleRevoke(a: Appointment, r: SharedReport) {
    Alert.alert('撤回報告', `撤回後，${a.clinicName} 將無法再查看 ${r.date} 這份報告。`, [
      { text: '取消', style: 'cancel' },
      { text: '撤回', style: 'destructive', onPress: async () => {
        setBusyId(r.shareId)
        try { await revokeReport(r.shareId); await load(true) }
        catch (e: any) { Alert.alert('撤回失敗', e?.message || '請稍後再試') }
        setBusyId(null)
      }},
    ])
  }

  function handleCancel(a: Appointment) {
    Alert.alert('取消預約', `確定要取消向 ${a.clinicName} 的預約申請嗎？\n\n已分享給這家診所的報告也會一併撤回。`, [
      { text: '不要取消', style: 'cancel' },
      { text: '取消預約', style: 'destructive', onPress: async () => {
        setBusyId(a.id)
        try { await cancelAppointment(a.id); await load(true) }
        catch (e: any) { Alert.alert('取消失敗', e?.message || '請稍後再試') }
        setBusyId(null)
      }},
    ])
  }

  const active = items.filter(a => a.status !== 'cancelled' && a.status !== 'closed')
  const past = items.filter(a => a.status === 'cancelled' || a.status === 'closed')

  function renderAppointment(a: Appointment) {
    const st = STATUS_STYLE[a.status] || STATUS_STYLE.closed
    const ended = a.status === 'cancelled' || a.status === 'closed'
    return (
      <View key={a.id} style={[styles.card, ended && { opacity: 0.7 }]}>
        <View style={styles.cardHead}>
          <View style={styles.clinicIcon}><Text style={styles.clinicIconText}>{a.clinicName.slice(0, 2)}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.clinicName}>{a.clinicName}</Text>
            <View style={[styles.badge, { backgroundColor: st.bg }]}>
              <Text style={[styles.badgeText, { color: st.fg }]}>{APPOINTMENT_STATUS_LABEL[a.status]}</Text>
            </View>
          </View>
        </View>

        {!!a.scheduledText && (
          <View style={styles.schedBox}>
            <Ionicons name="calendar" size={15} color={colors.success} />
            <Text style={styles.schedText}>約診時間：{a.scheduledText}</Text>
          </View>
        )}
        <View style={styles.row}><Text style={styles.rowKey}>送出日期</Text><Text style={styles.rowVal}>{formatDate(a.createdAt)}</Text></View>
        <View style={styles.row}><Text style={styles.rowKey}>方便時段</Text><Text style={styles.rowVal}>{a.slots.join('、')}</Text></View>

        <Text style={styles.subTitle}>分享給這家診所的報告</Text>
        {a.reports.length === 0 ? (
          <Text style={styles.muted}>沒有分享報告</Text>
        ) : a.reports.map(r => {
          const label = reportStateLabel(r)
          return (
            <View key={r.shareId} style={styles.reportRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.reportText}>{r.date}・T/C {r.tc}</Text>
                <Text style={[styles.reportState, { color: label.color }]}>{label.text}</Text>
              </View>
              {r.state === 'active' && (
                busyId === r.shareId
                  ? <ActivityIndicator size="small" color={colors.danger} />
                  : <TouchableOpacity onPress={() => handleRevoke(a, r)}><Text style={styles.revokeText}>撤回</Text></TouchableOpacity>
              )}
            </View>
          )
        })}

        {!ended && (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(a)} disabled={busyId === a.id}>
            {busyId === a.id ? <ActivityIndicator size="small" color={colors.gray500} /> : <Text style={styles.cancelText}>取消預約</Text>}
          </TouchableOpacity>
        )}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>我的診所</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
      >
        {loading ? (
          <View style={styles.stateBox}><ActivityIndicator color={colors.primary} /></View>
        ) : error ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity onPress={() => load()}><Text style={styles.retry}>重新載入</Text></TouchableOpacity>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.stateBox}>
            <Ionicons name="medkit-outline" size={28} color={colors.gray300} />
            <Text style={styles.stateText}>還沒有預約任何合作診所</Text>
            <Text style={styles.stateHint}>檢測完成後，可以在報告頁按「諮詢專業醫師」預約，並選擇是否一起分享報告。</Text>
          </View>
        ) : (
          <>
            {active.length > 0 && <Text style={styles.sectionTitle}>進行中</Text>}
            {active.map(renderAppointment)}
            {past.length > 0 && <Text style={styles.sectionTitle}>已結束</Text>}
            {past.map(renderAppointment)}
          </>
        )}

        <TouchableOpacity style={styles.findBtn} onPress={() => navigation.navigate('ClinicSearch')}>
          <Ionicons name="search-outline" size={16} color={colors.primary} />
          <Text style={styles.findText}>找合作診所</Text>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>關於分享報告</Text>
          <Text style={styles.infoText}>
            報告只會分享給你預約的診所，每次都由你按下確認才會送出，不會自動分享。分享的報告 30 天後自動失效，你也可以隨時撤回。
          </Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  appbar: { flexDirection: 'row', alignItems: 'center', paddingTop: 10, paddingHorizontal: 18, paddingBottom: 10 },
  back: { fontSize: 40, color: colors.primary, marginRight: 6, paddingBottom: 4 },
  appbarTitle: { flex: 1, fontSize: 22, fontWeight: '600', color: colors.gray900 },
  scroll: { flex: 1, paddingHorizontal: 18 },
  sectionTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.gray500, marginBottom: 8, marginTop: 4 },
  stateBox: { borderWidth: 0.5, borderColor: colors.gray200, borderRadius: 18, padding: 24, alignItems: 'center', gap: 8, marginBottom: 16 },
  stateText: { fontSize: typography.sizes.md, color: colors.gray500, textAlign: 'center' },
  stateHint: { fontSize: typography.sizes.sm, color: colors.gray400, textAlign: 'center', lineHeight: 20 },
  retry: { fontSize: typography.sizes.sm, color: colors.primary, fontWeight: typography.weights.medium },
  card: { borderWidth: 0.5, borderColor: colors.gray200, borderRadius: 18, padding: 14, marginBottom: 14 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  clinicIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  clinicIconText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.primary },
  clinicName: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900, marginBottom: 3 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.medium },
  schedBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.successLight, borderRadius: 10, padding: 10, marginBottom: 8 },
  schedText: { fontSize: typography.sizes.sm, color: colors.success, fontWeight: typography.weights.medium },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  rowKey: { fontSize: typography.sizes.sm, color: colors.gray400 },
  rowVal: { fontSize: typography.sizes.sm, color: colors.gray900 },
  subTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.gray900, marginTop: 10, marginBottom: 4 },
  muted: { fontSize: typography.sizes.sm, color: colors.gray400 },
  reportRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderTopWidth: 0.5, borderTopColor: colors.gray100 },
  reportText: { fontSize: typography.sizes.sm, color: colors.gray900 },
  reportState: { fontSize: typography.sizes.xs, marginTop: 1 },
  revokeText: { fontSize: typography.sizes.sm, color: colors.danger, paddingHorizontal: 4 },
  cancelBtn: { alignSelf: 'flex-start', marginTop: 10, paddingVertical: 4 },
  cancelText: { fontSize: typography.sizes.sm, color: colors.gray500, textDecorationLine: 'underline' },
  findBtn: {
    height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: colors.primary, marginBottom: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  findText: { fontSize: typography.sizes.md, color: colors.primary, fontWeight: typography.weights.medium },
  infoCard: { backgroundColor: colors.primaryLight, borderRadius: 16, padding: 14 },
  infoTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.primary, marginBottom: 4 },
  infoText: { fontSize: typography.sizes.xs, color: colors.gray900, lineHeight: 18 },
})