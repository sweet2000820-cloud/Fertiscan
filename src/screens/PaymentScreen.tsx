import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native'
import { colors, typography } from '../theme'
import { setUserPlan } from '../plan'
import { Ionicons } from '@expo/vector-icons'

export default function PaymentScreen({ navigation, route }: any) {
  const planType = route?.params?.planType || 'yearly'
  const price = planType === 'yearly' ? 'NT$1,068 / 年' : 'NT$149 / 月'
  const monthly = planType === 'yearly' ? 'NT$89 / 月' : 'NT$149 / 月'

  const [payMethod, setPayMethod] = useState<'credit' | 'apple' | 'google'>('credit')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [name, setName] = useState('')

  function formatCard(val: string) {
    const clean = val.replace(/\D/g, '').slice(0, 16)
    return clean.replace(/(.{4})/g, '$1 ').trim()
  }

  function formatExpiry(val: string) {
    const clean = val.replace(/\D/g, '').slice(0, 4)
    if (clean.length >= 3) return clean.slice(0, 2) + '/' + clean.slice(2)
    return clean
  }

  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>付款資訊</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* 訂單摘要 */}
        <View style={styles.orderCard}>
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>方案</Text>
            <Text style={styles.orderValue}>FertiScan Pro · {planType === 'yearly' ? '年訂閱' : '月訂閱'}</Text>
          </View>
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>金額</Text>
            <Text style={[styles.orderValue, { color: colors.primary, fontWeight: typography.weights.medium }]}>{price}</Text>
          </View>
          {planType === 'yearly' && (
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>相當於</Text>
              <Text style={styles.orderValue}>{monthly}</Text>
            </View>
          )}
          <View style={[styles.orderRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.orderLabel}>試用期</Text>
            <Text style={[styles.orderValue, { color: colors.success }]}>7 天免費試用</Text>
          </View>
        </View>

        {/* 付款方式 */}
        <Text style={styles.sectionTitle}>付款方式</Text>
        <View style={styles.payMethodRow}>
          {[
            { id: 'credit', label: '信用卡', icon: 'card-outline' },
            { id: 'apple', label: 'Apple Pay', icon: 'logo-apple' },
            { id: 'google', label: 'Google Pay', icon: 'logo-google' },
          ].map(m => (
            <TouchableOpacity
              key={m.id}
              style={[styles.payMethodBtn, payMethod === m.id && styles.payMethodBtnSelected]}
              onPress={() => setPayMethod(m.id as any)}
            >
              <Ionicons name={m.icon as any} size={18} color={payMethod === m.id ? colors.primary : colors.gray400} />
              <Text style={[styles.payMethodText, payMethod === m.id && { color: colors.primary }]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {payMethod === 'credit' && (
          <View style={styles.cardForm}>
            <Text style={styles.sectionTitle}>信用卡資訊</Text>
            <View style={styles.field}>
              <Text style={styles.label}>持卡人姓名</Text>
              <TextInput
                style={styles.input}
                placeholder="姓名（與卡面相同）"
                placeholderTextColor={colors.gray400}
                value={name}
                onChangeText={setName}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>卡號</Text>
              <TextInput
                style={styles.input}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor={colors.gray400}
                keyboardType="number-pad"
                value={cardNumber}
                onChangeText={v => setCardNumber(formatCard(v))}
                maxLength={19}
              />
            </View>
            <View style={styles.fieldRow}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>有效期限</Text>
                <TextInput
                  style={styles.input}
                  placeholder="MM/YY"
                  placeholderTextColor={colors.gray400}
                  keyboardType="number-pad"
                  value={expiry}
                  onChangeText={v => setExpiry(formatExpiry(v))}
                  maxLength={5}
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>CVV</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123"
                  placeholderTextColor={colors.gray400}
                  keyboardType="number-pad"
                  secureTextEntry
                  value={cvv}
                  onChangeText={setCvv}
                  maxLength={3}
                />
              </View>
            </View>
          </View>
        )}

        {(payMethod === 'apple' || payMethod === 'google') && (
          <View style={styles.tealCard}>
            <Text style={styles.tealText}>點擊下方按鈕將跳轉至 {payMethod === 'apple' ? 'Apple Pay' : 'Google Pay'} 完成付款。</Text>
          </View>
        )}

        <View style={styles.secureRow}>
          <Ionicons name="lock-closed-outline" size={14} color={colors.gray400} />
          <Text style={styles.secureText}>所有付款資訊均經過 256-bit SSL 加密保護</Text>
        </View>

        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => {
            Alert.alert('即將開放', '線上付款功能即將上線，敬請期待！\n\n（測試用：點確認直接升級）', [
              { text: '取消', style: 'cancel' },
              { text: '確認（測試）', onPress: async () => {
              await setUserPlan('pro', planType)
              Alert.alert('升級成功！', '您已成功升級為 Pro 版！', [
                { text: '太好了！', onPress: () => navigation.navigate('Main') }
              ])
            }}
            ])
          }}
        >
          <Text style={styles.ctaBtnText}>確認付款 · {price}</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>7 天免費試用，到期前取消不收費</Text>

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
  orderCard: { borderWidth: 0.5, borderColor: colors.gray200, borderRadius: 10, paddingHorizontal: 14, marginBottom: 16 },
  orderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: colors.gray100,
  },
  orderLabel: { fontSize: typography.sizes.sm, color: colors.gray400 },
  orderValue: { fontSize: typography.sizes.sm, color: colors.gray900 },
  sectionTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.gray500, marginBottom: 8 },
  payMethodRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  payMethodBtn: {
    flex: 1, height: 46, borderRadius: 9,
    borderWidth: 1, borderColor: colors.gray200,
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  payMethodBtnSelected: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.primaryLight },
  payMethodText: { fontSize: typography.sizes.xs, color: colors.gray400 },
  cardForm: { marginBottom: 16 },
  field: { marginBottom: 10 },
  fieldRow: { flexDirection: 'row', gap: 10 },
  label: { fontSize: typography.sizes.xs, color: colors.gray500, fontWeight: typography.weights.medium, marginBottom: 4 },
  input: {
    height: 40, borderWidth: 0.5, borderColor: colors.gray300,
    borderRadius: 8, paddingHorizontal: 12,
    fontSize: typography.sizes.md, color: colors.gray900,
  },
  tealCard: { backgroundColor: colors.primaryLight, borderRadius: 10, padding: 12, marginBottom: 16 },
  tealText: { fontSize: typography.sizes.sm, color: '#0d7a8f', lineHeight: 18 },
  secureRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  secureText: { fontSize: typography.sizes.xs, color: colors.gray400 },
  ctaBtn: {
    height: 42, borderRadius: 9, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  ctaBtnText: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: '#fff' },
  hint: { fontSize: typography.sizes.xs, color: colors.gray400, textAlign: 'center' },
})