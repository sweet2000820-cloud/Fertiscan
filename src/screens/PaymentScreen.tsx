import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { colors, typography } from '../theme'
import { setUserPlan } from '../plan'
import { Ionicons } from '@expo/vector-icons'

const planDetails = {
  monthly: {
    label: '月訂閱',
    priceLine: 'NT$149 / 月',
    billingNote: '訂閱後每月自動扣款 NT$149，隨時可取消',
  },
  yearly: {
    label: '年訂閱',
    priceLine: 'NT$89 / 月',
    billingNote: '訂閱後立即扣款 NT$1,068，一年一次，較月訂省 40%',
  },
}

export default function PaymentScreen({ navigation, route }: any) {
  const planType: 'monthly' | 'yearly' = route?.params?.planType === 'monthly' ? 'monthly' : 'yearly'
  const plan = planDetails[planType]
  const [processing, setProcessing] = useState(false)

  async function handleConfirm() {
    setProcessing(true)
    try {
      // 目前僅將方案狀態寫入 Firestore，尚未串接真實 Apple/Google IAP 收據驗證
      await setUserPlan('pro')
      Alert.alert(
        '訂閱成功',
        `已為您開通 Pro 版（${plan.label}），7 天免費試用期間可隨時於「方案管理」取消。`,
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
              <Text style={styles.summarySub}>7 天免費試用，到期前取消不收費</Text>
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
            <Text style={styles.rowValue}>7 天免費</Text>
          </View>
        </View>

        <Text style={styles.hint}>{plan.billingNote}</Text>

        <Text style={styles.sectionTitle}>付款方式</Text>
        <View style={styles.paymentCard}>
          <View style={styles.paymentIcon}>
            <Ionicons name="logo-apple" size={18} color={colors.gray900} />
          </View>
          <Text style={styles.paymentLabel}>Apple / Google Pay</Text>
          <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
        </View>

        <View style={styles.tealCard}>
          <Text style={styles.tealTitle}>訂閱說明</Text>
          <Text style={styles.tealText}>
            試用期滿後將依所選方案自動續訂，可隨時於「方案管理」頁面取消訂閱。取消後將於目前計費週期結束時降回免費版，已扣款金額恕不退還。
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