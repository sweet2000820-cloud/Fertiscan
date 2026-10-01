import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native'
import { colors, typography } from '../theme'
import { Ionicons } from '@expo/vector-icons'
import { getUserPlan } from '../plan'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { getRecords } from '../storage'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'

function getTCColor(status: string) {
  switch (status) {
    case '正常': return colors.primary
    case '邊緣': return colors.warning
    case '偏低': return colors.danger
    default: return colors.gray500
  }
}

function getIndexLabel(status: string) {
  switch (status) {
    case '正常': return '高'
    case '邊緣': return '中'
    case '偏低': return '低'
    default: return '—'
  }
}

function getNeedlePosition(tc: string) {
  const val = parseFloat(tc)
  if (val < 0.5) return '15%'
  if (val < 0.85) return `${((val - 0.5) / 0.35) * 35 + 15}%`
  return `${Math.min(((val - 0.85) / 0.15) * 20 + 50, 90)}%`
}

function generateAnonId(uid: string): string {
  let hash = 0
  for (let i = 0; i < uid.length; i++) {
    hash = ((hash << 5) - hash + uid.charCodeAt(i)) | 0
  }
  const code = Math.abs(hash).toString(36).toUpperCase().slice(0, 6)
  return `FS-${code}`
}

function getStatusBadgeColors(status: string) {
  if (status === '正常') return { bg: '#EAF3DE', text: '#3B6D11' }
  if (status === '邊緣') return { bg: '#FAEEDA', text: '#854F0B' }
  return { bg: '#FCEBEB', text: '#A32D2D' }
}

// [修改] 建議文字：男性精液品質的第一站通常是泌尿科，和「諮詢專業醫師」頁的說明一致
// [新增 2026/10/01] 試紙未出現 T 線＝濃度低於 15 百萬/mL（試紙的判讀門檻）
const FAINT_TITLE = '精子濃度可能低於 15 百萬/mL'
const FAINT_ADVICE = '本次試紙未出現 T 線，代表濃度可能低於 15 × 10⁶/mL（接近 WHO 參考下限）。單次結果可能受禁慾天數、樣本是否完整、近期發燒或用藥影響，建議 2–7 天後依採樣說明再測一次；若再次出現相同結果，建議到泌尿科或生殖醫學科做完整精液分析。'

function getAdviceText(status: string, tc: string) {
  if (status === '正常') return `此次 T/C 比值（${tc}）在正常範圍內（≥0.85）。建議維持目前生活習慣，定期複測追蹤趨勢。`
  if (status === '邊緣') return `此次 T/C 比值（${tc}）低於正常參考值（≥0.85）。建議 2 週後複測，或諮詢泌尿科、生殖醫學科醫師進行完整評估。`
  return `此次 T/C 比值（${tc}）明顯偏低。建議儘速諮詢泌尿科或生殖醫學科醫師進行進一步檢查。`
}

const sleepLabels: Record<string, string> = { lt5: '少於 5 小時', '5to6': '5–6 小時', '7to8': '7–8 小時', gt9: '超過 9 小時' }
const stressLabels: Record<string, string> = { low: '壓力不大', moderate: '有些壓力', high: '壓力較大', veryHigh: '壓力很大' }
const heatLabels: Record<string, string> = { never: '從不', occasional: '偶爾', often: '常常', almostDaily: '幾乎每天' }
const occupationLabels: Record<string, string> = { sedentary: '久坐辦公', active: '站立走動', highHeat: '高溫作業', other: '其他' }

function calcScoreItems(survey: any) {
  if (!survey) return []
  return [
    { label: '睡眠', max: 25, score: survey.sleepHours === '7to8' || survey.sleepHours === 'gt9' ? 25 : survey.sleepHours === '5to6' ? 14 : survey.sleepHours === 'lt5' ? 5 : 12, detail: sleepLabels[survey.sleepHours] || '未填寫' },
    { label: '壓力', max: 25, score: survey.stressLevel === 'low' ? 25 : survey.stressLevel === 'moderate' ? 16 : survey.stressLevel === 'high' ? 8 : survey.stressLevel === 'veryHigh' ? 3 : 12, detail: stressLabels[survey.stressLevel] || '未填寫' },
    { label: '高溫暴露', max: 25, score: survey.heatExposure === 'never' ? 25 : survey.heatExposure === 'occasional' ? 16 : survey.heatExposure === 'often' ? 8 : survey.heatExposure === 'almostDaily' ? 3 : 12, detail: heatLabels[survey.heatExposure] || '未填寫' },
    { label: '飲酒', max: 25, score: survey.heavyDrinking ? 5 : 25, detail: survey.heavyDrinking ? '近48小時有大量飲酒' : '近48小時無大量飲酒' },
  ]
}

function getScoreColor(s: number) {
  if (s >= 70) return '#3B6D11'
  if (s >= 40) return '#854F0B'
  return '#A32D2D'
}

export default function ReportOverviewScreen({ navigation, route }: any) {
  const record = route?.params?.record || {
    date: '2026/04/23', time: '上午 8:15', tc: '0.68', status: '邊緣', lot: 'LOT-2025-A'
  }

  const tcVal = parseFloat(record.tc)
  const tcColor = getTCColor(record.status)
  const needlePos = getNeedlePosition(record.tc)
  const isNormal = record.status === '正常' // [新增]
  // [新增 2026/10/01] 後端回傳 t_line_faint（T 線未顯色）；舊紀錄沒有這個欄位時，用 T 線強度為 0 判斷
  const belowThreshold = record.tLineFaint === true || (record.tIntensity != null && Number(record.tIntensity) <= 0)

  const badgeStyle = record.status === '正常'
    ? { bg: colors.successLight, text: colors.success, label: '正常值' }
    : record.status === '邊緣'
    ? { bg: colors.warningLight, text: colors.warning, label: '邊緣值' }
    : { bg: colors.dangerLight, text: colors.danger, label: belowThreshold ? '低於 15M/mL' : '偏低值' }

  // [修正] 沒有實際訊號強度時顯示「—」，不再用 T/C 值乘固定數字產生示意數值
  const hasC = record.cIntensity != null
  const hasT = record.tIntensity != null
  const cLine = hasC ? Number(record.cIntensity).toFixed(1) : '—'
  const tLine = belowThreshold ? '未顯色' : hasT ? Number(record.tIntensity).toFixed(1) : '—'
  const cBarPct = hasC ? Math.min(Number(record.cIntensity) / 170 * 100, 100) : 0
  const tBarPct = hasT ? Math.min(Number(record.tIntensity) / 170 * 100, 100) : 0
  const conc = '待校準'
  const abstinenceDays = record.preTestSurvey?.abstinenceDays
  const adviceText = belowThreshold ? FAINT_ADVICE : getAdviceText(record.status, record.tc)

  async function exportPDF() {
    const user = auth.currentUser
    let nameRaw = ''
    let anonId = 'FS-------'
    let profile: any = null
    let allRecords: any[] = []

    if (user) {
      anonId = generateAnonId(user.uid)
      const snap = await getDoc(doc(db, 'users', user.uid))
      if (snap.exists()) {
        const data: any = snap.data()
        nameRaw = data.name || ''
        profile = data
      }
      allRecords = await getRecords()
    }

    const maskedName = nameRaw.length > 0
      ? nameRaw.slice(0, 1) + '○' + (nameRaw.length > 2 ? nameRaw.slice(-1) : '')
      : '使用者'

    const generatedAt = new Date().toLocaleString('zh-TW')
    const badgeColors = getStatusBadgeColors(record.status)

    // ── AI 解讀相關計算 ──
    const age = profile?.birthYear ? new Date().getFullYear() - parseInt(profile.birthYear) : null
    const bmi = profile?.height && profile?.weight
      ? (parseFloat(profile.weight) / Math.pow(parseFloat(profile.height) / 100, 2)).toFixed(1)
      : null
    const bmiNum = bmi ? parseFloat(bmi) : null
    const bmiStatus = bmiNum ? (bmiNum < 18.5 ? '偏輕' : bmiNum < 24 ? '正常' : bmiNum < 27 ? '過重' : '肥胖') : '未填寫'

    const riskFactors: string[] = []
    if (profile?.varicocele) riskFactors.push('精索靜脈曲張病史')
    if (profile?.testicularHistory) riskFactors.push('隱睪症／睪丸手術病史')
    if (profile?.endocrineDisease) riskFactors.push('內分泌相關疾病')
    if (profile?.smoke) riskFactors.push(`吸菸${profile?.smokeYears ? `（約 ${profile.smokeYears} 年）` : ''}`)
    if (profile?.occupationType === 'highHeat') riskFactors.push('高溫作業環境')

    const survey = record.preTestSurvey
    const scoreItems = calcScoreItems(survey)
    const score = scoreItems.length > 0 ? scoreItems.reduce((s, i) => s + i.score, 0) : null

    const comparableRecords = abstinenceDays != null
      ? allRecords.filter(r => { const d = r.preTestSurvey?.abstinenceDays; return d != null && Math.abs(d - abstinenceDays) <= 2 })
      : []
    const trend = comparableRecords.length >= 2
      ? parseFloat(comparableRecords[0].tc) > parseFloat(comparableRecords[1].tc) ? '上升'
        : parseFloat(comparableRecords[0].tc) < parseFloat(comparableRecords[1].tc) ? '下降' : '穩定'
      : '資料不足'

    const actionList = survey ? [
      !(survey.sleepHours === '7to8' || survey.sleepHours === 'gt9') && { title: '固定就寢時間，目標 7–8 小時', text: '從今晚起設定固定就寢時間，睡前 30 分鐘避免使用螢幕。' },
      survey.stressLevel !== 'low' && { title: '每天安排 10 分鐘放鬆時間', text: '嘗試冥想、深呼吸或散步，幫助調節壓力荷爾蒙。' },
      (survey.heatExposure === 'often' || survey.heatExposure === 'almostDaily') && { title: '減少高溫暴露頻率', text: '減少三溫暖、熱水澡或久坐時間，每小時起身活動。' },
    ].filter(Boolean) as { title: string, text: string }[] : []

    const healthSectionHtml = (age || bmi || riskFactors.length > 0) ? `
      <div class="section">
        <div class="section-title">個人健康綜合評估</div>
        <table>
          ${age ? `<tr><td class="row-label">年齡</td><td class="row-value">${age} 歲</td></tr>` : ''}
          ${bmi ? `<tr><td class="row-label">BMI</td><td class="row-value">${bmi}（${bmiStatus}）</td></tr>` : ''}
          ${profile?.occupationType ? `<tr><td class="row-label">職業型態</td><td class="row-value">${occupationLabels[profile.occupationType] || '未填寫'}</td></tr>` : ''}
        </table>
        ${riskFactors.length > 0 ? `<div class="risk-box"><div class="risk-title">已知風險因子</div>${riskFactors.map(f => `<div class="risk-item">• ${f}</div>`).join('')}</div>` : ''}
      </div>
    ` : ''

    const scoreSectionHtml = score != null ? `
      <div class="section">
        <div class="section-title">本次生活習慣評分</div>
        <div class="score-row">
          <span class="score-value" style="color:${getScoreColor(score)}">${score} / 100</span>
        </div>
        <table>
          ${scoreItems.map(i => `<tr><td class="row-label">${i.label}（${i.detail}）</td><td class="row-value">${i.score}/${i.max}</td></tr>`).join('')}
        </table>
        <div class="trend-note">在禁慾天數相近的紀錄中，T/C 比值趨勢為「${trend}」。</div>
      </div>
    ` : ''

    const actionSectionHtml = actionList.length > 0 ? `
      <div class="section">
        <div class="section-title">本週行動建議</div>
        ${actionList.map((a, i) => `
          <div class="action-item">
            <span class="action-num">${i + 1}</span>
            <div>
              <div class="action-title">${a.title}</div>
              <div class="action-text">${a.text}</div>
            </div>
          </div>
        `).join('')}
      </div>
    ` : ''

    const html = `
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { box-sizing: border-box; }
          body { font-family: sans-serif; margin: 0; color: #333; }
          .header { padding: 36px 40px 24px; border-bottom: 3px solid #0A5C6B; display: flex; justify-content: space-between; align-items: center; }
          .brand { font-size: 22px; font-weight: 700; color: #0A5C6B; }
          .brand-sub { font-size: 11px; color: #6B7280; margin-top: 2px; }
          .meta { text-align: right; font-size: 11px; color: #4B5563; line-height: 1.6; }
          .content { padding: 28px 40px 0; }
          .tc-card { background: #E0F3F5; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px; }
          .tc-label { font-size: 11px; color: #0A5C6B; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 8px; }
          .tc-value { font-size: 48px; font-weight: 700; color: ${tcColor}; }
          .tc-badge { display: inline-block; margin-top: 8px; background: ${badgeColors.bg}; color: ${badgeColors.text}; font-size: 12px; font-weight: 600; padding: 4px 16px; border-radius: 20px; }
          .section-title { font-size: 12px; font-weight: 600; color: #4B5563; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #F3F4F6; }
          .section { margin-bottom: 20px; page-break-inside: avoid; break-inside: avoid; }
          table { width: 100%; font-size: 13px; border-collapse: collapse; }
          td { padding: 6px 0; }
          .row-label { color: #4B5563; }
          .row-value { text-align: right; color: #111827; font-weight: 500; }
          .row-value-ok { text-align: right; color: #3B6D11; font-weight: 500; }
          .advice-box { background: ${badgeColors.bg}; border-radius: 12px; padding: 16px 18px; margin-bottom: 28px; page-break-inside: avoid; break-inside: avoid; }
          .advice-title { font-size: 12px; font-weight: 600; color: ${badgeColors.text}; margin-bottom: 4px; }
          .advice-text { font-size: 12.5px; color: ${badgeColors.text}; line-height: 1.6; }
          .footer { padding: 16px 40px 24px; border-top: 1px solid #F3F4F6; text-align: center; }
          .footer-text { font-size: 10px; color: #6B7280; line-height: 1.6; }
          .risk-box { background: #FCEBEB; border-radius: 8px; padding: 10px 12px; margin-top: 8px; }
          .risk-title { font-size: 11px; font-weight: 600; color: #A32D2D; margin-bottom: 4px; }
          .risk-item { font-size: 12px; color: #A32D2D; line-height: 1.6; }
          .score-row { text-align: center; margin-bottom: 10px; }
          .score-value { font-size: 28px; font-weight: 700; }
          .trend-note { font-size: 12px; color: #4B5563; margin-top: 8px; line-height: 1.6; }
          .action-item { display: flex; gap: 10px; padding: 8px 0; border-bottom: 1px solid #F3F4F6; }
          .action-num { width: 20px; height: 20px; border-radius: 10px; background: #EAF3DE; color: #3B6D11; font-size: 11px; font-weight: 600; text-align: center; line-height: 20px; flex-shrink: 0; }
          .action-title { font-size: 13px; font-weight: 500; color: #111827; }
          .action-text { font-size: 12px; color: #6B7280; margin-top: 2px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">iMotile</div>
            <div class="brand-sub">檢測報告</div>
          </div>
          <div class="meta">
            ${record.date} · ${record.time}<br/>
            批號 ${record.lot}<br/>
            使用者 ${maskedName} · 識別碼 ${anonId}
          </div>
        </div>

        <div class="content">
          <div class="tc-card">
            ${belowThreshold ? `
            <div class="tc-label">檢測結果</div>
            <div class="tc-value" style="font-size:26px">未出現 T 線</div>
            <div class="tc-badge">${FAINT_TITLE}</div>` : `
            <div class="tc-label">T/C 比值</div>
            <div class="tc-value">${record.tc}</div>
            <div class="tc-badge">${badgeStyle.label}</div>`}
          </div>

          <div class="section">
            <div class="section-title">採樣資訊</div>
            <table>
              <tr><td class="row-label">禁慾天數</td><td class="row-value">${abstinenceDays != null ? `${abstinenceDays} 天` : '未記錄'}</td></tr>
              <tr><td class="row-label">試紙批號</td><td class="row-value">${record.lot}</td></tr>
              <tr><td class="row-label">報告產生時間</td><td class="row-value">${generatedAt}</td></tr>
            </table>
          </div>

          <div class="section">
            <div class="section-title">條線訊號詳情</div>
            <table>
              <tr><td class="row-label">Control line (C)</td><td class="row-value">灰階 ${cLine}</td></tr>
              <tr><td class="row-label">Test line (T)</td><td class="row-value">${belowThreshold ? '未顯色' : `灰階 ${tLine}`}</td></tr>
              <tr><td class="row-label">換算濃度</td><td class="row-value">≈ ${conc} mIU/mL</td></tr>
            </table>
          </div>

          <div class="section">
            <div class="section-title">影像品質確認</div>
            <table>
              <tr><td class="row-label">C line 訊號</td><td class="row-value-ok">✓ 通過</td></tr>
              <tr><td class="row-label">T line 偵測</td>${belowThreshold ? '<td class="row-value">未顯色</td>' : '<td class="row-value-ok">✓ 通過</td>'}</tr>
            </table>
          </div>

          ${healthSectionHtml}
          ${scoreSectionHtml}
          ${actionSectionHtml}

          <div class="advice-box">
            <div class="advice-title">${belowThreshold ? FAINT_TITLE : record.status === '正常' ? '結果說明' : '初步建議'}</div>
            <div class="advice-text">${adviceText}</div>
          </div>
        </div>

        <div class="footer">
          <div class="footer-text">
            本報告由 iMotile App 自動生成，僅供初步參考，不構成醫療診斷。<br/>
            如有疑慮請諮詢泌尿科或生殖醫學科醫師。
          </div>
        </div>
      </body>
      </html>
    `
    try {
      const { uri } = await Print.printToFileAsync({
        html,
        width: 595,
        height: 842,
      })
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: '分享 iMotile 報告' })
    } catch (e) {
      Alert.alert('匯出失敗', '請再試一次')
    }
  }

  function handleExportPDF() {
    getUserPlan().then(({ plan }) => {
      if (plan !== 'pro') {
        Alert.alert('Pro 功能', 'PDF 報告匯出為 Pro 版專屬功能。', [
          { text: '稍後再說', style: 'cancel' },
          { text: '升級 Pro', onPress: () => navigation.navigate('Plan') },
        ])
        return
      }
      exportPDF()
    })
  }

  // [新增] 前往既有的合作診所搜尋頁（諮詢模式），帶著本次紀錄用於「帶報告去看診」
  function goConsult() {
    navigation.navigate('ClinicSearch', { mode: 'consult', record })
  }

  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>檢測結果</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.titleRow}>
          <View>
            <Text style={styles.hint}>{record.date} · {record.time}</Text>
            <Text style={styles.title}>好孕指數分析</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: badgeStyle.bg }]}>
            <Text style={[styles.badgeText, { color: badgeStyle.text }]}>{getIndexLabel(record.status)}</Text>
          </View>
        </View>

        <View style={styles.gaugeCard}>
          <Text style={styles.labelDark}>好孕指數</Text>
          <View style={styles.gaugeCenter}>
            <Text style={[styles.gaugeNum, { color: tcColor, fontSize: 44 }]}>{getIndexLabel(record.status)}</Text>
          </View>
          <View style={styles.tcPill}>
            {belowThreshold ? (
              <Text style={styles.tcPillText}>T 線<Text style={styles.tcPillValue}>未顯色</Text>・低於 15 百萬/mL</Text>
            ) : (
              <Text style={styles.tcPillText}>T/C 比值 <Text style={styles.tcPillValue}>{record.tc}</Text></Text>
            )}
          </View>
          <View style={styles.scaleBar}>
            <View style={[styles.scaleNeedle, { left: `${needlePos}` as any }]} />
          </View>
          <View style={styles.scaleLabels}>
            <Text style={[styles.scaleLabel, { color: colors.danger }]}>低</Text>
            <Text style={[styles.scaleLabel, { color: colors.warning }]}>中</Text>
            <Text style={[styles.scaleLabel, { color: colors.success }]}>高</Text>
          </View>
        </View>

        <View style={styles.listCard}>
          <Text style={styles.sectionTitle}>條線訊號詳情</Text>
          <View style={styles.signalRow}>
            <Text style={styles.labelDark}>Control line (C) — 內部對照</Text>
            <Text style={[styles.signalValue, { color: '#1a6fbe' }]}>灰階 {cLine}</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${cBarPct}%`, backgroundColor: '#1a6fbe' }]} />
          </View>
          <View style={styles.signalRow}>
            <Text style={styles.labelDark}>Test line (T) — 樣本反應</Text>
            <Text style={[styles.signalValue, { color: tcColor }]}>{belowThreshold ? tLine : `灰階 ${tLine}`}</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${tBarPct}%`, backgroundColor: tcColor }]} />
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.labelDark}>換算濃度（批號 {record.lot}）</Text>
            <Text style={[styles.infoValue, { color: tcColor }]}>≈ {conc} mIU/mL</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.labelDark}>禁慾天數</Text>
            <Text style={styles.infoValue}>{abstinenceDays != null ? `${abstinenceDays} 天` : '未記錄'}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>影像品質確認</Text>
          {/* [修正 2026/10/01] 只列後端真的有檢查的項目；
              「影像穩定度」「螢幕亮度」「批號匹配」後端沒檢查，原本固定顯示通過，已移除 */}
          {[
            { label: 'C line 訊號', ok: true, text: '✓ 通過' },
            { label: 'T line 偵測', ok: !belowThreshold, text: belowThreshold ? '未顯色' : '✓ 通過' },
          ].map((item, i) => (
            <View key={i} style={styles.qcRow}>
              <Text style={styles.labelDark}>{item.label}</Text>
              <Text style={{ fontSize: typography.sizes.xs, color: item.ok ? colors.success : colors.gray500 }}>{item.text}</Text>
            </View>
          ))}
        </View>
        {/* [修正 2026/10/01] 除錯影像只在開發模式（Expo 開發中）顯示，正式版使用者看不到 */}
        {__DEV__ && (record.debugFull || record.debugInner) && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>偵測影像（除錯用）</Text>
            {record.debugFull && (
              <>
                <Text style={[styles.hint, { marginBottom: 6 }]}>完整拍攝畫面 / ROI 定位</Text>
                <Image
                  source={{ uri: `data:image/jpeg;base64,${record.debugFull}` }}
                  style={styles.debugImage}
                  resizeMode="contain"
                />
              </>
            )}
            {record.debugInner && (
              <>
                <Text style={[styles.hint, { marginTop: 12, marginBottom: 6 }]}>實際辨識區域（試紙裁切）</Text>
                <Image
                  source={{ uri: `data:image/jpeg;base64,${record.debugInner}` }}
                  style={styles.debugImage}
                  resizeMode="contain"
                />
              </>
            )}
          </View>
        )}

        <View style={[styles.warnCard, { backgroundColor: badgeStyle.bg }]}>
          <Text style={[styles.warnTitle, { color: badgeStyle.text }]}>
            {belowThreshold ? `⚠ ${FAINT_TITLE}` : isNormal ? '✓ 結果說明' : '⚠ 初步建議'}
          </Text>
          <Text style={[styles.warnText, { color: badgeStyle.text }]}>{adviceText}</Text>
        </View>

        {/* [修改] 「與診所分享」改為「諮詢專業醫師」，連到合作診所列表。
            數值邊緣或偏低時用主要按鈕、獨立一行，讓使用者最需要時最容易看到 */}
        {isNormal ? (
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.navigate('Main', { screen: '紀錄' })}>
              <Text style={styles.btnSecondaryText}>查看紀錄</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnSecondary} onPress={goConsult}>
              <Text style={styles.btnSecondaryText}>諮詢專業醫師</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TouchableOpacity style={[styles.btnPrimary, styles.consultBtn]} onPress={goConsult}>
              <Ionicons name="medkit-outline" size={16} color={colors.white} />
              <Text style={styles.btnPrimaryText}>諮詢專業醫師</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnSecondary, styles.fullBtn]} onPress={() => navigation.navigate('Main', { screen: '紀錄' })}>
              <Text style={styles.btnSecondaryText}>查看紀錄</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={styles.aiBtn}
          onPress={async () => {
              const { plan } = await getUserPlan()
              if (plan === 'pro') {
              navigation.navigate('AIAdvice', { record })
            } else {
              Alert.alert('Pro 功能', 'AI 趨勢解讀為 Pro 版專屬功能，升級後即可使用。', [
                { text: '稍後再說', style: 'cancel' },
                { text: '升級 Pro', onPress: () => navigation.navigate('Plan') },
              ])
            }
          }}
        >
          <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
          <Text style={styles.aiBtnText}>AI 趨勢解讀</Text>
          <View style={styles.proBadge}>
            <Text style={styles.proBadgeText}>PRO</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.btnRow}>
          <TouchableOpacity style={[styles.linkBtn, { flex: 1, marginBottom: 0 }]} onPress={handleExportPDF}>
            <Ionicons name="document-text-outline" size={16} color={colors.primary} />
            <Text style={styles.linkBtnText}>匯出 PDF</Text>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.linkBtn, { flex: 1, marginBottom: 0 }]} onPress={() => navigation.navigate('ReportLink', { records: [record] })}>
            <Ionicons name="link-outline" size={16} color={colors.primary} />
            <Text style={styles.linkBtnText}>複製分享連結</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  appbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 30, paddingHorizontal: 18, paddingBottom: 20,
  },
  back: { fontSize: 30, color: colors.primary, marginRight: 6 },
  appbarTitle: { flex: 1, fontSize: 22, fontWeight: '600', color: colors.gray900 },
  scroll: { flex: 1, paddingHorizontal: 18 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  hint: { fontSize: typography.sizes.sm, color: colors.gray400 },
  labelDark: { fontSize: typography.sizes.md, color: colors.gray900 },
  title: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium },
  gaugeCard: {
    backgroundColor: colors.white, borderWidth: 0.5, borderColor: colors.gray200,
    borderRadius: 18, padding: 16, alignItems: 'center', marginBottom: 14,
  },
  gaugeCenter: { alignItems: 'center', marginVertical: 12 },
  gaugeNum: { fontSize: 36, fontWeight: typography.weights.medium },
  gaugeUnit: { fontSize: typography.sizes.sm, color: colors.gray400, marginTop: 2 },
  tcPill: {
    backgroundColor: colors.gray100,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 12,
  },
  tcPillText: {
    fontSize: typography.sizes.md,
    color: colors.gray500,
  },
  tcPillValue: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.gray900,
  },
  scaleBar: { width: '100%', height: 8, borderRadius: 4, backgroundColor: colors.gray200, position: 'relative', marginBottom: 4 },
  scaleNeedle: { position: 'absolute', top: -4, width: 2.5, height: 16, backgroundColor: colors.gray900, borderRadius: 1.5 },
  scaleLabels: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  scaleLabel: { fontSize: typography.sizes.xs },
  listCard: {
    backgroundColor: colors.white, borderWidth: 0.5, borderColor: colors.gray200,
    borderRadius: 18, padding: 14, marginBottom: 14,
  },
  sectionTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.gray900, marginBottom: 10 },
  signalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  signalValue: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium },
  progressBg: { height: 5, backgroundColor: colors.gray200, borderRadius: 3, marginBottom: 10, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  divider: { height: 0.5, backgroundColor: colors.gray200, marginVertical: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  infoValue: { fontSize: typography.sizes.sm, color: colors.gray900 },
  card: {
    backgroundColor: colors.white, borderWidth: 0.5, borderColor: colors.gray200,
    borderRadius: 18, padding: 14, marginBottom: 14,
  },
  debugImage: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    backgroundColor: colors.gray200,
  },
  qcRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: colors.gray100 },
  warnCard: { borderRadius: 16, padding: 14, marginBottom: 14 },
  warnTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, marginBottom: 4 },
  warnText: { fontSize: typography.sizes.sm, lineHeight: 18 },
  btnRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  btnSecondary: { flex: 1, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  btnSecondaryText: { fontSize: typography.sizes.sm, color: colors.primary },
  btnPrimary: { flex: 1, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  btnPrimaryText: { fontSize: typography.sizes.sm, color: colors.white, fontWeight: typography.weights.medium },
  // [新增]
  consultBtn: { flex: 0, flexDirection: 'row', gap: 6, height: 48, borderRadius: 24, marginBottom: 8 },
  fullBtn: { flex: 0, marginBottom: 8 },
  btnGray: {
    height: 40, borderRadius: 20, backgroundColor: colors.white, borderWidth: 0.5, borderColor: colors.gray200,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  btnGrayText: { fontSize: typography.sizes.sm, color: colors.gray500 },
  aiBtn: {
    height: 46, borderRadius: 23,
    borderWidth: 1.5, borderColor: colors.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginBottom: 8,
  },
  aiBtnText: { fontSize: typography.sizes.md, color: colors.primary, fontWeight: typography.weights.medium },
  proBadge: { backgroundColor: colors.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  proBadgeText: { fontSize: 9, color: '#fff', fontWeight: typography.weights.medium },
  linkBtn: {
  height: 44, borderRadius: 22,
  borderWidth: 1.5, borderColor: colors.primary,
  flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  gap: 6, marginBottom: 8,
  },
  linkBtnText: { fontSize: typography.sizes.md, color: colors.primary, fontWeight: typography.weights.medium },
})