import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { colors, typography } from '../theme'
import { setUserPlan } from '../plan'
import { Ionicons } from '@expo/vector-icons'
import { PRODUCTS, TRIAL_DAYS, STORE_NAME, BILLING_READY, autoRenewNotice } from '../billing'

// [修改 2026/10/01] 價格統一從 billing.ts 讀取；年訂原本寫「訂閱後立即扣款」，但有 7 天試用，改為試用結束後扣款
const planDetails = {
  monthly: {
    label: PRODUCTS.monthly.label,
    priceLine: PRODUCTS.monthly.priceLine,
    billingNote: `${TRIAL_DAYS} 天免費試用結束後，每月自動扣款 ${PRODUCTS.monthly.price}`,
  },
  yearly: {
    label: PRODUCTS.yearly.label,
    priceLine: `${PRODUCTS.yearly.price} / 年（約 NT$89 / 月）`,
    billingNote: `${TRIAL_DAYS} 天免費試用結束後扣款 ${PRODUCTS.yearly.price}，一年一次，較月訂省 40%`,
  },
}

export default function PaymentScreen({ navigation, route }: any) {
  const planType: 'monthly' | 'yearly' = route?.params?.planType === 'monthly' ? 'monthly' : 'yearly'
  const plan = planDetails[planType]
  const [processing, setProcessing] = useState(false)

  async function handleConfirm() {
    // [新增 2026/10/01] 尚未串接內購：正式版不能讓人不付錢就開通 Pro，只有開發模式可以模擬
    if (!BILLING_READY && !__DEV__) {
      Alert.alert('即將開放', `訂閱功能即將透過 ${STORE_NAME} 開放，敬請期待！`)
      return
    }
    setProcessing(true)
    try {
      // 開發模式模擬訂閱：只寫入 Firestore，尚未串接真實 Apple/Google 內購與收據驗證
      await setUserPlan('pro')
      Alert.alert(
        '訂閱成功',
        `已為您開通 Pro 版（${plan.label}），${TRIAL_DAYS} 天免費試用期間可隨時到 ${STORE_NAME} 的訂閱設定取消。`,
        [
          { text: '完成', onPress: () => navigation.navigate('Main') },
        ]
      )
    } catch (e) {
      Alert.alert('付款失敗', '請稍後再試，或確認網路連線狀態')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>確認訂閱</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.planIcon}>
              <Text style={{ fontSize: 18 }}>★</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryTitle}>Pro 版 · {plan.label}</Text>
              <Text style={styles.summarySub}>{TRIAL_DAYS} 天免費試用，到期前取消不收費</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>訂閱方案</Text>
            <Text style={styles.rowValue}>{plan.label}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>費用</Text>
            <Text style={styles.rowValue}>{plan.priceLine}</Text>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.rowLabel}>試用期</Text>
            <Text style={styles.rowValue}>{TRIAL_DAYS} 天免費</Text>
          </View>
        </View>

        <Text style={styles.hint}>{plan.billingNote}</Text>

        <Text style={styles.sectionTitle}>付款方式</Text>
        <View style={styles.paymentCard}>
          <View style={styles.paymentIcon}>
            <Ionicons name={STORE_NAME === 'App Store' ? 'logo-apple' : 'logo-google-playstore'} size={18} color={colors.gray900} />
          </View>
          <Text style={styles.paymentLabel}>透過 {STORE_NAME} 付款</Text>
          <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
        </View>

        <View style={styles.tealCard}>
          <Text style={styles.tealTitle}>訂閱說明</Text>
          <Text style={styles.tealText}>
            {autoRenewNotice()}取消後可使用到目前計費週期結束，之後降回免費版。退款依 {STORE_NAME} 的退款政策辦理。
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.confirmBtn, processing && { opacity: 0.6 }]}
          onPress={handleConfirm}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmBtnText}>確認訂閱並開始試用</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelLink} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelLinkText}>返回方案選擇</Text>
        </TouchableOpacity>

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
  back: { fontSize: 30, color: colors.primary, marginRight: 6 },
  appbarTitle: { flex: 1, fontSize: 20, fontWeight: '600', color: colors.gray900, textAlign: 'center' },
  scroll: { flex: 1, paddingHorizontal: 18 },
  summaryCard: {
    backgroundColor: colors.white, borderWidth: 0.5, borderColor: colors.gray200,
    borderRadius: 18, padding: 16, marginBottom: 10,
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  planIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  summaryTitle: { fontSize: typography.sizes.md, fontWeight: '600', color: colors.gray900 },
  summarySub: { fontSize: typography.sizes.xs, color: colors.gray400, marginTop: 2 },
  divider: { height: 0.5, backgroundColor: colors.gray100, marginVertical: 10 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 9, borderBottomWidth: 0.5, borderBottomColor: colors.gray100,
  },
  rowLabel: { fontSize: typography.sizes.sm, color: colors.gray500 },
  rowValue: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.gray900 },
  hint: { fontSize: typography.sizes.xs, color: colors.gray400, marginBottom: 20, lineHeight: 18 },
  sectionTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.gray500, marginBottom: 8 },
  paymentCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.primary,
    borderRadius: 16, padding: 14, marginBottom: 16,
  },
  paymentIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.gray100,
    alignItems: 'center', justifyContent: 'center',
  },
  paymentLabel: { flex: 1, fontSize: typography.sizes.md, color: colors.gray900 },
  tealCard: { backgroundColor: colors.primaryLight, borderRadius: 16, padding: 14, marginBottom: 24 },
  tealTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.primary, marginBottom: 4 },
  tealText: { fontSize: typography.sizes.xs, color: '#0d7a8f', lineHeight: 18 },
  confirmBtn: {
    height: 50, borderRadius: 25, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  confirmBtnText: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: '#fff' },
  cancelLink: { alignItems: 'center', paddingVertical: 8 },
  cancelLinkText: { fontSize: typography.sizes.sm, color: colors.gray400 },
})