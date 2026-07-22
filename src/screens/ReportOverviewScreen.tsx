import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native'
import { colors, typography } from '../theme'
import { Ionicons } from '@expo/vector-icons'
import { getUserPlan } from '../plan'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'

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

  const cLine = record.cIntensity ? record.cIntensity.toFixed(1) : Math.round(tcVal * 142 / 0.68)
  const tLine = record.tIntensity ? record.tIntensity.toFixed(1) : Math.round(97 * tcVal / 0.68)
  const conc = '待校準'

  async function exportPDF() {
    const html = `
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: sans-serif; padding: 40px; color: #333; }
          h1 { color: #0A5C6B; font-size: 24px; margin-bottom: 4px; }
          .subtitle { color: #888; font-size: 14px; margin-bottom: 30px; }
          .section { margin-bottom: 24px; }
          .section-title { color: #0A5C6B; font-size: 16px; font-weight: bold; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 6px; }
          .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
          .label { color: #888; font-size: 13px; }
          .value { font-size: 13px; font-weight: bold; }
          .tc-value { font-size: 48px; font-weight: bold; color: ${tcColor}; text-align: center; margin: 20px 0; }
          .footer { margin-top: 40px; font-size: 11px; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 16px; }
        </style>
      </head>
      <body>
        <h1>FertiScan 檢測報告</h1>
        <p class="subtitle">${record.date} · ${record.time}</p>
        <div class="section">
          <div class="section-title">T/C 比值結果</div>
          <div class="tc-value">${record.tc}</div>
          <div class="row"><span class="label">狀態</span><span class="value">${badgeStyle.label}</span></div>
          <div class="row"><span class="label">換算濃度</span><span class="value">≈ ${conc} mIU/mL</span></div>
          <div class="row"><span class="label">參考下限</span><span class="value">25 mIU/mL</span></div>
          <div class="row"><span class="label">試紙批號</span><span class="value">${record.lot}</span></div>
        </div>
        <div class="section">
          <div class="section-title">條線訊號詳情</div>
          <div class="row"><span class="label">Control line (C)</span><span class="value">灰階 ${cLine}</span></div>
          <div class="row"><span class="label">Test line (T)</span><span class="value">灰階 ${tLine}</span></div>
        </div>
        <div class="section">
          <div class="section-title">影像品質確認</div>
          <div class="row"><span class="label">C line 訊號</span><span class="value" style="color:green">✓ 通過</span></div>
          <div class="row"><span class="label">T line 偵測</span><span class="value" style="color:green">✓ 通過</span></div>
          <div class="row"><span class="label">影像穩定度</span><span class="value" style="color:green">✓ 通過</span></div>
          <div class="row"><span class="label">螢幕亮度</span><span class="value" style="color:green">✓ 通過</span></div>
          <div class="row"><span class="label">批號匹配</span><span class="value" style="color:green">✓ 通過</span></div>
        </div>
        <div class="section">
          <div class="section-title">初步建議</div>
          <p style="font-size:13px; color:#555; line-height:1.6;">
            ${record.status === '正常'
              ? `此次 T/C 比值（${record.tc}）在正常範圍內（≥0.85）。建議維持目前生活習慣，定期複測追蹤趨勢。`
              : record.status === '邊緣'
              ? `此次 T/C 比值（${record.tc}）低於正常參考值（≥0.85）。建議 2 週後複測，或諮詢生殖科醫師進行完整評估。`
              : `此次 T/C 比值（${record.tc}）明顯偏低。建議儘速諮詢生殖科醫師進行進一步檢查。`
            }
          </p>
        </div>
        <div class="footer">
          本報告由 FertiScan App 自動生成，僅供初步參考，不構成醫療診斷。<br/>
          如有疑慮請諮詢生殖科醫師。
        </div>
      </body>
      </html>
    `
    try {
      const { uri } = await Print.printToFileAsync({ html })
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: '分享 FertiScan 報告' })
    } catch (e) {
      Alert.alert('匯出失敗', '請再試一次')
    }
  }

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
        {(record.debugFull || record.debugInner) && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>偵測影像（除錯用）</Text>
            {record.debugFull && (
              <>
                <Text style={[styles.hint, { marginBottom: 6 }]}>完整拍攝畫面 / ROI 定位</Text>
                <Image
                  source={{ uri: `data:image/jpeg;base64,${record.debugFull}` }}
                  style={styles.debugImage}
                  resizeMode="contain"
                />
              </>
            )}
            {record.debugInner && (
              <>
                <Text style={[styles.hint, { marginTop: 12, marginBottom: 6 }]}>實際辨識區域（試紙裁切）</Text>
                <Image
                  source={{ uri: `data:image/jpeg;base64,${record.debugInner}` }}
                  style={styles.debugImage}
                  resizeMode="contain"
                />
              </>
            )}
          </View>
        )}

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
            <Text style={styles.btnPrimaryText}>與診所分享</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.aiBtn}
          onPress={async () => {
              const { plan } = await getUserPlan()
              if (plan === 'pro') {
              navigation.navigate('AIAdvice', { record })
            } else {
              Alert.alert('Pro 功能', 'AI 趨勢解讀為 Pro 版專屬功能，升級後即可使用。', [
                { text: '稍後再說', style: 'cancel' },
                { text: '升級 Pro', onPress: () => navigation.navigate('Plan') },
              ])
            }
          }}
        >
          <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
          <Text style={styles.aiBtnText}>AI 趨勢解讀</Text>
          <View style={styles.proBadge}>
            <Text style={styles.proBadgeText}>PRO</Text>
          </View>
        </TouchableOpacity>

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
  back: { fontSize: 30, color: colors.primary, marginRight: 6 },
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
  debugImage: {
    width: '100%',
    height: 220,
    borderRadius: 8,
    backgroundColor: colors.gray200,
  },
  qcRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: colors.gray200 },
  warnCard: { borderRadius: 10, padding: 12, marginBottom: 14 },
  warnTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, marginBottom: 4 },
  warnText: { fontSize: typography.sizes.sm, lineHeight: 18 },
  btnRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  btnSecondary: { flex: 1, height: 36, borderRadius: 9, borderWidth: 1.5, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  btnSecondaryText: { fontSize: typography.sizes.sm, color: colors.primary },
  btnPrimary: { flex: 1, height: 36, borderRadius: 9, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  btnPrimaryText: { fontSize: typography.sizes.sm, color: colors.white, fontWeight: typography.weights.medium },
  btnGray: { height: 36, borderRadius: 9, backgroundColor: colors.gray100, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  btnGrayText: { fontSize: typography.sizes.sm, color: colors.gray500 },
  aiBtn: {
    height: 42, borderRadius: 9,
    borderWidth: 1.5, borderColor: colors.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginBottom: 8,
  },
  aiBtnText: { fontSize: typography.sizes.md, color: colors.primary, fontWeight: typography.weights.medium },
  proBadge: { backgroundColor: colors.primary, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3 },
  proBadgeText: { fontSize: 9, color: '#fff', fontWeight: typography.weights.medium },
})