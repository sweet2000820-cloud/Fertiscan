import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { colors, typography } from '../theme'
import { getRecords, TestRecord } from '../storage'

const defaultRecords: TestRecord[] = []

function getStatusColor(status: string) {
  switch (status) {
    case '正常': return colors.primary
    case '邊緣': return colors.warning
    default: return colors.danger
  }
}

function getStatusBg(status: string) {
  switch (status) {
    case '正常': return colors.successLight
    case '邊緣': return colors.warningLight
    default: return colors.dangerLight
  }
}

export default function HistoryScreen({ navigation }: any) {
  const [records, setRecords] = useState<TestRecord[]>(defaultRecords)

  useEffect(() => {
    getRecords().then(r => {
      if (r.length > 0) setRecords(r)
    })
  }, [])

  const avg = (records.reduce((s, r) => s + parseFloat(r.tc), 0) / records.length).toFixed(2)
  const max = Math.max(...records.map(r => parseFloat(r.tc))).toFixed(2)
  const min = Math.min(...records.map(r => parseFloat(r.tc))).toFixed(2)

  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <Text style={styles.appbarTitle}>歷史紀錄</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>T/C 比值趨勢（近 {Math.min(records.length, 5)} 次）</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 60, gap: 6, marginBottom: 4 }}>
            {records.slice(0, 5).reverse().map((r, i) => {
              const h = Math.max(8, parseFloat(r.tc) * 70)
              const color = r.status === '正常' ? colors.primary : r.status === '邊緣' ? '#EF9F27' : colors.danger
              return (
                <View key={i} style={{ flex: 1, alignItems: 'stretch', gap: 3 }}>
                  <View style={{ width: '100%', height: h, backgroundColor: color, borderRadius: 2 }} />
                  <Text style={{ fontSize: 8, color: colors.gray400, textAlign: 'center' }}>{r.date.slice(5, 7)}月</Text>
                </View>
              )
            })}
          </View>
          <View style={styles.divider} />
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.hint}>平均</Text>
              <Text style={[styles.statValue, { color: colors.primary }]}>{avg}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.hint}>最高</Text>
              <Text style={[styles.statValue, { color: colors.success }]}>{max}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.hint}>最低</Text>
              <Text style={[styles.statValue, { color: colors.danger }]}>{min}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>所有紀錄</Text>
        {records.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>尚無檢測紀錄</Text>
            <Text style={styles.emptyHint}>完成第一次檢測後將顯示於此</Text>
          </View>
        ) : (
        <View style={styles.listCard}>
          {records.map((r, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.row, i === records.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => navigation.getParent()?.navigate('ReportOverview', { record: r })}
            >
              <View>
                <Text style={styles.date}>{r.date}</Text>
                <Text style={styles.hint}>{r.time} · {r.lot}</Text>
              </View>
              <View style={styles.right}>
                <Text style={[styles.tc, { color: getStatusColor(r.status) }]}>{r.tc}</Text>
                <View style={[styles.badge, { backgroundColor: getStatusBg(r.status) }]}>
                  <Text style={[styles.badgeText, { color: getStatusColor(r.status) }]}>{r.status}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        )}

      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  appbar: {
    height: 46, justifyContent: 'center',
    paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: colors.gray200,
  },
  appbarTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  scroll: { flex: 1, padding: 18 },
  card: { backgroundColor: colors.gray100, borderRadius: 10, padding: 12, marginBottom: 14 },
  sectionTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.gray500, marginBottom: 8 },
  divider: { height: 0.5, backgroundColor: colors.gray200, marginVertical: 8 },
  statsRow: { flexDirection: 'row' },
  statItem: { flex: 1, alignItems: 'center' },
  hint: { fontSize: typography.sizes.sm, color: colors.gray400 },
  statValue: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, marginTop: 2 },
  listCard: { borderWidth: 0.5, borderColor: colors.gray200, borderRadius: 10, paddingHorizontal: 14 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: colors.gray100,
  },
  date: { fontSize: typography.sizes.md, color: colors.gray500 },
  right: { alignItems: 'flex-end', gap: 4 },
  tc: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.medium },
  emptyCard: { alignItems: 'center', paddingVertical: 40, gap: 6 },
  emptyText: { fontSize: typography.sizes.md, color: colors.gray500 },
  emptyHint: { fontSize: typography.sizes.sm, color: colors.gray400 },
})