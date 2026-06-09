import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { colors, typography } from '../theme'

function getTCColor(status: string) {
  switch (status) {
    case '正常': return colors.primary
    case '邊緣': return colors.warning
    case '偏低': return colors.danger
    default: return colors.gray500
  }
}

function getNeedlePosition(tc: string) {
  const val = parseFloat(tc)
  if (val < 0.5) return '15%'
  if (val < 0.85) return `${((val - 0.5) / 0.35) * 35 + 15}%`
  return `${Math.min(((val - 0.85) / 0.15) * 20 + 50, 90)}%`
}

export default function ReportOverviewScreen({ navigation, route }: any) {
  const record = route?.params?.record || {
    date: '2026/04/23', time: '上午 8:15', tc: '0.68', status: '邊緣', lot: 'LOT-2025-A'
  }

  const tcVal = parseFloat(record.tc)
  const tcColor = getTCColor(record.status)
  const needlePos = getNeedlePosition(record.tc)

  const badgeStyle = record.status === '正常'
    ? { bg: colors.successLight, text: colors.success, label: '正常值' }
    : record.status === '邊緣'
    ? { bg: colors.warningLight, text: colors.warning, label: '邊緣值' }
    : { bg: colors.dangerLight, text: colors.danger, label: '偏低值' }

  const cLine = Math.round(tcVal * 142 / 0.68)
  const tLine = Math.round(97 * tcVal / 0.68)
  const conc = Math.round(22 * tcVal / 0.68)

  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>檢測結果</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.titleRow}>
          <View>
            <Text style={styles.hint}>{record.date} · {record.time}</Text>
            <Text style={styles.title}>T/C 比值分析</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: badgeStyle.bg }]}>
            <Text style={[styles.badgeText, { color: badgeStyle.text }]}>{badgeStyle.label}</Text>
          </View>
        </View>

        <View style={styles.gaugeCard}>
          <Text style={styles.hint}>T/C 比值（定量指標）</Text>
          <View style={styles.gaugeCenter}>
            <Text style={[styles.gaugeNum, { color: tcColor }]}>{record.tc}</Text>
            <Text style={styles.gaugeUnit}>T/C ratio</Text>
          </View>
          <View style={styles.scaleBar}>
            <View style={[styles.scaleNeedle, { left: `${needlePos}` as any }]} />
          </View>
          <View style={styles.scaleLabels}>
            <Text style={[styles.scaleLabel, { color: colors.danger }]}>低（&lt;0.5）</Text>
            <Text style={[styles.scaleLabel, { color: colors.warning }]}>邊緣</Text>
            <Text style={[styles.scaleLabel, { color: colors.success }]}>正常（≥0.85）</Text>
          </View>
        </View>

        <View style={styles.listCard}>
          <Text style={styles.sectionTitle}>條線訊號詳情</Text>
          <View style={styles.signalRow}>
            <Text style={styles.hint}>Control line (C) — 內部對照</Text>
            <Text style={[styles.signalValue, { color: '#1a6fbe' }]}>灰階 {cLine}</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${Math.min(cLine / 170 * 100, 100)}%`, backgroundColor: '#1a6fbe' }]} />
          </View>
          <View style={styles.signalRow}>
            <Text style={styles.hint}>Test line (T) — 樣本反應</Text>
            <Text style={[styles.signalValue, { color: tcColor }]}>灰階 {tLine}</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${Math.min(tLine / 170 * 100, 100)}%`, backgroundColor: tcColor }]} />
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.hint}>換算濃度（批號 {record.lot}）</Text>
            <Text style={[styles.infoValue, { color: tcColor }]}>≈ {conc} mIU/mL</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.hint}>參考下限</Text>
            <Text style={styles.infoValue}>25 mIU/mL</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>影像品質確認</Text>
          {['C line 訊號', 'T line 偵測', '影像穩定度', '螢幕亮度', '批號匹配'].map((item, i) => (
            <View key={i} style={styles.qcRow}>
              <Text style={styles.hint}>{item}</Text>
              <Text style={{ fontSize: typography.sizes.xs, color: colors.success }}>✓ 通過</Text>
            </View>
          ))}
        </View>

        <View style={[styles.warnCard, { backgroundColor: badgeStyle.bg }]}>
          <Text style={[styles.warnTitle, { color: badgeStyle.text }]}>
            {record.status === '正常' ? '✓ 結果說明' : '⚠ 初步建議'}
          </Text>
          <Text style={[styles.warnText, { color: badgeStyle.text }]}>
            {record.status === '正常'
              ? `此次 T/C 比值（${record.tc}）在正常範圍內（≥0.85）。建議維持目前生活習慣，定期複測追蹤趨勢。`
              : record.status === '邊緣'
              ? `此次 T/C 比值（${record.tc}）低於正常參考值（≥0.85）。建議 2 週後複測，或諮詢生殖科醫師進行完整評估。`
              : `此次 T/C 比值（${record.tc}）明顯偏低。建議儘速諮詢生殖科醫師進行進一步檢查。`
            }
          </Text>
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.navigate('Main', { screen: '紀錄' })}>
            <Text style={styles.btnSecondaryText}>存入紀錄</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.navigate('ShareRecord')}>
            <Text style={styles.btnPrimaryText}>分享醫師</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.btnGray} onPress={() => navigation.navigate('ReportLink', { records: [record] })}>
          <Text style={styles.btnGrayText}>複製分享連結</Text>
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
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  hint: { fontSize: typography.sizes.sm, color: colors.gray400 },
  title: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900, marginTop: 2 },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.medium },
  gaugeCard: { backgroundColor: colors.gray100, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 14 },
  gaugeCenter: { alignItems: 'center', marginVertical: 12 },
  gaugeNum: { fontSize: 36, fontWeight: typography.weights.medium },
  gaugeUnit: { fontSize: typography.sizes.sm, color: colors.gray400, marginTop: 2 },
  scaleBar: { width: '100%', height: 8, borderRadius: 4, backgroundColor: colors.gray200, position: 'relative', marginBottom: 4 },
  scaleNeedle: { position: 'absolute', top: -4, width: 2.5, height: 16, backgroundColor: colors.gray900, borderRadius: 1.5 },
  scaleLabels: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  scaleLabel: { fontSize: typography.sizes.xs },
  listCard: { borderWidth: 0.5, borderColor: colors.gray200, borderRadius: 10, padding: 12, marginBottom: 14 },
  sectionTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.gray500, marginBottom: 10 },
  signalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  signalValue: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium },
  progressBg: { height: 5, backgroundColor: colors.gray200, borderRadius: 3, marginBottom: 10, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  divider: { height: 0.5, backgroundColor: colors.gray200, marginVertical: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  infoValue: { fontSize: typography.sizes.sm, color: colors.gray900 },
  card: { backgroundColor: colors.gray100, borderRadius: 10, padding: 12, marginBottom: 14 },
  qcRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: colors.gray200 },
  warnCard: { borderRadius: 10, padding: 12, marginBottom: 14 },
  warnTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, marginBottom: 4 },
  warnText: { fontSize: typography.sizes.sm, lineHeight: 18 },
  btnRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  btnSecondary: { flex: 1, height: 36, borderRadius: 9, borderWidth: 1.5, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  btnSecondaryText: { fontSize: typography.sizes.sm, color: colors.primary },
  btnPrimary: { flex: 1, height: 36, borderRadius: 9, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  btnPrimaryText: { fontSize: typography.sizes.sm, color: colors.white, fontWeight: typography.weights.medium },
  btnGray: { height: 36, borderRadius: 9, backgroundColor: colors.gray100, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  btnGrayText: { fontSize: typography.sizes.sm, color: colors.gray500 },
})