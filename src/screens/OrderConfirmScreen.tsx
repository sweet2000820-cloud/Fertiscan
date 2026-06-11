import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { colors, typography } from '../theme'
import { Ionicons } from '@expo/vector-icons'

export default function OrderConfirmScreen({ navigation, route }: any) {
  const qty = route?.params?.qty || 1
  const unitPrice = 720
  const total = unitPrice * qty
  const [payMethod, setPayMethod] = useState<string | null>(null)

  const payMethods = [
    { id: 'credit', label: '信用卡', iconName: 'card' },
    { id: 'atm', label: 'ATM 轉帳', iconName: 'business' },
    { id: 'cvs', label: '超商代碼', iconName: 'storefront' },
  ]

  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>確認訂單</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* 訂單明細 */}
        <Text style={styles.sectionTitle}>訂單明細</Text>
        <View style={styles.listCard}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>商品</Text>
            <Text style={styles.rowValue}>FertiScan 精子活力檢測試紙</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>規格</Text>
            <Text style={styles.rowValue}>6 片裝</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>數量</Text>
            <Text style={styles.rowValue}>{qty} 盒</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>單價</Text>
            <Text style={styles.rowValue}>NT$ {unitPrice}</Text>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={[styles.rowLabel, { fontWeight: typography.weights.medium, color: colors.gray900 }]}>總計</Text>
            <Text style={[styles.rowValue, { color: colors.primary, fontWeight: typography.weights.medium, fontSize: typography.sizes.lg }]}>NT$ {total.toLocaleString()}</Text>
          </View>
        </View>

        {/* 付款方式 */}
        <Text style={styles.sectionTitle}>選擇付款方式</Text>
        <View style={styles.listCard}>
          {payMethods.map((method, i) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.payRow,
                i === payMethods.length - 1 && { borderBottomWidth: 0 },
                payMethod === method.id && styles.payRowSelected,
              ]}
              onPress={() => setPayMethod(method.id)}
            >
              <Ionicons name={method.iconName as any} size={22} color={payMethod === method.id ? colors.primary : colors.gray900} />
              <Text style={[styles.payLabel, payMethod === method.id && { color: colors.primary }]}>{method.label}</Text>
              <View style={[styles.radio, payMethod === method.id && styles.radioSelected]}>
                {payMethod === method.id && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 配送資訊 */}
        <Text style={styles.sectionTitle}>配送資訊</Text>
        <View style={styles.tealCard}>
          <Text style={styles.tealText}>配送服務即將開放，目前尚未提供線上購買。感謝您的耐心等候！</Text>
        </View>

        <TouchableOpacity
          style={[styles.checkoutBtn, !payMethod && { opacity: 0.4 }]}
          disabled={!payMethod}
          onPress={() => {
            Alert.alert('即將開放', '線上購買功能即將上線，敬請期待！', [
              { text: '確定' }
            ])
          }}
        >
          <Text style={styles.checkoutBtnText}>確認付款</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelBtnText}>取消</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
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
  back: { fontSize: 28, color: colors.primary, marginRight: 6 },
  appbarTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  scroll: { flex: 1, padding: 18 },
  sectionTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.gray500, marginBottom: 8, marginTop: 4 },
  listCard: { borderWidth: 0.5, borderColor: colors.gray200, borderRadius: 10, paddingHorizontal: 14, marginBottom: 16 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: colors.gray100,
  },
  rowLabel: { fontSize: typography.sizes.sm, color: colors.gray400 },
  rowValue: { fontSize: typography.sizes.sm, color: colors.gray900 },
  payRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: colors.gray100,
  },
  payRowSelected: { backgroundColor: colors.primaryLight, marginHorizontal: -14, paddingHorizontal: 14 },
  payIcon: { fontSize: 20 },
  payLabel: { flex: 1, fontSize: typography.sizes.md, color: colors.gray900 },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: colors.gray300,
    alignItems: 'center', justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  tealCard: { backgroundColor: colors.primaryLight, borderRadius: 10, padding: 12, marginBottom: 16 },
  tealText: { fontSize: typography.sizes.xs, color: '#0d7a8f', lineHeight: 18 },
  checkoutBtn: {
    height: 42, borderRadius: 9, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  checkoutBtnText: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: '#fff' },
  cancelBtn: {
    height: 36, borderRadius: 9, backgroundColor: colors.gray100,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText: { fontSize: typography.sizes.sm, color: colors.gray500 },
})