import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { colors, typography } from '../theme'

const records = [
  { date: '2026/04/23', tc: '0.68', status: '邊緣', latest: true },
  { date: '2026/03/10', tc: '0.91', status: '正常', latest: false },
  { date: '2026/02/14', tc: '0.88', status: '正常', latest: false },
]

export default function ShareRecordScreen({ navigation }: any) {
  const [selected, setSelected] = useState([0])

  function toggleRecord(i: number) {
    if (selected.includes(i)) {
      setSelected(selected.filter(s => s !== i))
    } else {
      setSelected([...selected, i])
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>分享檢測記錄</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* 診所資訊 */}
        <View style={styles.clinicRow}>
          <View style={styles.clinicIcon}>
            <Text style={styles.clinicIconText}>台生</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.clinicName}>台北生殖醫學中心</Text>
            <Text style={styles.clinicSub}>李建宏 醫師</Text>
          </View>
          <View style={styles.connectedBadge}>
            <Text style={styles.connectedText}>已連結</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* 選擇記錄 */}
        <Text style={styles.sectionTitle}>選擇要分享的記錄</Text>
        {records.map((r, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.recordRow, selected.includes(i) && styles.recordRowSelected]}
            onPress={() => toggleRecord(i)}
          >
            <View style={[styles.checkbox, selected.includes(i) && styles.checkboxDone]}>
              {selected.includes(i) && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.recordDate, selected.includes(i) && { color: colors.primary }]}>
                {r.date} · T/C {r.tc}
              </Text>
              <Text style={styles.recordSub}>{r.status}</Text>
            </View>
            {r.latest && (
              <View style={styles.latestBadge}>
                <Text style={styles.latestText}>最新</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* 分享內容 */}
        <Text style={styles.sectionTitle}>分享內容</Text>
        <View style={styles.card}>
          {[
            { label: 'T/C 比值 · 換算濃度', ok: true },
            { label: 'QC 影像品質資訊', ok: true },
            { label: '原始試紙影像', ok: false },
            { label: '個人識別資訊', ok: false },
          ].map((item, i) => (
            <View key={i} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={[styles.infoValue, { color: item.ok ? colors.gray900 : colors.gray400 }]}>
                {item.ok ? '✓' : '✗ 不含'}
              </Text>
            </View>
          ))}
        </View>

        {/* 按鈕 */}
        <TouchableOpacity
          style={[styles.btnPrimary, selected.length === 0 && { opacity: 0.4 }]}
          onPress={() => selected.length > 0 && navigation.navigate('ShareSent')}
          disabled={selected.length === 0}
        >
          <Text style={styles.btnPrimaryText}>傳送至診所系統</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.navigate('ReportLink')}>
          <Text style={styles.btnSecondaryText}>產生分享連結</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnGray} onPress={() => navigation.goBack()}>
          <Text style={styles.btnGrayText}>取消</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />

      </ScrollView>
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
  scroll: { flex: 1, padding: 18 },
  clinicRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  clinicIcon: {
    width: 38, height: 38, borderRadius: 9,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  clinicIconText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.primary },
  clinicName: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  clinicSub: { fontSize: typography.sizes.xs, color: colors.gray400 },
  connectedBadge: { backgroundColor: colors.successLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  connectedText: { fontSize: typography.sizes.xs, color: colors.success, fontWeight: typography.weights.medium },
  divider: { height: 0.5, backgroundColor: colors.gray200, marginVertical: 12 },
  sectionTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.gray500, marginBottom: 8 },
  recordRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 10, borderRadius: 8, borderWidth: 0.5,
    borderColor: colors.gray200, marginBottom: 8,
  },
  recordRowSelected: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.primaryLight },
  checkbox: {
    width: 15, height: 15, borderRadius: 3,
    borderWidth: 1, borderColor: colors.gray300,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { fontSize: 9, color: '#fff' },
  recordDate: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  recordSub: { fontSize: typography.sizes.xs, color: colors.gray400, marginTop: 2 },
  latestBadge: { backgroundColor: colors.warningLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  latestText: { fontSize: typography.sizes.xs, color: colors.warning, fontWeight: typography.weights.medium },
  card: { backgroundColor: colors.gray100, borderRadius: 10, padding: 12, marginBottom: 14 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  infoLabel: { fontSize: typography.sizes.sm, color: colors.gray500 },
  infoValue: { fontSize: typography.sizes.sm },
  btnPrimary: {
    height: 42, borderRadius: 9, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  btnPrimaryText: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: '#fff' },
  btnSecondary: {
    height: 42, borderRadius: 9, borderWidth: 1.5, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  btnSecondaryText: { fontSize: typography.sizes.md, color: colors.primary },
  btnGray: {
    height: 36, borderRadius: 9, backgroundColor: colors.gray100,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  btnGrayText: { fontSize: typography.sizes.sm, color: colors.gray500 },
})