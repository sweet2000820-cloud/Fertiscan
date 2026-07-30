import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { colors, typography } from '../theme'
import { getRecords, TestRecord } from '../storage'
import { Ionicons } from '@expo/vector-icons'
import Svg, { Polyline, Circle, Text as SvgText, Line } from 'react-native-svg'

function getStatusColor(status: string) {
  switch (status) {
    case '正常': return colors.success
    case '邊緣': return colors.warning
    default: return colors.danger
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

  const chartRecords = records.slice(0, 5).reverse()
  const plotLeft = 5
  const plotRight = 292
  const plotTop = 20
  const plotBottom = 120


  const dataMax = chartRecords.length > 0
    ? Math.max(...chartRecords.map(r => parseFloat(r.tc)), 0.85)
    : 0.85
  const maxScale = Math.max(1.0, dataMax * 1.1)

  function yFor(v: number) {
    return Math.round(plotBottom - (Math.min(v, maxScale) / maxScale) * (plotBottom - plotTop))
  }

  const chartPoints = chartRecords.map((r, i) => {
    const x = chartRecords.length > 1
      ? Math.round(plotLeft + (i / (chartRecords.length - 1)) * (plotRight - plotLeft))
      : Math.round((plotLeft + plotRight) / 2)
    const y = yFor(parseFloat(r.tc))
    return { x, y }
  })
  const polylinePoints = chartPoints.map(p => `${p.x},${p.y}`).join(' ')

  const gridY0 = yFor(0)
  const gridY05 = yFor(0.5)
  const gridY10 = yFor(1.0)
  const gridY085 = yFor(0.85)

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
        <Text style={styles.appbarTitle}>紀錄</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>T/C 比值趨勢（近 {Math.min(records.length, 5)} 次）</Text>
          {chartRecords.length > 0 ? (
            <Svg width="100%" height={140} viewBox="0 0 300 140">

              <Line x1={plotLeft} y1={gridY0} x2={plotRight} y2={gridY0} stroke={colors.primary} strokeWidth={0.5} opacity={0.25} />
              <Line x1={plotLeft} y1={gridY05} x2={plotRight} y2={gridY05} stroke={colors.primary} strokeWidth={0.5} opacity={0.25} />
              <Line x1={plotLeft} y1={gridY10} x2={plotRight} y2={gridY10} stroke={colors.primary} strokeWidth={0.5} opacity={0.25} />
              <Line x1={plotLeft} y1={gridY085} x2={plotRight} y2={gridY085} stroke={colors.success} strokeWidth={1} strokeDasharray="3,3" opacity={0.7} />

              <SvgText x={-9} y={gridY0 + 3} fontSize={10} fill={colors.gray400}>0</SvgText>
              <SvgText x={-15} y={gridY05 + 3} fontSize={10} fill={colors.gray400}>0.5</SvgText>
              <SvgText x={-15} y={gridY10 + 3} fontSize={10} fill={colors.gray400}>1.0</SvgText>

              <Line x1={plotLeft} y1={plotTop - 6} x2={plotLeft} y2={plotBottom} stroke={colors.primary} strokeWidth={0.6} opacity={0.4} />

              <Polyline
                points={polylinePoints}
                fill="none"
                stroke={colors.primary}
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {chartPoints.map((p, i) => (
                <Circle key={`dot-${i}`} cx={p.x} cy={p.y} r={4} fill={getStatusColor(chartRecords[i].status)} />
              ))}
              {chartPoints.map((p, i) => {
                const valText = String(chartRecords[i].tc)
                const valX = i === 0-2 ? p.x : i === chartPoints.length + 1 ? p.x - valText.length * 6 : p.x - (valText.length * 6) / 2
                return (
                  <SvgText
                    key={`val-${i}`}
                    x={valX}
                    y={Math.max(10, p.y - 9)}
                    fontSize={10}
                    fontWeight="600"
                    fill={getStatusColor(chartRecords[i].status)}
                  >
                    {valText}
                  </SvgText>
                )
              })}
              {chartPoints.map((p, i) => {
                const dateText = `${chartRecords[i].date.slice(5, 7)}/${chartRecords[i].date.slice(8, 10)}`
                const dateX = i === 0-2 ? p.x : i === chartPoints.length + 1 ? p.x - 22 : p.x - 11
                return (
                  <SvgText
                    key={`date-${i}`}
                    x={dateX}
                    y={140}
                    fontSize={10}
                    fill={colors.primary}
                  >
                    {dateText}
                  </SvgText>
                )
              })}
            </Svg>
          ) : (
            <View style={{ height: 140, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={styles.hint}>尚無資料</Text>
            </View>
          )}
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

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
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
          <View style={{ gap: 8 }}>
            {records.map((r, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.row,
                  selectMode && selected.includes(i) && { borderColor: colors.primary, borderWidth: 1.5 },
                ]}
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
                <View style={[styles.statusBar, { backgroundColor: getStatusColor(r.status) }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.date}>{r.date}</Text>
                  <Text style={styles.hint}>{r.time} · {r.lot}</Text>
                </View>
                <View style={styles.right}>
                  <Text style={[styles.tc, { color: getStatusColor(r.status) }]}>T/C {r.tc}</Text>
                  <Text style={[styles.statusText, { color: getStatusColor(r.status) }]}>{r.status}</Text>
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
    paddingTop: 30, paddingHorizontal: 18, paddingBottom: 20,
  },
  appbarTitle: { fontSize: 22, fontWeight: '600', color: colors.gray900 },
  scroll: { flex: 1, paddingHorizontal: 18 },
  card: { backgroundColor: colors.primaryLight, borderRadius: 20, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.primary, marginBottom: 10 },
  axisLabel: { fontSize: 8, color: colors.primary },
  divider: { height: 0.5, backgroundColor: colors.primary, opacity: 0.2, marginVertical: 10 },
  statsRow: { flexDirection: 'row' },
  statItem: { flex: 1, alignItems: 'center' },
  hint: { fontSize: typography.sizes.sm, color: colors.gray400 },
  statValue: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, marginTop: 2 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.white, borderWidth: 0.5, borderColor: colors.gray200,
    borderRadius: 16, padding: 12,
  },
  statusBar: { width: 4, height: 32, borderRadius: 2 },
  date: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  right: { alignItems: 'flex-end' },
  tc: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium },
  statusText: { fontSize: typography.sizes.xs, marginTop: 2 },
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
    backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20,
  },
  exportBtnText: { fontSize: typography.sizes.sm, color: '#fff', fontWeight: typography.weights.medium },
  selectModeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1.5, borderColor: colors.primary,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  selectModeBtnText: { fontSize: typography.sizes.xs, color: colors.primary, fontWeight: typography.weights.medium },
})