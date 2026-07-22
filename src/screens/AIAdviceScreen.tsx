import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { colors, typography } from '../theme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getRecords, TestRecord } from '../storage'
import { getBaziFromYear, elementColors, elementReadings, getDailyFortune } from '../utils/bazi'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

const sleepLabels: Record<string, string> = {
  lt5: '少於 5 小時', '5to6': '5–6 小時', '7to8': '7–8 小時', gt9: '超過 9 小時',
}
const stressLabels: Record<string, string> = {
  low: '壓力不大', moderate: '有些壓力', high: '壓力較大', veryHigh: '壓力很大',
}
const heatLabels: Record<string, string> = {
  never: '從不', occasional: '偶爾', often: '常常', almostDaily: '幾乎每天',
}
const occupationLabels: Record<string, string> = {
  sedentary: '久坐辦公', active: '站立走動', highHeat: '高溫作業', other: '其他',
}

function avg(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function correlationInsight(
  records: TestRecord[],
  getGroup: (s: NonNullable<TestRecord['preTestSurvey']>) => 'good' | 'bad' | null,
  label: string,
  goodDesc: string,
  badDesc: string
) {
  const good: number[] = []
  const bad: number[] = []
  records.forEach(r => {
    if (!r.preTestSurvey) return
    const g = getGroup(r.preTestSurvey)
    if (g === 'good') good.push(parseFloat(r.tc))
    else if (g === 'bad') bad.push(parseFloat(r.tc))
  })
  if (good.length < 2 || bad.length < 2) return null
  const goodAvg = avg(good)
  const badAvg = avg(bad)
  if (badAvg === 0) return null
  const diffPct = Math.round(((goodAvg - badAvg) / badAvg) * 100)
  if (Math.abs(diffPct) < 10) return null
  return { label, goodDesc, badDesc, goodAvg, badAvg, diffPct, goodCount: good.length, badCount: bad.length }
}

export default function AIAdviceScreen({ navigation, route }: any) {
  const record: TestRecord = route?.params?.record
  const survey = record?.preTestSurvey

  const [allRecords, setAllRecords] = useState<TestRecord[]>([])
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
  getRecords().then(setAllRecords)
  ;(async () => {
    const user = auth.currentUser
    if (!user) return
    const snap = await getDoc(doc(db, 'users', user.uid))
    if (snap.exists()) {
      const data: any = snap.data()
      setProfile({
        userBirthYear: data.birthYear || null,
        userHeight: data.height || null,
        userWeight: data.weight || null,
        userSmoke: data.smoke ? 'true' : 'false',
        userSmokeYears: data.smokeYears || null,
        userVaricocele: data.varicocele ? 'true' : 'false',
        userTesticularHistory: data.testicularHistory ? 'true' : 'false',
        userEndocrineDisease: data.endocrineDisease ? 'true' : 'false',
        userHadSemenTest: data.hadSemenTest ? 'true' : 'false',
        userOccupationType: data.occupationType || null,
        userTryingToConceive: data.tryingToConceive || null,
      })
    }
  })()
}, [])

  const tcVal = parseFloat(record?.tc || '0')
  const status = record?.status || '—'
  const statusColor = status === '正常' ? colors.success : status === '邊緣' ? '#EF9F27' : colors.danger

  const age = profile?.userBirthYear ? new Date().getFullYear() - parseInt(profile.userBirthYear) : null
  const baziInfo = profile?.userBirthYear ? getBaziFromYear(parseInt(profile.userBirthYear)) : null
  const dailyFortune = baziInfo && record?.date ? getDailyFortune(baziInfo.element, record.date) : null
  const bmi = profile?.userHeight && profile?.userWeight
    ? (parseInt(profile.userWeight) / Math.pow(parseInt(profile.userHeight) / 100, 2)).toFixed(1)
    : null
  const bmiNum = bmi ? parseFloat(bmi) : null
  const bmiStatus = bmiNum ? (bmiNum < 18.5 ? '偏輕' : bmiNum < 24 ? '正常' : bmiNum < 27 ? '過重' : '肥胖') : '未填寫'
  const bmiColor = bmiNum ? (bmiNum < 18.5 ? '#EF9F27' : bmiNum < 24 ? colors.success : '#EF9F27') : colors.gray400
  const profileComplete = !!(profile?.userBirthYear && profile?.userHeight && profile?.userWeight)

  const riskFactors: string[] = []
  if (profile?.userVaricocele === 'true') riskFactors.push('精索靜脈曲張病史')
  if (profile?.userTesticularHistory === 'true') riskFactors.push('隱睪症／睪丸手術病史')
  if (profile?.userEndocrineDisease === 'true') riskFactors.push('內分泌相關疾病')
  if (profile?.userSmoke === 'true') riskFactors.push(`吸菸${profile?.userSmokeYears ? `（約 ${profile.userSmokeYears} 年）` : ''}`)
  if (profile?.userOccupationType === 'highHeat') riskFactors.push('高溫作業環境')

  const currentAbstinence = survey?.abstinenceDays
  const comparableRecords = currentAbstinence != null
    ? allRecords.filter(r => {
        const d = r.preTestSurvey?.abstinenceDays
        return d != null && Math.abs(d - currentAbstinence) <= 2
      })
    : []
  const trend = comparableRecords.length >= 2
    ? parseFloat(comparableRecords[0].tc) > parseFloat(comparableRecords[1].tc) ? '上升'
      : parseFloat(comparableRecords[0].tc) < parseFloat(comparableRecords[1].tc) ? '下降' : '穩定'
    : '資料不足'
  const trendColor = trend === '上升' ? colors.success : trend === '下降' ? colors.danger : '#EF9F27'
  const avgTC = comparableRecords.length > 0 ? avg(comparableRecords.map(r => parseFloat(r.tc))) : 0

  const qualityFlags: string[] = []
  if (currentAbstinence != null && (currentAbstinence < 2 || currentAbstinence > 7)) {
    qualityFlags.push(`本次禁慾 ${currentAbstinence} 天，超出建議的 2–7 天範圍，數值可能受此影響`)
  }
  if (survey?.sampleComplete === false) qualityFlags.push('本次檢體採集不完整，結果僅供參考')
  if (survey?.usedLubricant === true) qualityFlags.push('本次採樣使用了潤滑劑，可能影響訊號準確度')
  if (survey?.hadFever === true) qualityFlags.push('近 2 週曾發燒，可能暫時影響精子生成')
  if (survey?.newMedication === true) qualityFlags.push('近 3 個月有新增或調整用藥')

  const unfavorable: string[] = []
  if (survey) {
    if (survey.sleepHours === 'lt5' || survey.sleepHours === '5to6') unfavorable.push('睡眠不足')
    if (survey.stressLevel === 'high' || survey.stressLevel === 'veryHigh') unfavorable.push('壓力偏高')
    if (survey.heatExposure === 'often' || survey.heatExposure === 'almostDaily') unfavorable.push('高溫暴露頻繁')
    if (survey.heavyDrinking) unfavorable.push('近48小時大量飲酒')
    if (survey.hadFever) unfavorable.push('近期發燒')
    if (currentAbstinence != null && (currentAbstinence < 2 || currentAbstinence > 7)) unfavorable.push('禁慾天數超出建議範圍')
  }
  const hasCompoundRisk = unfavorable.length >= 2

  const scoreItems = survey ? [
    {
      label: '睡眠', max: 25,
      score: survey.sleepHours === '7to8' || survey.sleepHours === 'gt9' ? 25
        : survey.sleepHours === '5to6' ? 14 : survey.sleepHours === 'lt5' ? 5 : 12,
      detail: sleepLabels[survey.sleepHours] || '未填寫',
    },
    {
      label: '壓力', max: 25,
      score: survey.stressLevel === 'low' ? 25 : survey.stressLevel === 'moderate' ? 16
        : survey.stressLevel === 'high' ? 8 : survey.stressLevel === 'veryHigh' ? 3 : 12,
      detail: stressLabels[survey.stressLevel] || '未填寫',
    },
    {
      label: '高溫暴露', max: 25,
      score: survey.heatExposure === 'never' ? 25 : survey.heatExposure === 'occasional' ? 16
        : survey.heatExposure === 'often' ? 8 : survey.heatExposure === 'almostDaily' ? 3 : 12,
      detail: heatLabels[survey.heatExposure] || '未填寫',
    },
    {
      label: '飲酒', max: 25,
      score: survey.heavyDrinking ? 5 : 25,
      detail: survey.heavyDrinking ? '近48小時有大量飲酒' : '近48小時無大量飲酒',
    },
  ] : []
  const score = scoreItems.length > 0 ? scoreItems.reduce((s, i) => s + i.score, 0) : null

  function getScoreColor(s: number) {
    if (s >= 70) return colors.success
    if (s >= 40) return '#EF9F27'
    return colors.danger
  }

  const insights = [
    correlationInsight(allRecords,
      s => (s.sleepHours === '7to8' || s.sleepHours === 'gt9') ? 'good' : (s.sleepHours === 'lt5' || s.sleepHours === '5to6') ? 'bad' : null,
      '睡眠', '睡眠充足（7小時以上）', '睡眠不足（少於7小時）'),
    correlationInsight(allRecords,
      s => (s.stressLevel === 'low' || s.stressLevel === 'moderate') ? 'good' : (s.stressLevel === 'high' || s.stressLevel === 'veryHigh') ? 'bad' : null,
      '壓力', '壓力較低', '壓力較高'),
    correlationInsight(allRecords,
      s => (s.heatExposure === 'never' || s.heatExposure === 'occasional') ? 'good' : (s.heatExposure === 'often' || s.heatExposure === 'almostDaily') ? 'bad' : null,
      '高溫暴露', '高溫暴露較少', '高溫暴露頻繁'),
    correlationInsight(allRecords,
      s => s.heavyDrinking === false ? 'good' : s.heavyDrinking === true ? 'bad' : null,
      '飲酒', '未大量飲酒', '有大量飲酒'),
  ].filter((x): x is NonNullable<typeof x> => x !== null)

  const surveyedRecordsCount = allRecords.filter(r => r.preTestSurvey).length

  const factors = survey ? [
    { label: '睡眠', value: sleepLabels[survey.sleepHours] || '未填寫', good: survey.sleepHours === '7to8' || survey.sleepHours === 'gt9' },
    { label: '壓力', value: stressLabels[survey.stressLevel] || '未填寫', good: survey.stressLevel === 'low' },
    { label: '高溫暴露', value: heatLabels[survey.heatExposure] || '未填寫', good: survey.heatExposure === 'never' || survey.heatExposure === 'occasional' },
    { label: '飲酒', value: survey.heavyDrinking ? '近48小時有大量飲酒' : '近48小時無大量飲酒', good: !survey.heavyDrinking },
  ] : []

  const actionList = survey ? [
    !(survey.sleepHours === '7to8' || survey.sleepHours === 'gt9') && { title: '固定就寢時間，目標 7–8 小時', text: '從今晚起設定固定就寢時間，睡前 30 分鐘避免使用螢幕。' },
    survey.stressLevel !== 'low' && { title: '每天安排 10 分鐘放鬆時間', text: '嘗試冥想、深呼吸或散步，幫助調節壓力荷爾蒙。' },
    (survey.heatExposure === 'often' || survey.heatExposure === 'almostDaily') && { title: '減少高溫暴露頻率', text: '減少三溫暖、熱水澡或久坐時間，每小時起身活動。' },
  ].filter(Boolean) as { title: string, text: string }[] : []

  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>AI 趨勢解讀</Text>
        <View style={styles.proBadge}>
          <Text style={styles.proBadgeText}>Pro</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.darkCard}>
          <Text style={styles.darkLabel}>{record?.date} · 本次檢測摘要</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>T/C 比值</Text>
            <Text style={[styles.summaryValue, { color: statusColor }]}>{record?.tc}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>狀態</Text>
            <Text style={[styles.summaryValue, { color: statusColor }]}>{status}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>本次禁慾天數</Text>
            <Text style={styles.summaryValue}>{currentAbstinence != null ? `${currentAbstinence} 天` : '未記錄'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>同禁慾天數(±2天)歷史平均</Text>
            <Text style={[styles.summaryValue, { color: avgTC >= 0.85 ? colors.success : avgTC >= 0.5 ? '#EF9F27' : colors.danger }]}>
              {avgTC > 0 ? avgTC.toFixed(2) : '—'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>趨勢</Text>
            <Text style={[styles.summaryValue, { color: trendColor }]}>{trend}</Text>
          </View>
        </View>

        {qualityFlags.length > 0 && (
          <View style={styles.warnCard}>
            <Text style={styles.warnTitle}>本次採樣可能影響判讀準確度</Text>
            {qualityFlags.map((f, i) => <Text key={i} style={styles.warnText}>• {f}</Text>)}
          </View>
        )}

        {hasCompoundRisk && (
          <View style={styles.compoundCard}>
            <Text style={styles.compoundTitle}>多重不利因素同時發生</Text>
            <Text style={styles.compoundSub}>本次同時記錄到 {unfavorable.length} 項不利因素，可能有加乘影響：</Text>
            <View style={styles.compoundTags}>
              {unfavorable.map((f, i) => (
                <View key={i} style={styles.compoundTag}>
                  <Text style={styles.compoundTagText}>{f}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.compoundHint}>建議優先從最容易改善的一項開始調整，而不是同時處理所有面向。</Text>
          </View>
        )}

        <View style={styles.adviceCard}>
          <Text style={styles.adviceTitle}>本次生活習慣評分</Text>
          {score != null ? (
            <>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>總分</Text>
                <View style={styles.scoreBar}>
                  <View style={[styles.scoreBarFill, { width: `${score}%`, backgroundColor: getScoreColor(score) }]} />
                </View>
                <Text style={[styles.scoreValue, { color: getScoreColor(score) }]}>{score} / 100</Text>
              </View>

              <View style={styles.breakdownList}>
                {scoreItems.map((item, i) => (
                  <View key={i} style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>{item.label}（{item.detail}）</Text>
                    <View style={styles.breakdownBarBg}>
                      <View style={[styles.breakdownBarFill, { width: `${(item.score / item.max) * 100}%`, backgroundColor: getScoreColor((item.score / item.max) * 100) }]} />
                    </View>
                    <Text style={styles.breakdownScore}>{item.score}/{item.max}</Text>
                  </View>
                ))}
              </View>

              <Text style={[styles.adviceText, { marginTop: 10 }]}>
                {trend !== '資料不足'
                  ? `在禁慾天數相近的紀錄中，您的 T/C 比值趨勢為「${trend}」。${trend === '下降' ? '建議關注生活習慣變化。' : trend === '上升' ? '持續保持良好生活習慣！' : '數值穩定，繼續維持目前狀態。'}`
                  : '目前尚無禁慾天數相近的歷史紀錄可比較，多次檢測後可看到趨勢分析。'}
              </Text>
            </>
          ) : (
            <Text style={styles.adviceText}>本次無問卷紀錄，無法產生生活習慣評分。</Text>
          )}
        </View>


        <View style={styles.adviceCard}>
          <Text style={styles.adviceTitle}>個人健康綜合評估</Text>
          {profileComplete ? (
            <>
              <View style={styles.profileRow}>
                <View style={styles.profileItem}>
                  <Text style={styles.profileLabel}>年齡</Text>
                  <Text style={styles.profileValue}>{age} 歲</Text>
                </View>
                <View style={styles.profileItem}>
                  <Text style={styles.profileLabel}>BMI</Text>
                  <Text style={styles.profileValue}>{bmi}</Text>
                  <Text style={[styles.profileHint, { color: bmiColor }]}>{bmiStatus}</Text>
                </View>
                <View style={styles.profileItem}>
                  <Text style={styles.profileLabel}>職業型態</Text>
                  <Text style={styles.profileValue}>{occupationLabels[profile?.userOccupationType] || '未填寫'}</Text>
                </View>
              </View>
              {riskFactors.length > 0 && (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.riskTitle}>已知風險因子</Text>
                  {riskFactors.map((f, i) => <Text key={i} style={styles.riskText}>• {f}</Text>)}
                </>
              )}
              {baziInfo && (
              <View style={styles.baziCard}>
                <Text style={styles.baziLabel}>命理小彩蛋</Text>
                <Text style={[styles.baziValue, { color: elementColors[baziInfo.element] }]}>
                  {baziInfo.ganzhi}年・{baziInfo.nayin}
                </Text>
                <View style={styles.baziDivider} />
                <Text style={styles.baziReadingLabel}>性格特質</Text>
                <Text style={styles.baziReadingText}>{elementReadings[baziInfo.element]?.trait}</Text>
                {dailyFortune && (
                  <>
                    <Text style={[styles.baziReadingLabel, { marginTop: 8 }]}>當日運勢</Text>
                    <Text style={styles.baziReadingText}>{dailyFortune.text}</Text>
                  </>
                )}
                <Text style={styles.baziDisclaimer}>本區塊為趣味小彩蛋，非醫學或命理專業建議，僅供參考。</Text>
              </View>
            )}
            </>
          ) : (
            <Text style={styles.adviceText}>請至「設定 → 個人資料」填寫基礎資料，以獲得更完整的綜合評估。</Text>
          )}
        </View>

        {survey && (
          <View style={styles.adviceCard}>
            <Text style={styles.adviceTitle}>各面向詳細分析</Text>
            {factors.map((item, i) => (
              <View key={i} style={styles.factorCard}>
                <View style={styles.factorHeader}>
                  <Text style={styles.factorLabel}>{item.label}</Text>
                  <View style={[styles.factorBadge, { backgroundColor: (item.good ? colors.success : '#EF9F27') + '20' }]}>
                    <Text style={[styles.factorBadgeText, { color: item.good ? colors.success : '#EF9F27' }]}>{item.value}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {actionList.length > 0 && (
          <View style={styles.adviceCard}>
            <Text style={styles.adviceTitle}>本週行動清單</Text>
            {actionList.map((item, i) => (
              <View key={i} style={styles.actionRow}>
                <View style={styles.actionNum}>
                  <Text style={styles.actionNumText}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionTitle}>{item.title}</Text>
                  <Text style={styles.actionText}>{item.text}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.disclaimer}>以上建議根據本次問卷與檢測結果生成，僅供生活習慣參考，不構成醫療診斷。</Text>

        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>返回報告</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  appbar: {
    height: 46, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: colors.gray200,
  },
  back: { fontSize: 30, color: colors.primary, marginRight: 6 },
  appbarTitle: { flex: 1, fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  proBadge: { backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  proBadgeText: { fontSize: typography.sizes.sm, color: colors.primary, fontWeight: typography.weights.medium },
  scroll: { flex: 1, padding: 18 },
  darkCard: { backgroundColor: colors.primaryLight, borderRadius: 12, padding: 14, marginBottom: 14 },
  darkLabel: { fontSize: typography.sizes.sm, color: colors.primary, marginBottom: 12, fontWeight: typography.weights.medium },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryLabel: { fontSize: typography.sizes.sm, color: '#0d7a8f' },
  summaryValue: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.gray900 },  
  warnCard: { backgroundColor: '#FFF4E0', borderRadius: 10, padding: 12, marginBottom: 14 },
  warnTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: '#B8720A', marginBottom: 6 },
  warnText: { fontSize: typography.sizes.sm, color: '#8A5A08', lineHeight: 18 },
  compoundCard: { backgroundColor: '#FDEEEE', borderRadius: 10, padding: 12, marginBottom: 14 },
  compoundTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.danger, marginBottom: 4 },
  compoundSub: { fontSize: typography.sizes.sm, color: colors.gray500, marginBottom: 8, lineHeight: 18 },
  compoundTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  compoundTag: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.danger, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  compoundTagText: { fontSize: typography.sizes.sm, color: colors.danger },
  compoundHint: { fontSize: typography.sizes.sm, color: colors.gray500, lineHeight: 18 },
  adviceCard: { borderWidth: 0.5, borderColor: colors.gray200, borderRadius: 10, padding: 12, marginBottom: 14 },
  adviceTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900, marginBottom: 10 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  scoreLabel: { fontSize: typography.sizes.sm, color: colors.gray400 },
  scoreBar: { flex: 1, height: 4, backgroundColor: colors.gray200, borderRadius: 2, overflow: 'hidden' },
  scoreBarFill: { height: '100%', borderRadius: 2 },
  scoreValue: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium },
  breakdownList: { gap: 8 },
  breakdownRow: { gap: 3 },
  breakdownLabel: { fontSize: typography.sizes.sm, color: colors.gray500 },
  breakdownBarBg: { height: 5, backgroundColor: colors.gray200, borderRadius: 3, overflow: 'hidden' },
  breakdownBarFill: { height: '100%', borderRadius: 3 },
  breakdownScore: { fontSize: 10, color: colors.gray400, textAlign: 'right' },
  adviceText: { fontSize: typography.sizes.sm, color: colors.gray500, lineHeight: 18 },
  insightRow: { marginBottom: 10, paddingBottom: 10, borderBottomWidth: 0.5, borderBottomColor: colors.gray100 },
  insightLabel: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.gray900, marginBottom: 3 },
  insightText: { fontSize: typography.sizes.sm, color: colors.gray500, lineHeight: 18 },
  insightCaveat: { fontSize: 10, color: colors.gray400, lineHeight: 15, marginTop: 4 },
  factorCard: { backgroundColor: colors.gray100, borderRadius: 8, padding: 10, marginBottom: 8 },
  factorHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  factorLabel: { flex: 1, fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.gray900 },
  factorBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 3 },
  factorBadgeText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium },
  actionRow: { flexDirection: 'row', gap: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: colors.gray100 },
  actionNum: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.successLight, borderWidth: 1, borderColor: colors.success,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
  },
  actionNumText: { fontSize: 9, fontWeight: typography.weights.medium, color: colors.success },
  actionTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.gray900, marginBottom: 2 },
  actionText: { fontSize: typography.sizes.sm, color: colors.gray400, lineHeight: 16 },
  disclaimer: { fontSize: typography.sizes.sm, color: colors.gray400, textAlign: 'center', marginBottom: 12, lineHeight: 16 },
  backBtn: {
    height: 36, borderRadius: 9, backgroundColor: colors.gray100,
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { fontSize: typography.sizes.sm, color: colors.gray500 },
  profileRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  profileItem: { alignItems: 'center', gap: 4 },
  profileLabel: { fontSize: typography.sizes.sm, color: colors.gray400 },
  profileValue: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  profileHint: { fontSize: typography.sizes.sm },
  divider: { height: 0.5, backgroundColor: colors.gray200, marginVertical: 8 },
  riskTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.gray500, marginBottom: 4 },
  riskText: { fontSize: typography.sizes.sm, color: colors.danger, lineHeight: 18 },
  baziCard: {
    backgroundColor: colors.gray100,
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    alignItems: 'center',
  },
  baziLabel: { fontSize: typography.sizes.sm, color: colors.gray400, marginBottom: 4 },
  baziValue: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium },
  baziDivider: { height: 0.5, backgroundColor: colors.gray200, width: '100%', marginVertical: 8 },
  baziReadingLabel: { fontSize: typography.sizes.sm, color: colors.gray400 },
  baziReadingText: { fontSize: typography.sizes.sm, color: colors.gray500, textAlign: 'center', lineHeight: 18 },
  baziDisclaimer: { fontSize: 10, color: colors.gray400, textAlign: 'center', marginTop: 6, lineHeight: 15 },
})