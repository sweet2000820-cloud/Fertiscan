import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { colors, typography } from '../theme'
import { saveRecord } from '../storage'
import { getInventory, setLastTestDate, setStrips as setStripsRemote } from '../inventory'

export default function AnalysisScreen({ navigation, route }: any) {
  const [progress, setProgress] = useState(0)

  // 從 CamCapture 傳入的真實分析結果
  const analysisResult = route?.params?.analysisResult
  // [修正] 原本沒有分析結果時，會從假數值裡隨機挑一個當作 T/C 並存進紀錄。
  // 改為沒有結果就不產生數值、不存檔，並提示重新拍攝，避免假資料混進使用者的歷史紀錄
  const tc: string | null = analysisResult?.tc_ratio != null ? analysisResult.tc_ratio.toString() : null
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false) // [新增] 防止重複點擊
  const status = tc == null ? '—' : parseFloat(tc) >= 0.85 ? '正常' : parseFloat(tc) >= 0.5 ? '邊緣' : '偏低'

  useEffect(() => {
    let currentProgress = 0
    const timer = setInterval(() => {
      currentProgress += 1.5
      setProgress(currentProgress)
      if (currentProgress >= 40) setStep(1)
      if (currentProgress >= 70) setStep(2)
      if (currentProgress >= 100) {
        clearInterval(timer)
        setDone(true)
        setProgress(100)
      }
    }, 60)
    return () => clearInterval(timer)
  }, [])

  const steps = [
  { label: '試紙 ROI 自動定位', done: true },
  { label: '灰階積分計算', active: step === 0, done: step > 0 },
  { label: 'T/C 比值正規化', active: step === 1, done: step > 1 },
  { label: '標準曲線對照換算', active: step === 2, done: done },
]

  async function handleViewResult() {
    // [新增] 存檔中再按一次不會重複存，也不會重複扣試紙
    if (saving || tc == null) return
    setSaving(true)
    try {
      const now = new Date()
      const date = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`
      const time = `${now.getHours() < 12 ? '上午' : '下午'} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`
      const { lotNumber: currentLot, strips: currentStrips } = await getInventory()
      const lotNumber = currentLot || '未知批號'
      // [新增] 靜置等待時的問答成績（從 RestTimerScreen 一路帶過來；沒作答為 null）
      const quizResult = route?.params?.quizResult ?? null
      const tLineFaint = analysisResult?.t_line_faint === true

      await saveRecord({
        date, time, tc, status, lot: lotNumber,
        cIntensity: analysisResult?.c_intensity,
        tIntensity: analysisResult?.t_intensity,
        tLineFaint, // [新增 2026/10/01] T 線未顯色＝濃度低於 15 百萬/mL
        preTestSurvey: route?.params?.preTestSurvey,
        quizResult,
      })
      await setLastTestDate(now.toISOString())
      // [移除 2026/09/30] 原本的「自動分享給已連結診所」只寫入本機紀錄、並未真的送到診所；
      // 改為在「諮詢專業醫師 → 診所資訊」由使用者逐次確認分享
      const newStrips = Math.max(0, currentStrips - 1)
      await setStripsRemote(newStrips)
      navigation.navigate('ReportOverview', {
        record: {
          date, time, tc, status, lot: lotNumber,
          cIntensity: analysisResult?.c_intensity,
          tIntensity: analysisResult?.t_intensity,
          tLineFaint,
          debugInner: analysisResult?.debug_inner,
          debugFull: analysisResult?.debug_full,
          preTestSurvey: route?.params?.preTestSurvey,
          quizResult,
        },
      })
    } catch (e) {
      // [新增] 原本存檔失敗時按鈕會沒有任何反應，使用者不知道發生什麼事
      console.log('[Analysis] 儲存紀錄失敗:', e)
      Alert.alert('儲存失敗', '檢測結果尚未儲存，請確認網路連線後再按一次「查看結果」。')
    } finally {
      setSaving(false)
    }
  }

  // [新增] 沒有收到分析結果（理論上不會發生）：不顯示假數值，引導重新拍攝
  if (tc == null) {
    return (
      <View style={styles.container}>
        <View style={styles.appbar}>
          <Text style={styles.appbarTitle}>影像分析</Text>
        </View>
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>沒有收到分析結果</Text>
          <Text style={styles.errorText}>請回到上一步重新拍攝試紙。</Text>
          <TouchableOpacity style={styles.resultBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.resultBtnText}>重新拍攝</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <Text style={styles.appbarTitle}>影像分析中</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.progressRow}>
          <Text style={styles.hint}>步驟 6 / 6</Text>
          <Text style={styles.hint}>AI 本機分析</Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
        </View>
        <Text style={styles.pct}>{Math.round(Math.min(progress, 100))}%</Text>

        {/* 分析步驟 */}
        <View style={styles.darkCard}>
          <Text style={styles.darkLabel}>影像處理管線</Text>
          {steps.map((s, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.stepIcon, s.done && styles.iconDone, s.active && styles.iconActive]}>
                <Text style={[styles.stepIconText, s.done && { color: colors.success }, s.active && { color: colors.white }]}>
                  {s.done ? '✓' : i + 1}
                </Text>
              </View>
              <Text style={[styles.stepLabel, s.active && { color: '#facc15' }, s.done && { color: '#aaa' }]}>
                {s.active ? s.label + '中…' : s.label + (s.done ? '完成' : '')}
              </Text>
            </View>
          ))}
        </View>

        {/* 數值卡片 */}
        <View style={styles.listCard}>
          <Text style={styles.sectionTitle}>T/C 預估值</Text>
          <Text style={styles.tcValue}>{done ? tc : '—'}</Text>
          <View style={styles.divider} />
          {/* [修正] 原本是用 T/C 值乘上固定數字算出來的示意數值（兩者相除永遠是 0.68），
              改為顯示後端實際量到的訊號強度（CamCapture 已將三張照片平均） */}
          <View style={styles.dataRow}>
            <Text style={styles.hint}>C 線訊號強度</Text>
            <Text style={styles.dataValue}>
              {analysisResult?.c_intensity != null ? Number(analysisResult.c_intensity).toFixed(1) : '—'}
            </Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.hint}>T 線訊號強度</Text>
            <Text style={styles.dataValue}>
              {analysisResult?.t_intensity != null ? Number(analysisResult.t_intensity).toFixed(1) : '—'}
            </Text>
          </View>
        </View>

        {done && (
          <TouchableOpacity
            style={[styles.resultBtn, saving && { opacity: 0.6 }]}
            onPress={handleViewResult}
            disabled={saving}
          >
            <Text style={styles.resultBtnText}>{saving ? '儲存中…' : '查看結果 ›'}</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 20 }} />

      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  appbar: {
    justifyContent: 'center',
    paddingTop: 30,
    paddingHorizontal: 18,
    paddingBottom: 20,
  },
  appbarTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.gray900,
  },
  scroll: { flex: 1, paddingHorizontal: 18 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  hint: { fontSize: typography.sizes.sm, color: colors.gray400 },
  progressBg: { height: 4, backgroundColor: colors.gray200, borderRadius: 2, marginBottom: 4 },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  pct: { fontSize: typography.sizes.sm, color: colors.primary, textAlign: 'center', marginBottom: 16 },
  darkCard: { backgroundColor: '#0a0e0f', borderRadius: 18, padding: 14, marginBottom: 14 },
  darkLabel: { fontSize: typography.sizes.xs, color: '#4ade80', marginBottom: 10 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 },
  stepIcon: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#2a2a2a',
    alignItems: 'center', justifyContent: 'center',
  },
  iconDone: { backgroundColor: colors.successLight },
  iconActive: { backgroundColor: colors.primary },
  stepIconText: { fontSize: 9, color: '#555', fontWeight: typography.weights.medium },
  stepLabel: { fontSize: typography.sizes.xs, color: '#666' },
  listCard: {
    backgroundColor: colors.white,
    borderWidth: 0.5, borderColor: colors.gray200,
    borderRadius: 18, padding: 14, marginBottom: 14,
  },
  sectionTitle: { fontSize: typography.sizes.sm, color: colors.gray500, marginBottom: 6 },
  tcValue: {
    fontSize: 28, fontWeight: typography.weights.medium,
    color: colors.warning, textAlign: 'center', marginVertical: 8,
  },
  divider: { height: 0.5, backgroundColor: colors.gray200, marginVertical: 8 },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  dataValue: { fontSize: typography.sizes.sm, color: colors.gray900 },
  resultBtn: {
    height: 48, borderRadius: 24, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  resultBtnText: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.white },
  // [新增]
  errorBox: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  errorTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.medium, color: colors.gray900, textAlign: 'center', marginBottom: 8 },
  errorText: { fontSize: typography.sizes.md, color: colors.gray500, textAlign: 'center', marginBottom: 24 },
})
