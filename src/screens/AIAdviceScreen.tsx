import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { colors, typography } from '../theme'
import { Ionicons } from '@expo/vector-icons'
import type { ComponentProps } from 'react'
import { getRecords, TestRecord } from '../storage'
import { getBaziFromYear, getDailyFortune, luckyColorHex } from '../utils/bazi'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
// [新增] 孕事小語／相處小語的文字內容
import { getCoupleReading, getWeeklyLuckyDay, getWeeklyCoupleTask, NoteSection, BirthInfo } from '../utils/coupleNotes'

type IoniconName = ComponentProps<typeof Ionicons>['name']

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

// ── [新增] 生育計畫狀態 ──
// 個人資料頁存的值：'yes'（正在備孕）/ 'planning'（1–3 年內可能）/ 'no'（目前沒有計畫）/ 'undecided'（尚未決定）
type ConceiveStatus = 'trying' | 'planning' | 'notNow'

function getConceiveStatus(raw: any): ConceiveStatus {
  if (raw === 'yes' || raw === true || raw === 'true' || raw === 'trying') return 'trying'
  if (raw === 'planning') return 'planning'
  return 'notNow' // 'no'、'undecided'、未填
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
// [修改] 第四個參數改為生育計畫狀態，依狀態給不同的備孕營養建議
function getDietTips(
  survey: NonNullable<TestRecord['preTestSurvey']>,
  bmiNum: number | null,
  isSmoker: boolean,
  conceiveStatus: ConceiveStatus
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
  // [修改] 依生育計畫狀態區分
  if (conceiveStatus === 'trying') {
    tips.push({
      icon: 'heart-outline',
      title: '備孕期間：留意鋅的攝取，並提醒伴侶補充葉酸',
      text: '鋅參與精子生成，可從牡蠣、瘦肉、南瓜籽攝取。伴侶建議在懷孕前至少 1 個月開始每天補充 400 微克葉酸，可降低胎兒神經管缺陷風險。飲食調整約需 3 個月才會反映在精子品質上。',
    })
  } else if (conceiveStatus === 'planning') {
    tips.push({
      icon: 'calendar-outline',
      title: '提早 3 個月開始調整飲食',
      text: '精子從生成到成熟約需 2.5–3 個月，現在開始均衡飲食、減少含糖飲料與加工肉品，到準備生育時就是最好的狀態。',
    })
  }

  if (tips.length === 0) {
    tips.push({
      icon: 'nutrition-outline',
      title: conceiveStatus === 'notNow' ? '維持均衡飲食，照顧整體健康' : '維持均衡飲食，補充生殖健康營養素',
      text: conceiveStatus === 'notNow'
        ? '目前生活習慣狀況良好，建議持續均衡飲食、控制含糖飲料與油炸食物，對體力、代謝與整體健康都有幫助。'
        : '目前生活習慣狀況良好，建議持續維持均衡飲食，適量攝取鋅（牡蠣、瘦肉）、Omega-3（深海魚類）與充足水分，有助維持精子品質穩定。',
    })
  }

  return tips
}

// ── [新增] 醫師觀點（規則產生，非真人醫師） ──
interface DoctorAdvice {
  summary: string
  points: { icon: IoniconName, title: string, text: string }[]
  alert: { title: string, text: string }
  fixedNotice: string | null
}

function getDoctorAdvice(params: {
  status: string
  trend: string
  survey: TestRecord['preTestSurvey'] | undefined
  isSmoker: boolean
  riskFactors: string[]
  age: number | null
  conceiveStatus: ConceiveStatus
}): DoctorAdvice {
  const { status, trend, survey, isSmoker, riskFactors, age, conceiveStatus } = params
  const clinic = conceiveStatus === 'notNow' ? '泌尿科' : '泌尿科或生殖醫學門診'

  let summary: string
  if (status === '正常') {
    summary = `本次數值在正常範圍${trend === '上升' ? '，且比之前上升，整體方向不錯' : trend === '下降' ? '，但比之前下降，建議留意近期生活作息的變化' : ''}。`
  } else if (status === '邊緣') {
    summary = '本次數值落在邊緣範圍。單次結果容易受當下狀態影響，建議在禁慾 2–7 天的條件下再測一次確認。'
  } else {
    summary = `本次數值低於參考範圍。單次結果不等於診斷，建議在禁慾 2–7 天的條件下重測；若仍偏低，請到${clinic}做完整的精液分析。`
  }

  const points: DoctorAdvice['points'] = []
  if (survey?.hadFever) {
    points.push({
      icon: 'thermometer-outline',
      title: '發燒的影響可能延後 1–3 個月才出現',
      text: '精子從生成到成熟約需 2.5–3 個月，近期發燒可能讓之後幾次的數值暫時下降，屬常見現象。建議 4–6 週後再測一次比較。',
    })
  }
  if (survey?.newMedication) {
    points.push({
      icon: 'medkit-outline',
      title: '近期有調整用藥',
      text: '部分藥物可能影響精子生成。回診時可以主動告知醫師正在追蹤這項數值，請不要自行停藥。',
    })
  }
  if (isSmoker) {
    points.push({
      icon: 'ban-outline',
      title: '戒菸是最值得優先處理的一項',
      text: '吸菸可能降低精子數量與活動力，並增加 DNA 損傷。戒菸後約 3 個月，可望在數值上看到變化。',
    })
  }
  const medicalHistory = riskFactors.filter(f => !f.startsWith('吸菸') && f !== '高溫作業環境')
  if (medicalHistory.length > 0) {
    points.push({
      icon: 'clipboard-outline',
      title: '有相關病史，建議定期追蹤',
      text: `您記錄了${medicalHistory.join('、')}，這些都可能影響精液品質，建議定期到${clinic}追蹤。`,
    })
  }
  if (conceiveStatus === 'trying') {
    points.push({
      icon: 'heart-outline',
      title: '把握易孕期',
      text: '排卵前 5 天到排卵日是易孕期，這段期間建議每 1–2 天行房一次，不需要刻意「存精」。',
    })
  } else if (conceiveStatus === 'planning') {
    points.push({
      icon: 'calendar-outline',
      title: '預留 3 個月的準備期',
      text: '生活習慣的改變約 3 個月後才會反映在精子品質上，建議在開始備孕前 3 個月就調整作息、戒菸、減少飲酒。',
    })
  } else {
    points.push({
      icon: 'hand-left-outline',
      title: '每月一次睪丸自我檢查',
      text: '洗澡時用手指輕輕觸摸兩側睪丸，留意有沒有硬塊、腫脹或疼痛。睪丸癌好發於年輕男性，早期發現治癒率很高。',
    })
  }
  if (age != null && age >= 40 && conceiveStatus !== 'notNow') {
    points.push({
      icon: 'time-outline',
      title: '年齡也是考量因素之一',
      text: '男性生育力雖然下降得較慢，但年齡增長仍可能影響精液品質，生育計畫不宜一拖再拖。',
    })
  }

  let alert: DoctorAdvice['alert']
  if (conceiveStatus === 'trying') {
    alert = {
      title: '什麼時候該就醫？',
      text: '規律行房一年仍未懷孕（女方 35 歲以上為半年），建議夫妻一起到生殖醫學門診檢查。居家試紙適合追蹤趨勢，不能取代醫院的完整精液分析。',
    }
  } else if (conceiveStatus === 'planning') {
    alert = {
      title: '開始備孕前',
      text: '可以考慮夫妻一起做孕前健康檢查。居家試紙適合追蹤趨勢，不能取代醫院的完整精液分析。',
    }
  } else {
    alert = {
      title: '什麼時候該就醫？',
      text: '若數值連續多次偏低，或自我檢查發現睪丸有硬塊、腫脹、疼痛，建議到泌尿科檢查。',
    }
  }

  // 固定顯示、不交給 AI 產生的安全提醒
  const fixedNotice = conceiveStatus === 'trying'
    ? null
    : '試紙數值偏低，不代表不會讓伴侶懷孕，不能作為避孕的依據。'

  return { summary, points, alert, fixedNotice }
}

type AdviceTab = 'doctor' | 'nutrition' | 'notes'

export default function AIAdviceScreen({ navigation, route }: any) {
  const record: TestRecord = route?.params?.record
  const survey = record?.preTestSurvey

  const [allRecords, setAllRecords] = useState<TestRecord[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [profileError, setProfileError] = useState(false)
  const [activeTab, setActiveTab] = useState<AdviceTab>('doctor') // [新增]

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
            // [新增] 出生時辰（選填）：0–23 的整點，未填為 null → 排盤時預設午時
            userBirthHour: data.birthHour != null && data.birthHour !== '' ? Number(data.birthHour) : null,
            userHeight: data.height || null,
            userWeight: data.weight || null,
            userSmoke: data.smoke ? 'true' : 'false',
            userSmokeYears: data.smokeYears || null,
            userVaricocele: data.varicocele ? 'true' : 'false',
            userTesticularHistory: data.testicularHistory ? 'true' : 'false',
            userEndocrineDisease: data.endocrineDisease ? 'true' : 'false',
            userHadSemenTest: data.hadSemenTest ? 'true' : 'false',
            userOccupationType: data.occupationType || null,
            // [修正] 原本 `data.tryingToConceive || null` 若存的是 boolean true，
            // 之後跟字串 'true' 比對永遠不成立，備孕建議從來不會出現。改為保留原值交給 getConceiveStatus 判斷
            userTryingToConceive: data.tryingToConceive ?? null,
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
  // 八字只用來算幸運色，畫面上不顯示年柱、五行（星座已移除）
  // [修正] 傳入出生月日，立春前出生的人才會算成前一年
  const baziInfo = profile?.userBirthYear
    ? getBaziFromYear(
        parseInt(profile.userBirthYear),
        profile.userBirthMonth ? parseInt(profile.userBirthMonth) : undefined,
        profile.userBirthDay ? parseInt(profile.userBirthDay) : undefined
      )
    : null
  const dailyFortune = baziInfo && record?.date ? getDailyFortune(baziInfo.element, record.date) : null

  // [新增] 孕事小語／相處小語：依生日排盤（沒填時辰用午時）；沒填生日就用帳號 uid 固定挑一種類型
  const birthKey = (profile?.userBirthYear && profile?.userBirthMonth && profile?.userBirthDay)
    ? `${profile.userBirthYear}-${profile.userBirthMonth}-${profile.userBirthDay}`
    : null
  const birthInfo: BirthInfo | null = birthKey
    ? {
        year: parseInt(profile.userBirthYear),
        month: parseInt(profile.userBirthMonth),
        day: parseInt(profile.userBirthDay),
        hour: profile.userBirthHour,
      }
    : null
  const noteSeed = birthKey || auth.currentUser?.uid || 'guest'
  const weekDate = (() => {
    const d = record?.date ? new Date(String(record.date).replace(/\//g, '-')) : new Date()
    return isNaN(d.getTime()) ? new Date() : d
  })()
  const luckyDay = getWeeklyLuckyDay(noteSeed, weekDate)

  // [修正] 身高體重改用 parseFloat，避免 72.5 kg 被截成 72
  const bmi = profile?.userHeight && profile?.userWeight
    ? (parseFloat(profile.userWeight) / Math.pow(parseFloat(profile.userHeight) / 100, 2)).toFixed(1)
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
  const conceiveStatus = getConceiveStatus(profile?.userTryingToConceive) // [修改]

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

  // [修正] 「各面向詳細分析」的好壞判斷改為直接沿用評分結果（≥ 70% 視為良好），
  // 原本高溫「偶爾」在評分條是黃色、在這裡卻是綠色，兩邊不一致
  const factors = scoreItems.map(item => ({
    label: item.label,
    value: item.detail,
    good: item.score / item.max >= 0.7,
  }))

  const actionList = survey ? [
    !(survey.sleepHours === '7to8' || survey.sleepHours === 'gt9') && { title: '固定就寢時間，目標 7–8 小時', text: '從今晚起設定固定就寢時間，睡前 30 分鐘避免使用螢幕。' },
    survey.stressLevel !== 'low' && { title: '每天安排 10 分鐘放鬆時間', text: '嘗試冥想、深呼吸或散步，幫助調節壓力荷爾蒙。' },
    (survey.heatExposure === 'often' || survey.heatExposure === 'almostDaily') && { title: '減少高溫暴露頻率', text: '減少三溫暖、熱水澡或久坐時間，每小時起身活動。' },
  ].filter(Boolean) as { title: string, text: string }[] : []

  const dietTips = survey ? getDietTips(survey, bmiNum, isSmoker, conceiveStatus) : []

  // [新增] 三方觀點
  const doctorAdvice = getDoctorAdvice({ status, trend, survey, isSmoker, riskFactors, age, conceiveStatus })

  const perspectiveTitle = conceiveStatus === 'trying' ? '備孕建議'
    : conceiveStatus === 'planning' ? '生育準備建議' : '健康建議'
  const perspectiveBanner = conceiveStatus === 'trying'
    ? '依您「正在備孕」的狀態，整理本次結果與接下來可以做的事。'
    : conceiveStatus === 'planning'
      ? '依您「1–3 年內可能」生育的狀態，整理現在就可以開始準備的事。'
      : '依本次結果，整理日常可以留意的健康重點。'
  // 第三分頁只談生育與伴侶相處：
  // 備孕／準備中看「兩人相處」＋「家庭與孕事」；目前沒有計畫看「感情裡的你」＋「兩人相處」
  const noteSections: NoteSection[] = conceiveStatus === 'notNow'
    ? ['self', 'couple']
    : ['couple', 'family']
  const noteContext = conceiveStatus === 'notNow' ? 'general' : 'ttc'
  const sectionLabel: Record<NoteSection, string> = { self: '感情裡的你', couple: '兩人相處', family: '家庭與孕事' }
  const sectionIcon: Record<NoteSection, IoniconName> = { self: 'person-outline', couple: 'people-outline', family: 'home-outline' }
  const coupleTask = getWeeklyCoupleTask(noteSeed, weekDate, noteContext)

  const tabs: { key: AdviceTab, label: string, icon: IoniconName, color: string }[] = [
    { key: 'doctor', label: '身體狀況', icon: 'pulse-outline', color: colors.primary },
    { key: 'nutrition', label: '飲食調理', icon: 'restaurant-outline', color: colors.success },
    { key: 'notes', label: conceiveStatus === 'notNow' ? '相處小語' : '孕事小語', icon: 'heart-outline', color: colors.easterEgg },
  ]

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
            {insights.map((item, i) => {
              // [修正] 原本負數時顯示「-15%・壓力較高時數值較高」，負號加上「較高」讀起來像矛盾。
              // 改為一律顯示正數，描述「哪一組平均較高多少」；結果與一般認知相反時用灰色，不用紅色
              const goodHigher = item.diffPct > 0
              const pct = Math.abs(item.diffPct)
              return (
                <View key={i} style={[styles.insightRow, i === insights.length - 1 && { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 }]}>
                  <Text style={styles.insightLabel}>與{item.label}的關聯</Text>
                  <View style={styles.insightNumRow}>
                    <Text style={[styles.insightPct, { color: goodHigher ? colors.success : colors.gray400 }]}>
                      {pct}%
                    </Text>
                    <Text style={styles.insightDesc}>
                      {goodHigher ? item.goodDesc : item.badDesc}時，數值平均高 {pct}%
                    </Text>
                  </View>
                  {!goodHigher && (
                    <Text style={styles.insightNote}>這個結果與一般研究方向不同，可能是紀錄筆數還不夠多，持續記錄後會更準確。</Text>
                  )}
                  <View style={styles.confidenceRow}>
                    <View style={styles.confidenceBarBg}>
                      <View style={[styles.confidenceBarFill, { width: `${confidenceBarPct[item.confidence]}%` }]} />
                    </View>
                    <Text style={styles.confidenceText}>
                      {item.goodCount + item.badCount} 筆紀錄 · {confidenceLabel[item.confidence]}
                    </Text>
                  </View>
                </View>
              )
            })}
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

        {/* ── [新增] 三方觀點（取代原本的「飲食建議」卡與「小彩蛋」區塊） ── */}
        {!loadingProfile && (
          <View style={styles.adviceCard}>
            <Text style={styles.adviceTitle}>{perspectiveTitle}</Text>
            <View style={styles.pvBanner}>
              <Text style={styles.pvBannerText}>{perspectiveBanner}</Text>
            </View>

            <View style={styles.tabBar}>
              {tabs.map(t => {
                const active = activeTab === t.key
                return (
                  <TouchableOpacity
                    key={t.key}
                    style={[styles.tab, active && styles.tabActive]}
                    onPress={() => setActiveTab(t.key)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                  >
                    <Ionicons name={t.icon} size={18} color={active ? t.color : colors.gray400} />
                    <Text style={[styles.tabText, active && { color: t.color }]}>{t.label}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            {/* 醫師觀點 */}
            {activeTab === 'doctor' && (
              <View>
                <Text style={styles.pvSub}>依本次檢測與問卷整理的衛教說明 · 非醫療診斷</Text>
                <View style={[styles.pvQuote, { backgroundColor: colors.primaryLight }]}>
                  <Text style={styles.pvQuoteText}>{doctorAdvice.summary}</Text>
                </View>
                {doctorAdvice.points.map((p, i) => (
                  <View key={i} style={[styles.actionRow, i === doctorAdvice.points.length - 1 && { borderBottomWidth: 0 }]}>
                    <View style={styles.dietIconWrap}>
                      <Ionicons name={p.icon} size={16} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.actionTitle}>{p.title}</Text>
                      <Text style={styles.dietText}>{p.text}</Text>
                    </View>
                  </View>
                ))}
                <View style={styles.pvAlert}>
                  <Text style={styles.pvAlertTitle}>{doctorAdvice.alert.title}</Text>
                  <Text style={styles.pvAlertText}>{doctorAdvice.alert.text}</Text>
                </View>
                {doctorAdvice.fixedNotice && (
                  <View style={styles.pvNotice}>
                    <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
                    <Text style={styles.pvNoticeText}>{doctorAdvice.fixedNotice}</Text>
                  </View>
                )}
                <Text style={styles.dietDisclaimer}>本內容為一般衛教資訊，不構成醫療診斷或處方。</Text>
              </View>
            )}

            {/* 營養師觀點（沿用原本的 getDietTips） */}
            {activeTab === 'nutrition' && (
              <View>
                <Text style={styles.pvSub}>一般飲食衛教 · 非個人化營養處方</Text>
                {dietTips.length > 0 ? dietTips.map((item, i) => (
                  <View key={i} style={[styles.actionRow, i === dietTips.length - 1 && { borderBottomWidth: 0 }]}>
                    <View style={styles.dietIconWrap}>
                      <Ionicons name={item.icon} size={16} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.actionTitle}>{item.title}</Text>
                      <Text style={styles.dietText}>{item.text}</Text>
                    </View>
                  </View>
                )) : (
                  <Text style={styles.adviceText}>本次沒有問卷紀錄，完成檢測前問卷後即可看到飲食建議。</Text>
                )}
                <Text style={styles.dietDisclaimer}>本建議依本次問卷結果篩選對應面向，屬一般性飲食衛教觀念，如有特殊飲食或健康需求，請諮詢營養師或醫師。</Text>
              </View>
            )}

            {/* 孕事小語／相處小語（只談生育與伴侶相處；不顯示年柱、五行、星座、星曜名稱） */}
            {activeTab === 'notes' && (
              <View>
                <Text style={styles.pvSub}>趣味內容 · 僅供娛樂</Text>

                {noteSections.map(section => (
                  <View key={section} style={styles.zwSection}>
                    <View style={styles.zwSectionHead}>
                      <Ionicons name={sectionIcon[section]} size={15} color={colors.easterEgg} />
                      <Text style={styles.zwSectionTitle}>{sectionLabel[section]}</Text>
                    </View>
                    <Text style={styles.zwSectionText}>{getCoupleReading(section, noteContext, birthInfo, noteSeed)}</Text>
                  </View>
                ))}

                {/* 本週相處小任務 */}
                <View style={styles.zwSection}>
                  <View style={styles.zwSectionHead}>
                    <Ionicons name="checkbox-outline" size={15} color={colors.easterEgg} />
                    <Text style={styles.zwSectionTitle}>本週相處小任務：{coupleTask.title}</Text>
                  </View>
                  <Text style={styles.zwSectionText}>{coupleTask.text}</Text>
                </View>

                {(luckyDay || dailyFortune) && (
                  <View style={styles.luckyRow}>
                    {luckyDay && (
                      <View style={styles.luckyBox}>
                        <Text style={styles.luckyLabel}>本週幸運日</Text>
                        <Text style={styles.luckyValue}>{luckyDay.day}</Text>
                        <Text style={styles.luckyHint}>{luckyDay.hint}</Text>
                      </View>
                    )}
                    {dailyFortune && (
                      <View style={styles.luckyBox}>
                        <Text style={styles.luckyLabel}>今日幸運色</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <View style={{
                            width: 16, height: 16, borderRadius: 8,
                            backgroundColor: luckyColorHex[dailyFortune.todayLuckyColor] || colors.gray300,
                            borderWidth: dailyFortune.todayLuckyColor === '白色' ? 1 : 0,
                            borderColor: colors.gray300,
                          }} />
                          <Text style={styles.luckyValue}>{dailyFortune.todayLuckyColor}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                <Text style={styles.baziDisclaimer}>
                  本區塊僅供娛樂，幸運日與受孕時機無關，也不預測是否懷孕或懷孕時間；生育相關問題請以醫師意見為準。
                </Text>
              </View>
            )}
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
  insightDesc: { fontSize: typography.sizes.sm, color: colors.gray500, flex: 1 },
  // [新增]
  insightNote: { fontSize: 11, color: colors.gray400, lineHeight: 15, marginBottom: 6 },
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

  baziValue: { fontSize: typography.sizes.lg, fontWeight: typography.weights.medium },
  baziDivider: { height: 0.5, backgroundColor: colors.gray200, width: '100%', marginVertical: 8 },
  baziReadingLabel: { fontSize: typography.sizes.md, color: colors.primary, fontWeight: typography.weights.medium },
  baziReadingText: { fontSize: typography.sizes.md, color: colors.gray900, textAlign: 'center', lineHeight: 18 },
  baziDisclaimer: { fontSize: 12, color: colors.gray500, textAlign: 'center', marginTop: 10, lineHeight: 15 },

  // ── [新增] 三方觀點 ──
  pvBanner: { backgroundColor: colors.primaryLight, borderRadius: 12, padding: 10, marginBottom: 12 },
  pvBannerText: { fontSize: typography.sizes.sm, color: colors.primary, lineHeight: 18 },
  tabBar: { flexDirection: 'row', gap: 6, backgroundColor: colors.gray100, padding: 4, borderRadius: 14, marginBottom: 12 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10, gap: 2 },
  tabActive: {
    backgroundColor: colors.white,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 3, shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  tabText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.gray500 },
  pvSub: { fontSize: 11, color: colors.gray400, marginBottom: 8 },
  pvQuote: { borderRadius: 12, padding: 12, marginBottom: 6 },
  pvQuoteText: { fontSize: typography.sizes.md, color: colors.gray900, lineHeight: 20 },
  pvAlert: {
    backgroundColor: colors.primaryLight, borderLeftWidth: 3, borderLeftColor: colors.primary,
    borderRadius: 8, padding: 10, marginTop: 10,
  },
  pvAlertTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.primary, marginBottom: 2 },
  pvAlertText: { fontSize: typography.sizes.sm, color: colors.gray900, lineHeight: 18 },
  pvNotice: {
    flexDirection: 'row', gap: 6, alignItems: 'flex-start',
    backgroundColor: colors.dangerLight, borderRadius: 8, padding: 10, marginTop: 8,
  },
  pvNoticeText: { flex: 1, fontSize: typography.sizes.sm, color: colors.danger, lineHeight: 18 },

  zwSection: {
    borderWidth: 1, borderStyle: 'dashed', borderColor: colors.easterEggBorder,
    borderRadius: 12, padding: 12, marginBottom: 10,
  },
  zwSectionHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  zwSectionTitle: { flex: 1, fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.easterEgg },
  zwSectionText: { fontSize: typography.sizes.sm, color: colors.gray900, lineHeight: 21 },
  luckyRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  luckyBox: {
    flex: 1, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 6,
    borderWidth: 1, borderStyle: 'dashed', borderColor: colors.easterEggBorder, borderRadius: 12,
  },
  luckyLabel: { fontSize: 11, color: colors.gray400 },
  luckyValue: { fontSize: typography.sizes.md, fontWeight: '600', color: colors.easterEgg, marginTop: 2 },
  luckyHint: { fontSize: 11, color: colors.gray500, textAlign: 'center', marginTop: 4, lineHeight: 15 },
})