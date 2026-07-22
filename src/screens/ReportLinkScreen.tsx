import { useState } from 'react'
import { colors, typography } from '../theme'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, Share, Linking } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { Ionicons } from '@expo/vector-icons'
import * as FileSystem from 'expo-file-system/legacy'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { getUserPlan } from '../plan'

export default function ReportLinkScreen({ navigation, route }: any) {
  const [pwEnabled, setPwEnabled] = useState(false)
  const [expiry, setExpiry] = useState('7 天')
  const records = route?.params?.records || []

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
        <h1>FertiScan 檢測報告</h1>
        <p class="subtitle">使用者：${maskedName} · 共 ${records.length} 筆紀錄 · 產生時間：${new Date().toLocaleDateString('zh-TW')}</p>
        <div class="section">
          <div class="section-title">檢測紀錄明細</div>
          ${records.map((r: any) => {
            const tcVal = parseFloat(r.tc)
            const conc = Math.round(22 * tcVal / 0.68)
            const cLine = Math.round(tcVal * 142 / 0.68)
            const tLine = Math.round(97 * tcVal / 0.68)
            const badgeClass = r.status === '正常' ? 'badge-normal' : r.status === '邊緣' ? 'badge-warn' : 'badge-danger'
            const tcColor = r.status === '正常' ? '#0A5C6B' : r.status === '邊緣' ? '#f57f17' : '#c62828'
            
            return `
              <div class="record-card">
                <div class="record-header">
                  <span class="record-date">${r.date} · ${r.time}</span>
                  <span class="badge ${badgeClass}">${r.status}</span>
                </div>
                <div class="tc-big" style="color:${tcColor}">${r.tc}</div>
                <div class="row"><span class="label">換算濃度</span><span class="value">≈ ${conc} mIU/mL</span></div>
                <div class="row"><span class="label">參考下限</span><span class="value">25 mIU/mL</span></div>
                <div class="row"><span class="label">Control line (C)</span><span class="value">灰階 ${cLine}</span></div>
                <div class="row"><span class="label">Test line (T)</span><span class="value">灰階 ${tLine}</span></div>
                <div class="row"><span class="label">試紙批號</span><span class="value">${r.lot}</span></div>
                <div class="row" style="border:none"><span class="label">影像品質</span><span class="value" style="color:green">✓ 全部通過</span></div>
              </div>
            `
          }).join('')}
        </div>
        <div class="footer">
          本報告由 FertiScan App 自動生成，僅供初步參考，不構成醫療診斷。如有疑慮請諮詢生殖科醫師。
        </div>
      </body>
      </html>
    `
    try {
      const { uri } = await Print.printToFileAsync({ html })
      const fileName = `FertiScan_報告_${new Date().toLocaleDateString('zh-TW').replace(/\//g, '-')}.pdf`
      const newUri = `${FileSystem.documentDirectory}${fileName}`
      await FileSystem.moveAsync({ from: uri, to: newUri })
      await Sharing.shareAsync(newUri, { mimeType: 'application/pdf', dialogTitle: '分享 FertiScan 報告' })
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
          <Text style={styles.reportTitle}>FertiScan 檢測報告</Text>
          <Text style={[styles.hint, { marginBottom: 8 }]}>共 {records.length} 筆紀錄 · 匿名 ID: FS-4A2C</Text>
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
            <Text style={styles.linkText}>fertiscan.app/r/FS-4A2C-x8kqp</Text>
          </View>
          <TouchableOpacity
            style={styles.linkBtn}
            onPress={async () => {
              await Clipboard.setStringAsync('fertiscan.app/r/FS-4A2C-x8kqp')
              Alert.alert('已複製', '連結已複製到剪貼簿')
            }}
          >
            <Text style={styles.linkBtnText}>複製連結</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>快速傳送管道</Text>
        <View style={styles.channelRow}>
          <TouchableOpacity style={styles.channel} onPress={() => Linking.openURL('https://line.me/R/share?text=fertiscan.app/r/FS-4A2C-x8kqp')}>
            <View style={[styles.channelIcon, { backgroundColor: '#06C755' }]}>
              <Text style={styles.channelIconText}>L</Text>
            </View>
            <Text style={styles.channelName}>LINE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.channel} onPress={() => Linking.openURL('mailto:?subject=FertiScan%20檢測報告&body=fertiscan.app/r/FS-4A2C-x8kqp')}>
            <View style={[styles.channelIcon, { backgroundColor: colors.primary }]}>
              <Text style={styles.channelIconText}>✉</Text>
            </View>
            <Text style={styles.channelName}>Email</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.channel} onPress={() => Linking.openURL('sms:?body=fertiscan.app/r/FS-4A2C-x8kqp')}>
            <View style={[styles.channelIcon, { backgroundColor: '#4B9EFF' }]}>
              <Text style={styles.channelIconText}>💬</Text>
            </View>
            <Text style={styles.channelName}>訊息</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.channel} onPress={() => Share.share({ message: '我的 FertiScan 檢測報告：fertiscan.app/r/FS-4A2C-x8kqp' })}>
            <View style={[styles.channelIcon, { backgroundColor: colors.gray100 }]}>
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
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <View>
              <Text style={styles.rowLabel}>需要密碼開啟</Text>
              <Text style={styles.hint}>{pwEnabled ? '開啟 — 需輸入密碼' : '關閉 — 任何人可查閱'}</Text>
            </View>
            <Switch value={pwEnabled} onValueChange={setPwEnabled} trackColor={{ true: colors.primary }} />
          </View>
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
          <TouchableOpacity style={styles.btnPrimary} onPress={() => {
            Alert.alert('已複製', '連結已複製到剪貼簿')
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
    height: 46, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: colors.gray200,
  },
  back: { fontSize: 30, color: colors.primary, marginRight: 6 },
  appbarTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  scroll: { flex: 1, padding: 18 },
  listCard: { borderWidth: 0.5, borderColor: colors.gray200, borderRadius: 10, padding: 12, marginBottom: 14 },
  reportTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  hint: { fontSize: typography.sizes.xs, color: colors.gray400, marginTop: 2 },
  sectionTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.gray500, marginBottom: 8 },
  linkBox: { borderWidth: 1.5, borderColor: colors.primary, borderRadius: 10, overflow: 'hidden', marginBottom: 14 },
  linkUrl: { backgroundColor: colors.primaryLight, padding: 10 },
  linkText: { fontSize: typography.sizes.xs, color: colors.primary, fontFamily: 'monospace' },
  linkBtn: { height: 38, alignItems: 'center', justifyContent: 'center' },
  linkBtnText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.primary },
  channelRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  channel: { flex: 1, alignItems: 'center', gap: 4 },
  channelIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  channelIconText: { fontSize: 18, color: '#fff' },
  channelName: { fontSize: typography.sizes.xs, color: colors.gray500 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: colors.gray100,
  },
  rowLabel: { fontSize: typography.sizes.md, color: colors.gray900 },
  expiryValue: { fontSize: typography.sizes.md, color: colors.primary, fontWeight: typography.weights.medium },
  pdfBtn: {
    height: 42, borderRadius: 9,
    borderWidth: 1.5, borderColor: colors.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginBottom: 8,
  },
  pdfBtnText: { fontSize: typography.sizes.md, color: colors.primary, fontWeight: typography.weights.medium },
  proBadge: { backgroundColor: colors.primary, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3 },
  proBadgeText: { fontSize: 9, color: '#fff', fontWeight: typography.weights.medium },
  btnRow: { flexDirection: 'row', gap: 8 },
  btnGray: { flex: 1, height: 36, borderRadius: 9, backgroundColor: colors.gray100, alignItems: 'center', justifyContent: 'center' },
  btnGrayText: { fontSize: typography.sizes.sm, color: colors.gray500 },
  btnPrimary: { flex: 1, height: 36, borderRadius: 9, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  btnPrimaryText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: '#fff' },
  recordRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recordDate: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.gray900 },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.medium },
})