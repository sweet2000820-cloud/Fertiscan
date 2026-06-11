import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native'
import { colors, typography } from '../theme'
import { useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getRecords } from '../storage'

export default function ClinicListScreen({ navigation }: any) {
  const [clinics, setClinics] = useState<any[]>([])
  const [sharedHistory, setSharedHistory] = useState<{date: string, clinic: string}[]>([])

 useEffect(() => {
    AsyncStorage.getItem('clinics').then(val => {
      const parsed = val ? JSON.parse(val) : []
      setClinics(parsed)
      AsyncStorage.getItem('sharedHistory').then(hval => {
      if (hval) {
        const history = JSON.parse(hval)
        const mapped = history.slice(0, 10).map((h: any) => ({
          date: `${h.date} · T/C ${h.tc}`,
          clinic: `${h.clinicName} `
        }))
        setSharedHistory(mapped)
      }
    })
    })
  }, [])
  

  function handleDisconnect(id: number, name: string) {
    Alert.alert('解除連結', `確定要解除與${name}的連結嗎？\n\n解除後診所將無法再接收您的資料。`, [
      { text: '取消', style: 'cancel' },
      { text: '解除連結', style: 'destructive', onPress: () => {
        const updated = clinics.filter(c => c.id !== id)
        setClinics(updated)
        AsyncStorage.setItem('clinics', JSON.stringify(updated))
      }},
    ])
  }

  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>診所連結管理</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.sectionTitle}>已連結診所</Text>

        {clinics.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>尚未連結任何診所</Text>
            <Text style={styles.emptyHint}>點擊下方按鈕新增診所</Text>
          </View>
        ) : clinics.map(clinic => (
          <View key={clinic.id} style={styles.listCard}>
            <View style={styles.clinicHeader}>
              <View style={styles.clinicIcon}>
                <Text style={styles.clinicIconText}>{clinic.name.slice(0, 2)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.clinicName}>{clinic.name}</Text>
              </View>
              <View style={styles.connectedBadge}>
                <Text style={styles.connectedBadgeText}>已連結</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.shareRow}>
              <View>
                <Text style={styles.shareLabel}>授權分享範圍</Text>
                <Text style={styles.shareValue}>T/C 比值 · 換算濃度</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.shareLabel}>自動分享</Text>
                <Switch
                  value={clinic.autoShare || false}
                  onValueChange={async (val) => {
                    const updated = clinics.map(c => c.id === clinic.id ? { ...c, autoShare: val } : c)
                    setClinics(updated)
                    await AsyncStorage.setItem('clinics', JSON.stringify(updated))
                  }}
                  trackColor={{ true: colors.primary }}
                />
              </View>
            </View>
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.navigate('ShareRecord')}>
                <Text style={styles.btnSecondaryText}>立即分享記錄</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnRed} onPress={() => handleDisconnect(clinic.id, clinic.name)}>
                <Text style={styles.btnRedText}>解除連結</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <Text style={styles.sectionTitle}>新增診所連結</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('ClinicAdd')}>
          <Text style={styles.addBtnText}>＋ 新增診所 / 醫師</Text>
        </TouchableOpacity>

        <View style={styles.tealCard}>
          <Text style={styles.tealTitle}>關於診所連結</Text>
          <Text style={styles.tealText}>連結診所後，您可選擇將單次或全部檢測結果分享給醫師。每次分享均需您主動授權，診所無法主動讀取您的資料。</Text>
        </View>

        <Text style={styles.sectionTitle}>分享歷程</Text>
        {sharedHistory.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>尚無分享歷程</Text>
          </View>
        ) : (
        <View style={styles.listCard}>
          {sharedHistory.map((item, i) => (
            <View key={i} style={[styles.historyRow, i === 1 && { borderBottomWidth: 0 }]}>
              <View>
                <Text style={styles.historyDate}>{item.date}</Text>
                <Text style={styles.clinicSub}>{item.clinic}</Text>
              </View>
              <Text style={styles.sentText}>已送出</Text>
            </View>
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
    height: 46, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: colors.gray200,
  },
  back: { fontSize: 30, color: colors.primary, marginRight: 6 },
  appbarTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  scroll: { flex: 1, padding: 18 },
  sectionTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.gray500, marginBottom: 8 },
  emptyCard: {
    borderWidth: 0.5, borderColor: colors.gray200, borderRadius: 10,
    padding: 24, marginBottom: 16, alignItems: 'center', gap: 6,
  },
  emptyText: { fontSize: typography.sizes.md, color: colors.gray500 },
  emptyHint: { fontSize: typography.sizes.sm, color: colors.gray400 },
  listCard: { borderWidth: 0.5, borderColor: colors.gray200, borderRadius: 10, padding: 12, marginBottom: 16 },
  clinicHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  clinicIcon: {
    width: 42, height: 42, borderRadius: 10,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  clinicIconText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.primary },
  clinicName: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  clinicSub: { fontSize: typography.sizes.xs, color: colors.gray400, marginTop: 2 },
  connectedBadge: { backgroundColor: colors.successLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  connectedBadgeText: { fontSize: typography.sizes.xs, color: colors.success, fontWeight: typography.weights.medium },
  divider: { height: 0.5, backgroundColor: colors.gray200, marginBottom: 10 },
  shareRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  shareLabel: { fontSize: typography.sizes.xs, color: colors.gray400, marginBottom: 2 },
  shareValue: { fontSize: typography.sizes.sm, color: colors.gray900 },
  btnRow: { flexDirection: 'row', gap: 8 },
  btnSecondary: {
    flex: 1, height: 32, borderRadius: 8,
    borderWidth: 1.5, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  btnSecondaryText: { fontSize: typography.sizes.xs, color: colors.primary },
  btnRed: {
    flex: 1, height: 32, borderRadius: 8,
    borderWidth: 1.5, borderColor: colors.danger,
    alignItems: 'center', justifyContent: 'center',
  },
  btnRedText: { fontSize: typography.sizes.xs, color: colors.danger },
  addBtn: {
    height: 42, borderRadius: 9, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  addBtnText: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: '#fff' },
  tealCard: { backgroundColor: colors.primaryLight, borderRadius: 10, padding: 12, marginBottom: 16 },
  tealTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.primary, marginBottom: 4 },
  tealText: { fontSize: typography.sizes.xs, color: '#0d7a8f', lineHeight: 18 },
  historyRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: colors.gray100,
  },
  historyDate: { fontSize: typography.sizes.md, color: colors.gray900 },
  sentText: { fontSize: typography.sizes.xs, color: colors.success },
})