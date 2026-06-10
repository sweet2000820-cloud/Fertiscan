import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { colors, typography } from '../theme'
import AsyncStorage from '@react-native-async-storage/async-storage'

const lotData: Record<string, {
  points: { tc: number, conc: number }[],
  expiry: string,
  r2: string,
}> = {
  'LOT-2025-A': {
    points: [
      { tc: 0.10, conc: 2 }, { tc: 0.22, conc: 5 }, { tc: 0.35, conc: 9 },
      { tc: 0.48, conc: 14 }, { tc: 0.61, conc: 18 }, { tc: 0.68, conc: 22 },
      { tc: 0.75, conc: 26 }, { tc: 0.85, conc: 32 }, { tc: 0.92, conc: 38 },
      { tc: 1.00, conc: 45 }, { tc: 1.08, conc: 52 }, { tc: 1.15, conc: 60 },
    ],
    expiry: '2026/08/31',
    r2: '0.994',
  },
  'LOT-2025-B': {
    points: [
      { tc: 0.12, conc: 2 }, { tc: 0.24, conc: 5 }, { tc: 0.38, conc: 9 },
      { tc: 0.50, conc: 14 }, { tc: 0.63, conc: 18 }, { tc: 0.70, conc: 22 },
      { tc: 0.78, conc: 26 }, { tc: 0.87, conc: 32 }, { tc: 0.94, conc: 38 },
      { tc: 1.02, conc: 45 }, { tc: 1.10, conc: 52 }, { tc: 1.18, conc: 60 },
    ],
    expiry: '2026/12/31',
    r2: '0.997',
  },
  'LOT-2024-B': {
    points: [
      { tc: 0.09, conc: 2 }, { tc: 0.20, conc: 5 }, { tc: 0.32, conc: 9 },
      { tc: 0.45, conc: 14 }, { tc: 0.58, conc: 18 }, { tc: 0.65, conc: 22 },
      { tc: 0.72, conc: 26 }, { tc: 0.82, conc: 32 }, { tc: 0.90, conc: 38 },
      { tc: 0.98, conc: 45 }, { tc: 1.05, conc: 52 }, { tc: 1.12, conc: 60 },
    ],
    expiry: '2025/12/31',
    r2: '0.991',
  },
}

export default function CalibrationScreen({ navigation }: any) {
  const [lotNumber, setLotNumber] = useState('')

  useEffect(() => {
    AsyncStorage.getItem('lotNumber').then(val => {
      if (val) setLotNumber(val)
    })
  }, [])

  const currentLot = lotNumber ? lotData[lotNumber] : null
  const expiry = currentLot?.expiry || '—'
  const r2 = currentLot?.r2 || '—'
  const points = currentLot?.points || []

  function handleManualInput() {
    Alert.prompt(
      '手動輸入批號',
      '請輸入試紙包裝上的批號（例如：LOT-2025-A）',
      [
        { text: '取消', style: 'cancel' },
        { text: '確認', onPress: (value: string | undefined) => {
          if (value) {
            setLotNumber(value)
            AsyncStorage.setItem('lotNumber', value)
            Alert.alert('已更新', `批號已更新為 ${value}`)
          }
        }},
      ],
      'plain-text',
      lotNumber || 'LOT-2025-A'
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <Text style={styles.appbarTitle}>批號校準設定</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.listCard}>
          <View style={styles.lotRow}>
            <Text style={styles.rowLabel}>目前試紙批號</Text>
            <View style={styles.lotBadge}>
              <Text style={styles.lotBadgeText}>{lotNumber || '尚未設定'}</Text>
            </View>
          </View>
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.getParent()?.navigate('LotQR')}>
              <Text style={styles.btnSecondaryText}>掃描 QR Code</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnGray} onPress={handleManualInput}>
              <Text style={styles.btnGrayText}>手動輸入</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>不同批次試紙靈敏度不同，請確認批號正確</Text>
        </View>

        <View style={styles.listCard}>
          <Text style={styles.sectionTitle}>標準曲線（批號 {lotNumber || '尚未設定'}）</Text>
          <View style={styles.chartArea}>
            <View style={styles.chartInner}>
              <View style={styles.yAxis} />
              <View style={styles.xAxis} />
              {points.length === 0 ? (
                <Text style={styles.emptyChart}>請先設定批號</Text>
              ) : points.map((p, i) => {
                const leftPct = `${(p.tc / 1.2) * 90}%`
                const bottomPx = Math.max(4, (p.conc / 60) * 70)
                return <View key={i} style={[styles.dot, { bottom: bottomPx, left: leftPct as any }]} />
              })}
              {points.length > 0 && <View style={styles.refLine} />}
              {points.length > 0 && <Text style={styles.refLabel}>0.85</Text>}
            </View>
            <View style={styles.axisLabels}>
              <Text style={styles.axisText}>0</Text>
              <Text style={styles.axisText}>T/C →</Text>
            </View>
          </View>
          {points.length > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.resultRow}>
                <Text style={styles.hint}>目前讀值 T/C = 0.68</Text>
                <Text style={styles.resultValue}>→ ≈ 22 mIU/mL</Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.listCard}>
          <Text style={styles.sectionTitle}>批號資訊</Text>
          {[
            { label: '批號', value: lotNumber || '尚未設定' },
            { label: '有效期限', value: expiry },
            { label: '校準點數量', value: points.length > 0 ? `n = ${points.length}` : '—' },
            { label: '正常參考值', value: 'T/C ≥ 0.85', valueColor: colors.success },
            { label: 'R² 擬合度', value: r2 },
          ].map((item, i) => (
            <View key={i} style={[styles.infoRow, i === 4 && { borderBottomWidth: 0 }]}>
              <Text style={styles.hint}>{item.label}</Text>
              <Text style={[styles.infoValue, item.valueColor ? { color: item.valueColor, fontWeight: typography.weights.medium } : {}]}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.tealCard}>
          <Text style={styles.tealText}>✓ 批號已驗證。若更換新批次試紙，請重新掃描包裝上的 QR Code 更新校準曲線。</Text>
        </View>

      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  appbar: {
    height: 46, justifyContent: 'center',
    paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: colors.gray200,
  },
  appbarTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  scroll: { flex: 1, padding: 18 },
  listCard: { borderWidth: 0.5, borderColor: colors.gray200, borderRadius: 10, padding: 12, marginBottom: 14 },
  lotRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  rowLabel: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  lotBadge: { backgroundColor: colors.primaryLight, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  lotBadgeText: { fontSize: typography.sizes.sm, color: colors.primary, fontWeight: typography.weights.medium },
  btnRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  btnSecondary: { flex: 1, height: 34, borderWidth: 1.5, borderColor: colors.primary, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnSecondaryText: { fontSize: typography.sizes.sm, color: colors.primary },
  btnGray: { flex: 1, height: 34, backgroundColor: colors.gray100, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnGrayText: { fontSize: typography.sizes.sm, color: colors.gray500 },
  hint: { fontSize: typography.sizes.sm, color: colors.gray400 },
  sectionTitle: { fontSize: typography.sizes.sm, color: colors.gray500, marginBottom: 10 },
  chartArea: { height: 100, marginBottom: 8 },
  chartInner: { flex: 1, position: 'relative', marginBottom: 4 },
  emptyChart: { position: 'absolute', top: 30, left: 0, right: 0, textAlign: 'center', fontSize: typography.sizes.xs, color: colors.gray400 },
  yAxis: { position: 'absolute', left: 0, top: 0, bottom: 20, width: 0.5, backgroundColor: colors.gray200 },
  xAxis: { position: 'absolute', left: 0, right: 0, bottom: 20, height: 0.5, backgroundColor: colors.gray200 },
  dot: { position: 'absolute', width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary },
  currentDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: colors.warning, borderWidth: 1.5, borderColor: colors.white },
  refLine: { position: 'absolute', left: '58%', top: 0, bottom: 20, width: 0.8, backgroundColor: colors.success },
  refLabel: { position: 'absolute', left: '59%', top: 0, fontSize: 7, color: colors.success },
  currentLabel: { position: 'absolute', left: '38%', bottom: 22, fontSize: 7, color: colors.warning },
  axisLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  axisText: { fontSize: 7, color: colors.gray400 },
  divider: { height: 0.5, backgroundColor: colors.gray200, marginVertical: 8 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultValue: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.warning },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: colors.gray100 },
  infoValue: { fontSize: typography.sizes.sm, color: colors.gray900 },
  tealCard: { backgroundColor: colors.primaryLight, borderRadius: 10, padding: 12, marginBottom: 16 },
  tealText: { fontSize: typography.sizes.sm, color: '#0d7a8f', lineHeight: 18 },
})