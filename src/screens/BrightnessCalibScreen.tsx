import { useState, useEffect, useRef } from 'react'
import * as Brightness from 'expo-brightness'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native'
import { colors, typography } from '../theme'
import Button from '../components/Button'

// [修正] 亮度控制改用 setBrightnessAsync：
// - 只影響本 App 畫面，iOS / Android 都能用，不需要權限
// - 原本的 setSystemBrightnessAsync 只支援 Android，且會改掉使用者手機的全域亮度、
//   關閉自動亮度，離開 App 後也不會恢復
// - 原本的 useSystemBrightnessAsync 在新版 expo-brightness 已移除（改名為 restoreSystemBrightnessAsync）

async function applyBrightness(percent: number) {
  try {
    await Brightness.setBrightnessAsync(percent / 100)
  } catch (e) {
    // 少數裝置不支援調整亮度，不影響後續流程
  }
}

export default function BrightnessCalibScreen({ navigation, route }: any) {
  const [brightness, setBrightness] = useState(100)
  const originalBrightness = useRef<number | null>(null)

  useEffect(() => {
    async function setupBrightness() {
      try {
        // 記下進來前的亮度，離開時還原（iOS 用）
        originalBrightness.current = await Brightness.getBrightnessAsync()
      } catch (e) {
        originalBrightness.current = null
      }
      await applyBrightness(100)
      setBrightness(100)
    }
    setupBrightness()

    return () => {
      // 離開校準流程時還原亮度
      if (Platform.OS === 'android') {
        // Android：取消 App 的亮度覆寫，回到使用者的系統亮度
        Brightness.restoreSystemBrightnessAsync().catch(() => {})
      } else if (originalBrightness.current != null) {
        // iOS：設回進來前的亮度
        Brightness.setBrightnessAsync(originalBrightness.current).catch(() => {})
      }
    }
  }, [])

  async function changeBrightness(delta: number) {
    const newVal = Math.max(0, Math.min(100, brightness + delta))
    setBrightness(newVal)
    await applyBrightness(newVal)
  }

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
            <TouchableOpacity onPress={() => changeBrightness(-5)} style={styles.sliderBtn}>
              <Text style={styles.sliderBtnText}>−</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => changeBrightness(5)} style={styles.sliderBtn}>
              <Text style={styles.sliderBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>建議亮度 ≥ 85%。App 將在拍攝期間鎖定亮度。</Text>
        </View>

        <View style={styles.divider} />

        {/* 校準步驟 */}
        <Text style={styles.sectionTitle}>白場校準步驟</Text>
        {[
          { num: '1', title: '停用自動亮度', sub: '避免拍攝過程中亮度自動變化，影響判讀一致性' },
          { num: '2', title: '準備試紙', sub: '將試紙對齊方框拍攝，確認 C、T 兩條線清晰' },
          { num: '3', title: '基準值確認', sub: '拍攝時自動計算背景灰階均值，作為後續扣除基底' },
        ].map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepNum}>{step.num}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.hint}>{step.sub}</Text>
            </View>
          </View>
        ))}
        <Button title="開始拍攝試紙 ›" onPress={() => navigation.navigate('CamCapture', { ...route?.params })} />

      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  appbar: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 10, paddingHorizontal: 18, paddingBottom: 20,
  },
  back: { fontSize: 40, color: colors.primary, marginRight: 6, paddingBottom: 4 },
  appbarTitle: { fontSize: 22, fontWeight: '600', color: colors.gray900 },
  scroll: { flex: 1, paddingHorizontal: 18 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  hint: { fontSize: typography.sizes.sm, color: colors.gray400 },
  progressBg: { height: 4, backgroundColor: colors.gray200, borderRadius: 2, marginBottom: 16 },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  darkCard: {
    backgroundColor: '#0a0e0f',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
  },
  darkLabel: { fontSize: typography.sizes.xs, color: '#4ade80', marginBottom: 8 },
  whiteBox: {
    height: 60,
    borderRadius: 12,
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
    width: 40,
    height: 40,
    borderRadius: 20,
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