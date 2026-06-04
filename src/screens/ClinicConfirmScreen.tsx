import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native'
import { colors, typography } from '../theme'
import { useState } from 'react'

export default function ClinicConfirmScreen({ navigation }: any) {
  const [shareTC, setShareTC] = useState(true)
  const [shareHistory, setShareHistory] = useState(true)
  const [shareImage, setShareImage] = useState(false)
  const [autoShare, setAutoShare] = useState(false)

  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>確認連結</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* 診所資訊 */}
        <View style={styles.clinicArea}>
          <View style={styles.clinicIcon}>
            <Text style={styles.clinicIconText}>台生</Text>
          </View>
          <Text style={styles.clinicName}>台北生殖醫學中心</Text>
          <Text style={styles.clinicSub}>台北市中正區 · 李建宏 醫師</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>FertiScan 合作診所</Text>
          </View>
        </View>

        {/* 授權設定 */}
        <View style={styles.listCard}>
          <Text style={styles.sectionTitle}>授權分享設定</Text>
          {[
            { label: 'T/C 比值與換算濃度', sub: '數值結果（不含影像）', value: shareTC, onChange: setShareTC },
            { label: '歷史趨勢（最近 6 次）', sub: '含日期與批號', value: shareHistory, onChange: setShareHistory },
            { label: '原始試紙影像', sub: '每次拍攝的影像檔案', value: shareImage, onChange: setShareImage },
            { label: '自動分享（每次新結果）', sub: '關閉則需每次手動確認', value: autoShare, onChange: setAutoShare },
          ].map((item, i) => (
            <View key={i} style={[styles.row, i === 3 && { borderBottomWidth: 0 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text style={styles.rowSub}>{item.sub}</Text>
              </View>
              <Switch value={item.value} onValueChange={item.onChange} trackColor={{ true: colors.primary }} />
            </View>
          ))}
        </View>

        <View style={styles.tealCard}>
          <Text style={styles.tealText}>連結後診所無法主動讀取您的資料。每次分享時您會收到推播通知確認。您可隨時解除連結。</Text>
        </View>

        <TouchableOpacity style={styles.ctaBtn} onPress={() => navigation.navigate('ClinicSuccess')}>
          <Text style={styles.ctaBtnText}>確認連結診所</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelBtnText}>取消</Text>
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
  back: { fontSize: 22, color: colors.primary, marginRight: 6 },
  appbarTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  scroll: { flex: 1, padding: 18 },
  clinicArea: { alignItems: 'center', paddingVertical: 16, gap: 6, marginBottom: 10 },
  clinicIcon: {
    width: 60, height: 60, borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  clinicIconText: { fontSize: 16, fontWeight: typography.weights.medium, color: colors.primary },
  clinicName: { fontSize: 16, fontWeight: typography.weights.medium, color: colors.gray900 },
  clinicSub: { fontSize: typography.sizes.xs, color: colors.gray400 },
  badge: { backgroundColor: colors.successLight, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: typography.sizes.xs, color: colors.success, fontWeight: typography.weights.medium },
  listCard: {
    borderWidth: 0.5, borderColor: colors.gray200,
    borderRadius: 10, padding: 12, marginBottom: 14,
  },
  sectionTitle: {
    fontSize: typography.sizes.sm, fontWeight: typography.weights.medium,
    color: colors.gray500, marginBottom: 10,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: colors.gray100,
  },
  rowLabel: { fontSize: typography.sizes.md, color: colors.gray900 },
  rowSub: { fontSize: typography.sizes.xs, color: colors.gray400, marginTop: 2 },
  tealCard: { backgroundColor: colors.primaryLight, borderRadius: 10, padding: 12, marginBottom: 14 },
  tealText: { fontSize: typography.sizes.xs, color: '#0d7a8f', lineHeight: 18 },
  ctaBtn: {
    height: 42, borderRadius: 9, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  ctaBtnText: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: '#fff' },
  cancelBtn: {
    height: 36, borderRadius: 9, backgroundColor: colors.gray100,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText: { fontSize: typography.sizes.sm, color: colors.gray500 },
})