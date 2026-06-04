import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { colors, typography } from '../theme'

export default function PlanScreen({ navigation }: any) {
  const [selected, setSelected] = useState<'monthly' | 'yearly'>('yearly')

  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>方案管理</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* 目前方案卡片 */}
        <View style={styles.darkCard}>
          <View style={styles.darkCardHeader}>
            <View style={styles.planIcon}>
              <Text style={{ fontSize: 20 }}>★</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.planRow}>
                <Text style={styles.planTitle}>免費版</Text>
                <View style={styles.freeBadge}>
                  <Text style={styles.freeBadgeText}>免費</Text>
                </View>
              </View>
              <Text style={styles.planSub}>基本檢測功能</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>本月檢測</Text>
              <Text style={styles.statValue}>3 次</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>AI 建議</Text>
              <Text style={[styles.statValue, { color: 'rgba(255,255,255,0.35)', fontSize: 14 }]}>未解鎖</Text>
            </View>
          </View>
        </View>

        {/* 功能比較 */}
        <Text style={styles.sectionTitle}>功能比較</Text>
        <View style={styles.compareCard}>
          <View style={styles.compareHeader}>
            <Text style={[styles.compareCol, { flex: 1 }]}>功能</Text>
            <Text style={styles.compareCol}>免費</Text>
            <Text style={[styles.compareCol, { color: colors.primary }]}>Pro</Text>
          </View>
          {[
            { label: 'T/C 定量結果', free: true, pro: true },
            { label: '歷史記錄查閱', free: true, pro: true },
            { label: '分享連結', free: true, pro: true },
            { label: 'AI 趨勢解讀', free: false, pro: true },
            { label: '影響因素分析', free: false, pro: true },
            { label: '個人化複測計畫', free: false, pro: true },
            { label: '診所報告 PDF', free: false, pro: true },
          ].map((item, i) => (
            <View key={i} style={[styles.compareRow, !item.free && { backgroundColor: '#F0FAF8' }]}>
              <Text style={[styles.compareLabel, { flex: 1 }]}>{item.label}</Text>
              <Text style={[styles.compareCol, { color: item.free ? colors.success : colors.gray300 }]}>
                {item.free ? '✓' : '—'}
              </Text>
              <Text style={[styles.compareCol, { color: colors.success }]}>✓</Text>
            </View>
          ))}
        </View>

        {/* 方案選擇 */}
        <Text style={styles.sectionTitle}>選擇方案</Text>
        <TouchableOpacity
          style={[styles.planOption, selected === 'monthly' && styles.planOptionSelected]}
          onPress={() => setSelected('monthly')}
        >
          <View>
            <Text style={styles.planOptionTitle}>月訂閱</Text>
            <Text style={styles.planOptionSub}>隨時取消</Text>
          </View>
          <Text style={styles.planOptionPrice}>NT$149<Text style={styles.planOptionUnit}> / 月</Text></Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.planOption, selected === 'yearly' && styles.planOptionSelected, { position: 'relative' }]}
          onPress={() => setSelected('yearly')}
        >
          <View style={styles.bestBadge}>
            <Text style={styles.bestBadgeText}>最優惠</Text>
          </View>
          <View>
            <Text style={[styles.planOptionTitle, selected === 'yearly' && { color: colors.primary }]}>年訂閱</Text>
            <Text style={styles.planOptionSub}>較月訂省 40%</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.planOptionPrice, selected === 'yearly' && { color: colors.primary }]}>
              NT$89<Text style={styles.planOptionUnit}> / 月</Text>
            </Text>
            <Text style={styles.planOptionSub}>NT$1,068 / 年</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.ctaBtn}>
          <Text style={styles.ctaBtnText}>免費試用 7 天 · 立即解鎖</Text>
        </TouchableOpacity>
        <Text style={styles.ctaHint}>7 天免費，到期前取消不收費 · Apple / Google Pay</Text>

        <View style={{ height: 30 }} />

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
  darkCard: {
    backgroundColor: '#0a1628',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  darkCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  planIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: 'rgba(93,191,204,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  planTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: '#fff' },
  freeBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  freeBadgeText: { fontSize: typography.sizes.xs, color: 'rgba(255,255,255,0.5)' },
  planSub: { fontSize: typography.sizes.xs, color: 'rgba(255,255,255,0.45)' },
  statsRow: { flexDirection: 'row', gap: 8 },
  statBox: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8, padding: 8, alignItems: 'center',
  },
  statLabel: { fontSize: typography.sizes.xs, color: 'rgba(255,255,255,0.35)', marginBottom: 2 },
  statValue: { fontSize: 18, fontWeight: typography.weights.medium, color: '#fff' },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.gray500,
    marginBottom: 8,
  },
  compareCard: {
    borderWidth: 0.5, borderColor: colors.gray200,
    borderRadius: 10, overflow: 'hidden', marginBottom: 16,
  },
  compareHeader: {
    flexDirection: 'row', padding: 8, paddingHorizontal: 12,
    backgroundColor: colors.gray100, borderBottomWidth: 0.5, borderBottomColor: colors.gray200,
  },
  compareRow: {
    flexDirection: 'row', padding: 9, paddingHorizontal: 12,
    borderBottomWidth: 0.5, borderBottomColor: colors.gray100,
  },
  compareCol: { width: 40, textAlign: 'center', fontSize: typography.sizes.xs, color: colors.gray400 },
  compareLabel: { fontSize: typography.sizes.sm, color: colors.gray900 },
  planOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: colors.gray200,
    borderRadius: 10, padding: 12, marginBottom: 10,
  },
  planOptionSelected: {
    borderWidth: 2, borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  planOptionTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  planOptionSub: { fontSize: typography.sizes.xs, color: colors.gray400, marginTop: 2 },
  planOptionPrice: { fontSize: 15, fontWeight: typography.weights.medium, color: colors.gray900 },
  planOptionUnit: { fontSize: typography.sizes.xs, color: colors.gray400 },
  bestBadge: {
    position: 'absolute', top: -10, left: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4,
  },
  bestBadgeText: { fontSize: typography.sizes.xs, color: '#fff', fontWeight: typography.weights.medium },
  ctaBtn: {
    height: 42, borderRadius: 9, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  ctaBtnText: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: '#fff' },
  ctaHint: { fontSize: typography.sizes.xs, color: colors.gray400, textAlign: 'center', marginBottom: 8 },
})