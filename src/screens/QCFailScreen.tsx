import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { colors, typography } from '../theme'

export default function QCFailScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>品質管控警告</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* 紅色警告 */}
        <View style={styles.redCard}>
          <Text style={styles.redTitle}>⚠ 此次讀值無效</Text>
          <Text style={styles.redText}>C line 未偵測到，試紙可能無效或操作異常</Text>
        </View>

        {/* QC 結果 */}
        <View style={styles.listCard}>
          <Text style={styles.sectionTitle}>QC 檢查結果</Text>
          {[
            { label: 'C line 訊號', ok: false, value: '✗ 未偵測' },
            { label: 'T line 訊號', ok: false, value: '✗ 未偵測' },
            { label: '影像穩定度', ok: true, value: '✓ 91%' },
            { label: '螢幕亮度', ok: true, value: '✓ 88%' },
            { label: '試紙對齊', ok: null, value: '△ 輕微偏移' },
          ].map((item, i) => (
            <View key={i} style={[styles.qcRow, i === 4 && { borderBottomWidth: 0 }]}>
              <Text style={styles.hint}>{item.label}</Text>
              <Text style={[
                styles.qcValue,
                item.ok === true && { color: colors.success },
                item.ok === false && { color: colors.danger },
                item.ok === null && { color: colors.warning },
              ]}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* 可能原因 */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>可能原因與處置</Text>
          {[
            '試紙過期或受潮 — 確認有效期及保存條件',
            '樣本量不足 — 確認滴入足量樣本（依說明書）',
            '靜置時間不足 — 加入樣本後需靜置 ≥ 5 分鐘再拍攝',
            '夾具位置偏移 — 重新對齊，確認試紙條線在視窗內',
          ].map((reason, i) => (
            <View key={i} style={styles.reasonRow}>
              <View style={styles.reasonNum}>
                <Text style={styles.reasonNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.reasonText}>{reason}</Text>
            </View>
          ))}
        </View>

        {/* 按鈕 */}
        <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.goBack()}>
          <Text style={styles.btnPrimaryText}>重新拍攝</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnRed}>
          <Text style={styles.btnRedText}>棄置此試紙，換新片</Text>
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
  back: { fontSize: 30, color: colors.primary, marginRight: 6 },
  appbarTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.gray900,
  },
  scroll: { flex: 1, padding: 18 },
  redCard: {
    backgroundColor: colors.dangerLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  redTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.danger,
    marginBottom: 4,
  },
  redText: { fontSize: typography.sizes.md, color: colors.danger, lineHeight: 18 },
  listCard: {
    borderWidth: 0.5,
    borderColor: colors.gray200,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.gray900,
    marginBottom: 10,
  },
  qcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.gray100,
  },
  hint: { fontSize: typography.sizes.sm, color: colors.gray500 },
  qcValue: { fontSize: typography.sizes.xs, fontWeight: typography.weights.medium },
  card: { backgroundColor: colors.gray100, borderRadius: 10, padding: 12, marginBottom: 14 },
  reasonRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  reasonNum: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.warningLight,
    borderWidth: 1,
    borderColor: '#EF9F27',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  reasonNumText: { fontSize: 9, fontWeight: typography.weights.medium, color: colors.warning },
  reasonText: { fontSize: typography.sizes.sm, color: colors.gray500, flex: 1, lineHeight: 18 },
  btnPrimary: {
    height: 42, borderRadius: 9, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  btnPrimaryText: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.white },
  btnRed: {
    height: 38, borderRadius: 9,
    borderWidth: 1.5, borderColor: colors.danger,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  btnRedText: { fontSize: typography.sizes.sm, color: colors.danger },
})