import { colors, typography } from '../theme'
import Button from '../components/Button'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native'
import { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getRecords, TestRecord } from '../storage'
import { useFocusEffect } from '@react-navigation/native'
import { useCallback } from 'react'


export default function DashboardScreen({ navigation }: any) {
  const [daysSince, setDaysSince] = useState<string>('尚未檢測')
  const [records, setRecords] = useState<TestRecord[]>([])
  const [strips, setStrips] = useState<number>(6)
  const [userName, setUserName] = useState<string>('陳小明')
  const [avatar, setAvatar] = useState<string | null>(null)

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('userName').then(val => { if (val) setUserName(val) })
      AsyncStorage.getItem('userAvatar').then(val => { setAvatar(val) })
      AsyncStorage.getItem('lastTestDate').then(val => {
        
        if (val) {
          const diff = Math.floor((Date.now() - new Date(val).getTime()) / (1000 * 60 * 60 * 24))
          setDaysSince(diff === 0 ? '今天' : `${diff} 天前`)
        }
      })
      AsyncStorage.getItem('strips').then(val => {
        if (val !== null) {
          const n = parseInt(val)
          setStrips(n)
          if (n === 0) {
            Alert.alert('試紙用完了', '您的試紙剩餘數量為 0，請前往商店購買。', [
              { text: '稍後再說', style: 'cancel' },
              { text: '前往商店', onPress: () => navigation.navigate('Main', { screen: '商店' }) },
            ])
          }
        } else {
          setStrips(6)
          AsyncStorage.setItem('strips', '6')
        }
      })
      getRecords().then(r => setRecords(r))
      ;(async () => {
        const val = await AsyncStorage.getItem('lotNumber')
        if (!val) {
          const shown = await AsyncStorage.getItem('onboardingShown')
          if (!shown) {
            await AsyncStorage.setItem('onboardingShown', '1')
            Alert.alert(
              '歡迎使用 FertiScan 👋',
              '開始檢測前，請先前往「校準」頁面設定試紙批號，確保結果準確。',
              [
                { text: '稍後再說', style: 'cancel' },
                { text: '前往設定批號', onPress: () => navigation.navigate('Main', { screen: '校準' }) },
              ]
            )
          }
        }
      })()
    }, [])
  )

  const displayRecords = records.slice(0, 3)

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
            AsyncStorage.setItem('strips', String(n))
          }
        }},
      ],
      'plain-text',
      String(strips)
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <Text style={styles.appbarTitle}>FertiScan</Text>
        <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('Profile')}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={{ width: 40, height: 40, borderRadius: 20 }} />
          ) : (
            <Text style={styles.avatarText}>{userName.slice(0, 1)}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        
        <Text style={styles.greeting}>
          {(() => {
            const h = new Date().getHours()
            if (h < 12) return `早安，${userName}`
            if (h < 18) return `午安，${userName}`
            return `晚安，${userName}`
          })()}
        </Text>

        <View style={styles.tealCard}>
          <Text style={styles.cardTitle}>近 {Math.min(displayRecords.length, 4)} 次 T/C 比值趨勢</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 80, gap: 6, marginBottom: 4 }}>
            {displayRecords.slice(0, 4).reverse().map((r, i, arr) => {
              const h = Math.max(8, parseFloat(r.tc) * 50) // 將 T/C 比值轉換為柱狀圖高度
              const color = r.status === '正常' ? colors.primary : r.status === '邊緣' ? '#EF9F27' : colors.danger
              const isLast = i === arr.length - 1
              return (
                <View key={i} style={{ flex: 1, alignItems: 'stretch', gap: 3 }}>
                  <View style={{ width: '100%', height: h, backgroundColor: color, borderRadius: 2 }} />
                  <Text style={{ fontSize: 8, color: isLast ? colors.warning : colors.gray400 }}>
                    {isLast ? '最近' : r.date.slice(5, 7) + '/' + r.date.slice(8, 10)}
                  </Text>
                </View>
              )
            })}
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.hint}>平均 T/C 比值</Text>
            <Text style={styles.avgValue}>
              {(displayRecords.reduce((s, r) => s + parseFloat(r.tc), 0) / displayRecords.length).toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.hint}>上次檢測</Text>
            <Text style={styles.statValue}>{daysSince}</Text>
          </View>
          <TouchableOpacity style={styles.statCard} onPress={handleStripsPress}>
            <Text style={styles.hint}>試紙剩餘</Text>
            <Text style={[styles.statValue, { color: strips <= 1 ? colors.danger : colors.primary }]}>{strips} 片</Text>
          </TouchableOpacity>
        </View>

        <Button title="開始新一次檢測" onPress={async () => {
          const lot = await AsyncStorage.getItem('lotNumber')
          if (!lot) {
            Alert.alert('尚未設定批號', '請先前往「校準」頁面設定試紙批號，才能開始檢測。', [
              { text: '稍後再說', style: 'cancel' },
              { text: '前往設定批號', onPress: () => navigation.navigate('Main', { screen: '校準' }) },
            ])
            return
          }
          navigation.navigate('PreCheck')
        }} />

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>最近紀錄</Text>

        {displayRecords.map((r, i) => (
          <TouchableOpacity key={i} style={styles.historyRow} onPress={() => navigation.navigate('ReportOverview', { record: r })}>
            <View>
              <Text style={styles.historyDate}>{r.date}</Text>
              <Text style={styles.hint}>{r.time}</Text>
            </View>
            <View style={styles.historyRight}>
              <Text style={[styles.tcValue, { color: getStatusColor(r.status) }]}>T/C {r.tc}</Text>
              <View style={[styles.badge, { backgroundColor: getStatusBg(r.status) }]}>
                <Text style={[styles.badgeText, { color: getStatusColor(r.status) }]}>{r.status}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

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
  appbar: {
    height: 56, flexDirection: 'row', alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: colors.gray200,
  },
  appbarTitle: { flex: 1, fontSize: typography.sizes.lg, fontWeight: typography.weights.medium, color: colors.primary },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.primary },
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
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.medium },
  fab: {
    position: 'absolute', bottom: 50, right: 40,
    width: 60, height: 60,
    backgroundColor: 'transparent',
  },
  speechBubble: {
    position: 'absolute',
    bottom: 75,
    right: 0,
    backgroundColor: '#fff',
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