import { useState } from 'react'
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { colors, typography } from '../theme'

// 是非題（2選項）
const yesNoQuestions = [
  { key: 'sampleComplete', q: '本次檢體是否完整採集？' },
  { key: 'usedLubricant', q: '採樣過程是否使用潤滑劑？' },
  { key: 'hadFever', q: '最近 2 週是否有發燒超過 38.5°C？' },
  { key: 'newMedication', q: '最近 3 個月是否有新增或調整用藥？' },
  { key: 'heavyDrinking', q: '最近 48 小時是否大量飲酒？' },
]

// 頻率程度題（4選項）
const heatExposureOpts = [
  { label: '從不', value: 'never' },
  { label: '偶爾', value: 'occasional' },
  { label: '常常', value: 'often' },
  { label: '幾乎每天', value: 'almostDaily' },
]
const sleepHoursOpts = [
  { label: '少於 5 小時', value: 'lt5' },
  { label: '5–6 小時', value: '5to6' },
  { label: '7–8 小時', value: '7to8' },
  { label: '超過 9 小時', value: 'gt9' },
]
const stressOpts = [
  { label: '壓力不大', value: 'low' },
  { label: '有些壓力，尚可承受', value: 'moderate' },
  { label: '壓力較大', value: 'high' },
  { label: '壓力很大', value: 'veryHigh' },
]

export default function PreQuestionnaireScreen({ navigation, route }: any) {
  const [step, setStep] = useState(0)

  // 數字輸入
  const [abstinenceDays, setAbstinenceDays] = useState('')
  const [sampleIntervalMinutes, setSampleIntervalMinutes] = useState('')

  // 是非題答案
  const [yesNoAnswers, setYesNoAnswers] = useState<Record<string, boolean | undefined>>({})

  // 頻率程度題答案
  const [heatExposure, setHeatExposure] = useState<string | undefined>()
  const [sleepHours, setSleepHours] = useState<string | undefined>()
  const [stressLevel, setStressLevel] = useState<string | undefined>()

  // 總步驟：2個數字輸入 + 5個是非題 + 3個頻率題 = 10 頁
  const totalSteps = 2 + yesNoQuestions.length + 3
  const progress = ((step + 1) / totalSteps * 100).toFixed(0)

  function canProceed() {
    if (step === 0) return abstinenceDays.trim() !== ''
    if (step === 1) return sampleIntervalMinutes.trim() !== ''
    const yesNoIndex = step - 2
    if (yesNoIndex >= 0 && yesNoIndex < yesNoQuestions.length) {
      return yesNoAnswers[yesNoQuestions[yesNoIndex].key] !== undefined
    }
    const freqIndex = step - 2 - yesNoQuestions.length
    if (freqIndex === 0) return heatExposure !== undefined
    if (freqIndex === 1) return sleepHours !== undefined
    if (freqIndex === 2) return stressLevel !== undefined
    return false
  }

  function next() {
    if (!canProceed()) return
    if (step < totalSteps - 1) {
      setStep(step + 1)
    } else {
      const preTestSurvey = {
        abstinenceDays: parseInt(abstinenceDays, 10),
        sampleIntervalMinutes: parseInt(sampleIntervalMinutes, 10),
        sampleComplete: !!yesNoAnswers.sampleComplete,
        usedLubricant: !!yesNoAnswers.usedLubricant,
        hadFever: !!yesNoAnswers.hadFever,
        newMedication: !!yesNoAnswers.newMedication,
        heavyDrinking: !!yesNoAnswers.heavyDrinking,
        heatExposure: heatExposure as 'never' | 'occasional' | 'often' | 'almostDaily',
        sleepHours: sleepHours as 'lt5' | '5to6' | '7to8' | 'gt9',
        stressLevel: stressLevel as 'low' | 'moderate' | 'high' | 'veryHigh',
      }
      navigation.navigate('BrightnessCalib', { ...route?.params, preTestSurvey })
    }
  }

  function back() {
    if (step > 0) setStep(step - 1)
    else navigation.goBack()
  }

  // 渲染題目內容
  function renderQuestion() {
    if (step === 0) {
      return (
        <>
          <Text style={styles.question}>距離上次射精，已經幾天了？</Text>
          <Text style={styles.hint}>建議禁慾 2–7 天內採樣，準確度較高</Text>
          <TextInput
            style={styles.numInput}
            placeholder="請輸入天數"
            placeholderTextColor={colors.gray400}
            keyboardType="number-pad"
            value={abstinenceDays}
            onChangeText={setAbstinenceDays}
          />
        </>
      )
    }
    
    const yesNoIndex = step - 2
    if (yesNoIndex >= 0 && yesNoIndex < yesNoQuestions.length) {
      const item = yesNoQuestions[yesNoIndex]
      const selected = yesNoAnswers[item.key]
      return (
        <>
          <Text style={styles.question}>{item.q}</Text>
          <View style={styles.optionList}>
            {[{ label: '是', value: true }, { label: '否', value: false }].map(opt => (
              <TouchableOpacity
                key={String(opt.value)}
                style={[styles.option, selected === opt.value && styles.optionSelected]}
                onPress={() => setYesNoAnswers({ ...yesNoAnswers, [item.key]: opt.value })}
              >
                <View style={[styles.radio, selected === opt.value && styles.radioSelected]}>
                  {selected === opt.value && <View style={styles.radioDot} />}
                </View>
                <Text style={[styles.optionText, selected === opt.value && styles.optionTextSelected]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )
    }
    const freqIndex = step - 2 - yesNoQuestions.length
    const freqConfigs = [
      { q: '最近是否有泡三溫暖/熱水澡/久坐？', opts: heatExposureOpts, selected: heatExposure, setter: setHeatExposure },
      { q: '昨晚睡眠時數？', opts: sleepHoursOpts, selected: sleepHours, setter: setSleepHours },
      { q: '最近整體壓力狀況？', opts: stressOpts, selected: stressLevel, setter: setStressLevel },
    ]
    const cfg = freqConfigs[freqIndex]
    if (!cfg) return null
    return (
      <>
        <Text style={styles.question}>{cfg.q}</Text>
        <View style={styles.optionList}>
          {cfg.opts.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.option, cfg.selected === opt.value && styles.optionSelected]}
              onPress={() => cfg.setter(opt.value)}
            >
              <View style={[styles.radio, cfg.selected === opt.value && styles.radioSelected]}>
                {cfg.selected === opt.value && <View style={styles.radioDot} />}
              </View>
              <Text style={[styles.optionText, cfg.selected === opt.value && styles.optionTextSelected]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <TouchableOpacity onPress={back}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>採樣前問卷</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <View style={styles.progressRow}>
          <Text style={styles.hint}>步驟 2 / 6</Text>
          <Text style={styles.hint}>問題 {step + 1} / {totalSteps}</Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
        </View>

        {renderQuestion()}

        <TouchableOpacity
          style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]}
          onPress={next}
          disabled={!canProceed()}
        >
          <Text style={styles.nextBtnText}>
            {step === totalSteps - 1 ? '完成，開始校準 ›' : '下一題 ›'}
          </Text>
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
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  hint: { fontSize: typography.sizes.sm, color: colors.gray400, marginBottom: 6 },
  progressBg: {
    height: 4,
    backgroundColor: colors.gray200,
    borderRadius: 2,
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  question: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.medium,
    color: colors.gray900,
    lineHeight: 24,
    marginBottom: 6,
  },
  numInput: {
  height: 46,
  borderWidth: 0.5,
  borderColor: colors.gray300,
  borderRadius: 8,
  paddingHorizontal: 14,
  fontSize: typography.sizes.lg,
  color: colors.gray900,
  marginTop: 16,
  marginBottom: 24,
  },
  optionList: { gap: 10, marginTop: 16, marginBottom: 20 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.white,
  },
  optionSelected: {
    borderColor: colors.primary,
    borderWidth: 1.5,
    backgroundColor: colors.primaryLight,
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  radioDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.white },
  optionText: { fontSize: typography.sizes.md, color: colors.gray900 },
  optionTextSelected: { color: colors.primary, fontWeight: typography.weights.medium },
  nextBtn: {
    height: 42,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.white },
})