import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { colors, typography } from '../theme'
import { useState } from 'react'

export default function ConsentScreen({ navigation, route }: any) {
  const clinicName = route?.params?.clinicName || '台北生殖醫學中心'
  const doctor = route?.params?.doctor || '李建宏 醫師'
  const [scrolled, setScrolled] = useState(false)
  const [checked, setChecked] = useState([false, false, false])
  const allChecked = checked.every(c => c)

  function toggleCheck(i: number) {
    if (!scrolled) return
    const next = [...checked]
    next[i] = !next[i]
    setChecked(next)
  }

  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>資料授權同意書</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* 診所資訊 */}
        <View style={styles.clinicRow}>
          <View style={styles.clinicIcon}>
            <Text style={styles.clinicIconText}>{clinicName.slice(0, 2)}</Text>
          </View>
          <View>
            <Text style={styles.clinicName}>{clinicName}</Text>
            <Text style={styles.clinicSub}>{doctor} · FertiScan 合作診所</Text>
          </View>
        </View>

        {/* 同意書文字 */}
        <ScrollView
          style={styles.docBox}
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent
            if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 20) {
              setScrolled(true)
            }
          }}
          scrollEventThrottle={16}
        >
          <Text style={styles.docTitle}>個人健康資料提供同意書</Text>
          <Text style={styles.docText}>
            {'一、資料蒐集目的\n本人同意將透過 FertiScan 所產生之檢測數據，提供予上述醫療機構，用於輔助醫師進行生殖健康評估與診療建議。\n\n二、去識別化處理\n所有分享至醫療機構之資料，將進行去識別化處理：\n· 移除姓名、身份證字號、聯絡資訊\n· 以匿名代碼取代個人識別符\n· 出生年月日僅保留年份\n\n三、分享資料範圍\n· T/C 比值與換算濃度數值\n· 歷史檢測趨勢（最多 6 次）\n· 生活習慣問卷結果（去識別化）\n\n四、您的權利\n· 可隨時在設定中解除授權\n· 診所無法主動讀取您的資料\n· 有權要求刪除已接收的資料\n\n五、資料保存期限\n醫療機構依醫療法規保存資料；FertiScan 授權記錄保存至解除連結後 30 天。'}
          </Text>
        </ScrollView>

        <Text style={styles.scrollHint}>
          {scrolled ? '✓ 已閱讀完畢，請勾選下方同意項目' : 'ℹ 請向下捲動閱讀完整同意書後才可勾選'}
        </Text>

        {/* 勾選項 */}
        {[
          { title: '我已閱讀並了解同意書全部內容', sub: '包含去識別化方式與我的資料權利' },
          { title: '我同意將去識別化資料分享給', sub: `${clinicName} · ${doctor}` },
          { title: '我了解可隨時在設定中撤回此授權', sub: '撤回後診所將無法再接收新資料' },
        ].map((item, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.checkCard, checked[i] && styles.checkCardSelected, !scrolled && { opacity: 0.4 }]}
            onPress={() => toggleCheck(i)}
            disabled={!scrolled}
          >
            <View style={[styles.checkbox, checked[i] && styles.checkboxDone]}>
              {checked[i] && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.checkTitle}>{item.title}</Text>
              <Text style={[styles.checkSub, checked[i] && { color: colors.primary }]}>{item.sub}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.ctaBtn, !allChecked && { opacity: 0.4 }]}
          onPress={() => allChecked && navigation.navigate('ClinicConfirm', { clinicName, doctor })}
          disabled={!allChecked}
        >
          <Text style={styles.ctaBtnText}>同意並繼續設定授權範圍 ›</Text>
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
  clinicRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, marginBottom: 10 },
  clinicIcon: {
    width: 42, height: 42, borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  clinicIconText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.primary },
  clinicName: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  clinicSub: { fontSize: typography.sizes.xs, color: colors.gray400 },
  docBox: {
    height: 220, borderWidth: 0.5, borderColor: colors.gray200,
    borderRadius: 10, padding: 12, marginBottom: 8,
  },
  docTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.gray900, textAlign: 'center', marginBottom: 10 },
  docText: { fontSize: typography.sizes.xs, color: colors.gray500, lineHeight: 20 },
  scrollHint: { fontSize: typography.sizes.xs, color: colors.gray400, marginBottom: 12 },
  checkCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    padding: 10, borderRadius: 8, borderWidth: 1,
    borderColor: colors.gray200, marginBottom: 8,
  },
  checkCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  checkbox: {
    width: 16, height: 16, borderRadius: 4,
    borderWidth: 1.5, borderColor: colors.gray300,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  checkboxDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { fontSize: 10, color: '#fff' },
  checkTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.gray900 },
  checkSub: { fontSize: typography.sizes.xs, color: colors.gray400, marginTop: 2 },
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