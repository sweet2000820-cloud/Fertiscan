import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { colors, typography } from '../theme'

const questions = [
  {
    q: '最近 1 個月，平均每晚睡幾小時？',
    opts: ['少於 5 小時', '5–6 小時', '7–8 小時', '超過 9 小時']
  },
  {
    q: '最近 1 個月，每週運動幾次？',
    opts: ['幾乎不運動', '每週 1–2 次', '每週 3–4 次', '每週 5 次以上']
  },
  {
    q: '最近 1 個月，是否有長時間久坐（每天超過 6 小時）？',
    opts: ['很少', '偶爾', '幾乎每天']
  },
  {
    q: '最近 1 個月，飲酒頻率？',
    opts: ['不喝', '偶爾（每月 1–3 次）', '每週 1–2 次', '每週 3 次以上']
  },
  {
    q: '最近 2 週，整體壓力狀況？',
    opts: ['壓力不大', '有些壓力，尚可承受', '壓力較大', '壓力很大']
  },
]

export default function PreQuestionnaireScreen({ navigation }: any) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])

  const current = questions[step]
  const selected = answers[step]
  const progress = ((step + 1) / questions.length * 100).toFixed(0)

  function selectAnswer(i: number) {
    const newAnswers = [...answers]
    newAnswers[step] = i
    setAnswers(newAnswers)
  }

  async function next() {
    if (selected === undefined) return
    if (step < questions.length - 1) {
      setStep(step + 1)
    } else {
      const questionnaireData = {
        sleepHours: questions[0].opts[answers[0]],
        exerciseDays: questions[1].opts[answers[1]],
        sitting: questions[2].opts[answers[2]],
        alcohol: questions[3].opts[answers[3]],
        stress: questions[4].opts[answers[4]],
      }
      const AsyncStorage = require('@react-native-async-storage/async-storage').default
      await AsyncStorage.setItem('lastQuestionnaire', JSON.stringify(questionnaireData))
      navigation.navigate('BrightnessCalib')
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => step > 0 ? setStep(step - 1) : navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>採樣前問卷</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.progressRow}>
          <Text style={styles.hint}>步驟 2 / 6</Text>
          <Text style={styles.hint}>問題 {step + 1} / {questions.length}</Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, {width:`${progress}%` as any}]} />
        </View>

        <Text style={styles.question}>{current.q}</Text>
        <Text style={styles.hint}>回答將用於 AI 生活習慣建議參考</Text>

        <View style={styles.optionList}>
          {current.opts.map((opt, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.option, selected === i && styles.optionSelected]}
              onPress={() => selectAnswer(i)}
            >
              <View style={[styles.radio, selected === i && styles.radioSelected]}>
                {selected === i && <View style={styles.radioDot} />}
              </View>
              <Text style={[styles.optionText, selected === i && styles.optionTextSelected]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.nextBtn, selected === undefined && styles.nextBtnDisabled]}
          onPress={next}
          disabled={selected === undefined}
        >
          <Text style={styles.nextBtnText}>
            {step === questions.length - 1 ? '完成，開始校準 ›' : '下一題 ›'}
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
  hint: { fontSize: typography.sizes.sm, color: colors.gray400 },
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