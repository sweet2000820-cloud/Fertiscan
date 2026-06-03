import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { colors, typography } from '../theme'

export default function ReportOverviewScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => navigation.navigate('Main')}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>檢測結果</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* 標題列 */}
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.hint}>2026/04/23 · 上午 8:15</Text>
            <Text style={styles.title}>T/C 比值分析</Text>
          </View>
          <View style={styles.badgeWarn}>
            <Text style={styles.badgeWarnText}>邊緣值</Text>
          </View>
        </View>

        {/* 量規 */}
        <View style={styles.gaugeCard}>
          <Text style={styles.hint}>T/C 比值（定量指標）</Text>
          <View style={styles.gaugeCenter}>
            <Text style={styles.gaugeNum}>0.68</Text>
            <Text style={styles.gaugeUnit}>T/C ratio</Text>
          </View>
          <View style={styles.scaleBar}>
            <View style={styles.scaleNeedle} />
          </View>
          <View style={styles.scaleLabels}>
            <Text style={[styles.scaleLabel, { color: colors.danger }]}>低（&lt;0.5）</Text>
            <Text style={[styles.scaleLabel, { color: colors.warning }]}>邊緣</Text>
            <Text style={[styles.scaleLabel, { color: colors.success }]}>正常（≥0.85）</Text>
          </View>
        </View>

        {/* 條線訊號 */}
        <View style={styles.listCard}>
          <Text style={styles.sectionTitle}>條線訊號詳情</Text>
          <View style={styles.signalRow}>
            <Text style={styles.hint}>Control line (C) — 內部對照</Text>
            <Text style={[styles.signalValue, { color: '#1a6fbe' }]}>灰階 142</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: '84%', backgroundColor: '#1a6fbe' }]} />
          </View>
          <View style={styles.signalRow}>
            <Text style={styles.hint}>Test line (T) — 樣本反應</Text>
            <Text style={[styles.signalValue, { color: colors.danger }]}>灰階 97</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: '57%', backgroundColor: colors.danger }]} />
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.hint}>換算濃度（批號 2025-A 曲線）</Text>
            <Text style={[styles.infoValue, { color: colors.warning }]}>≈ 22 mIU/mL</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.hint}>參考下限</Text>
            <Text style={styles.infoValue}>25 mIU/mL</Text>
          </View>
        </View>

        {/* QC */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>影像品質確認</Text>
          {[
            { label: 'C line 訊號', ok: true },
            { label: 'T line 偵測', ok: true },
            { label: '影像穩定度', ok: true },
            { label: '螢幕亮度', ok: true },
            { label: '批號匹配', ok: true },
          ].map((item, i) => (
            <View key={i} style={styles.qcRow}>
              <Text style={styles.hint}>{item.label}</Text>
              <Text style={{ fontSize: typography.sizes.xs, color: colors.success }}>✓ 通過</Text>
            </View>
          ))}
        </View>

        {/* 警告卡片 */}
        <View style={styles.warnCard}>
          <Text style={styles.warnTitle}>⚠ 初步建議</Text>
          <Text style={styles.warnText}>此次 T/C 比值（0.68）低於正常參考值（≥0.85）。建議 2 週後複測，或諮詢生殖科醫師進行完整評估。</Text>
        </View>

        {/* 按鈕 */}
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.btnSecondary}>
            <Text style={styles.btnSecondaryText}>存入紀錄</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnPrimary}>
            <Text style={styles.btnPrimaryText}>分享醫師</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.btnGray}>
          <Text style={styles.btnGrayText}>複製分享連結</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  appbar: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.gray200,
  },
  back: { fontSize: 22, color: colors.primary, marginRight: 6 },
  appbarTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.gray900,
  },
  scroll: { flex: 1, padding: 18 },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  hint: { fontSize: typography.sizes.sm, color: colors.gray400 },
  title: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.gray900,
    marginTop: 2,
  },
  badgeWarn: {
    backgroundColor: colors.warningLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeWarnText: {
    fontSize: typography.sizes.xs,
    color: colors.warning,
    fontWeight: typography.weights.medium,
  },
  gaugeCard: {
    backgroundColor: colors.gray100,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  gaugeCenter: { alignItems: 'center', marginVertical: 12 },
  gaugeNum: {
    fontSize: 36,
    fontWeight: typography.weights.medium,
    color: colors.warning,
  },
  gaugeUnit: { fontSize: typography.sizes.sm, color: colors.gray400, marginTop: 2 },
  scaleBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray200,
    position: 'relative',
    marginBottom: 4,
  },
  scaleNeedle: {
    position: 'absolute',
    left: '40%',
    top: -4,
    width: 2.5,
    height: 16,
    backgroundColor: colors.gray900,
    borderRadius: 1.5,
  },
  scaleLabels: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  scaleLabel: { fontSize: typography.sizes.xs },
  listCard: {
    borderWidth: 0.5,
    borderColor: colors.gray200,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.gray500,
    marginBottom: 10,
  },
  signalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  signalValue: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium },
  progressBg: { height: 5, backgroundColor: colors.gray200, borderRadius: 3, marginBottom: 10, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  divider: { height: 0.5, backgroundColor: colors.gray200, marginVertical: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  infoValue: { fontSize: typography.sizes.sm, color: colors.gray900 },
  card: { backgroundColor: colors.gray100, borderRadius: 10, padding: 12, marginBottom: 14 },
  qcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.gray200,
  },
  warnCard: {
    backgroundColor: colors.warningLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  warnTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.warning,
    marginBottom: 4,
  },
  warnText: { fontSize: typography.sizes.sm, color: colors.warning, lineHeight: 18 },
  btnRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  btnSecondary: {
    flex: 1, height: 36, borderRadius: 9,
    borderWidth: 1.5, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  btnSecondaryText: { fontSize: typography.sizes.sm, color: colors.primary },
  btnPrimary: {
    flex: 1, height: 36, borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  btnPrimaryText: { fontSize: typography.sizes.sm, color: colors.white, fontWeight: typography.weights.medium },
  btnGray: {
    height: 36, borderRadius: 9,
    backgroundColor: colors.gray100,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  btnGrayText: { fontSize: typography.sizes.sm, color: colors.gray500 },
})