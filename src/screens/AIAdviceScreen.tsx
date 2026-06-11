import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { colors, typography } from '../theme'

export default function AIAdviceScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>AI 生活習慣建議</Text>
        <View style={styles.proBadge}>
          <Text style={styles.proBadgeText}>Pro</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* 問卷摘要 */}
        <View style={styles.darkCard}>
          <Text style={styles.darkLabel}>2026/04/23 · 本次問卷回覆摘要</Text>
          {[
            { label: '睡眠', value: '5–6 小時（偏低）', color: colors.danger },
            { label: '運動', value: '每週 1–2 次', color: '#EF9F27' },
            { label: '久坐', value: '幾乎每天', color: colors.danger },
            { label: '飲酒', value: '偶爾', color: '#97C459' },
            { label: '壓力', value: '壓力較大', color: '#EF9F27' },
          ].map((item, i) => (
            <View key={i} style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{item.label}</Text>
              <Text style={[styles.summaryValue, { color: item.color }]}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* 整體評估 */}
        <View style={styles.adviceCard}>
          <Text style={styles.adviceTitle}>整體生活習慣評估</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>整體評分</Text>
            <View style={styles.scoreBar}>
              <View style={[styles.scoreBarFill, { width: '45%' }]} />
            </View>
            <Text style={[styles.scoreValue, { color: '#EF9F27' }]}>45 / 100</Text>
          </View>
          <Text style={styles.adviceText}>
            根據本次問卷，您目前在睡眠與久坐兩個面向有較大改善空間，運動量與壓力管理也值得關注。飲酒習慣良好，是目前最健康的一項。
          </Text>
        </View>

        {/* 各面向分析 */}
        <View style={styles.adviceCard}>
          <Text style={styles.adviceTitle}>各面向詳細分析</Text>
          {[
            { icon: '😴', label: '睡眠不足', status: '需要改善', statusColor: colors.danger, text: '每晚 5–6 小時低於建議的 7–9 小時。長期睡眠不足會影響荷爾蒙平衡與免疫力。' },
            { icon: '🪑', label: '長時間久坐', status: '需要改善', statusColor: colors.danger, text: '幾乎每天久坐會導致骨盆血液循環不良，影響生殖功能。' },
            { icon: '🏃', label: '運動量略低', status: '可以加強', statusColor: '#EF9F27', text: '每週 1–2 次稍低於建議的每週 3 次。規律有氧運動有助於降低壓力荷爾蒙。' },
            { icon: '😤', label: '壓力偏大', status: '可以加強', statusColor: '#EF9F27', text: '慢性壓力是常見的隱性健康風險，建議先從改善睡眠著手。' },
          ].map((item, i) => (
            <View key={i} style={styles.factorCard}>
              <View style={styles.factorHeader}>
                <Text style={styles.factorIcon}>{item.icon}</Text>
                <Text style={styles.factorLabel}>{item.label}</Text>
                <View style={[styles.factorBadge, { backgroundColor: item.statusColor + '20' }]}>
                  <Text style={[styles.factorBadgeText, { color: item.statusColor }]}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.factorText}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* 行動清單 */}
        <View style={styles.adviceCard}>
          <Text style={styles.adviceTitle}>本週行動清單</Text>
          {[
            { num: '1', title: '固定就寢時間，目標 7 小時', text: '從今晚起設定固定就寢時間，不看螢幕 30 分鐘前。' },
            { num: '2', title: '每小時起身活動 5 分鐘', text: '設定手機提醒，站起來走動、伸展或做幾個深蹲。' },
            { num: '3', title: '本週新增一次 30 分鐘有氧', text: '快走、騎車或游泳都可以，重點是持續 30 分鐘。' },
            { num: '4', title: '找出一個壓力來源，做一件小事', text: '不需要解決所有壓力，只需做一件具體的小事。' },
          ].map((item, i) => (
            <View key={i} style={styles.actionRow}>
              <View style={styles.actionNum}>
                <Text style={styles.actionNumText}>{item.num}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>{item.title}</Text>
                <Text style={styles.actionText}>{item.text}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* 下次建議 */}
        <View style={styles.adviceCard}>
          <Text style={styles.adviceTitle}>下次建議檢測時間</Text>
          <View style={styles.nextTestRow}>
            <View>
              <Text style={styles.nextTestLabel}>建議 4 週後再測</Text>
              <Text style={styles.nextTestSub}>讓生活習慣調整有時間反映</Text>
            </View>
            <Text style={styles.nextTestDate}>2026/05/21</Text>
          </View>
          <TouchableOpacity style={styles.reminderBtn} onPress={() => {}}>
            <Text style={styles.reminderBtnText}>＋ 加入提醒</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>以上建議由 AI 根據本次問卷生成，僅供生活習慣參考，不構成醫療診斷。</Text>

        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>返回報告</Text>
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
  appbarTitle: { flex: 1, fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  proBadge: { backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  proBadgeText: { fontSize: typography.sizes.xs, color: colors.primary, fontWeight: typography.weights.medium },
  scroll: { flex: 1, padding: 18 },
  darkCard: { backgroundColor: '#0a1628', borderRadius: 12, padding: 12, marginBottom: 14 },
  darkLabel: { fontSize: typography.sizes.xs, color: 'rgba(255,255,255,0.35)', marginBottom: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryLabel: { fontSize: typography.sizes.xs, color: 'rgba(255,255,255,0.5)' },
  summaryValue: { fontSize: typography.sizes.xs, fontWeight: typography.weights.medium },
  adviceCard: { borderWidth: 0.5, borderColor: colors.gray200, borderRadius: 10, padding: 12, marginBottom: 14 },
  adviceTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900, marginBottom: 10 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  scoreLabel: { fontSize: typography.sizes.xs, color: colors.gray400 },
  scoreBar: { flex: 1, height: 4, backgroundColor: colors.gray200, borderRadius: 2, overflow: 'hidden' },
  scoreBarFill: { height: '100%', backgroundColor: '#EF9F27', borderRadius: 2 },
  scoreValue: { fontSize: typography.sizes.xs, fontWeight: typography.weights.medium },
  adviceText: { fontSize: typography.sizes.xs, color: colors.gray500, lineHeight: 18 },
  factorCard: { backgroundColor: colors.gray100, borderRadius: 8, padding: 10, marginBottom: 8 },
  factorHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  factorIcon: { fontSize: 14 },
  factorLabel: { flex: 1, fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.gray900 },
  factorBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 3 },
  factorBadgeText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.medium },
  factorText: { fontSize: typography.sizes.xs, color: colors.gray500, lineHeight: 18 },
  actionRow: { flexDirection: 'row', gap: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: colors.gray100 },
  actionNum: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.successLight, borderWidth: 1, borderColor: colors.success,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
  },
  actionNumText: { fontSize: 9, fontWeight: typography.weights.medium, color: colors.success },
  actionTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.gray900, marginBottom: 2 },
  actionText: { fontSize: typography.sizes.xs, color: colors.gray400, lineHeight: 16 },
  nextTestRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  nextTestLabel: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.primary },
  nextTestSub: { fontSize: typography.sizes.xs, color: colors.gray400, marginTop: 2 },
  nextTestDate: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  reminderBtn: {
    height: 34, borderRadius: 8, borderWidth: 1, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  reminderBtnText: { fontSize: typography.sizes.sm, color: colors.primary },
  disclaimer: { fontSize: typography.sizes.xs, color: colors.gray400, textAlign: 'center', marginBottom: 12, lineHeight: 16 },
  backBtn: {
    height: 36, borderRadius: 9, backgroundColor: colors.gray100,
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { fontSize: typography.sizes.sm, color: colors.gray500 },
})