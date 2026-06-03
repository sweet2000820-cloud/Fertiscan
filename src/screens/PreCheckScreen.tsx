import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { colors, typography } from '../theme'
import Button from '../components/Button'

export default function PreCheckScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>檢測準備</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* 進度條 */}
        <View style={styles.progressRow}>
          <Text style={styles.hint}>步驟 1 / 6</Text>
          <Text style={styles.hint}>準備確認</Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: '20%' }]} />
        </View>

        {/* 圖示區 */}
        <View style={styles.iconArea}>
          <View style={styles.iconBox}>
            <Text style={{ fontSize: 32 }}>⊞</Text>
          </View>
          <Text style={styles.iconTitle}>準備試紙與夾具</Text>
          <Text style={styles.iconSub}>確認試紙效期、安裝光學夾具至手機前鏡頭</Text>
        </View>

        {/* 確認清單 */}
        <View style={styles.listCard}>
          <Text style={styles.sectionTitle}>確認清單</Text>
          {[
            { text: '試紙包裝完整、未過期', checked: true },
            { text: '光學夾具已安裝，遮光腔體密合', checked: true },
            { text: '樣本已備妥（採樣後立即使用）', checked: false },
            { text: '試紙已加入樣本，靜置 ≥ 5 分鐘', checked: false },
          ].map((item, i) => (
            <View key={i} style={styles.checkRow}>
              <View style={[styles.checkbox, item.checked && styles.checkboxDone]}>
                {item.checked && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkText}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* 提示卡片 */}
        <View style={styles.tealCard}>
          <Text style={styles.tealTitle}>夾具使用說明</Text>
          <Text style={styles.tealText}>光學夾具需緊貼前鏡頭，讓螢幕白光均勻透過試紙。避免環境強光干擾。</Text>
        </View>

        <Button title="下一步：採樣前問卷 ›" onPress={() => navigation.navigate('PreQuestionnaire')} />

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
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  hint: { fontSize: typography.sizes.sm, color: colors.gray400 },
  progressBg: {
    height: 4,
    backgroundColor: colors.gray200,
    borderRadius: 2,
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  iconArea: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
    marginBottom: 10,
  },
  iconBox: {
    width: 68,
    height: 68,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.gray900,
  },
  iconSub: {
    fontSize: typography.sizes.sm,
    color: colors.gray500,
    textAlign: 'center',
    lineHeight: 18,
  },
  listCard: {
    borderWidth: 0.5,
    borderColor: colors.gray200,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.gray500,
    marginBottom: 10,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.gray300,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: colors.successLight,
    borderColor: colors.success,
  },
  checkmark: { fontSize: 10, color: colors.success },
  checkText: { fontSize: typography.sizes.sm, color: colors.gray500, flex: 1 },
  tealCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  tealTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.primary,
    marginBottom: 4,
  },
  tealText: { fontSize: typography.sizes.sm, color: '#0d7a8f', lineHeight: 18 },
})