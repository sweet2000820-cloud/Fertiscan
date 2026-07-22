import { signOut } from 'firebase/auth'
import { auth, db } from '../firebase'
import { doc, getDoc } from 'firebase/firestore'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Linking } from 'react-native'
import { colors, typography } from '../theme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Notifications from 'expo-notifications'
import { useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { useCallback } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'react-native'
import { getUserPlan } from '../plan'
import { getClinics, clearAllClinicsAndHistory, getSharedHistory } from '../clinics'


export default function SettingsScreen({ navigation }: any) {
  const [notifyEnabled, setNotifyEnabled] = useState(true)
  const [reminderWeeks, setReminderWeeks] = useState(4)
  const [clinicCount, setClinicCount] = useState(0)
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [userPlan, setUserPlan] = useState('free')

  useFocusEffect(
    useCallback(() => {
      getClinics().then(list => setClinicCount(list.length))
      AsyncStorage.getItem('reminderWeeks').then(val => { if (val) setReminderWeeks(parseInt(val)) })
      getUserPlan().then(({ plan }) => setUserPlan(plan))

      const user = auth.currentUser
      if (user) {
        setUserEmail(user.email || '')
        getDoc(doc(db, 'users', user.uid)).then(snap => {
          if (snap.exists()) {
            const data: any = snap.data()
            if (data.name) setUserName(data.name)
            if (data.avatar) setAvatar(data.avatar)
          }
        })
      }
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
            {avatar ? (
              <Image source={{ uri: avatar }} style={{ width: 46, height: 46, borderRadius: 23 }} />
            ) : (
              <Text style={styles.avatarText}>{userName ? userName.slice(0, 1) : '?'}</Text>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userName || '尚未設定姓名'}</Text>
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
              <View style={[styles.freeBadge, userPlan === 'pro' && { backgroundColor: 'rgba(93,191,204,0.3)' }]}>
                <Text style={[styles.freeBadgeText, userPlan === 'pro' && { color: '#5dbfcc' }]}>
                  {userPlan === 'pro' ? 'Pro 版' : '免費版'}
                </Text>
              </View>
            </View>
            <Text style={styles.planSub}>
              {userPlan === 'pro' ? '已解鎖 AI 深度建議 · 點擊管理方案' : '升級 Pro · 解鎖 AI 深度建議'}
            </Text>
          </View>
          <Text style={styles.planArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.clinicBanner} onPress={() => navigation.navigate('ClinicList')}>
          <View style={styles.clinicBannerIcon}>
            <Ionicons name="business-outline" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.clinicBannerTitle}>連結診所</Text>
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
              { text: '每 1 週', onPress: async () => { setReminderWeeks(1);AsyncStorage.setItem('reminderWeeks', '1'); if (notifyEnabled) { await Notifications.cancelAllScheduledNotificationsAsync(); await Notifications.scheduleNotificationAsync({ content: { title: 'FertiScan 提醒', body: '建議進行一次新的檢測。' }, trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 60 * 60 * 24 * 7 * 1, repeats: true } }) } } },
              { text: '每 2 週', onPress: async () => { setReminderWeeks(2);AsyncStorage.setItem('reminderWeeks', '2'); if (notifyEnabled) { await Notifications.cancelAllScheduledNotificationsAsync(); await Notifications.scheduleNotificationAsync({ content: { title: 'FertiScan 提醒', body: '建議進行一次新的檢測。' }, trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 60 * 60 * 24 * 7 * 2, repeats: true } }) } } },
              { text: '每 3 週', onPress: async () => { setReminderWeeks(3);AsyncStorage.setItem('reminderWeeks', '3'); if (notifyEnabled) { await Notifications.cancelAllScheduledNotificationsAsync(); await Notifications.scheduleNotificationAsync({ content: { title: 'FertiScan 提醒', body: '建議進行一次新的檢測。' }, trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 60 * 60 * 24 * 7 * 3, repeats: true } }) } } },
              { text: '每 4 週', onPress: async () => { setReminderWeeks(4);AsyncStorage.setItem('reminderWeeks', '4'); if (notifyEnabled) { await Notifications.cancelAllScheduledNotificationsAsync(); await Notifications.scheduleNotificationAsync({ content: { title: 'FertiScan 提醒', body: '建議進行一次新的檢測。' }, trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 60 * 60 * 24 * 7 * 4, repeats: true } }) } } },
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


        <View style={styles.tealCard}>
          <Text style={styles.tealTitle}>隱私說明</Text>
          <Text style={styles.tealText}>照片會上傳至伺服器進行分析，分析完成後不會保留原始影像。</Text>
        </View>

        <Text style={styles.sectionTitle}>其他</Text>
        <View style={styles.listCard}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>App 版本</Text>
            <Text style={styles.rowHint}>v1.2.0</Text>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.rowLabel}>圖示版權</Text>
            <Text style={styles.rowHint}>Freepik - Flaticon</Text>
          </View>
          <TouchableOpacity style={styles.row} onPress={async () => {
            await clearAllClinicsAndHistory()
            setClinicCount(0)
            Alert.alert('已清除', '診所資料已清除')
          }}>
            <Text style={[styles.rowLabel, { color: colors.danger }]}>清除診所資料（測試用）</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={async () => {
            const history = await getSharedHistory(10)
            Alert.alert('sharedHistory', JSON.stringify(history) || '空的')
          }}>
            <Text style={styles.rowLabel}>查看分享歷程（測試用）</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.row, { borderBottomWidth: 0 }]} onPress={() => {
            Alert.alert('登出帳號', '確定要登出嗎？', [
              { text: '取消', style: 'cancel' },
              { text: '登出', style: 'destructive', onPress: async () => {
                try {
                  await signOut(auth)
                } catch (e) {
                  Alert.alert('登出失敗', '請稍後再試')
                }
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
  creditCard: { backgroundColor: colors.gray100, borderRadius: 10, padding: 12, marginBottom: 16 },
  creditTitle: { fontSize: typography.sizes.xs, color: colors.gray500, marginBottom: 4 },
  creditText: { fontSize: typography.sizes.xs, color: colors.primary, textDecorationLine: 'underline' },
})