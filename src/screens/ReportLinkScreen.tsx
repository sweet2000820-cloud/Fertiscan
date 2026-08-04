import { useState, useEffect } from 'react'
import { colors, typography } from '../theme'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, Share, Linking, ActivityIndicator, TextInput } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { Ionicons } from '@expo/vector-icons'
import * as FileSystem from 'expo-file-system/legacy'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { getUserPlan } from '../plan'

// 後端 API 網址。imotile.app 網域正式綁定 Render 後，把 API_BASE 改成 https://imotile.app 即可
const API_BASE = 'https://fertiscan-api.onrender.com'
// 分享連結顯示用的網域。目前 imotile.app 尚未指向後端，實際能開啟的網址是 API_BASE + /r/{id}
// 待網域設定完成後，SHARE_DOMAIN 改成 'imotile.app' 就會跟畫面顯示、實際連結一致
const SHARE_DOMAIN = 'fertiscan-api.onrender.com'

// ⚠️ 換算公式為前端暫時推估值，非真實校準結果，待批號校準曲線完成後需整支替換
const CONCENTRATION_FACTOR = 22
const C_LINE_FACTOR = 142
const T_LINE_FACTOR = 97
const CALIBRATION_DIVISOR = 0.68
// ⚠️ 參考下限尚未對應任何醫學實際標準或後端設定值，待確認
const REFERENCE_LOWER_LIMIT = 25

function calcMetrics(tc: string) {
  const tcVal = parseFloat(tc)
  return {
    conc: Math.round(CONCENTRATION_FACTOR * tcVal / CALIBRATION_DIVISOR),
    cLine: Math.round(tcVal * C_LINE_FACTOR / CALIBRATION_DIVISOR),
    tLine: Math.round(T_LINE_FACTOR * tcVal / CALIBRATION_DIVISOR),
  }
}

// 依使用者 UID 產生穩定的匿名代碼，同一使用者每次產生的代碼相同，但不同使用者不會撞號
function generateAnonymousId(uid: string) {
  let hash = 0
  for (let i = 0; i < uid.length; i++) {
    hash = (hash * 31 + uid.charCodeAt(i)) >>> 0
  }
  return 'FS-' + hash.toString(36).toUpperCase().padStart(4, '0').slice(-4)
}

export default function ReportLinkScreen({ navigation, route }: any) {
  const [pwEnabled, setPwEnabled] = useState(false)
  const [password, setPassword] = useState('')
  const [expiry, setExpiry] = useState('7 天')
  const [anonymousId, setAnonymousId] = useState('')
  const [shareId, setShareId] = useState('')
  const [creating, setCreating] = useState(true)
  const records = route?.params?.records || []

  const expiryHoursMap: Record<string, number> = {
    '24 小時': 24, '3 天': 72, '7 天': 168, '30 天': 720,
  }

  async function createShare() {
    if (pwEnabled && !password.trim()) {
      // 密碼開關開著卻沒輸入密碼，不送出請求
      return
    }
    setCreating(true)
    try {
      const res = await fetch(`${API_BASE}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records: records.map((r: any) => ({
            date: r.date,
            time: r.time,
            tc: r.tc,
            status: r.status,
            lot: r.lot,
            qualityPassed: r.qualityPassed !== false,
          })),
          expiry_hours: expiryHoursMap[expiry] ?? 168,
          password: pwEnabled ? password : null,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setShareId(json.share_id)
      } else {
        Alert.alert('產生連結失敗', '請稍後再試')
      }
    } catch (e) {
      Alert.alert('連線失敗', '無法連上伺服器，請確認網路連線後再試一次')
    } finally {
      setCreating(false)
    }
  }

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (uid) setAnonymousId(generateAnonymousId(uid))
    createShare()
  }, [])

  // 有效期限、密碼開關、密碼內容變更時，延遲 600ms 後重新產生分享連結
  // 用 debounce 避免使用者打密碼時每個字都觸發一次 API
  useEffect(() => {
    if (creating) return
    if (pwEnabled && !password.trim()) return
    const timer = setTimeout(() => {
      createShare()
    }, 600)
    return () => clearTimeout(timer)
  }, [expiry, pwEnabled, password])

  const shareUrl = shareId ? `${SHARE_DOMAIN}/r/${shareId}` : ''

  // 只要有任一筆紀錄的 qualityPassed 明確為 false，就視為未全部通過
  // 目前後端影像分析（main.py）沒有留 log、不回傳這個欄位，所以現階段預設為 true（尚無法真正判斷）
  const allQualityPassed = records.every((r: any) => r.qualityPassed !== false)

  async function copyLink() {
    if (!shareUrl) return
    await Clipboard.setStringAsync(shareUrl)
    Alert.alert('已複製', '連結已複製到剪貼簿')
  }

  async function exportPDF() {
    const user = auth.currentUser
    let nameRaw = ''
    if (user) {
      const snap = await getDoc(doc(db, 'users', user.uid))
      if (snap.exists()) {
        const data: any = snap.data()
        nameRaw = data.name || ''
      }
    }
    const maskedName = nameRaw.length > 0
      ? nameRaw.slice(0, 1) + '○' + (nameRaw.length > 2 ? nameRaw.slice(-1) : '')
      : '使用者'
    const html = `
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: sans-serif; padding: 40px; color: #333; }
          h1 { color: #0A5C6B; font-size: 24px; margin-bottom: 4px; }
          .subtitle { color: #888; font-size: 14px; margin-bottom: 30px; }
          .section { margin-bottom: 24px; }
          .section-title { color: #0A5C6B; font-size: 16px; font-weight: bold; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 6px; }
          .record-card { border: 1px solid #eee; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
          .record-header { display: flex; justify-content: space-between; margin-bottom: 12px; }
          .record-date { font-size: 14px; font-weight: bold; color: #333; }
          .tc-big { font-size: 36px; font-weight: bold; text-align: center; margin: 12px 0; }
          .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f5f5f5; }
          .label { color: #888; font-size: 13px; }
          .value { font-size: 13px; font-weight: bold; }
          .badge { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; }
          .badge-normal { background: #e6f4ea; color: #2e7d32; }
          .badge-warn { background: #fff8e1; color: #f57f17; }
          .badge-danger { background: #fdecea; color: #c62828; }
          .footer { margin-top: 40px; font-size: 11px; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 16px; }
        </style>
      </head>
      <body>
        <h1>iMotile 檢測報告</h1>
        <p class="subtitle">使用者：${maskedName} · 共 ${records.length} 筆紀錄 · 產生時間：${new Date().toLocaleDateString('zh-TW')}</p>
        <div class="section">
          <div class="section-title">檢測紀錄明細</div>
          ${records.map((r: any) => {
            const { conc, cLine, tLine } = calcMetrics(r.tc)
            const badgeClass = r.status === '正常' ? 'badge-normal' : r.status === '邊緣' ? 'badge-warn' : 'badge-danger'
            const tcColor = r.status === '正常' ? '#0A5C6B' : r.status === '邊緣' ? '#f57f17' : '#c62828'
            const qualityOk = r.qualityPassed !== false

            return `
              <div class="record-card">
                <div class="record-header">
                  <span class="record-date">${r.date} · ${r.time}</span>
                  <span class="badge ${badgeClass}">${r.status}</span>
                </div>
                <div class="tc-big" style="color:${tcColor}">${r.tc}</div>
                <div class="row"><span class="label">換算濃度（推估值）</span><span class="value">≈ ${conc} mIU/mL</span></div>
                <div class="row"><span class="label">參考下限</span><span class="value">${REFERENCE_LOWER_LIMIT} mIU/mL</span></div>
                <div class="row"><span class="label">Control line (C)</span><span class="value">灰階 ${cLine}</span></div>
                <div class="row"><span class="label">Test line (T)</span><span class="value">灰階 ${tLine}</span></div>
                <div class="row"><span class="label">試紙批號</span><span class="value">${r.lot}</span></div>
                <div class="row" style="border:none"><span class="label">影像品質</span><span class="value" style="color:${qualityOk ? 'green' : '#c62828'}">${qualityOk ? '✓ 通過' : '⚠ 需確認'}</span></div>
              </div>
            `
          }).join('')}
        </div>
        <div class="footer">
          本報告由 iMotile App 自動生成，濃度換算為推估值，僅供初步參考，不構成醫療診斷。如有疑慮請諮詢生殖科醫師。
        </div>
      </body>
      </html>
    `
    try {
      const { uri } = await Print.printToFileAsync({ html })
      const fileName = `iMotile_報告_${new Date().toLocaleDateString('zh-TW').replace(/\//g, '-')}.pdf`
      const newUri = `${FileSystem.documentDirectory}${fileName}`
      await FileSystem.moveAsync({ from: uri, to: newUri })
      await Sharing.shareAsync(newUri, { mimeType: 'application/pdf', dialogTitle: '分享 iMotile 報告' })
     } catch (e: any) {
      Alert.alert('匯出失敗', e?.message || '請再試一次')
     }
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
          <Text style={[styles.hint, { marginBottom: 8 }]}>共 {records.length} 筆紀錄 · 匿名 ID: {anonymousId || '產生中...'}</Text>
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
            {creating ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.linkText}>產生連結中...</Text>
              </View>
            ) : pwEnabled && !password.trim() ? (
              <Text style={styles.linkText}>請先設定密碼</Text>
            ) : (
              <Text style={styles.linkText}>{shareUrl || '連結產生失敗'}</Text>
            )}
          </View>
          <TouchableOpacity style={styles.linkBtn} onPress={copyLink} disabled={!shareUrl}>
            <Text style={styles.linkBtnText}>複製連結</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>快速傳送管道</Text>
        <View style={styles.channelRow}>
          <TouchableOpacity
            style={styles.channel}
            disabled={!shareUrl}
            onPress={() => Linking.openURL(`https://line.me/R/share?text=${encodeURIComponent(shareUrl)}`)}
          >
            <View style={[styles.channelIcon, { backgroundColor: '#06C755' }]}>
              <Text style={styles.channelIconText}>L</Text>
            </View>
            <Text style={styles.channelName}>LINE</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.channel}
            disabled={!shareUrl}
            onPress={() => Linking.openURL(`mailto:?subject=iMotile%20檢測報告&body=${encodeURIComponent(shareUrl)}`)}
          >
            <View style={[styles.channelIcon, { backgroundColor: colors.primary }]}>
              <Text style={styles.channelIconText}>✉</Text>
            </View>
            <Text style={styles.channelName}>Email</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.channel}
            disabled={!shareUrl}
            onPress={() => Linking.openURL(`sms:?body=${encodeURIComponent(shareUrl)}`)}
          >
            <View style={[styles.channelIcon, { backgroundColor: '#4B9EFF' }]}>
              <Text style={styles.channelIconText}>💬</Text>
            </View>
            <Text style={styles.channelName}>訊息</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.channel}
            disabled={!shareUrl}
            onPress={() => Share.share({ message: `我的 iMotile 檢測報告：${shareUrl}` })}
          >
            <View style={[styles.channelIcon, { backgroundColor: colors.white, borderWidth: 0.5, borderColor: colors.gray200 }]}>
              <Text style={[styles.channelIconText, { color: colors.gray500 }]}>···</Text>
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
          <View style={[styles.row, { borderBottomWidth: pwEnabled ? 0.5 : 0 }]}>
            <View>
              <Text style={styles.rowLabel}>需要密碼開啟</Text>
              <Text style={styles.hint}>{pwEnabled ? '開啟 — 需輸入密碼' : '關閉 — 任何人可查閱'}</Text>
            </View>
            <Switch value={pwEnabled} onValueChange={(v) => {
              setPwEnabled(v)
              if (!v) setPassword('')
            }} trackColor={{ true: colors.primary }} />
          </View>
          {pwEnabled && (
            <View style={{ paddingVertical: 11, borderBottomWidth: 0 }}>
              <TextInput
                style={styles.pwInput}
                placeholder="設定分享密碼"
                placeholderTextColor={colors.gray400}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.pdfBtn}
          onPress={async () => {
              const { plan } = await getUserPlan()
              if (plan === 'pro') {
              exportPDF()
            } else {
              Alert.alert('Pro 功能', 'PDF 報告匯出為 Pro 版專屬功能。', [
                { text: '稍後再說', style: 'cancel' },
                { text: '升級 Pro', onPress: () => navigation.navigate('Plan') },
              ])
            }
          }}
        >
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
          <TouchableOpacity style={styles.btnPrimary} onPress={async () => {
            if (shareUrl) await copyLink()
            navigation.goBack()
          }}>
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
    paddingTop: 10, paddingHorizontal: 18, paddingBottom: 20,
  },
  back: { fontSize: 40, color: colors.primary, marginRight: 6, paddingBottom: 4  },
  appbarTitle: { flex: 1, fontSize: 22, fontWeight: '600', color: colors.gray900 },
  scroll: { flex: 1, paddingHorizontal: 18 },
  listCard: {
    backgroundColor: colors.white, borderWidth: 0.5, borderColor: colors.gray200,
    borderRadius: 18, padding: 14, marginBottom: 14,
  },
  reportTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  hint: { fontSize: typography.sizes.xs, color: colors.gray400, marginTop: 2 },
  sectionTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.gray500, marginBottom: 8 },
  linkBox: { borderWidth: 1.5, borderColor: colors.primary, borderRadius: 16, overflow: 'hidden', marginBottom: 14 },
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
  pwInput: {
    height: 44, borderWidth: 0.5, borderColor: colors.gray300,
    borderRadius: 12, paddingHorizontal: 14,
    fontSize: typography.sizes.md, color: colors.gray900,
  },
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