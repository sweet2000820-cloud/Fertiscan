import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { colors, typography } from '../theme'
import Button from '../components/Button'

export default function DashboardScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      
      {/* AppBar */}
      <View style={styles.appbar}>
        <Text style={styles.appbarTitle}>FertiScan</Text>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>陳</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        
        <Text style={styles.greeting}>早安，陳小明</Text>

        <View style={styles.tealCard}>
          <Text style={styles.cardTitle}>近 4 次 T/C 比值趨勢</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 60, gap: 6, marginBottom: 4 }}>
            <View style={{ flex: 1, alignItems: 'stretch', gap: 3 }}>
              <View style={{ width: '100%', height: 44, backgroundColor: colors.primary, borderRadius: 2 }} />
              <Text style={{ fontSize: 8, color: colors.gray400 }}>2月</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'stretch', gap: 3 }}>
              <View style={{ width: '100%', height: 28, backgroundColor: '#EF9F27', borderRadius: 2 }} />
              <Text style={{ fontSize: 8, color: colors.gray400 }}>3月</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'stretch', gap: 3 }}>
              <View style={{ width: '100%', height: 50, backgroundColor: colors.primary, borderRadius: 2 }} />
              <Text style={{ fontSize: 8, color: colors.gray400 }}>4月</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'stretch', gap: 3 }}>
              <View style={{ width: '100%', height: 35, backgroundColor: '#EF9F27', borderRadius: 2 }} />
              <Text style={{ fontSize: 8, color: colors.warning, fontWeight: '500' }}>最近</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.hint}>平均 T/C 比值</Text>
            <Text style={styles.avgValue}>0.74</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.hint}>上次檢測</Text>
            <Text style={styles.statValue}>12天前</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.hint}>試紙剩餘</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>3 片</Text>
          </View>
        </View>

        <Button title="開始新一次檢測" onPress={() => navigation.navigate('PreCheck')} />

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>最近紀錄</Text>

        <TouchableOpacity style={styles.historyRow} onPress={() => navigation.navigate('ReportOverview')}>
          <View>
            <Text style={styles.historyDate}>2026/04/23</Text>
            <Text style={styles.hint}>上午 8:15</Text>
          </View>
          <View style={styles.historyRight}>
            <Text style={[styles.tcValue, { color: colors.warning }]}>T/C 0.68</Text>
            <View style={styles.badgeWarn}>
              <Text style={styles.badgeWarnText}>邊緣</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.historyRow} onPress={() => navigation.navigate('ReportOverview')}>
          <View>
            <Text style={styles.historyDate}>2026/03/10</Text>
            <Text style={styles.hint}>上午 9:02</Text>
          </View>
          <View style={styles.historyRight}>
            <Text style={[styles.tcValue, { color: colors.primary }]}>T/C 0.91</Text>
            <View style={styles.badgeGood}>
              <Text style={styles.badgeGoodText}>正常</Text>
            </View>
          </View>
        </TouchableOpacity>

      </ScrollView>

      {/* AI FAB 按鈕 */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AIChat')}>
        <Text style={styles.fabText}>AI</Text>
      </TouchableOpacity>

    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white},
  appbar: {
    height: 56, flexDirection: 'row', alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: colors.gray200,
  },
  appbarTitle: { flex: 1, fontSize: typography.sizes.lg, fontWeight: typography.weights.medium, color: colors.primary },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.medium, color: colors.primary },
  scroll: { flex: 1, padding: 18 },
  greeting: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900, marginBottom: 10 },
  tealCard: { backgroundColor: colors.primaryLight, borderRadius: 10, padding: 12, marginBottom: 10 },
  cardTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.primary, marginBottom: 8 },
  divider: { height: 0.5, backgroundColor: colors.gray200, marginVertical: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  hint: { fontSize: typography.sizes.sm, color: colors.gray400 },
  avgValue: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.primary },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  statCard: { flex: 1, backgroundColor: colors.gray100, borderRadius: 10, padding: 12 },
  statValue: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900, marginTop: 3 },
  sectionTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray500, marginBottom: 6 },
  historyRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 9, borderBottomWidth: 0.5, borderBottomColor: colors.gray100,
  },
  historyDate: { fontSize: typography.sizes.md, color: colors.gray500 },
  historyRight: { alignItems: 'flex-end', gap: 3 },
  tcValue: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium },
  badgeWarn: { backgroundColor: colors.warningLight, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  badgeWarnText: { fontSize: typography.sizes.xs, color: colors.warning, fontWeight: typography.weights.medium },
  badgeGood: { backgroundColor: colors.successLight, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  badgeGoodText: { fontSize: typography.sizes.xs, color: colors.success, fontWeight: typography.weights.medium },
  fab: {
    position: 'absolute', bottom: 30, right: 20,
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  fabText: { color: '#fff', fontSize: 23, fontWeight: typography.weights.medium },
})