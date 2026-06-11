import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { colors, typography } from '../theme'
import { getRecords, TestRecord } from '../storage'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function ShareRecordScreen({ navigation }: any) {
  const [records, setRecords] = useState<TestRecord[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [clinics, setClinics] = useState<any[]>([])
  const [selectedClinic, setSelectedClinic] = useState<any>(null)
  const [sharedDates, setSharedDates] = useState<string[]>([])

  useEffect(() => {
    AsyncStorage.getItem('clinics').then(val => {
      const parsed = val ? JSON.parse(val) : []
      setClinics(parsed)
      if (parsed.length > 0) setSelectedClinic(parsed[0])
      AsyncStorage.getItem('sharedHistory').then(hval => {
        if (hval && parsed.length > 0) {
          const history = JSON.parse(hval)
          const dates = history
            .filter((h: any) => h.clinicName === parsed[0]?.name)
            .map((h: any) => `${h.date}_${h.time}_${h.tc}`)
          setSharedDates(dates)
        }
      })
    })
    getRecords().then(r => {
      setRecords(r)
    })
  }, [])

  function toggleRecord(i: number) {
    if (sharedDates.includes(records[i]?.date)) return
    if (selected.includes(i)) {
      setSelected(selected.filter(s => s !== i))
    } else {
      setSelected([...selected, i])
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>分享檢測記錄</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {clinics.length === 0 ? (
          <View style={styles.clinicRow}>
            <Text style={{ color: colors.gray400, fontSize: typography.sizes.sm }}>尚未連結任何診所</Text>
          </View>
        ) : clinics.map(clinic => (
          <TouchableOpacity
            key={clinic.id}
            style={[styles.clinicRow, selectedClinic?.id === clinic.id && { backgroundColor: colors.primaryLight, borderRadius: 8, padding: 6 }]}
            onPress={async () => {
              setSelectedClinic(clinic)
              setSelected([])
              const hval = await AsyncStorage.getItem('sharedHistory')
              if (hval) {
                const history = JSON.parse(hval)
                const dates = history
                  .filter((h: any) => h.clinicName === clinic.name)
                  .map((h: any) => `${h.date}_${h.time}_${h.tc}`)
                setSharedDates(dates)
              } else {
                setSharedDates([])
              }
            }}
          >
            <View style={styles.clinicIcon}>
              <Text style={styles.clinicIconText}>{clinic.name.slice(0, 2)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.clinicName}>{clinic.name}</Text>
            </View>
            {selectedClinic?.id === clinic.id ? (
              <View style={styles.connectedBadge}>
                <Text style={styles.connectedText}>傳送對象</Text>
              </View>
            ) : (
              <View style={[styles.connectedBadge, { backgroundColor: colors.gray100 }]}>
                <Text style={[styles.connectedText, { color: colors.gray400 }]}>點擊選擇</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>選擇要分享的記錄</Text>
        {records.map((r, i) => {
          const alreadyShared = sharedDates.includes(`${r.date}_${r.time}_${r.tc}`)
          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.recordRow,
                selected.includes(i) && styles.recordRowSelected,
                alreadyShared && { opacity: 0.5 },
              ]}
              onPress={() => {
                if (alreadyShared) {
                  Alert.alert('已傳送', '此筆紀錄已傳送給此診所，無法重複傳送。')
                  return
                }
                toggleRecord(i)
              }}
            >
              <View style={[styles.checkbox, selected.includes(i) && styles.checkboxDone]}>
                {selected.includes(i) && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.recordDate, selected.includes(i) && { color: colors.primary }]}>
                  {r.date} · T/C {r.tc}
                </Text>
                <Text style={styles.recordSub}>{r.status}</Text>
              </View>
              {i === 0 && !alreadyShared && (
                <View style={styles.latestBadge}>
                  <Text style={styles.latestText}>最新</Text>
                </View>
              )}
              {alreadyShared && (
                <View style={[styles.latestBadge, { backgroundColor: colors.successLight }]}>
                  <Text style={[styles.latestText, { color: colors.success }]}>已傳送</Text>
                </View>
              )}
            </TouchableOpacity>
          )
        })}

        <Text style={styles.sectionTitle}>分享內容</Text>
        <View style={styles.card}>
          {[
            { label: 'T/C 比值 · 換算濃度', ok: true },
            { label: 'QC 影像品質資訊', ok: true },
            { label: '個人識別資訊', ok: false },
          ].map((item, i) => (
            <View key={i} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={[styles.infoValue, { color: item.ok ? colors.gray900 : colors.gray400 }]}>
                {item.ok ? '✓' : '✗ 不含'}
              </Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.btnPrimary, (selected.length === 0 || clinics.length === 0) && { opacity: 0.4 }]}
          onPress={() => {
            if (clinics.length === 0) {
              Alert.alert('尚未連結診所', '請先至設定頁面連結診所，才能傳送記錄。', [
                { text: '取消', style: 'cancel' },
                { text: '前往設定', onPress: () => navigation.navigate('Main', { screen: '設定' }) },
              ])
              return
            }
            if (selected.length > 0) {
              const selectedRecords = selected.map(i => records[i])
              navigation.navigate('ShareSent', { clinics: selectedClinic ? [selectedClinic] : clinics, records: selectedRecords })
            }
          }}
          disabled={selected.length === 0}
        >
          <Text style={styles.btnPrimaryText}>傳送至診所系統</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.btnSecondary, selected.length === 0 && { opacity: 0.4 }]}
          onPress={() => {
            if (selected.length === 0) {
              Alert.alert('請選擇紀錄', '請先選擇要分享的檢測紀錄')
              return
            }
            const selectedRecords = selected.map(i => records[i])
            navigation.navigate('ReportLink', { records: selectedRecords })
          }}
          disabled={selected.length === 0}
        >
          <Text style={styles.btnSecondaryText}>產生分享連結</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnGray} onPress={() => navigation.goBack()}>
          <Text style={styles.btnGrayText}>取消</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
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
  clinicRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  clinicIcon: {
    width: 38, height: 38, borderRadius: 9,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  clinicIconText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.primary },
  clinicName: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  clinicSub: { fontSize: typography.sizes.xs, color: colors.gray400 },
  connectedBadge: { backgroundColor: colors.successLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  connectedText: { fontSize: typography.sizes.xs, color: colors.success, fontWeight: typography.weights.medium },
  divider: { height: 0.5, backgroundColor: colors.gray200, marginVertical: 12 },
  sectionTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.gray500, marginBottom: 8 },
  recordRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 10, borderRadius: 8, borderWidth: 0.5,
    borderColor: colors.gray200, marginBottom: 8,
  },
  recordRowSelected: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.primaryLight },
  checkbox: {
    width: 15, height: 15, borderRadius: 3,
    borderWidth: 1, borderColor: colors.gray300,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { fontSize: 9, color: '#fff' },
  recordDate: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  recordSub: { fontSize: typography.sizes.xs, color: colors.gray400, marginTop: 2 },
  latestBadge: { backgroundColor: colors.warningLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  latestText: { fontSize: typography.sizes.xs, color: colors.warning, fontWeight: typography.weights.medium },
  card: { backgroundColor: colors.gray100, borderRadius: 10, padding: 12, marginBottom: 14 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  infoLabel: { fontSize: typography.sizes.sm, color: colors.gray500 },
  infoValue: { fontSize: typography.sizes.sm },
  btnPrimary: {
    height: 42, borderRadius: 9, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  btnPrimaryText: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: '#fff' },
  btnSecondary: {
    height: 42, borderRadius: 9, borderWidth: 1.5, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  btnSecondaryText: { fontSize: typography.sizes.md, color: colors.primary },
  btnGray: {
    height: 36, borderRadius: 9, backgroundColor: colors.gray100,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  btnGrayText: { fontSize: typography.sizes.sm, color: colors.gray500 },
})