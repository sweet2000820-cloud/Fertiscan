import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { colors, typography } from '../theme'
import { getRecords, TestRecord } from '../storage'
import { Ionicons } from '@expo/vector-icons'

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
  const [records, setRecords] = useState<TestRecord[]>([])
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState<number[]>([])

  useEffect(() => {
    getRecords().then(r => {
      if (r.length > 0) setRecords(r)
    })
  }, [])

  const avg = records.length > 0 ? (records.reduce((s, r) => s + parseFloat(r.tc), 0) / records.length).toFixed(2) : '—'
  const max = records.length > 0 ? Math.max(...records.map(r => parseFloat(r.tc))).toFixed(2) : '—'
  const min = records.length > 0 ? Math.min(...records.map(r => parseFloat(r.tc))).toFixed(2) : '—'

  function toggleSelect(i: number) {
    setSelected(prev => prev.includes(i) ? prev.filter(s => s !== i) : [...prev, i])
  }

  function handleExport() {
    if (selected.length === 0) {
      Alert.alert('請選擇紀錄', '請先勾選要匯出的紀錄')
      return
    }
    const selectedRecords = selected.map(i => records[i])
    Alert.alert(
      `已選 ${selected.length} 筆紀錄`,
      '請選擇要執行的動作',
      [
        { text: '取消', style: 'cancel' },
        { text: '分享給診所', onPress: () => {
          navigation.getParent()?.navigate('ShareRecord')
          setSelectMode(false)
          setSelected([])
        }},
        { text: '產生分享連結 / PDF', onPress: () => {
          navigation.getParent()?.navigate('ReportLink', { records: selectedRecords })
          setSelectMode(false)
          setSelected([])
        }},
      ]
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <Text style={styles.appbarTitle}>歷史紀錄</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>T/C 比值趨勢（近 {Math.min(records.length, 5)} 次）</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 6, marginBottom: 4 }}>
            {records.slice(0, 5).reverse().map((r, i) => {
              const h = Math.max(8, parseFloat(r.tc) * 70)
              const color = r.status === '正常' ? colors.primary : r.status === '邊緣' ? '#EF9F27' : colors.danger
              return (
                <View key={i} style={{ flex: 1, alignItems: 'stretch', gap: 3 }}>
                  <View style={{ width: '100%', height: h, backgroundColor: color, borderRadius: 2 }} />
                  <Text style={{ fontSize: 8, color: colors.gray400, textAlign: 'center' }}>{r.date.slice(5, 7) + '/' + r.date.slice(8, 10)}</Text>
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

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={styles.sectionTitle}>所有紀錄</Text>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            {selectMode && (
              <TouchableOpacity onPress={() => setSelected(records.map((_, i) => i))}>
                <Text style={{ fontSize: typography.sizes.xs, color: colors.primary }}>全選</Text>
              </TouchableOpacity>
            )}
            {records.length > 0 && (
              <TouchableOpacity
                style={[styles.selectModeBtn, selectMode && { backgroundColor: colors.primary }]}
                onPress={() => { setSelectMode(!selectMode); setSelected([]) }}
              >
                <Ionicons name="checkmark-circle-outline" size={14} color={selectMode ? '#fff' : colors.primary} />
                <Text style={[styles.selectModeBtnText, selectMode && { color: '#fff' }]}>
                  {selectMode ? '取消選擇' : '選擇匯出'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

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
                style={[styles.row, i === records.length - 1 && { borderBottomWidth: 0, borderRadius: 10 }, selectMode && selected.includes(i) && { backgroundColor: colors.primaryLight, marginHorizontal: -14, paddingHorizontal: 14 }]}
                onPress={() => {
                  if (selectMode) {
                    toggleSelect(i)
                  } else {
                    navigation.getParent()?.navigate('ReportOverview', { record: r })
                  }
                }}
              >
                {selectMode && (
                  <View style={[styles.checkbox, selected.includes(i) && styles.checkboxDone]}>
                    {selected.includes(i) && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                )}
                <View style={{ flex: 1 }}>
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

        <View style={{ height: 80 }} />
      </ScrollView>

      {selectMode && (
        <View style={styles.footer}>
          <Text style={styles.selectedCount}>已選 {selected.length} 筆</Text>
          <TouchableOpacity
            style={[styles.exportBtn, selected.length === 0 && { opacity: 0.4 }]}
            onPress={handleExport}
            disabled={selected.length === 0}
          >
            <Ionicons name="document-text-outline" size={16} color="#fff" />
            <Text style={styles.exportBtnText}>匯出 / 分享</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  appbar: {
    height: 46, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: colors.gray200,
  },
  appbarTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  selectBtn: { fontSize: typography.sizes.sm, color: colors.primary },
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
    paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: colors.gray100, gap: 8,
  },
  date: { fontSize: typography.sizes.md, color: colors.gray500 },
  right: { alignItems: 'flex-end', gap: 4 },
  tc: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.medium },
  emptyCard: { alignItems: 'center', paddingVertical: 40, gap: 6 },
  emptyText: { fontSize: typography.sizes.md, color: colors.gray500 },
  emptyHint: { fontSize: typography.sizes.sm, color: colors.gray400 },
  checkbox: {
    width: 18, height: 18, borderRadius: 4,
    borderWidth: 1.5, borderColor: colors.gray300,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { fontSize: 10, color: '#fff' },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14, paddingBottom: 30,
    backgroundColor: colors.white, borderTopWidth: 0.5, borderTopColor: colors.gray200,
  },
  selectedCount: { fontSize: typography.sizes.sm, color: colors.gray500 },
  exportBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9,
  },
  exportBtnText: { fontSize: typography.sizes.sm, color: '#fff', fontWeight: typography.weights.medium },
  selectModeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1.5, borderColor: colors.primary,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  selectModeBtnText: { fontSize: typography.sizes.xs, color: colors.primary, fontWeight: typography.weights.medium },
})