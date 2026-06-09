import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Linking } from 'react-native'
import { colors, typography } from '../theme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Notifications from 'expo-notifications'
import { useState } from 'react'
import { useEffect } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { useCallback } from 'react'


export default function SettingsScreen({ navigation }: any) {
  const [notifyEnabled, setNotifyEnabled] = useState(true)
  const [reminderWeeks, setReminderWeeks] = useState(4)
  const [clinicCount, setClinicCount] = useState(0)
  const [userName, setUserName] = useState('陳小明')
  const [userEmail, setUserEmail] = useState('chen@gmail.com')

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('clinics').then(val => {
        if (val) setClinicCount(JSON.parse(val).length)
      })
      AsyncStorage.getItem('userName').then(val => { if (val) setUserName(val) })
      AsyncStorage.getItem('userEmail').then(val => { if (val) setUserEmail(val) })
    }, [])
  )

  async function handleNotifyToggle(val: boolean) {
    if (val) {
      const { status } = await Notifications.requestPermissionsAsync()
      if (status === 'granted') {
        setNotifyEnabled(true)
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'FertiScan 提醒',
            body: '距離上次檢測已超過 4 週，建議進行一次新的檢測。',
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 60 * 60 * 24 * 7 * reminderWeeks,
            repeats: true,
          },
        })
        Alert.alert('已開啟', '將於每 4 週提醒您進行檢測')
      } else {
        Alert.alert('無法開啟', '請在 iPhone 設定中允許 FertiScan 傳送通知')
      }
    } else {
      setNotifyEnabled(false)
      await Notifications.cancelAllScheduledNotificationsAsync()
      Alert.alert('已關閉', '通知提醒已關閉')
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <Text style={styles.appbarTitle}>設定</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        <TouchableOpacity style={styles.profileCard} onPress={() => navigation.navigate('Profile')}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userName.slice(0, 1)}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userName}</Text>
            <Text style={styles.profileEmail}>{userEmail}</Text>
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

        <TouchableOpacity style={styles.clinicBanner} onPress={() => navigation.navigate('ClinicList')}>
          <View style={styles.clinicBannerIcon}>
            <Text style={{ fontSize: 18, color: '#fff' }}>＋</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.clinicBannerTitle}>連結診所 / 醫師</Text>
            <Text style={styles.clinicBannerSub}>{clinicCount > 0 ? `已連結 ${clinicCount} 間診所 · 點擊管理` : '尚未連結診所 · 點擊新增'}</Text>
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>›</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>檢測設定</Text>
        <View style={styles.listCard}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>通知提醒</Text>
            <Switch value={notifyEnabled} onValueChange={handleNotifyToggle} trackColor={{ true: colors.primary }} />
          </View>
          <TouchableOpacity style={styles.row} onPress={() => {
            Alert.alert('複測提醒週期', '選擇提醒間隔', [
              { text: '每 1 週', onPress: async () => { setReminderWeeks(1); if (notifyEnabled) { await Notifications.cancelAllScheduledNotificationsAsync(); await Notifications.scheduleNotificationAsync({ content: { title: 'FertiScan 提醒', body: '建議進行一次新的檢測。' }, trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 60 * 60 * 24 * 7 * 1, repeats: true } }) } } },
              { text: '每 2 週', onPress: async () => { setReminderWeeks(2); if (notifyEnabled) { await Notifications.cancelAllScheduledNotificationsAsync(); await Notifications.scheduleNotificationAsync({ content: { title: 'FertiScan 提醒', body: '建議進行一次新的檢測。' }, trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 60 * 60 * 24 * 7 * 2, repeats: true } }) } } },
              { text: '每 3 週', onPress: async () => { setReminderWeeks(3); if (notifyEnabled) { await Notifications.cancelAllScheduledNotificationsAsync(); await Notifications.scheduleNotificationAsync({ content: { title: 'FertiScan 提醒', body: '建議進行一次新的檢測。' }, trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 60 * 60 * 24 * 7 * 3, repeats: true } }) } } },
              { text: '每 4 週', onPress: async () => { setReminderWeeks(4); if (notifyEnabled) { await Notifications.cancelAllScheduledNotificationsAsync(); await Notifications.scheduleNotificationAsync({ content: { title: 'FertiScan 提醒', body: '建議進行一次新的檢測。' }, trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 60 * 60 * 24 * 7 * 4, repeats: true } }) } } },
              { text: '取消', style: 'cancel' },
            ])
          }}>
            <Text style={styles.rowLabel}>複測提醒週期</Text>
            <Text style={styles.rowValue}>每 {reminderWeeks} 週 ›</Text>
          </TouchableOpacity>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.rowLabel}>結果顯示單位</Text>
            <Text style={styles.rowValue}>T/C 比值 + 濃度</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>隱私與資料</Text>
        <View style={styles.listCard}>
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
          <TouchableOpacity style={styles.row} onPress={() => Linking.openURL('https://www.ipreginc.com/')}>
            <Text style={styles.rowLabel}>關於 FertiScan</Text>
            <Text style={styles.rowHint}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={async () => {
            await AsyncStorage.setItem('clinics', JSON.stringify([]))
            setClinicCount(0)
            Alert.alert('已清除', '診所資料已清除')
          }}>
            <Text style={[styles.rowLabel, { color: colors.danger }]}>清除診所資料（測試用）</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.row, { borderBottomWidth: 0 }]} onPress={() => {
            Alert.alert('登出帳號', '確定要登出嗎？', [
              { text: '取消', style: 'cancel' },
              { text: '登出', style: 'destructive', onPress: async () => {
                await AsyncStorage.removeItem('isLoggedIn')
                navigation.navigate('Login')
              }},
            ])
          }}>
            <Text style={[styles.rowLabel, { color: colors.danger }]}>登出帳號</Text>
            <Text style={styles.rowHint}>›</Text>
          </TouchableOpacity>
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
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: typography.weights.medium, color: colors.primary },
  profileInfo: { flex: 1 },
  profileName: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  profileEmail: { fontSize: typography.sizes.xs, color: colors.gray400, marginTop: 2 },
  editBtn: { fontSize: typography.sizes.sm, color: colors.primary },
  planCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#0a1628', borderRadius: 12, padding: 12, marginBottom: 10,
  },
  planIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: 'rgba(93,191,204,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  planInfo: { flex: 1 },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  planTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: '#fff' },
  freeBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  freeBadgeText: { fontSize: typography.sizes.xs, color: 'rgba(255,255,255,0.5)' },
  planSub: { fontSize: typography.sizes.xs, color: 'rgba(255,255,255,0.45)' },
  planArrow: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  clinicBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.primary, borderRadius: 12, padding: 12, marginBottom: 16,
  },
  clinicBannerIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  clinicBannerTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: '#fff' },
  clinicBannerSub: { fontSize: typography.sizes.xs, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  sectionTitle: {
    fontSize: typography.sizes.sm, fontWeight: typography.weights.medium,
    color: colors.gray500, marginBottom: 8, marginTop: 4,
  },
  listCard: {
    borderWidth: 0.5, borderColor: colors.gray200,
    borderRadius: 10, paddingHorizontal: 14, marginBottom: 16,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: colors.gray100,
  },
  rowLabel: { fontSize: typography.sizes.md, color: colors.gray900 },
  rowValue: { fontSize: typography.sizes.md, color: colors.primary },
  rowHint: { fontSize: typography.sizes.md, color: colors.gray400 },
  tealCard: { backgroundColor: colors.primaryLight, borderRadius: 10, padding: 12, marginBottom: 16 },
  tealTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.primary, marginBottom: 4 },
  tealText: { fontSize: typography.sizes.xs, color: '#0d7a8f', lineHeight: 18 },
  disclaimer: { fontSize: typography.sizes.xs, color: colors.gray400, textAlign: 'center', marginBottom: 20 },
})