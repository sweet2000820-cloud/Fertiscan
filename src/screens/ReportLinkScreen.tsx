import { useState } from 'react'
import { colors, typography } from '../theme'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, Share, Linking } from 'react-native'
import * as Clipboard from 'expo-clipboard'

export default function ReportLinkScreen({ navigation }: any) {
  const [pwEnabled, setPwEnabled] = useState(false)
  const [expiry, setExpiry] = useState('7 天')

  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>報告分享連結</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* 報告預覽 */}
        <View style={styles.listCard}>
          <View style={styles.reportHeader}>
            <View>
              <Text style={styles.reportTitle}>FertiScan 檢測報告</Text>
              <Text style={styles.hint}>2026/04/23 · 匿名 ID: FS-4A2C</Text>
            </View>
            <View style={styles.badgeWarn}>
              <Text style={styles.badgeWarnText}>邊緣值</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>T/C 比值</Text>
              <Text style={[styles.statValue, { color: colors.warning }]}>0.68</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>換算濃度</Text>
              <Text style={[styles.statValue, { color: colors.warning }]}>22 mIU/mL</Text>
            </View>
          </View>
        </View>

        {/* 連結框 */}
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

        {/* 快速傳送 */}
       <Text style={styles.sectionTitle}>快速傳送管道</Text>
        <View style={styles.channelRow}>
          <TouchableOpacity
            style={styles.channel}
            onPress={() => Linking.openURL('https://line.me/R/share?text=fertiscan.app/r/FS-4A2C-x8kqp')}
          >
            <View style={[styles.channelIcon, { backgroundColor: '#06C755' }]}>
              <Text style={styles.channelIconText}>L</Text>
            </View>
            <Text style={styles.channelName}>LINE</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.channel}
            onPress={() => Linking.openURL('mailto:?subject=FertiScan%20檢測報告&body=fertiscan.app/r/FS-4A2C-x8kqp')}
          >
            <View style={[styles.channelIcon, { backgroundColor: colors.primary }]}>
              <Text style={styles.channelIconText}>✉</Text>
            </View>
            <Text style={styles.channelName}>Email</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.channel}
            onPress={() => Linking.openURL('sms:?body=fertiscan.app/r/FS-4A2C-x8kqp')}
          >
            <View style={[styles.channelIcon, { backgroundColor: '#4B9EFF' }]}>
              <Text style={styles.channelIconText}>💬</Text>
            </View>
            <Text style={styles.channelName}>訊息</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.channel}
            onPress={() => Share.share({ message: '我的 FertiScan 檢測報告：fertiscan.app/r/FS-4A2C-x8kqp' })}
          >
            <View style={[styles.channelIcon, { backgroundColor: colors.gray100 }]}>
              <Text style={[styles.channelIconText, { color: colors.gray500 }]}>···</Text>
            </View>
            <Text style={styles.channelName}>更多</Text>
          </TouchableOpacity>
        </View>

        {/* 連結設定 */}
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

        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.btnGray} onPress={() => navigation.goBack()}>
            <Text style={styles.btnGrayText}>返回報告</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => {
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
    height: 46, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: colors.gray200,
  },
  back: { fontSize: 22, color: colors.primary, marginRight: 6 },
  appbarTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  scroll: { flex: 1, padding: 18 },
  listCard: { borderWidth: 0.5, borderColor: colors.gray200, borderRadius: 10, padding: 12, marginBottom: 14 },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  reportTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  hint: { fontSize: typography.sizes.xs, color: colors.gray400, marginTop: 2 },
  badgeWarn: { backgroundColor: colors.warningLight, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  badgeWarnText: { fontSize: typography.sizes.xs, color: colors.warning, fontWeight: typography.weights.medium },
  statsRow: { flexDirection: 'row', gap: 8 },
  statBox: { flex: 1, backgroundColor: colors.gray100, borderRadius: 6, padding: 8, alignItems: 'center' },
  statLabel: { fontSize: typography.sizes.xs, color: colors.gray400, marginBottom: 2 },
  statValue: { fontSize: 18, fontWeight: typography.weights.medium },
  sectionTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.gray500, marginBottom: 8 },
  linkBox: { borderWidth: 1.5, borderColor: colors.primary, borderRadius: 10, overflow: 'hidden', marginBottom: 14 },
  linkUrl: { backgroundColor: colors.primaryLight, padding: 10 },
  linkText: { fontSize: typography.sizes.xs, color: colors.primary, fontFamily: 'monospace' },
  linkBtns: { flexDirection: 'row', backgroundColor: colors.white },
  linkBtn: { flex: 1, height: 38, alignItems: 'center', justifyContent: 'center' },
  linkBtnText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.primary },
  linkBtnDivider: { width: 0.5, backgroundColor: colors.gray200 },
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
  btnRow: { flexDirection: 'row', gap: 8 },
  btnGray: { flex: 1, height: 36, borderRadius: 9, backgroundColor: colors.gray100, alignItems: 'center', justifyContent: 'center' },
  btnGrayText: { fontSize: typography.sizes.sm, color: colors.gray500 },
  btnPrimary: { flex: 1, height: 36, borderRadius: 9, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  btnPrimaryText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: '#fff' },
})