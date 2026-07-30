import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { colors, typography } from '../theme'

export default function ClinicSuccessScreen({ navigation, route }: any) {
  const clinicName = route?.params?.clinicName || '台北生殖醫學中心'
  return (
    <View style={styles.container}>
      <View style={styles.content}>

        {/* 成功圖示 */}
        <View style={styles.successIcon}>
          <Text style={styles.checkmark}>✓</Text>
        </View>

        <Text style={styles.title}>診所連結成功！</Text>
        <Text style={styles.sub}>{clinicName}{'\n'}</Text>

        {/* 授權摘要 */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>已授權分享</Text>
          <Text style={styles.summaryItem}>✓ T/C 比值與換算濃度</Text>
          <Text style={styles.summaryItem}>✓ 歷史趨勢（最近 6 次）</Text>
          <Text style={styles.summaryItemOff}>✗ 原始影像（未授權）</Text>
          <Text style={styles.summaryItemOff}>✗ 自動分享（需手動確認）</Text>
        </View>

        <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.navigate('ShareRecord')}>
          <Text style={styles.btnPrimaryText}>立即分享最新結果</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnGray} onPress={() => navigation.navigate('Main')}>
          <Text style={styles.btnGrayText}>稍後再說</Text>
        </TouchableOpacity>

      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 24,
  },
  successIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.successLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  checkmark: { fontSize: 30, color: colors.success },
  title: {
    fontSize: 18, fontWeight: '600',
    color: colors.success, marginBottom: 6,
  },
  sub: {
    fontSize: typography.sizes.md, color: colors.gray500,
    textAlign: 'center', lineHeight: 22, marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: colors.white, borderWidth: 0.5, borderColor: colors.gray200, borderRadius: 18,
    padding: 14, width: '100%', marginBottom: 20,
  },
  summaryTitle: {
    fontSize: typography.sizes.sm, fontWeight: typography.weights.medium,
    color: colors.gray500, marginBottom: 8,
  },
  summaryItem: { fontSize: typography.sizes.sm, color: colors.gray500, lineHeight: 22 },
  summaryItemOff: { fontSize: typography.sizes.sm, color: colors.gray400, lineHeight: 22 },
  btnPrimary: {
    width: '100%', height: 48, borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  btnPrimaryText: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: '#fff' },
  btnGray: {
    width: '100%', height: 40, borderRadius: 20,
    backgroundColor: colors.white, borderWidth: 0.5, borderColor: colors.gray200,
    alignItems: 'center', justifyContent: 'center',
  },
  btnGrayText: { fontSize: typography.sizes.sm, color: colors.gray500 },
})