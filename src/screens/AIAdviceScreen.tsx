import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { colors, typography } from '../theme'
import { Ionicons } from '@expo/vector-icons'
import type { ComponentProps } from 'react'

type IoniconName = ComponentProps<typeof Ionicons>['name']
import { getRecords, TestRecord } from '../storage'
import { getBaziFromYear, elementColors, elementReadings, getDailyFortune, luckyColorHex } from '../utils/bazi'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { getZodiacSign, zodiacColors, zodiacReadings } from '../utils/zodiac'

// ────────────────────────────────────────────────────────────
// 注意：以下顏色需加入 theme.ts 的 colors 物件，本檔案才能正常引用：
//
//   easterEgg: '#B0559A',
//   easterEggBorder: '#D4A5D8',
//
// 其餘用到的顏色（primary/primaryLight/success/successLight/
// warning/warningLight/danger/gray100~500/gray900/white/background）
// 皆已存在於原本的 colors 物件中。
// ────────────────────────────────────────────────────────────

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

// 信度等級：樣本數過少的洞察不該用跟高信度洞察一樣的呈現方式
type Confidence = 'low' | 'medium' | 'high'

function getConfidence(n: number): Confidence {
  if (n >= 16) return 'high'
  if (n >= 8) return 'medium'
  return 'low'
}

const confidenceLabel: Record<Confidence, string> = {
  low: '信度偏低',
  medium: '信度中等',
  high: '信度較高',
}

// 信度轉換成呈現用的進度比例（純視覺提示，非統計檢定力）
const confidenceBarPct: Record<Confidence, number> = {
  low: 30,
  medium: 65,
  high: 100,
}

interface CorrelationInsight {
  label: string
  goodDesc: string
  badDesc: string
  goodAvg: number
  badAvg: number
  diffPct: number
  goodCount: number
  badCount: number
  confidence: Confidence
}

function correlationInsight(
  records: TestRecord[],
  getGroup: (s: NonNullable<TestRecord['preTestSurvey']>) => 'good' | 'bad' | null,
  label: string,
  goodDesc: string,
  badDesc: string
): CorrelationInsight | null {
  const good: number[] = []
  const bad: number[] = []
  records.forEach(r => {
    if (!r.preTestSurvey) return
    const g = getGroup(r.preTestSurvey)
    if (g === 'good') good.push(parseFloat(r.tc))
    else if (g === 'bad') bad.push(parseFloat(r.tc))
  })

  // 樣本數低於這個絕對門檻，統計上太不穩定，直接不產生洞察
  // （原本的門檻是各組 2 筆，容易呈現出看似篤定、實則巧合的百分比）
  if (good.length < 3 || bad.length < 3) return null

  const goodAvg = avg(good)
  const badAvg = avg(bad)
  if (badAvg === 0) return null
  const diffPct = Math.round(((goodAvg - badAvg) / badAvg) * 100)
  if (Math.abs(diffPct) < 10) return null

  return {
    label, goodDesc, badDesc, goodAvg, badAvg, diffPct,
    goodCount: good.length, badCount: bad.length,
    confidence: getConfidence(good.length + bad.length),
  }
}

// 依問卷結果與個人健康資訊，收集所有符合的飲食建議面向，全部符合的都會顯示
// 若都沒有特別不利因素，回傳一條通用的均衡飲食建議
function getDietTips(
  survey: NonNullable<TestRecord['preTestSurvey']>,
  bmiNum: number | null,
  isSmoker: boolean,
  isTryingToConceive: boolean
) {
  const tips: { title: string, text: string, icon: IoniconName }[] = []

  if (survey.heavyDrinking) {
    tips.push({
      icon: 'wine-outline',
      title: '減少酒精攝取，補充保肝營養素',
      text: '過量飲酒會影響精子品質與肝臟代謝，建議減少飲酒頻率，並多攝取十字花科蔬菜（花椰菜、高麗菜）與富含維生素B群的食物，協助肝臟修復。',
    })
  }
  if (survey.heatExposure === 'often' || survey.heatExposure === 'almostDaily') {
    tips.push({
      icon: 'sunny-outline',
      title: '補充抗氧化營養素，減緩高溫氧化壓力',
      text: '長期高溫暴露容易增加精子氧化壓力，建議多攝取莓果、堅果、深色蔬菜等富含維生素C、E與硒的食物，有助於保護精子DNA。',
    })
  }
  if (survey.stressLevel === 'high' || survey.stressLevel === 'veryHigh') {
    tips.push({
      icon: 'leaf-outline',
      title: '補充維生素B群與鎂，協助紓緩壓力',
      text: '長期壓力可能影響荷爾蒙平衡，建議多攝取全穀類、堅果、深綠色蔬菜，這些食物富含維生素B群與鎂，有助神經系統穩定。',
    })
  }
  if (survey.sleepHours === 'lt5' || survey.sleepHours === '5to6') {
    tips.push({
      icon: 'moon-outline',
      title: '補充助眠營養素，改善睡眠品質',
      text: '睡眠不足可能影響荷爾蒙分泌，建議睡前避免咖啡因與重口味飲食，可適量攝取富含色胺酸的食物（如香蕉、堅果、牛奶），有助放鬆入眠。',
    })
  }
  if (bmiNum != null && bmiNum >= 27) {
    tips.push({
      icon: 'body-outline',
      title: '體重管理有助改善精子品質',
      text: 'BMI 過高與精子濃度、活動力下降有關聯，建議透過均衡飲食與規律運動逐步調整體重，優先減少精製糖與油炸食物攝取。',
    })
  }
  if (bmiNum != null && bmiNum < 18.5) {
    tips.push({
      icon: 'restaurant-outline',
      title: '增加優質蛋白質與熱量攝取',
      text: '體重過輕可能反映營養攝取不足，建議增加優質蛋白質（雞蛋、魚肉、豆類）與足夠熱量攝取，維持身體正常代謝與荷爾蒙分泌。',
    })
  }
  if (isSmoker) {
    tips.push({
      icon: 'shield-outline',
      title: '補充抗氧化營養素，緩解吸菸造成的氧化壓力',
      text: '吸菸會增加體內氧化壓力，建議多攝取富含維生素C、E的蔬果（芭樂、奇異果、堅果），有助減少對精子DNA的潛在影響；長期而言仍建議諮詢專業戒菸資源。',
    })
  }
  if (isTryingToConceive) {
    tips.push({
      icon: 'heart-outline',
      title: '加強備孕相關營養素攝取',
      text: '若正在積極備孕，建議額外留意鋅（牡蠣、南瓜籽）與葉酸（深綠色蔬菜、豆類）的攝取，這兩項是生殖健康領域較常被提及的營養素，可與伴侶一起調整飲食習慣。',
    })
  }

  if (tips.length === 0) {
    tips.push({
      icon: 'nutrition-outline',
      title: '維持均衡飲食，補充生殖健康營養素',
      text: '目前生活習慣狀況良好，建議持續維持均衡飲食，適量攝取鋅（牡蠣、瘦肉）、Omega-3（深海魚類）與充足水分，有助維持精子品質穩定。',
    })
  }

  return tips
}

export default function AIAdviceScreen({ navigation, route }: any) {
  const record: TestRecord = route?.params?.record
  const survey = record?.preTestSurvey

  const [allRecords, setAllRecords] = useState<TestRecord[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [profileError, setProfileError] = useState(false)

  useEffect(() => {
    getRecords().then(setAllRecords).catch(() => {})
    ;(async () => {
      try {
        const user = auth.currentUser
        if (!user) {
          setLoadingProfile(false)
          return
        }
        const snap = await getDoc(doc(db, 'users', user.uid))
        if (snap.exists()) {
          const data: any = snap.data()
          setProfile({
            userBirthYear: data.birthYear || null,
            userBirthMonth: data.birthMonth || null,
            userBirthDay: data.birthDay || null,
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
      } catch (e) {
        setProfileError(true)
      } finally {
        setLoadingProfile(false)
      }
    })()
  }, [])

  const tcVal = parseFloat(record?.tc || '0')
  const status = record?.status || '—'
  const statusColor = status === '正常' ? colors.success : status === '邊緣' ? colors.warning : colors.danger
  const statusBg = status === '正常' ? colors.successLight : status === '邊緣' ? colors.warningLight : colors.dangerLight

  const age = profile?.userBirthYear
    ? (() => {
        const today = new Date()
        let a = today.getFullYear() - parseInt(profile.userBirthYear)
        const bm = profile.userBirthMonth ? parseInt(profile.userBirthMonth) : 1
        const bd = profile.userBirthDay ? parseInt(profile.userBirthDay) : 1
        if (today.getMonth() + 1 < bm || (today.getMonth() + 1 === bm && today.getDate() < bd)) a -= 1
        return a
      })()
    : null
  const baziInfo = profile?.userBirthYear ? getBaziFromYear(parseInt(profile.userBirthYear)) : null
  const zodiacInfo = (profile?.userBirthMonth && profile?.userBirthDay)
    ? getZodiacSign(parseInt(profile.userBirthMonth), parseInt(profile.userBirthDay))
    : null
  const dailyFortune = baziInfo && record?.date ? getDailyFortune(baziInfo.element, record.date) : null
  const bmi = profile?.userHeight && profile?.userWeight
    ? (parseInt(profile.userWeight) / Math.pow(parseInt(profile.userHeight) / 100, 2)).toFixed(1)
    : null
  const bmiNum = bmi ? parseFloat(bmi) : null
  const bmiStatus = bmiNum ? (bmiNum < 18.5 ? '偏輕' : bmiNum < 24 ? '正常' : bmiNum < 27 ? '過重' : '肥胖') : '未填寫'
  const bmiColor = bmiNum ? (bmiNum < 18.5 ? colors.warning : bmiNum < 24 ? colors.success : colors.warning) : colors.gray400
  const profileComplete = !!(profile?.userBirthYear && profile?.userHeight && profile?.userWeight)

  const riskFactors: string[] = []
  if (profile?.userVaricocele === 'true') riskFactors.push('精索靜脈曲張病史')
  if (profile?.userTesticularHistory === 'true') riskFactors.push('隱睪症／睪丸手術病史')
  if (profile?.userEndocrineDisease === 'true') riskFactors.push('內分泌相關疾病')
  if (profile?.userSmoke === 'true') riskFactors.push(`吸菸${profile?.userSmokeYears ? `（約 ${profile.userSmokeYears} 年）` : ''}`)
  if (profile?.userOccupationType === 'highHeat') riskFactors.push('高溫作業環境')

  const isSmoker = profile?.userSmoke === 'true'
  const isTryingToConceive = profile?.userTryingToConceive === 'true'

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
  const trendColor = trend === '上升' ? colors.success : trend === '下降' ? colors.danger : colors.warning
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
    if (s >= 40) return colors.warning
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
  ].filter((x): x is CorrelationInsight => x !== null)

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

  const dietTips = survey ? getDietTips(survey, bmiNum, isSmoker, isTryingToConceive) : []

  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="返回">
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>AI 趨勢解讀</Text>
        <View style={styles.proBadge}>
          <Text style={styles.proBadgeText}>Pro</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* 摘要卡：方案 A — 大數字聚焦，次要資訊降階至分隔線下方 */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryDate}>{record?.date} · T/C 比值</Text>
          <View style={styles.summaryMainRow}>
            <Text style={[styles.summaryBigNumber, { color: statusColor }]}>{record?.tc}</Text>
            <View style={[styles.summaryStatusPill, { backgroundColor: statusBg }]}>
              <Text style={[styles.summaryStatusText, { color: statusColor }]}>
                {status}{trend !== '資料不足' ? ` · ${trend}` : ''}
              </Text>
            </View>
          </View>
          <View style={styles.summarySubRow}>
            <View style={styles.summarySubItem}>
              <Text style={styles.summarySubLabel}>本次禁慾天數</Text>
              <Text style={styles.summarySubValue}>{currentAbstinence != null ? `${currentAbstinence} 天` : '未記錄'}</Text>
            </View>
            <View style={styles.summarySubItem}>
              <Text style={styles.summarySubLabel}>同天數歷史平均</Text>
              <Text style={styles.summarySubValue}>{avgTC > 0 ? avgTC.toFixed(2) : '—'}</Text>
            </View>
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
          {loadingProfile ? (
            <Text style={styles.adviceText}>資料讀取中…</Text>
          ) : profileError ? (
            <Text style={styles.adviceText}>個人資料讀取失敗，請稍後再試。</Text>
          ) : profileComplete ? (
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
                  <View style={[styles.factorBadge, { backgroundColor: item.good ? colors.successLight : colors.warningLight }]}>
                    <Text style={[styles.factorBadgeText, { color: item.good ? colors.success : colors.warning }]}>{item.value}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {insights.length > 0 && (
          <View style={styles.adviceCard}>
            <Text style={styles.adviceTitle}>與生活習慣的關聯</Text>
            {insights.map((item, i) => (
              <View key={i} style={[styles.insightRow, i === insights.length - 1 && { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 }]}>
                <Text style={styles.insightLabel}>與{item.label}的關聯</Text>
                <View style={styles.insightNumRow}>
                  <Text style={[styles.insightPct, { color: item.diffPct > 0 ? colors.success : colors.danger }]}>
                    {item.diffPct > 0 ? '+' : ''}{item.diffPct}%
                  </Text>
                  <Text style={styles.insightDesc}>{item.diffPct > 0 ? item.goodDesc : item.badDesc}時數值較高</Text>
                </View>
                <View style={styles.confidenceRow}>
                  <View style={styles.confidenceBarBg}>
                    <View style={[styles.confidenceBarFill, { width: `${confidenceBarPct[item.confidence]}%` }]} />
                  </View>
                  <Text style={styles.confidenceText}>
                    {item.goodCount + item.badCount} 筆紀錄 · {confidenceLabel[item.confidence]}
                  </Text>
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

        {dietTips.length > 0 && (
          <View style={styles.adviceCard}>
            <Text style={styles.adviceTitle}>飲食建議</Text>
            {dietTips.map((item, i) => (
              <View key={i} style={[styles.actionRow, i === dietTips.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={styles.dietIconWrap}>
                  <Ionicons name={item.icon} size={16} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionTitle}>{item.title}</Text>
                  <Text style={styles.dietText}>{item.text}</Text>
                </View>
              </View>
            ))}
            <Text style={styles.dietDisclaimer}>本建議依本次問卷結果篩選對應面向，屬一般性飲食衛教觀念，如有特殊飲食或健康需求，請諮詢營養師或醫師。</Text>
          </View>
        )}

        {baziInfo && (
          <>
            <View style={styles.eggDivider}>
              <View style={styles.eggDividerLine} />
              <Text style={styles.eggDividerText}>以下為趣味內容 · 非醫學建議</Text>
              <View style={styles.eggDividerLine} />
            </View>

            <View style={styles.baziCard}>
              <View style={styles.eggHeaderRow}>
                <Ionicons name="sparkles-outline" size={15} color={colors.easterEgg} />
                <Text style={styles.eggHeaderText}>小彩蛋</Text>
              </View>
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
                  <Text style={[styles.baziReadingLabel, { marginTop: 8 }]}>今日宜忌</Text>
                  <Text style={styles.baziReadingText}>宜：{dailyFortune.todayActivity}　忌：{dailyFortune.todayCaution}</Text>
                  <Text style={[styles.baziReadingLabel, { marginTop: 8 }]}>今日幸運色</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 2 }}>
                    <View style={{
                      width: 16, height: 16, borderRadius: 8,
                      backgroundColor: luckyColorHex[dailyFortune.todayLuckyColor] || colors.gray300,
                      borderWidth: dailyFortune.todayLuckyColor === '白色' ? 1 : 0,
                      borderColor: colors.gray300,
                    }} />
                    <Text style={styles.baziReadingText}>{dailyFortune.todayLuckyColor}</Text>
                  </View>
                </>
              )}

              {zodiacInfo && (
                <>
                  <View style={styles.baziDivider} />
                  <Text style={[styles.baziValue, { color: zodiacColors[zodiacInfo.name] }]}>
                    {zodiacInfo.name}・{zodiacInfo.element}
                  </Text>
                  <Text style={[styles.baziReadingLabel, { marginTop: 8 }]}>星座特質</Text>
                  <Text style={styles.baziReadingText}>{zodiacReadings[zodiacInfo.name]?.trait}</Text>
                  <Text style={[styles.baziReadingLabel, { marginTop: 8 }]}>近期運勢</Text>
                  <Text style={styles.baziReadingText}>{zodiacReadings[zodiacInfo.name]?.fortune}</Text>
                </>
              )}

              <Text style={styles.baziDisclaimer}>本區塊為趣味小彩蛋，非醫學或命理專業建議，僅供參考。</Text>
            </View>
          </>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 10, paddingHorizontal: 18, paddingBottom: 10,
  },
  back: { fontSize: 40, color: colors.primary, marginRight: 6, paddingBottom: 4 },
  appbarTitle: { flex: 1, fontSize: 22, fontWeight: '600', color: colors.gray900 },
  proBadge: { backgroundColor: colors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  proBadgeText: { fontSize: typography.sizes.sm, color: colors.primary, fontWeight: typography.weights.medium },
  scroll: { flex: 1, paddingHorizontal: 18 },

  summaryCard: { backgroundColor: colors.white, borderWidth: 0.5, borderColor: colors.gray200, borderRadius: 18, padding: 16, marginBottom: 14 },
  summaryDate: { fontSize: typography.sizes.sm, color: colors.gray400, marginBottom: 2 },
  summaryMainRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 12 },
  summaryBigNumber: { fontSize: 36, fontWeight: '500' },
  summaryStatusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  summaryStatusText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium },
  summarySubRow: { flexDirection: 'row', gap: 20, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: colors.gray100 },
  summarySubItem: { gap: 2 },
  summarySubLabel: { fontSize: 11, color: colors.gray400 },
  summarySubValue: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.gray900 },

  warnCard: { backgroundColor: colors.warningLight, borderRadius: 16, padding: 14, marginBottom: 14 },
  warnTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.warning, marginBottom: 6 },
  warnText: { fontSize: typography.sizes.sm, color: colors.warning, lineHeight: 18 },
  compoundCard: { backgroundColor: colors.dangerLight, borderRadius: 16, padding: 14, marginBottom: 14 },
  compoundTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.danger, marginBottom: 4 },
  compoundSub: { fontSize: typography.sizes.sm, color: colors.gray500, marginBottom: 8, lineHeight: 18 },
  compoundTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  compoundTag: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.danger, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  compoundTagText: { fontSize: typography.sizes.sm, color: colors.danger },
  compoundHint: { fontSize: typography.sizes.sm, color: colors.gray500, lineHeight: 18 },
  adviceCard: {
    backgroundColor: colors.white, borderWidth: 0.5, borderColor: colors.gray200,
    borderRadius: 18, padding: 14, marginBottom: 14,
  },
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

  insightRow: { marginBottom: 12, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: colors.gray100 },
  insightLabel: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.gray900, marginBottom: 4 },
  insightNumRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 6 },
  insightPct: { fontSize: 20, fontWeight: '500' },
  insightDesc: { fontSize: typography.sizes.sm, color: colors.gray500 },
  confidenceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  confidenceBarBg: { flex: 1, height: 4, backgroundColor: colors.gray100, borderRadius: 2, overflow: 'hidden' },
  confidenceBarFill: { height: '100%', backgroundColor: colors.gray300, borderRadius: 2 },
  confidenceText: { fontSize: 11, color: colors.gray400, flexShrink: 0 },

  factorCard: {
    backgroundColor: colors.white, borderWidth: 0.5, borderColor: colors.gray200,
    borderRadius: 14, padding: 10, marginBottom: 8,
  },
  factorHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  factorLabel: { flex: 1, fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.gray900 },
  factorBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  factorBadgeText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium },
  actionRow: { flexDirection: 'row', gap: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: colors.gray100 },
  actionNum: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.successLight, borderWidth: 1, borderColor: colors.success,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
  },
  actionNumText: { fontSize: 9, fontWeight: typography.weights.medium, color: colors.success },
  dietIconWrap: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
  },
  actionTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900, marginBottom: 2 },
  actionText: { fontSize: typography.sizes.sm, color: colors.gray400, lineHeight: 16 },
  dietText: { fontSize: typography.sizes.sm, color: colors.gray900, lineHeight: 16 },
  dietDisclaimer: { fontSize: 12, color: colors.gray400, textAlign: 'center', marginTop: 8, lineHeight: 15 },
  disclaimer: { fontSize: typography.sizes.sm, color: colors.gray400, textAlign: 'center', marginBottom: 12, lineHeight: 16 },
  backBtn: {
    height: 40, borderRadius: 20, backgroundColor: colors.white, borderWidth: 0.5, borderColor: colors.gray200,
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { fontSize: typography.sizes.md, color: colors.gray500 },
  profileRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  profileItem: { alignItems: 'center', gap: 4 },
  profileLabel: { fontSize: typography.sizes.md, color: colors.gray400 },
  profileValue: { fontSize: typography.sizes.lg, fontWeight: typography.weights.medium, color: colors.gray900 },
  profileHint: { fontSize: typography.sizes.sm },
  divider: { height: 0.5, backgroundColor: colors.gray200, marginVertical: 8 },
  riskTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.gray500, marginBottom: 4 },
  riskText: { fontSize: typography.sizes.sm, color: colors.danger, lineHeight: 18 },

  eggDivider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14, marginTop: 2 },
  eggDividerLine: { flex: 1, height: 1, backgroundColor: colors.gray200, borderStyle: 'dashed', borderWidth: 1, borderColor: colors.gray200 },
  eggDividerText: { fontSize: 11, color: colors.gray400, flexShrink: 0 },

  baziCard: {
    backgroundColor: colors.white,
    borderWidth: 1.5, borderColor: colors.easterEggBorder, borderStyle: 'dashed',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    alignItems: 'center',
  },
  eggHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  eggHeaderText: { fontSize: typography.sizes.sm, color: colors.easterEgg, fontWeight: typography.weights.medium },
  baziValue: { fontSize: typography.sizes.lg, fontWeight: typography.weights.medium },
  baziDivider: { height: 0.5, backgroundColor: colors.gray200, width: '100%', marginVertical: 8 },
  baziReadingLabel: { fontSize: typography.sizes.md, color: colors.primary, fontWeight: typography.weights.medium },
  baziReadingText: { fontSize: typography.sizes.md, color: colors.gray900, textAlign: 'center', lineHeight: 18 },
  baziDisclaimer: { fontSize: 12, color: colors.gray500, textAlign: 'center', marginTop: 6, lineHeight: 15 },
})