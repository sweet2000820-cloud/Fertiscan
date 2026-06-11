import { useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { colors, typography } from '../theme'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function ShareSentScreen({ navigation, route }: any) {
  const clinics = route?.params?.clinics || []
  const records = route?.params?.records || []
  const clinicNames = clinics.map((c: any) => c.name).join('、')

  useEffect(() => {
    async function saveSharedHistory() {
      const raw = await AsyncStorage.getItem('sharedHistory')
      const existing = raw ? JSON.parse(raw) : []
      const newEntries: any[] = []
      for (const clinic of clinics) {
        for (const r of records) {
          newEntries.push({
            date: r.date,
            time: r.time,
            tc: r.tc,
            clinicName: clinic.name,
            sharedAt: new Date().toISOString(),
          })
        }
      }
      await AsyncStorage.setItem('sharedHistory', JSON.stringify([...newEntries, ...existing]))
    }
    if (records.length > 0 && clinics.length > 0) saveSharedHistory()
  }, [])

  return (
    <View style={styles.container}>
      <View style={styles.content}>

        <View style={styles.successIcon}>
          <Text style={styles.checkmark}>✓</Text>
        </View>

        <Text style={styles.title}>已成功分享！</Text>
        <Text style={styles.sub}>記錄已傳送至{'\n'}<Text style={styles.highlight}>{clinicNames}</Text></Text>

        <View style={styles.tealCard}>
          <Text style={styles.tealTitle}>後續說明</Text>
          <Text style={styles.tealText}>醫師收到後會於診所系統中查閱。如需回診，請透過診所管道預約。</Text>
        </View>

        <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.navigate('Main')}>
          <Text style={styles.btnPrimaryText}>回到首頁</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnGray} onPress={() => navigation.navigate('ClinicList')}>
          <Text style={styles.btnGrayText}>查看分享紀錄</Text>
        </TouchableOpacity>

      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  successIcon: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: colors.successLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  checkmark: { fontSize: 28, color: colors.success },
  title: { fontSize: 17, fontWeight: typography.weights.medium, color: colors.success, marginBottom: 6 },
  sub: { fontSize: typography.sizes.md, color: colors.gray500, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  highlight: { color: colors.primary, fontWeight: typography.weights.medium },
  tealCard: { backgroundColor: colors.primaryLight, borderRadius: 10, padding: 12, width: '100%', marginBottom: 20 },
  tealTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.primary, marginBottom: 4 },
  tealText: { fontSize: typography.sizes.xs, color: '#0d7a8f', lineHeight: 18 },
  btnPrimary: {
    width: '100%', height: 42, borderRadius: 9, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  btnPrimaryText: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: '#fff' },
  btnGray: {
    width: '100%', height: 36, borderRadius: 9, backgroundColor: colors.gray100,
    alignItems: 'center', justifyContent: 'center',
  },
  btnGrayText: { fontSize: typography.sizes.sm, color: colors.gray500 },
})