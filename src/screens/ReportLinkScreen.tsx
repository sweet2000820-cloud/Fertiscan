import { useState, useEffect } from 'react'
import { colors, typography } from '../theme'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, Share, Linking } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import * as FileSystem from 'expo-file-system/legacy'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { getUserPlan } from '../plan'
import { getRecords } from '../storage'
import { Ionicons } from '@expo/vector-icons'

const API_BASE = 'https://fertiscan-api.onrender.com'

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

function expiryToHours(label: string): number {
  switch (label) {
    case '24 小時': return 24
    case '3 天': return 72
    case '7 天': return 168
    case '30 天': return 720
    default: return 168
  }
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

export default function ReportLinkScreen({ navigation, route }: any) {
  const [pwEnabled, setPwEnabled] = useState(false)
  const [password, setPassword] = useState('')
  const [expiry, setExpiry] = useState('7 天')
  const [anonId, setAnonId] = useState('FS-------')
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [shareLoading, setShareLoading] = useState(false)
  const [shareError, setShareError] = useState(false)
  const records = route?.params?.records || []

  useEffect(() => {
    const user = auth.currentUser
    if (user) {
      setAnonId(generateAnonId(user.uid))
    }
  }, [])

  async function generateShareLink() {
    if (records.length === 0) return
    const user = auth.currentUser
    if (!user) {
      setShareError(true)
      return
    }
    setShareLoading(true)
    setShareError(false)
    try {
      const idToken = await user.getIdToken()
      const res = await fetch(`${API_BASE}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          records: records.map((r: any) => ({
            date: r.date,
            time: r.time,
            tc: r.tc,
            status: r.status,
            lot: r.lot,
            qualityPassed: true,
          })),
          expiry_hours: expiryToHours(expiry),
          password: pwEnabled && password ? password : null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setShareUrl(data.url)
      } else {
        setShareError(true)
      }
    } catch (e) {
      setShareError(true)
    }
    setShareLoading(false)
  }

  useEffect(() => {
    generateShareLink()
  }, [expiry, pwEnabled, password])

  function handleTogglePassword(val: boolean) {
    if (val) {
      Alert.prompt(
        '設定密碼',
        '請輸入查看此報告所需的密碼',
        [
          { text: '取消', style: 'cancel' },
          { text: '確認', onPress: (pw?: string) => {
            if (pw && pw.length > 0) {
              setPassword(pw)
              setPwEnabled(true)
            }
          }},
        ],
        'secure-text'
      )
    } else {
      setPwEnabled(false)
      setPassword('')
    }
  }

  async function exportPDF() {
    const user = auth.currentUser
    let nameRaw = ''
    let currentAnonId = anonId
    let profile: any = null
    let allRecords: any[] = []

    if (user) {
      currentAnonId = generateAnonId(user.uid)
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

    const age = profile?.birthYear ? new Date().getFullYear() - parseInt(profile.birthYear) : null
    const bmi = profile?.height && profile?.weight
      ? (parseInt(profile.weight) / Math.pow(parseInt(profile.height) / 100, 2)).toFixed(1)
      : null
    const bmiNum = bmi ? parseFloat(bmi) : null
    const bmiStatus = bmiNum ? (bmiNum < 18.5 ? '偏輕' : bmiNum < 24 ? '正常' : bmiNum < 27 ? '過重' : '肥胖') : '未填寫'

    const riskFactors: string[] = []
    if (profile?.varicocele) riskFactors.push('精索靜脈曲張病史')
    if (profile?.testicularHistory) riskFactors.push('隱睪症／睪丸手術病史')
    if (profile?.endocrineDisease) riskFactors.push('內分泌相關疾病')
    if (profile?.smoke) riskFactors.push(`吸菸${profile?.smokeYears ? `（約 ${profile.smokeYears} 年）` : ''}`)
    if (profile?.occupationType === 'highHeat') riskFactors.push('高溫作業環境')

    const healthSectionHtml = (age || bmi || riskFactors.length > 0) ? `
      <div class="health-section">
        <div class="section-title">個人健康綜合評估</div>
        <table>
          ${age ? `<tr><td class="row-label">年齡</td><td class="row-value">${age} 歲</td></tr>` : ''}
          ${bmi ? `<tr><td class="row-label">BMI</td><td class="row-value">${bmi}（${bmiStatus}）</td></tr>` : ''}
          ${profile?.occupationType ? `<tr><td class="row-label">職業型態</td><td class="row-value">${occupationLabels[profile.occupationType] || '未填寫'}</td></tr>` : ''}
        </table>
        ${riskFactors.length > 0 ? `<div class="risk-box"><div class="risk-title">已知風險因子</div>${riskFactors.map(f => `<div class="risk-item">• ${f}</div>`).join('')}</div>` : ''}
      </div>
    ` : ''

    const sortedRecords = [...records].sort((a: any, b: any) => a.date.localeCompare(b.date))

    const chartWidth = 400
    const chartTop = 24
    const chartBottom = 78
    const maxTC = Math.max(...sortedRecords.map((r: any) => parseFloat(r.tc)), 0.85) * 1.1
    const chartScaleMax = Math.max(1.0, maxTC)

    function yForTC(tc: number) {
      return Math.round(chartBottom - (Math.min(tc, chartScaleMax) / chartScaleMax) * (chartBottom - chartTop))
    }

    const chartPoints = sortedRecords.map((r: any, i: number) => {
      const x = sortedRecords.length > 1
        ? Math.round((i / (sortedRecords.length - 1)) * (chartWidth - 20) + 10)
        : Math.round(chartWidth / 2)
      const y = yForTC(parseFloat(r.tc))
      return { x, y, tc: r.tc, status: r.status, date: r.date }
    })

    const polylinePoints = chartPoints.map((p: any) => `${p.x},${p.y}`).join(' ')

    const chartSvg = sortedRecords.length >= 2 ? `
      <div class="chart-section">
        <div class="section-title">T/C 比值趨勢</div>
        <svg width="100%" height="130" viewBox="0 0 ${chartWidth} 130" style="display:block;">
          <polyline points="${polylinePoints}" fill="none" stroke="#0A5C6B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
          ${chartPoints.map((p: any) => {
            const dotColor = p.status === '正常' ? '#3B6D11' : p.status === '邊緣' ? '#854F0B' : '#A32D2D'
            const valX = Math.max(20, Math.min(chartWidth - 30, p.x))
            return `
              <circle cx="${p.x}" cy="${p.y}" r="4.5" fill="${dotColor}" />
              <text x="${valX}" y="${p.y - 9}" font-size="11" font-weight="600" fill="${dotColor}" text-anchor="middle">${p.tc}</text>
              <text x="${valX}" y="102" font-size="9" fill="#6B7280" text-anchor="middle">${p.date.slice(5)}</text>
            `
          }).join('')}
        </svg>
      </div>
    ` : ''

    function buildRecordCard(r: any) {
      const tcVal = parseFloat(r.tc)
      const conc = Math.round(22 * tcVal / 0.68)
      const cLine = Math.round(tcVal * 142 / 0.68)
      const tLine = Math.round(97 * tcVal / 0.68)
      const badgeColors = getStatusBadgeColors(r.status)
      const abstinenceDays = r.preTestSurvey?.abstinenceDays

      const scoreItems = calcScoreItems(r.preTestSurvey)
      const score = scoreItems.length > 0 ? scoreItems.reduce((s, i) => s + i.score, 0) : null

      const comparableRecords = abstinenceDays != null
        ? allRecords.filter(ar => { const d = ar.preTestSurvey?.abstinenceDays; return d != null && Math.abs(d - abstinenceDays) <= 2 })
        : []
      const trend = comparableRecords.length >= 2
        ? parseFloat(comparableRecords[0].tc) > parseFloat(comparableRecords[1].tc) ? '上升'
          : parseFloat(comparableRecords[0].tc) < parseFloat(comparableRecords[1].tc) ? '下降' : '穩定'
        : null

      const scoreHtml = score != null ? `
        <div class="score-block">
          <div class="score-row">
            <span class="score-label-sm">本次生活習慣評分</span>
            <span class="score-value-sm" style="color:${getScoreColor(score)}">${score} / 100</span>
          </div>
          <table>
            ${scoreItems.map(i => `<tr><td class="row-label-sm">${i.label}（${i.detail}）</td><td class="row-value-sm">${i.score}/${i.max}</td></tr>`).join('')}
          </table>
          ${trend ? `<div class="trend-note-sm">同禁慾天數區間 T/C 趨勢：${trend}</div>` : ''}
        </div>
      ` : ''

      return `
        <div class="record-card">
          <div class="record-header">
            <span class="record-date">${r.date} · ${r.time}</span>
            <span class="badge" style="background:${badgeColors.bg};color:${badgeColors.text}">${r.status}</span>
          </div>
          <div class="tc-big" style="color:${badgeColors.text}">${r.tc}</div>
          <table>
            <tr><td class="row-label">Control line (C)</td><td class="row-value">灰階 ${cLine}</td></tr>
            <tr><td class="row-label">Test line (T)</td><td class="row-value">灰階 ${tLine}</td></tr>
            <tr><td class="row-label">換算濃度</td><td class="row-value">≈ ${conc} mIU/mL</td></tr>
            <tr><td class="row-label">禁慾天數</td><td class="row-value">${abstinenceDays != null ? `${abstinenceDays} 天` : '未記錄'}</td></tr>
            <tr><td class="row-label">試紙批號</td><td class="row-value">${r.lot}</td></tr>
          </table>
          ${scoreHtml}
        </div>
      `
    }

    // ── 手動分頁：第1頁 = 健康評估+趨勢圖+第1筆紀錄，第2頁起每頁固定2筆 ──
    const firstPageRecord = records.length > 0 ? [records[0]] : []
    const remainingRecords = records.slice(1)
    const recordChunks: any[][] = []
    for (let i = 0; i < remainingRecords.length; i += 2) {
      recordChunks.push(remainingRecords.slice(i, i + 2))
    }
    const totalPages = 1 + recordChunks.length

    function pageHeader() {
      return `
        <div class="header">
          <div>
            <div class="brand">iMotile</div>
            <div class="brand-sub">檢測報告</div>
          </div>
          <div class="meta">
            使用者 ${maskedName} · 識別碼 ${currentAnonId}<br/>
            共 ${records.length} 筆紀錄 · ${generatedAt} 產生
          </div>
        </div>
      `
    }

    function pageFooter(pageNum: number) {
      return `
        <div class="footer">
          <div class="page-num">第 ${pageNum} 頁 ／ 共 ${totalPages} 頁</div>
        </div>
      `
    }

    const page1Html = `
      <div class="pdf-page">
        ${pageHeader()}
        <div class="content">
          ${healthSectionHtml}
          ${chartSvg}
          ${firstPageRecord.length > 0 ? `
            <div class="section-title">檢測紀錄明細</div>
            ${buildRecordCard(firstPageRecord[0])}
          ` : ''}
        </div>
        ${pageFooter(1)}
      </div>
    `

    const recordPagesHtml = recordChunks.map((chunk, idx) => `
      <div class="pdf-page page-break">
        ${pageHeader()}
        <div class="content">
          ${chunk.map(buildRecordCard).join('')}
        </div>
        ${pageFooter(idx + 2)}
      </div>
    `).join('')

    const html = `
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { box-sizing: border-box; }
          @page { size: A4; margin: 0; }
          body { font-family: sans-serif; margin: 0; color: #333; background: #FFFFFF; }
          .pdf-page { background: #FFFFFF; width: 100%; height: 100%; padding: 0; position: relative; display: block; flex-direction: column; }
          .page-break { page-break-before: always; break-before: page; }
          .footer {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
          }
            .page-break {
              position: relative;
            }

            .page-break .footer {
              position: absolute;
              bottom: 0;
            }
          .header { width: 100%; padding: 16px 32px 10px; border-bottom: 3px solid #0A5C6B; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
          .brand { font-size: 19px; font-weight: 700; color: #0A5C6B; }
          .brand-sub { font-size: 10px; color: #6B7280; margin-top: 1px; }
          .meta { text-align: right; font-size: 10px; color: #4B5563; line-height: 1.5; }
          .content { width: 100%; padding: 16px 32px; flex: 1; padding-bottom: 80px;}
          .section-title { font-size: 11px; font-weight: 600; color: #4B5563; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
          .health-section { border: 1px solid #E5E7EB; border-radius: 10px; padding: 20px 24px; margin-bottom: 24px; }
          .chart-section { border: 1px solid #E5E7EB; border-radius: 10px; padding: 20px 24px; margin-bottom: 24px; }
          .risk-box { background: #FCEBEB; border-radius: 6px; padding: 7px 10px; margin-top: 6px; }
          .risk-title { font-size: 10px; font-weight: 600; color: #A32D2D; margin-bottom: 2px; }
          .risk-item { font-size: 11px; color: #A32D2D; line-height: 1.4; }
          .record-card { border: 1px solid #E5E7EB; border-radius: 10px; padding: 20px 24px; margin-bottom: 16px; }
          .record-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
          .record-date { font-size: 11px; color: #6B7280; }
          .badge { font-size: 10px; font-weight: 600; padding: 2px 10px; border-radius: 14px; }
          .tc-big { font-size: 24px; font-weight: 700; text-align: center; margin: 4px 0; }
          table { width: 100%; font-size: 11px; border-collapse: collapse; }
          td { padding: 6px 0; }
          .row-label { color: #4B5563; }
          .row-value { text-align: right; color: #111827; }
          .score-block { margin-top: 8px; padding-top: 8px; border-top: 1px dashed #E5E7EB; }
          .score-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
          .score-label-sm { font-size: 11px; font-weight: 600; color: #4B5563; }
          .score-value-sm { font-size: 14px; font-weight: 700; }
          .row-label-sm { color: #6B7280; font-size: 10px; padding: 2px 0; }
          .row-value-sm { text-align: right; color: #111827; font-size: 10px; padding: 2px 0; }
          .trend-note-sm { font-size: 10px; color: #4B5563; margin-top: 4px; line-height: 1.4; }
          .footer { width: 100%; padding: 10px 32px 16px; text-align: center; border-top: 1px solid #E5E7EB; flex-shrink: 0; }
          .page-num { font-size: 13px; font-weight: 700; color: #0A5C6B; letter-spacing: 0.5px; }
        </style>
      </head>
      <body>
        ${page1Html}
        ${recordPagesHtml}
      </body>
      </html>
    `
    try {
      const { uri } = await Print.printToFileAsync({
        html,
        width: 595,
        height: 842,
      })
      const fileName = `iMotile_報告_${new Date().toLocaleDateString('zh-TW').replace(/\//g, '-')}.pdf`
      const newUri = `${FileSystem.documentDirectory}${fileName}`
      await FileSystem.moveAsync({ from: uri, to: newUri })
      await Sharing.shareAsync(newUri, { mimeType: 'application/pdf', dialogTitle: '分享 iMotile 報告' })
    } catch (e: any) {
      Alert.alert('匯出失敗', e?.message || '請再試一次')
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
      if (pwEnabled) {
        Alert.alert(
          '提醒：PDF 為獨立檔案',
          'PDF 檔案會直接下載到裝置，不透過分享連結，因此不受密碼保護。如需密碼保護，建議使用分享連結而非 PDF 檔案。',
          [
            { text: '取消', style: 'cancel' },
            { text: '繼續匯出', onPress: () => exportPDF() },
          ]
        )
        return
      }
      exportPDF()
    })
  }

  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>報告分享連結</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.listCard}>
          <Text style={styles.reportTitle}>iMotile 檢測報告</Text>
          <Text style={[styles.hint, { marginBottom: 8 }]}>共 {records.length} 筆紀錄 · 匿名 ID: {anonId}</Text>
          {records.map((r: any, i: number) => (
            <View key={i} style={[styles.recordRow, i < records.length - 1 && { marginBottom: 8 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.recordDate}>{r.date} · T/C {r.tc}</Text>
                <Text style={styles.hint}>{r.time}</Text>
              </View>
              <View style={[styles.badge, {
                backgroundColor: r.status === '正常' ? colors.successLight :
                r.status === '邊緣' ? colors.warningLight : colors.dangerLight
              }]}>
                <Text style={[styles.badgeText, {
                  color: r.status === '正常' ? colors.success :
                  r.status === '邊緣' ? colors.warning : colors.danger
                }]}>{r.status}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>分享連結</Text>
        <View style={styles.linkBox}>
          <View style={styles.linkUrl}>
            <Text style={styles.linkText} numberOfLines={1}>
              {shareLoading ? '產生連結中...' : shareError ? '產生失敗，請稍後再試' : shareUrl || '尚未產生連結'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.linkBtn}
            disabled={!shareUrl || shareLoading}
            onPress={async () => {
              if (!shareUrl) return
              await Clipboard.setStringAsync(shareUrl)
              Alert.alert('已複製', '連結已複製到剪貼簿')
            }}
          >
            <Text style={[styles.linkBtnText, (!shareUrl || shareLoading) && { opacity: 0.4 }]}>複製連結</Text>
          </TouchableOpacity>
        </View>
        {shareError && (
          <TouchableOpacity onPress={generateShareLink} style={{ marginTop: -8, marginBottom: 14 }}>
            <Text style={{ fontSize: typography.sizes.sm, color: colors.primary }}>重新產生連結 ›</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>快速傳送管道</Text>
          <View style={styles.channelRow}>
            <TouchableOpacity
              style={[styles.channel, !shareUrl && { opacity: 0.4 }]}
              disabled={!shareUrl}
              onPress={() => shareUrl && Linking.openURL(`https://line.me/R/share?text=${encodeURIComponent(shareUrl)}`)}
            >
              <View style={[styles.channelIcon, { backgroundColor: '#06C755' }]}>
                <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
              </View>
              <Text style={styles.channelName}>LINE</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.channel, !shareUrl && { opacity: 0.4 }]}
              disabled={!shareUrl}
              onPress={() => shareUrl && Linking.openURL(`mailto:?subject=iMotile%20檢測報告&body=${encodeURIComponent(shareUrl)}`)}
            >
              <View style={[styles.channelIcon, { backgroundColor: colors.primary }]}>
                <Ionicons name="mail" size={20} color="#fff" />
              </View>
              <Text style={styles.channelName}>Email</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.channel, !shareUrl && { opacity: 0.4 }]}
              disabled={!shareUrl}
              onPress={() => shareUrl && Linking.openURL(`sms:?body=${encodeURIComponent(shareUrl)}`)}
            >
              <View style={[styles.channelIcon, { backgroundColor: '#4B9EFF' }]}>
                <Ionicons name="chatbubble" size={19} color="#fff" />
              </View>
              <Text style={styles.channelName}>訊息</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.channel, !shareUrl && { opacity: 0.4 }]}
              disabled={!shareUrl}
              onPress={() => shareUrl && Share.share({ message: `我的 iMotile 檢測報告：${shareUrl}` })}
            >
              <View style={[styles.channelIcon, { backgroundColor: colors.white, borderWidth: 0.5, borderColor: colors.gray200 }]}>
                <Ionicons name="ellipsis-horizontal" size={20} color={colors.gray500} />
              </View>
              <Text style={styles.channelName}>更多</Text>
            </TouchableOpacity>
          </View>

        <Text style={styles.sectionTitle}>連結設定</Text>
        <View style={styles.listCard}>
          <View style={styles.row}>
            <View>
              <Text style={styles.rowLabel}>連結有效期限</Text>
              <Text style={styles.hint}>連結過期後自動失效</Text>
            </View>
            <TouchableOpacity onPress={() => {
              const options = ['24 小時', '3 天', '7 天', '30 天']
              Alert.alert('選擇有效期限', '', options.map(o => ({ text: o, onPress: () => setExpiry(o) })))
            }}>
              <Text style={styles.expiryValue}>{expiry} ›</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.rowLabel}>需要密碼開啟</Text>
              <Text style={styles.hint}>{pwEnabled ? '開啟 — 分享連結需輸入密碼查看' : '關閉 — 任何人可查閱分享連結'}</Text>
            </View>
            <Switch value={pwEnabled} onValueChange={handleTogglePassword} trackColor={{ true: colors.primary }} />
          </View>
        </View>

        <TouchableOpacity style={styles.pdfBtn} onPress={handleExportPDF}>
          <Ionicons name="document-text-outline" size={16} color={colors.primary} />
          <Text style={styles.pdfBtnText}>匯出 PDF 報告</Text>
          <View style={styles.proBadge}>
            <Text style={styles.proBadgeText}>PRO</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.btnGray} onPress={() => navigation.goBack()}>
            <Text style={styles.btnGrayText}>返回報告</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btnPrimary, !shareUrl && { opacity: 0.4 }]}
            disabled={!shareUrl}
            onPress={async () => {
              if (!shareUrl) return
              await Clipboard.setStringAsync(shareUrl)
              Alert.alert('已複製', '連結已複製到剪貼簿')
              navigation.goBack()
            }}
          >
            <Text style={styles.btnPrimaryText}>複製並返回</Text>
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
  listCard: {
    backgroundColor: colors.white, borderWidth: 0.5, borderColor: colors.gray200,
    borderRadius: 18, padding: 14, marginBottom: 14,
  },
  reportTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  hint: { fontSize: typography.sizes.xs, color: colors.gray400, marginTop: 2 },
  sectionTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.gray500, marginBottom: 8 },
  linkBox: { borderWidth: 1.5, borderColor: colors.primary, borderRadius: 16, overflow: 'hidden', marginBottom: 6 },
  linkUrl: { backgroundColor: colors.primaryLight, padding: 12 },
  linkText: { fontSize: typography.sizes.xs, color: colors.primary, fontFamily: 'monospace' },
  linkBtn: { height: 40, alignItems: 'center', justifyContent: 'center' },
  linkBtnText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.primary },
  channelRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  channel: { flex: 1, alignItems: 'center', gap: 4 },
  channelIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  channelIconText: { fontSize: 18, color: '#fff' },
  channelName: { fontSize: typography.sizes.xs, color: colors.gray500 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 11, borderBottomWidth: 0.5, borderBottomColor: colors.gray100,
  },
  rowLabel: { fontSize: typography.sizes.md, color: colors.gray900 },
  expiryValue: { fontSize: typography.sizes.md, color: colors.primary, fontWeight: typography.weights.medium },
  pdfBtn: {
    height: 46, borderRadius: 23,
    borderWidth: 1.5, borderColor: colors.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginBottom: 8,
  },
  pdfBtnText: { fontSize: typography.sizes.md, color: colors.primary, fontWeight: typography.weights.medium },
  proBadge: { backgroundColor: colors.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  proBadgeText: { fontSize: 9, color: '#fff', fontWeight: typography.weights.medium },
  btnRow: { flexDirection: 'row', gap: 8 },
  btnGray: {
    flex: 1, height: 44, borderRadius: 22, backgroundColor: colors.white, borderWidth: 0.5, borderColor: colors.gray200,
    alignItems: 'center', justifyContent: 'center',
  },
  btnGrayText: { fontSize: typography.sizes.sm, color: colors.gray500 },
  btnPrimary: { flex: 1, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  btnPrimaryText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: '#fff' },
  recordRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recordDate: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.gray900 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.medium },
})