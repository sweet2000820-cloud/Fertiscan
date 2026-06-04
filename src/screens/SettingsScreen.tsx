import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native'
import { colors, typography } from '../theme'

export default function SettingsScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <Text style={styles.appbarTitle}>設定</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        <TouchableOpacity style={styles.profileCard} onPress={() => navigation.navigate('Profile')}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>陳</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>陳小明</Text>
            <Text style={styles.profileEmail}>chen@gmail.com · 34 歲</Text>
          </View>
          <Text style={styles.editBtn}>編輯 ›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.planCard} onPress={() => navigation.navigate('Plan')}>
          <View style={styles.planIcon}>
            <Text style={{ fontSize: 18 }}>★</Text>
          </View>
          <View style={styles.planInfo}>
            <View style={styles.planRow}>
              <Text style={styles.planTitle}>目前方案</Text>
              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>免費版</Text>
              </View>
            </View>
            <Text style={styles.planSub}>升級 Pro · 解鎖 AI 深度建議</Text>
          </View>
          <Text style={styles.planArrow}>›</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>檢測設定</Text>
        <View style={styles.listCard}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>通知提醒</Text>
            <Switch value={true} onValueChange={() => {}} trackColor={{ true: colors.primary }} />
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>複測提醒週期</Text>
            <Text style={styles.rowValue}>每 4 週</Text>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.rowLabel}>結果顯示單位</Text>
            <Text style={styles.rowValue}>T/C 比值 + 濃度</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>隱私與資料</Text>
        <View style={styles.listCard}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>資料本機加密</Text>
            <Switch value={true} onValueChange={() => {}} trackColor={{ true: colors.primary }} />
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.rowLabel}>資料上傳雲端</Text>
            <Switch value={false} onValueChange={() => {}} trackColor={{ true: colors.primary }} />
          </View>
        </View>

        <View style={styles.tealCard}>
          <Text style={styles.tealTitle}>隱私說明</Text>
          <Text style={styles.tealText}>所有影像與分析均在手機本地完成，原始影像不會上傳。</Text>
        </View>

        <Text style={styles.sectionTitle}>其他</Text>
        <View style={styles.listCard}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>App 版本</Text>
            <Text style={styles.rowHint}>v1.2.0</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>關於 FertiScan</Text>
            <Text style={styles.rowHint}>›</Text>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={[styles.rowLabel, { color: colors.danger }]}>登出帳號</Text>
            <Text style={styles.rowHint}>›</Text>
          </View>
        </View>

        <Text style={styles.disclaimer}>本產品僅供初步參考，不構成醫療診斷</Text>

      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  appbar: {
    height: 46,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.gray200,
  },
  appbarTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.gray900,
  },
  scroll: { flex: 1, padding: 18 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.gray100,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: typography.weights.medium,
    color: colors.primary,
  },
  profileInfo: { flex: 1 },
  profileName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.gray900,
  },
  profileEmail: { fontSize: typography.sizes.xs, color: colors.gray400, marginTop: 2 },
  editBtn: { fontSize: typography.sizes.sm, color: colors.primary },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0a1628',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  planIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(93,191,204,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planInfo: { flex: 1 },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  planTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: '#fff' },
  freeBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  freeBadgeText: { fontSize: typography.sizes.xs, color: 'rgba(255,255,255,0.5)' },
  planSub: { fontSize: typography.sizes.xs, color: 'rgba(255,255,255,0.45)' },
  planArrow: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.gray500,
    marginBottom: 8,
    marginTop: 4,
  },
  listCard: {
    borderWidth: 0.5,
    borderColor: colors.gray200,
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.gray100,
  },
  rowLabel: { fontSize: typography.sizes.md, color: colors.gray900 },
  rowValue: { fontSize: typography.sizes.md, color: colors.primary },
  rowHint: { fontSize: typography.sizes.md, color: colors.gray400 },
  tealCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  tealTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.primary,
    marginBottom: 4,
  },
  tealText: { fontSize: typography.sizes.xs, color: '#0d7a8f', lineHeight: 18 },
  disclaimer: {
    fontSize: typography.sizes.xs,
    color: colors.gray400,
    textAlign: 'center',
    marginBottom: 20,
  },
})