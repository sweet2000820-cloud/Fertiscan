import { colors, typography } from '../theme'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Dimensions } from 'react-native'
import { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { getInventory, setStrips as setStripsRemote } from '../inventory'
import { getRecords, TestRecord } from '../storage'
import { useFocusEffect, useIsFocused } from '@react-navigation/native'
import { useCallback } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useMeasureTargets } from '../hooks/useMeasureTargets'
import { useFeatureTour, TourStep } from '../context/FeatureTourContext'

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window')
const TAB_BAR_HEIGHT = 80
const TAB_INDEX = { dashboard: 0, history: 1, calibration: 2, shop: 3, settings: 4 }

function tabRect(index: number) {
  return { x: (SCREEN_W / 5) * index, y: SCREEN_H - TAB_BAR_HEIGHT, width: SCREEN_W / 5, height: TAB_BAR_HEIGHT }
}

const DASHBOARD_TARGET_KEYS = ['trend', 'stats', 'cta', 'history']

export default function DashboardScreen({ navigation }: any) {
  const [daysSince, setDaysSince] = useState<string>('尚未檢測')
  const [records, setRecords] = useState<TestRecord[]>([])
  const [strips, setStrips] = useState<number>(6)
  const [userName, setUserName] = useState<string>('')
  const [avatar, setAvatar] = useState<string | null>(null)

  const isFocused = useIsFocused()
  const { stage, registerSteps, startTour, setStageDirectly } = useFeatureTour()
  const isMyTurn = stage === 'dashboard' && isFocused
  const { setRef, measureAll } = useMeasureTargets(DASHBOARD_TARGET_KEYS)

    useEffect(() => {
      console.log('[Dashboard] isMyTurn 變化了:', isMyTurn, 'stage=', stage, 'isFocused=', isFocused)
      if (!isMyTurn) return
      const timer = setTimeout(async () => {
        console.log('[Dashboard] 開始量測目標座標')
        const t = await measureAll()
        console.log('[Dashboard] 量到的座標:', JSON.stringify(t))
        const steps: TourStep[] = [
          { key: 'tab-self', label: '這裡是首頁', rect: tabRect(TAB_INDEX.dashboard), shape: 'circle' },
          ...(t.trend ? [{ key: 'trend', label: '這裡顯示近期 T/C 比值趨勢', rect: t.trend as any }] : []),
          ...(t.stats ? [{ key: 'stats', label: '上次檢測時間與試紙剩餘數量', rect: t.stats as any, labelSide: 'top' as const }] : []),
          ...(t.cta ? [{ key: 'cta', label: '點這裡開始新一次檢測', rect: t.cta as any }] : []),
          ...(t.history ? [{ key: 'history', label: '這裡會顯示你近 3 次的檢測紀錄', rect: t.history as any, minHeight: 160 , labelSide: 'bottom' as const }] : []),
          {
            key: 'tab-next',
            label: '點擊「紀錄」前往下一步',
            rect: tabRect(TAB_INDEX.history),
            shape: 'circle',
            labelSide: 'top',
            passthrough: true,
            onPress: () => {
              setStageDirectly('history')
              navigation.navigate('紀錄')
            },
          },
        ]
        console.log('[Dashboard] 準備登記的步驟數量:', steps.length)
        registerSteps(steps)
        console.log('[Dashboard] registerSteps 已呼叫完成')
      }, 300)
      return () => clearTimeout(timer)
    }, [isMyTurn])

  useFocusEffect(
    useCallback(() => {
      const user = auth.currentUser
      if (user) {
        getDoc(doc(db, 'users', user.uid)).then(snap => {
          if (snap.exists()) {
            const data: any = snap.data()
            setUserName(data.name || '')
            setAvatar(data.avatar || null)
          }
        })
      }
      getInventory().then(({ strips: n, lotNumber, lastTestDate }) => {
        if (lastTestDate) {
          const last = new Date(lastTestDate)
          const today = new Date()
          const lastDate = new Date(last.getFullYear(), last.getMonth(), last.getDate())
          const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
          const diff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
          setDaysSince(diff === 0 ? '今天' : `${diff} 天前`)
        }
        setStrips(n)
        if (n === 0) {
          Alert.alert('試紙用完了', '您的試紙剩餘數量為 0，請前往商店購買。', [
            { text: '稍後再說', style: 'cancel' },
            { text: '前往商店', onPress: () => navigation.navigate('Main', { screen: '商店' }) },
          ])
        }
        if (!lotNumber) {
          AsyncStorage.getItem('onboardingShown').then(shown => {
            if (!shown) {
              AsyncStorage.setItem('onboardingShown', '1')
              Alert.alert(
                '歡迎使用 iMotile 👋',
                '開始檢測前，請先前往「校準」頁面設定試紙批號，確保結果準確。',
                [
                  { text: '稍後再說', style: 'cancel' },
                  { text: '前往設定批號', onPress: () => navigation.navigate('Main', { screen: '校準' }) },
                ]
              )
            }
          })
        }
      })
      getRecords().then(r => setRecords(r))
    }, [])
  )

  const displayRecords = records.slice(0, 3)

  function getStatusColor(status: string) {
    switch (status) {
      case '正常': return colors.success
      case '邊緣': return colors.warning
      default: return colors.danger
    }
  }

  function handleStripsPress() {
    Alert.prompt(
      '更新試紙數量',
      '請輸入目前剩餘試紙數量',
      [
        { text: '取消', style: 'cancel' },
        { text: '確認', onPress: (val: string | undefined) => {
          if (val && !isNaN(parseInt(val))) {
            const n = parseInt(val)
            setStrips(n)
            setStripsRemote(n)
          }
        }},
      ],
      'plain-text',
      String(strips)
    )
  }

  console.log('[Dashboard] 每次渲染都會印 - isFocused:', isFocused, 'stage:', stage, 'isMyTurn:', isMyTurn)

  return (
    <View style={styles.container}>
      <TouchableOpacity
          style={styles.brandBar}
          onLongPress={() => {
            console.log('長按觸發了，目前 stage 準備設成 dashboard')
            startTour()
          }}
          delayLongPress={2000}
        >
        <Image source={require('../../assets/logo.png')} style={styles.brandLogo} resizeMode="contain" />
      </TouchableOpacity>

      <View style={styles.header}>
        <View>
          <Text style={styles.greetingSmall}>
            {new Date().getHours() < 12 ? '早安' : new Date().getHours() < 18 ? '午安' : '晚安'}
          </Text>
          <Text style={styles.greetingName}>{userName || '您'}</Text>
        </View>
        <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('Profile')}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={{ width: 52, height: 52, borderRadius: 26 }} />
          ) : (
            <Ionicons name="person" size={26} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        <View ref={setRef('trend')} style={styles.tealCard}>
          <Text style={styles.cardTitle}>近 {Math.min(displayRecords.length, 3)} 次 T/C 比值趨勢</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 60, gap: 10, marginBottom: 8, paddingHorizontal: 12 }}>
            {displayRecords.slice(0, 3).reverse().map((r, i) => {
            const h = Math.max(10, parseFloat(r.tc) * 55)
            return (
              <View key={i} style={{ flex: 1, height: '100%', justifyContent: 'flex-end' }}>
                <View style={{ width: '100%', height: h, backgroundColor: getStatusColor(r.status), borderRadius: 8 }} />
              </View>
            )
          })}
          </View>
          <View style={styles.row}>
            <Text style={styles.tealHint}>平均 T/C 比值</Text>
            <Text style={styles.avgValue}>
              {displayRecords.length > 0
                ? (displayRecords.reduce((s, r) => s + parseFloat(r.tc), 0) / displayRecords.length).toFixed(2)
                : '—'}
            </Text>
          </View>
        </View>

        <View ref={setRef('stats')} style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            <Text style={styles.hint}>上次檢測</Text>
            <Text style={styles.statValue}>{daysSince}</Text>
          </View>
          <TouchableOpacity style={styles.statCard} onPress={handleStripsPress}>
            <Ionicons name="layers-outline" size={18} color={colors.primary} />
            <Text style={styles.hint}>試紙剩餘</Text>
            <Text style={[styles.statValue, { color: strips <= 1 ? colors.danger : colors.gray900 }]}>{strips} 片</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity ref={setRef('cta')} style={styles.ctaBtn} onPress={async () => {
          const { lotNumber } = await getInventory()
          if (!lotNumber) {
            Alert.alert('尚未設定批號', '請先前往「校準」頁面設定試紙批號，才能開始檢測。', [
              { text: '稍後再說', style: 'cancel' },
              { text: '前往設定批號', onPress: () => navigation.navigate('Main', { screen: '校準' }) },
            ])
            return
          }
          navigation.navigate('PreCheck')
        }}>
          <Ionicons name="scan-outline" size={17} color={colors.white} />
          <Text style={styles.ctaBtnText}>開始新一次檢測</Text>
        </TouchableOpacity>

        <View ref={setRef('history')}>
          <Text style={styles.sectionTitle}>最近紀錄</Text>

          {displayRecords.map((r, i) => (
            <TouchableOpacity key={i} style={styles.historyCard} onPress={() => navigation.navigate('ReportOverview', { record: r })}>
              <View>
                <Text style={styles.historyDate}>{r.date}</Text>
                <Text style={styles.hint}>{r.time}</Text>
              </View>
              <View style={styles.historyRight}>
                <Text style={[styles.tcValue, { color: getStatusColor(r.status) }]}>T/C {r.tc}</Text>
                <Text style={[styles.statusText, { color: getStatusColor(r.status) }]}>{r.status}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 90 }} />

      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AIChat')}>
        <View style={styles.speechBubble}>
          <Text style={styles.speechText}>有問題嗎？來問我！</Text>
          <View style={styles.speechTail} />
        </View>
        <Image source={require('../../assets/robot.png')} style={{ width: 80, height: 80 }} />
      </TouchableOpacity>

    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  brandBar: {
    alignItems: 'center',
    paddingTop: 20,
  },
  brandLogo: {
    width: 120,
    height: 60,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
    , paddingHorizontal: 30, paddingBottom: 6,
  },
  greetingSmall: { fontSize: typography.sizes.md, color: colors.gray500 },
  greetingName: { fontSize: 28, fontWeight: typography.weights.medium, color: colors.gray900, marginTop: 2 },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: { flex: 1, paddingHorizontal: 18 },
  tealCard: { backgroundColor: colors.primaryLight, borderRadius: 20, padding: 16, marginTop: 6, marginBottom: 10 },
  cardTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.primary, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  tealHint: { fontSize: typography.sizes.sm, color: colors.primary },
  hint: { fontSize: typography.sizes.sm, color: colors.gray500, marginTop: 4 },
  avgValue: { fontSize: typography.sizes.lg, fontWeight: typography.weights.medium, color: colors.primary },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  statCard: {
    flex: 1, backgroundColor: colors.white, borderWidth: 0.5, borderColor: colors.gray200,
    borderRadius: 18, padding: 12, alignItems: 'center',
  },
  statValue: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900, marginTop: 2 },
  ctaBtn: {
    height: 48, borderRadius: 24, backgroundColor: colors.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginBottom: 16,
  },
  ctaBtnText: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.white },
  sectionTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.gray500, marginBottom: 8 },
  historyCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.white, borderWidth: 0.5, borderColor: colors.gray200,
    borderRadius: 16, padding: 12, marginBottom: 8,
  },
  historyDate: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  historyRight: { alignItems: 'flex-end' },
  tcValue: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium },
  statusText: { fontSize: typography.sizes.xs, marginTop: 2 },
  fab: {
    position: 'absolute', bottom: 40, right: 40,
    width: 60, height: 60,
    backgroundColor: 'transparent',
  },
  speechBubble: {
    position: 'absolute',
    bottom: 75,
    right: 0,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    width: 130,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  speechText: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    textAlign: 'center',
  },
  speechTail: {
    position: 'absolute',
    bottom: -9,
    right: 20,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.primary,
  },
})