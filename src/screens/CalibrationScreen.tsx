import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native'
import { colors, typography } from '../theme'
import { getInventory, setLotNumber as setLotNumberRemote, setStrips as setStripsRemote } from '../inventory'
import { Ionicons } from '@expo/vector-icons'
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg'
import { useMeasureTargets } from '../hooks/useMeasureTargets'
import { useFeatureTour, TourStep } from '../context/FeatureTourContext'
import { useIsFocused } from '@react-navigation/native'

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window')
const TAB_BAR_HEIGHT = 80
const TAB_INDEX = { dashboard: 0, history: 1, calibration: 2, shop: 3, settings: 4 }

function tabRect(index: number) {
  return { x: (SCREEN_W / 5) * index, y: SCREEN_H - TAB_BAR_HEIGHT, width: SCREEN_W / 5, height: TAB_BAR_HEIGHT }
}

const CALIBRATION_TARGET_KEYS = ['qrBtn', 'manualBtn']

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

  const isFocused = useIsFocused()
  const { stage, registerSteps, setStageDirectly } = useFeatureTour()
  const isMyTurn = stage === 'calibration' && isFocused
  const { setRef, measureAll } = useMeasureTargets(CALIBRATION_TARGET_KEYS)

  useEffect(() => {
    if (!isMyTurn) return
    const timer = setTimeout(async () => {
      const t = await measureAll()
      const steps: TourStep[] = [
        ...(t.qrBtn ? [{ key: 'qrBtn', label: '可以掃描試紙包裝上的 QR Code 完成校準', rect: t.qrBtn as any }] : []),
        ...(t.manualBtn ? [{ key: 'manualBtn', label: '或是手動輸入批號也可以', rect: t.manualBtn as any }] : []),
        {
          key: 'tab-next',
          label: '點擊「商店」前往下一步',
          rect: tabRect(TAB_INDEX.shop),
          shape: 'circle',
          labelSide: 'top',
          passthrough: true,
          onPress: () => {
            setStageDirectly('shop')
            navigation.navigate('商店')
          },
        },
      ]
      registerSteps(steps)
    }, 300)
    return () => clearTimeout(timer)
  }, [isMyTurn])

  useEffect(() => {
    getInventory().then(({ lotNumber: val }) => {
      if (val) setLotNumber(val)
    })
  }, [])

  const currentLot = lotNumber ? lotData[lotNumber] : null
  const expiry = currentLot?.expiry || '—'
  const r2 = currentLot?.r2 || '—'
  const points = currentLot?.points || []

  const chartLeft = 6
  const chartRight = 260
  const chartTop = 8
  const chartBottom = 65
  const maxTc = 1.2
  const maxConc = 60

  function xFor(tc: number) {
    return Math.round(chartLeft + (Math.min(tc, maxTc) / maxTc) * (chartRight - chartLeft))
  }
  function yFor(conc: number) {
    return Math.round(chartBottom - (Math.min(conc, maxConc) / maxConc) * (chartBottom - chartTop))
  }
  const refX = xFor(0.85)

  function handleManualInput() {
    Alert.prompt(
      '手動輸入批號',
      '請輸入試紙包裝上的批號（例如：LOT-2025-A）',
      [
        { text: '取消', style: 'cancel' },
        { text: '確認', onPress: async (value: string | undefined) => {
          if (value) {
            setLotNumber(value)
            await setLotNumberRemote(value)
            await setStripsRemote(6)
            Alert.alert('已更新', `批號已更新為 ${value}，試紙數量已重設為 6 片`)
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

        <View style={styles.card}>
          <View style={styles.lotRow}>
            <Text style={styles.rowLabel}>目前試紙批號</Text>
            <View style={styles.lotBadge}>
              <Text style={styles.lotBadgeText}>{lotNumber || '尚未設定'}</Text>
            </View>
          </View>
          <View style={styles.btnRow}>
            <TouchableOpacity ref={setRef('qrBtn')} style={styles.btnOutline} onPress={() => navigation.getParent()?.navigate('LotQR')}>
              <Text style={styles.btnOutlineText}>掃描 QR Code</Text>
            </TouchableOpacity>
            <TouchableOpacity ref={setRef('manualBtn')} style={styles.btnFilled} onPress={handleManualInput}>
              <Text style={styles.btnFilledText}>手動輸入</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>不同批次試紙靈敏度不同，請確認批號正確</Text>
        </View>

        <View style={styles.tealCard}>
          <Text style={styles.tealSectionTitle}>標準曲線（批號 {lotNumber || '尚未設定'}）</Text>
          {points.length === 0 ? (
            <View style={{ height: 80, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={styles.tealHint}>請先設定批號</Text>
            </View>
          ) : (
            <Svg width="100%" height={80} viewBox="0 0 299 65">
              <Line x1={chartLeft} y1={chartBottom} x2={chartRight} y2={chartBottom} stroke={colors.primary} strokeWidth={0.5} opacity={0.3} />
              <Line x1={refX} y1={chartTop} x2={refX} y2={chartBottom} stroke={colors.success} strokeWidth={1} strokeDasharray="3,3" opacity={0.7} />
              <SvgText x={refX + 2} y={chartTop + 8} fontSize={10} fill={colors.success}>0.85</SvgText>
              {points.map((p, i) => (
                <Circle key={i} cx={xFor(p.tc)} cy={yFor(p.conc)} r={2.5} fill={colors.primary} />
              ))}
            </Svg>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>批號資訊</Text>
          {[
            { label: '批號', value: lotNumber || '尚未設定' },
            { label: '有效期限', value: expiry },
            { label: '校準點數量', value: points.length > 0 ? `n = ${points.length}` : '—' },
            { label: '正常參考值', value: 'T/C ≥ 0.85', valueColor: colors.success },
            { label: 'R² 擬合度', value: r2 },
          ].map((item, i) => (
            <View key={i} style={[styles.infoRow, i === 4 && { borderBottomWidth: 5 }]}>
              <Text style={styles.hint}>{item.label}</Text>
              <Text style={[styles.infoValue, item.valueColor ? { color: item.valueColor, fontWeight: typography.weights.medium } : {}]}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.noticeCard}>
          <Ionicons name="checkmark-circle-outline" size={16} color={colors.primary} />
          <Text style={styles.noticeText}>批號已驗證。若更換新批次試紙，請重新掃描包裝上的 QR Code 更新校準曲線。</Text>
        </View>

        <View style={{ height: 20 }} />

      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  appbar: {
    paddingTop: 30, paddingHorizontal: 18, paddingBottom: 20, backgroundColor: colors.white,
  },
  appbarTitle: { fontSize: 22, fontWeight: '600', color: colors.gray900 },
  scroll: { flex: 1, paddingHorizontal: 18 },
  card: {
    backgroundColor: colors.white, borderWidth: 0.5, borderColor: colors.gray200,
    borderRadius: 18, padding: 14, marginBottom: 12,
  },
  lotRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  rowLabel: { fontSize: typography.sizes.md, fontWeight: '600', color: colors.gray900 },
  lotBadge: { backgroundColor: colors.primaryLight, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  lotBadgeText: { fontSize: typography.sizes.sm, color: colors.primary, fontWeight: '600' },
  btnRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  btnOutline: { flex: 1, height: 34, borderWidth: 1.5, borderColor: colors.primary, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  btnOutlineText: { fontSize: typography.sizes.sm, color: colors.primary, fontWeight: typography.weights.medium },
  btnFilled: { flex: 1, height: 34, backgroundColor: colors.primaryLight, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  btnFilledText: { fontSize: typography.sizes.sm, color: colors.primary, fontWeight: typography.weights.medium },
  hint: { fontSize: typography.sizes.sm, color: colors.gray400 },
  sectionTitle: { fontSize: typography.sizes.sm, color: colors.gray500, marginBottom: 10 },
  tealCard: { backgroundColor: colors.primaryLight, borderRadius: 18, padding: 14, marginBottom: 12 },
  tealSectionTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.primary, marginBottom: 10 },
  tealHint: { fontSize: typography.sizes.xs, color: colors.primary },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: colors.gray100 },
  infoValue: { fontSize: typography.sizes.sm, color: colors.gray900 },
  noticeCard: {
    backgroundColor: colors.primaryLight, borderRadius: 14, padding: 12,
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
  },
  noticeText: { flex: 1, fontSize: typography.sizes.xs, color: colors.primary, lineHeight: 17 },
})