import { useState, useEffect } from 'react'
import * as Brightness from 'expo-brightness'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { colors, typography } from '../theme'
import Button from '../components/Button'

export default function BrightnessCalibScreen({ navigation }: any) {
  const [brightness, setBrightness] = useState(88)

  useEffect(() => {
    async function setupBrightness() {
      const { status } = await Brightness.requestPermissionsAsync()
      if (status === 'granted') {
        await Brightness.setSystemBrightnessAsync(1.0)
        setBrightness(100)
      }
    }
    setupBrightness()
    return () => {
      Brightness.useSystemBrightnessAsync()
    }
  }, [])

  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>螢幕光源校準</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.progressRow}>
          <Text style={styles.hint}>步驟 3 / 6</Text>
          <Text style={styles.hint}>光源設定</Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: '40%' }]} />
        </View>

        {/* 白場預覽 */}
        <View style={styles.darkCard}>
          <Text style={styles.darkLabel}>螢幕白場預覽</Text>
          <View style={styles.whiteBox}>
            <Text style={styles.whiteBoxText}>均勻白光 — 供試紙透光使用</Text>
          </View>
        </View>

        {/* 亮度滑桿 */}
        <View style={styles.section}>
          <View style={styles.brightnessRow}>
            <Text style={styles.rowLabel}>螢幕亮度</Text>
            <Text style={styles.brightnessValue}>{brightness}%</Text>
          </View>
          <View style={styles.sliderBg}>
            <View style={[styles.sliderFill, { width: `${brightness}%` }]} />
          </View>
          <View style={styles.sliderBtns}>
           <TouchableOpacity onPress={async () => {
            const newVal = Math.max(0, brightness - 5)
            setBrightness(newVal)
            await Brightness.setSystemBrightnessAsync(newVal / 100)}} style={styles.sliderBtn}>
              <Text style={styles.sliderBtnText}>−</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={async () => {
              const newVal = Math.min(100, brightness + 5)
              setBrightness(newVal)
              await Brightness.setSystemBrightnessAsync(newVal / 100)
            }} style={styles.sliderBtn}>
              <Text style={styles.sliderBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>建議亮度 ≥ 85%。App 將在拍攝期間鎖定亮度。</Text>
        </View>

        <View style={styles.divider} />

        {/* 校準步驟 */}
        <Text style={styles.sectionTitle}>白場校準步驟</Text>
        {[
          { num: '✓', title: '停用自動亮度', sub: '已完成', done: true },
          { num: '2', title: '準備試紙', sub: '將試紙放入夾具，確認 C、T 兩條線清晰', active: true },
          { num: '3', title: '基準值確認', sub: '計算背景灰階均值，作為後續扣除基底', pending: true },
        ].map((step, i) => (
          <View key={i} style={[styles.stepRow, step.pending && { opacity: 0.4 }]}>
            <View style={[
              styles.stepCircle,
              step.done && styles.stepDone,
              step.active && styles.stepActive,
              step.pending && styles.stepPending,
            ]}>
              <Text style={[styles.stepNum, (step.active || step.done) && { color: step.done ? colors.success : colors.white }]}>{step.num}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.hint}>{step.sub}</Text>
            </View>
          </View>
        ))}

        <Button title="開始拍攝試紙 ›" onPress={() => navigation.navigate('CamCapture')} />

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
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  hint: { fontSize: typography.sizes.sm, color: colors.gray400 },
  progressBg: { height: 4, backgroundColor: colors.gray200, borderRadius: 2, marginBottom: 16 },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  darkCard: {
    backgroundColor: '#0a0e0f',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  darkLabel: { fontSize: typography.sizes.xs, color: '#4ade80', marginBottom: 8 },
  whiteBox: {
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whiteBoxText: { fontSize: typography.sizes.xs, color: '#ccc' },
  section: { marginBottom: 16 },
  brightnessRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rowLabel: { fontSize: typography.sizes.md, color: colors.gray500 },
  brightnessValue: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.primary },
  sliderBg: { height: 8, backgroundColor: colors.gray200, borderRadius: 4, marginBottom: 8, overflow: 'hidden' },
  sliderFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  sliderBtns: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  sliderBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderBtnText: { fontSize: 20, color: colors.primary },
  divider: { height: 0.5, backgroundColor: colors.gray200, marginVertical: 12 },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.gray500,
    marginBottom: 10,
  },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8 },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepDone: { backgroundColor: colors.successLight, borderWidth: 1, borderColor: colors.success },
  stepActive: { backgroundColor: colors.primary },
  stepPending: { backgroundColor: colors.gray100, borderWidth: 1, borderColor: colors.gray200 },
  stepNum: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.gray400 },
  stepTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
})