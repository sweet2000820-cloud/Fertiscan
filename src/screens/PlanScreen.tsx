import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native'
import { colors, typography } from '../theme'
import { useState, useEffect } from 'react'
import { getRecords } from '../storage'
import { getUserPlan } from '../plan'
// [新增 2026/10/01] 訂閱共用設定（商品、價格、條款連結、管理訂閱、恢復購買）
import { PRODUCTS, TRIAL_DAYS, TERMS_URL, PRIVACY_URL, STORE_NAME, autoRenewNotice, openManageSubscriptions, restorePurchases } from '../billing'

export default function PlanScreen({ navigation }: any) {
  const [monthCount, setMonthCount] = useState(0)
  const [selected, setSelected] = useState<'monthly' | 'yearly'>('yearly')
  const [currentPlan, setCurrentPlan] = useState<string>('free')
  const [restoring, setRestoring] = useState(false)

  // [新增 2026/10/01] 恢復購買（Apple 規定必須提供）
  async function handleRestore() {
    setRestoring(true)
    try {
      const plan = await restorePurchases()
      setCurrentPlan(plan)
      Alert.alert(plan === 'pro' ? '已恢復 Pro 版' : '沒有找到訂閱紀錄', plan === 'pro' ? '你的 Pro 功能已恢復。' : `這個 ${STORE_NAME} 帳號目前沒有有效的 iMotile Pro 訂閱。`)
    } catch {
      Alert.alert('恢復失敗', '請確認網路連線後再試一次。')
    }
    setRestoring(false)
  }

  useEffect(() => {
    getUserPlan().then(({ plan }) => setCurrentPlan(plan))
    getRecords().then(records => {
      const now = new Date()
      const thisMonth = records.filter(r => {
        const d = new Date(r.date.replace(/\//g, '-'))
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
      setMonthCount(thisMonth.length)
    })
  }, [])

  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>方案管理</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.darkCard}>
          <View style={styles.darkCardHeader}>
            <View style={styles.planIcon}>
              <Text style={{ fontSize: 20 }}>★</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.planRow}>
                <Text style={styles.planTitle}>{currentPlan === 'pro' ? 'Pro 版' : '免費版'}</Text>
                <View style={styles.freeBadge}>
                  <Text style={styles.freeBadgeText}>
                    {currentPlan === 'pro' ? 'Pro' : '免費'}
                  </Text>
                </View>
              </View>
              <Text style={styles.planSub}>{currentPlan === 'pro' ? '已解鎖全部功能' : '基本檢測功能'}</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>本月檢測</Text>
              <Text style={styles.statValue}>{monthCount} 次</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>AI 建議</Text>
              <Text style={[styles.statValue, { color: currentPlan === 'pro' ? '#4ade80' : 'rgba(255,255,255,0.35)', fontSize: 14 }]}>
                {currentPlan === 'pro' ? '已解鎖' : '未解鎖'}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>功能比較</Text>
        <View style={styles.compareCard}>
          <View style={styles.compareHeader}>
            <Text style={[styles.compareCol, { flex: 1, textAlign: 'left' }]}>功能</Text>
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
            <View key={i} style={[styles.compareRow, !item.free && { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.compareLabel, { flex: 1 }]}>{item.label}</Text>
              <Text style={[styles.compareCol, { color: item.free ? colors.success : colors.gray300 }]}>
                {item.free ? '✓' : '—'}
              </Text>
              <Text style={[styles.compareCol, { color: colors.success }]}>✓</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>選擇方案</Text>
        <TouchableOpacity
          style={[styles.planOption, selected === 'monthly' && styles.planOptionSelected]}
          onPress={() => setSelected('monthly')}
        >
          <View>
            <Text style={styles.planOptionTitle}>月訂閱</Text>
            <Text style={styles.planOptionSub}>隨時取消</Text>
          </View>
          <Text style={styles.planOptionPrice}>{PRODUCTS.monthly.price}<Text style={styles.planOptionUnit}> / 月</Text></Text>
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
            <Text style={styles.planOptionSub}>{PRODUCTS.yearly.priceLine}</Text>
          </View>
        </TouchableOpacity>

       {currentPlan !== 'pro' && (
          <TouchableOpacity style={styles.ctaBtn} onPress={() => {
            navigation.navigate('Payment', { planType: selected })
          }}>
            <Text style={styles.ctaBtnText}>免費試用 {TRIAL_DAYS} 天 · 立即解鎖</Text>
          </TouchableOpacity>
        )}
        {currentPlan === 'pro' && (
          <>
            <View style={[styles.ctaBtn, { backgroundColor: colors.success }]}>
              <Text style={styles.ctaBtnText}>✓ 目前為 Pro 版</Text>
            </View>
            {/* [修改 2026/10/01] 訂閱由 App Store／Google Play 管理，App 不能自己取消；
                原本按下去只把帳號改回免費版，商店那邊其實還會繼續扣款 */}
            <TouchableOpacity style={styles.cancelBtn} onPress={() => openManageSubscriptions().catch(() =>
              Alert.alert('無法開啟', `請到 ${STORE_NAME} 的「訂閱項目」管理或取消訂閱。`))}>
              <Text style={styles.manageBtnText}>管理或取消訂閱（{STORE_NAME}）</Text>
            </TouchableOpacity>
          </>
        )}
        <Text style={styles.ctaHint}>{TRIAL_DAYS} 天免費，到期前取消不收費 · 透過 {STORE_NAME} 訂閱</Text>

        {/* [新增 2026/10/01] 自動續訂說明、恢復購買、條款連結（上架審核要求） */}
        <Text style={styles.legalText}>{autoRenewNotice()}</Text>
        <View style={styles.legalRow}>
          <TouchableOpacity onPress={handleRestore} disabled={restoring}>
            <Text style={styles.legalLink}>{restoring ? '恢復中…' : '恢復購買'}</Text>
          </TouchableOpacity>
          {!!TERMS_URL && (
            <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL)}>
              <Text style={styles.legalLink}>使用條款</Text>
            </TouchableOpacity>
          )}
          {!!PRIVACY_URL && (
            <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL)}>
              <Text style={styles.legalLink}>隱私權政策</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 30 }} />

      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  appbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 10, paddingHorizontal: 18, paddingBottom: 10,
  },
  back: { fontSize: 40, color: colors.primary, marginRight: 6, paddingBottom: 4  },
  appbarTitle: { flex: 1, fontSize: 22, fontWeight: '600', color: colors.gray900 },
  scroll: { flex: 1, paddingHorizontal: 18 },
  darkCard: {
    backgroundColor: '#0a1628',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  darkCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  planIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(93,191,204,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  planTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: '#fff' },
  freeBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  freeBadgeText: { fontSize: typography.sizes.xs, color: 'rgba(255,255,255,0.6)' },
  planSub: { fontSize: typography.sizes.xs, color: 'rgba(255,255,255,0.45)' },
  statsRow: { flexDirection: 'row', gap: 8 },
  statBox: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14, padding: 10, alignItems: 'center',
  },
  statLabel: { fontSize: typography.sizes.xs, color: 'rgba(255,255,255,0.4)', marginBottom: 3 },
  statValue: { fontSize: 18, fontWeight: typography.weights.medium, color: '#fff' },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.gray500,
    marginBottom: 8,
  },
  compareCard: {
    backgroundColor: colors.white,
    borderWidth: 0.5, borderColor: colors.gray200,
    borderRadius: 16, overflow: 'hidden', marginBottom: 16,
  },
  compareHeader: {
    flexDirection: 'row', padding: 10, paddingHorizontal: 14,
    backgroundColor: colors.primaryLight,
  },
  compareRow: {
    flexDirection: 'row', padding: 10, paddingHorizontal: 14,
    borderTopWidth: 0.5, borderTopColor: colors.gray100,
  },
  compareCol: { width: 40, textAlign: 'center', fontSize: typography.sizes.xs, color: colors.gray400 },
  compareLabel: { fontSize: typography.sizes.sm, color: colors.gray900 },
  planOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1, borderColor: colors.gray200,
    borderRadius: 18, padding: 14, marginBottom: 10,
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
    position: 'absolute', top: -10, left: 14,
    backgroundColor: colors.primary,
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10,
  },
  bestBadgeText: { fontSize: typography.sizes.xs, color: '#fff', fontWeight: typography.weights.medium },
  ctaBtn: {
    height: 48, borderRadius: 24, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  ctaBtnText: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: '#fff' },
  ctaHint: { fontSize: typography.sizes.xs, color: colors.gray400, textAlign: 'center', marginBottom: 8 },
  cancelBtn: {
    height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  cancelBtnText: { fontSize: typography.sizes.sm, color: colors.danger },
  manageBtnText: { fontSize: typography.sizes.sm, color: colors.primary },
  legalText: { fontSize: 11, color: colors.gray400, lineHeight: 16, marginTop: 8, marginBottom: 8 },
  legalRow: { flexDirection: 'row', justifyContent: 'center', gap: 18, marginBottom: 8 },
  legalLink: { fontSize: typography.sizes.xs, color: colors.primary, textDecorationLine: 'underline' },
})