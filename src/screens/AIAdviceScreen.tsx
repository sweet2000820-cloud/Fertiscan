import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { colors, typography } from '../theme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getRecords } from '../storage'

export default function AIAdviceScreen({ navigation, route }: any) {
  const record = route?.params?.record
  const [questionnaire, setQuestionnaire] = useState<any>(null)
  const [allRecords, setAllRecords] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)

  useEffect(() => {
    AsyncStorage.getItem('lastQuestionnaire').then(val => {
      if (val) setQuestionnaire(JSON.parse(val))
    })
    getRecords().then(r => setAllRecords(r));
    (async () => {
      const birthYear = await AsyncStorage.getItem('userBirthYear')
      const height = await AsyncStorage.getItem('userHeight')
      const weight = await AsyncStorage.getItem('userWeight')
      setUserProfile({ birthYear, height, weight })
    })()
  }, [])

  const tcVal = parseFloat(record?.tc || '0')
  const status = record?.status || '—'

  function getScoreColor(score: number) {
    if (score >= 70) return colors.success
    if (score >= 40) return '#EF9F27'
    return colors.danger
  }
  const age = userProfile?.birthYear ? new Date().getFullYear() - parseInt(userProfile.birthYear) : null
  const bmi = userProfile?.height && userProfile?.weight
    ? (parseInt(userProfile.weight) / Math.pow(parseInt(userProfile.height) / 100, 2)).toFixed(1)
    : null
  const bmiNum = bmi ? parseFloat(bmi) : null
  const bmiStatus = bmiNum
    ? bmiNum < 18.5 ? '偏輕' : bmiNum < 24 ? '正常' : bmiNum < 27 ? '過重' : '肥胖'
    : '未填寫'
  const bmiColor = bmiNum
    ? bmiNum < 18.5 ? '#EF9F27' : bmiNum < 24 ? colors.success : bmiNum < 27 ? '#EF9F27' : colors.danger
    : colors.gray400
  const recentRecords = allRecords.slice(0, 5)
  const avgTC = recentRecords.length > 0
    ? recentRecords.reduce((s, r) => s + parseFloat(r.tc), 0) / recentRecords.length
    : 0

  const trend = recentRecords.length >= 2
    ? parseFloat(recentRecords[0].tc) > parseFloat(recentRecords[1].tc)
      ? '上升'
      : parseFloat(recentRecords[0].tc) < parseFloat(recentRecords[1].tc)
      ? '下降'
      : '穩定'
    : '資料不足'

  const trendColor = trend === '上升' ? colors.success : trend === '下降' ? colors.danger : '#EF9F27'

  const sleepHours = questionnaire?.sleepHours || '未填寫'
  const exerciseDays = questionnaire?.exerciseDays || '未填寫'
  const sitting = questionnaire?.sitting || '未填寫'
  const alcohol = questionnaire?.alcohol || '未填寫'
  const stress = questionnaire?.stress || '未填寫'

  const score = Math.min(100, Math.round(
    (tcVal >= 0.85 ? 30 : tcVal >= 0.5 ? 15 : 5) +
    (questionnaire ? 40 : 20)
  ))

  const suggestions = [
    {
      icon: '😴', label: '睡眠',
      status: sleepHours === '7–9 小時' ? '良好' : '需要改善',
      statusColor: sleepHours === '7–9 小時' ? colors.success : colors.danger,
      text: sleepHours === '7–9 小時'
        ? '睡眠時間充足，繼續維持。'
        : '睡眠不足會影響荷爾蒙平衡，建議每晚維持 7–9 小時。'
    },
    {
      icon: '🏃', label: '運動',
      status: exerciseDays === '每週 3 次以上' ? '良好' : '可以加強',
      statusColor: exerciseDays === '每週 3 次以上' ? colors.success : '#EF9F27',
      text: exerciseDays === '每週 3 次以上'
        ? '運動習慣良好，有助於改善生殖功能。'
        : '建議每週至少 3 次有氧運動，每次 30 分鐘。'
    },
    {
      icon: '🪑', label: '久坐',
      status: sitting === '幾乎不久坐' ? '良好' : '需要改善',
      statusColor: sitting === '幾乎不久坐' ? colors.success : colors.danger,
      text: sitting === '幾乎不久坐'
        ? '活動量充足，骨盆血液循環良好。'
        : '建議每小時起身活動 5 分鐘，改善骨盆血液循環。'
    },
    {
      icon: '🍺', label: '飲酒',
      status: alcohol === '不喝' ? '良好' : '可以注意',
      statusColor: alcohol === '不喝' ? colors.success : '#EF9F27',
      text: alcohol === '不喝'
        ? '不飲酒是最佳選擇。'
        : '適量飲酒對生殖功能影響有限，但建議控制在每週 2 次以下。'
    },
    {
      icon: '😤', label: '壓力',
      status: stress === '壓力不大' ? '良好' : '可以加強',
      statusColor: stress === '壓力不大' ? colors.success : '#EF9F27',
      text: stress === '壓力不大'
        ? '壓力管理良好。'
        : '慢性壓力會影響荷爾蒙，建議嘗試冥想或規律運動來舒壓。'
    },
  ]

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
            <Text style={[styles.summaryValue, { color: status === '正常' ? colors.success : status === '邊緣' ? '#EF9F27' : colors.danger }]}>{record?.tc}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>狀態</Text>
            <Text style={[styles.summaryValue, { color: status === '正常' ? colors.success : status === '邊緣' ? '#EF9F27' : colors.danger }]}>{status}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>批號</Text>
            <Text style={styles.summaryValue}>{record?.lot}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>近 {recentRecords.length} 次平均 T/C</Text>
            <Text style={[styles.summaryValue, { color: avgTC >= 0.85 ? colors.success : avgTC >= 0.5 ? '#EF9F27' : colors.danger }]}>
              {avgTC > 0 ? avgTC.toFixed(2) : '—'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>趨勢</Text>
            <Text style={[styles.summaryValue, { color: trendColor }]}>{trend}</Text>
          </View>
        </View>

        <View style={styles.adviceCard}>
          <Text style={styles.adviceTitle}>整體生活習慣評估</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>整體評分</Text>
            <View style={styles.scoreBar}>
              <View style={[styles.scoreBarFill, { width: `${score}%`, backgroundColor: getScoreColor(score) }]} />
            </View>
            <Text style={[styles.scoreValue, { color: getScoreColor(score) }]}>{score} / 100</Text>
          </View>
          <Text style={styles.adviceText}>
            {recentRecords.length >= 2
              ? `根據最近 ${recentRecords.length} 次檢測，您的 T/C 比值趨勢為「${trend}」，平均值為 ${avgTC.toFixed(2)}。${trend === '上升' ? '持續保持良好生活習慣！' : trend === '下降' ? '建議關注生活習慣，考慮諮詢醫師。' : '數值穩定，繼續維持目前狀態。'}`
              : questionnaire
              ? `根據本次問卷與檢測結果，您的整體生活習慣評分為 ${score} 分。`
              : '尚無足夠歷史紀錄，建議多次檢測後可看到趨勢分析。'}
          </Text>
        </View>

        <View style={styles.adviceCard}>
          <Text style={styles.adviceTitle}>個人健康綜合評估</Text>
          <View style={styles.profileRow}>
            <View style={styles.profileItem}>
              <Text style={styles.profileLabel}>年齡</Text>
              <Text style={styles.profileValue}>{age ? `${age} 歲` : '未填寫'}</Text>
              <Text style={[styles.profileHint, { color: age && age >= 20 && age <= 40 ? colors.success : '#EF9F27' }]}>
                {age ? (age < 20 ? '較年輕' : age <= 40 ? '黃金時期' : '建議定期追蹤') : '—'}
              </Text>
            </View>
            <View style={styles.profileItem}>
              <Text style={styles.profileLabel}>BMI</Text>
              <Text style={styles.profileValue}>{bmi || '—'}</Text>
              <Text style={[styles.profileHint, { color: bmiColor }]}>{bmiStatus}</Text>
            </View>
            <View style={styles.profileItem}>
              <Text style={styles.profileLabel}>近期趨勢</Text>
              <Text style={styles.profileValue}>{trend}</Text>
              <Text style={[styles.profileHint, { color: trendColor }]}>
                {trend === '上升' ? '持續改善' : trend === '下降' ? '需關注' : '維持中'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={[styles.adviceText, { marginTop: 8 }]}>
            {age && bmiNum
              ? `根據您的年齡（${age} 歲）與 BMI（${bmi}，${bmiStatus}）綜合評估：${
                  bmiNum >= 24
                    ? '體重偏高可能影響荷爾蒙分泌，建議透過飲食控制與規律運動改善。'
                    : bmiNum < 18.5
                    ? '體重偏輕可能影響營養供給，建議增加蛋白質攝取。'
                    : '體重在正常範圍，繼續維持健康生活習慣。'
                }${
                  age > 35
                    ? ' 年齡超過 35 歲後生殖功能自然下降，建議每 2–4 週定期追蹤。'
                    : ''
                }`
              : '請在個人資料頁面填寫出生年份與身高體重，以獲得更精確的綜合評估。'}
          </Text>
        </View>

        <View style={styles.adviceCard}>
          <Text style={styles.adviceTitle}>各面向詳細分析</Text>
          {suggestions.map((item, i) => (
            <View key={i} style={styles.factorCard}>
              <View style={styles.factorHeader}>
                <Text style={styles.factorIcon}>{item.icon}</Text>
                <Text style={styles.factorLabel}>{item.label}</Text>
                <View style={[styles.factorBadge, { backgroundColor: item.statusColor + '20' }]}>
                  <Text style={[styles.factorBadgeText, { color: item.statusColor }]}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.factorText}>{item.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.adviceCard}>
          <Text style={styles.adviceTitle}>本週行動清單</Text>
          {[
            { num: '1', title: '固定就寢時間，目標 7 小時', text: '從今晚起設定固定就寢時間，不看螢幕 30 分鐘前。' },
            { num: '2', title: '每小時起身活動 5 分鐘', text: '設定手機提醒，站起來走動或伸展。' },
            { num: '3', title: '本週新增一次 30 分鐘有氧', text: '快走、騎車或游泳都可以，重點是持續 30 分鐘。' },
          ].map((item, i) => (
            <View key={i} style={styles.actionRow}>
              <View style={styles.actionNum}>
                <Text style={styles.actionNumText}>{item.num}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>{item.title}</Text>
                <Text style={styles.actionText}>{item.text}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.disclaimer}>以上建議由 AI 根據本次問卷與檢測結果生成，僅供生活習慣參考，不構成醫療診斷。</Text>

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
  proBadgeText: { fontSize: typography.sizes.xs, color: colors.primary, fontWeight: typography.weights.medium },
  scroll: { flex: 1, padding: 18 },
  darkCard: { backgroundColor: '#0a1628', borderRadius: 12, padding: 12, marginBottom: 14 },
  darkLabel: { fontSize: typography.sizes.xs, color: 'rgba(255,255,255,0.35)', marginBottom: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryLabel: { fontSize: typography.sizes.xs, color: 'rgba(255,255,255,0.5)' },
  summaryValue: { fontSize: typography.sizes.xs, fontWeight: typography.weights.medium },
  adviceCard: { borderWidth: 0.5, borderColor: colors.gray200, borderRadius: 10, padding: 12, marginBottom: 14 },
  adviceTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900, marginBottom: 10 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  scoreLabel: { fontSize: typography.sizes.xs, color: colors.gray400 },
  scoreBar: { flex: 1, height: 4, backgroundColor: colors.gray200, borderRadius: 2, overflow: 'hidden' },
  scoreBarFill: { height: '100%', borderRadius: 2 },
  scoreValue: { fontSize: typography.sizes.xs, fontWeight: typography.weights.medium },
  adviceText: { fontSize: typography.sizes.xs, color: colors.gray500, lineHeight: 18 },
  factorCard: { backgroundColor: colors.gray100, borderRadius: 8, padding: 10, marginBottom: 8 },
  factorHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  factorIcon: { fontSize: 14 },
  factorLabel: { flex: 1, fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.gray900 },
  factorBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 3 },
  factorBadgeText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.medium },
  factorText: { fontSize: typography.sizes.xs, color: colors.gray500, lineHeight: 18 },
  actionRow: { flexDirection: 'row', gap: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: colors.gray100 },
  actionNum: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.successLight, borderWidth: 1, borderColor: colors.success,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
  },
  actionNumText: { fontSize: 9, fontWeight: typography.weights.medium, color: colors.success },
  actionTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.gray900, marginBottom: 2 },
  actionText: { fontSize: typography.sizes.xs, color: colors.gray400, lineHeight: 16 },
  disclaimer: { fontSize: typography.sizes.xs, color: colors.gray400, textAlign: 'center', marginBottom: 12, lineHeight: 16 },
  backBtn: {
    height: 36, borderRadius: 9, backgroundColor: colors.gray100,
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { fontSize: typography.sizes.sm, color: colors.gray500 },
  profileRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  profileItem: { alignItems: 'center', gap: 4 },
  profileLabel: { fontSize: typography.sizes.xs, color: colors.gray400 },
  profileValue: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  profileHint: { fontSize: typography.sizes.xs },
  divider: { height: 0.5, backgroundColor: colors.gray200, marginVertical: 8 },
})