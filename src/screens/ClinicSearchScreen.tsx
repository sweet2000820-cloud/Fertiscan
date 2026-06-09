import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Linking, Alert } from 'react-native'
import { useState } from 'react'
import { colors, typography } from '../theme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useEffect } from 'react'

const [linkedNames, setLinkedNames] = useState<string[]>([])

  useEffect(() => {
    AsyncStorage.getItem('clinics').then(val => {
      if (val) {
        const saved = JSON.parse(val)
        setLinkedNames(saved.map((c: any) => c.name))
      }
    })
  }, [])

const clinics = [
  { id: 1, name: '艾微芙人工生殖中心', doctor: '陳明哲 醫師', area: '台北市大安區', verified: true, url: 'https://www.taiwanivfgroup.com/' },
  { id: 2, name: '華育生殖醫學中心', doctor: '蔡鋒博 醫師', area: '台北市信義區', verified: true, url: 'https://huayuivf.com/' },
  { id: 3, name: '王家瑋婦產科診所', doctor: '王家瑋 醫師', area: '台中市西區', verified: true, url: 'https://www.bestivf.com.tw/TW/home/Default.asp' },
  { id: 4, name: '茂盛醫院生殖醫學中心', doctor: '李茂盛 醫師', area: '台中市北區', verified: true, url: 'https://www.ivftaiwan.tw/' },
  { id: 5, name: '送子鳥生殖中心', doctor: '李明昭 醫師', area: '台北市中山區', verified: true, url: 'https://www.e-stork.com.tw/' },
]

export default function ClinicSearchScreen({ navigation }: any) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<number | null>(null)

  const filtered = clinics.filter(c =>
    c.name.includes(query) || c.doctor.includes(query) || c.area.includes(query)
  )

  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>搜尋合作診所</Text>
      </View>

      {/* 搜尋框 */}
      <View style={styles.searchArea}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="輸入診所名稱、醫師或地區"
            placeholderTextColor={colors.gray400}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {query.length === 0 && (
          <Text style={styles.hint}>目前顯示所有 FertiScan 合作診所</Text>
        )}

        {filtered.length === 0 && (
          <View style={styles.emptyArea}>
            <Text style={styles.emptyText}>找不到符合的診所</Text>
            <Text style={styles.hint}>請嘗試其他關鍵字</Text>
          </View>
        )}

        <View style={styles.listCard}>
          {filtered.map((clinic, i) => (
            <TouchableOpacity
              key={clinic.id}
              style={[
                styles.clinicRow,
                i === filtered.length - 1 && { borderBottomWidth: 0 },
                selected === clinic.id && styles.clinicRowSelected,
              ]}
              onPress={() => setSelected(clinic.id)}
            >
              <View style={styles.clinicIcon}>
                <Text style={styles.clinicIconText}>{clinic.name.slice(0, 2)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.clinicNameRow}>
                  <Text style={[styles.clinicName, selected === clinic.id && { color: colors.primary }]}>
                    {clinic.name}
                  </Text>
                  {clinic.verified && (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>✓ 認證</Text>
                    </View>
                  )}
                </View>
                <View style={styles.clinicSubRow}>
                <Text style={styles.clinicSub}>{clinic.doctor} · {clinic.area}</Text>
                <TouchableOpacity onPress={() => Linking.openURL(clinic.url)}>
                  <Text style={styles.detailBtn}>詳情 ›</Text>
                </TouchableOpacity>
              </View>
              </View>
              {selected === clinic.id && (
                <Text style={{ color: colors.primary, fontSize: 18 }}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 確認按鈕 */}
      {selected !== null && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={() => {
              const clinic = clinics.find(c => c.id === selected)
              if (!clinic) return
              if (linkedNames.includes(clinic.name)) {
                Alert.alert('已連結', `您已經連結了${clinic.name}，無法重複連結。`)
                return
              }
              navigation.navigate('Consent', { clinicName: clinic.name, doctor: clinic.doctor })
            }}
          >
            <Text style={styles.confirmBtnText}>
              選擇「{clinics.find(c => c.id === selected)?.name}」繼續 ›
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  appbar: {
    height: 46, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: colors.gray200,
  },
  back: { fontSize: 22, color: colors.primary, marginRight: 6 },
  appbarTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  searchArea: { padding: 14, borderBottomWidth: 0.5, borderBottomColor: colors.gray200 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.gray100, borderRadius: 10,
    paddingHorizontal: 12, height: 40, gap: 8,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontSize: typography.sizes.md, color: colors.gray900 },
  clearBtn: { fontSize: 14, color: colors.gray400 },
  scroll: { flex: 1, padding: 16 },
  hint: { fontSize: typography.sizes.sm, color: colors.gray400, marginBottom: 10 },
  emptyArea: { alignItems: 'center', paddingVertical: 40, gap: 6 },
  emptyText: { fontSize: typography.sizes.md, color: colors.gray500 },
  listCard: { borderWidth: 0.5, borderColor: colors.gray200, borderRadius: 10, overflow: 'hidden' },
  clinicRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderBottomWidth: 0.5, borderBottomColor: colors.gray100,
  },
  clinicRowSelected: { backgroundColor: colors.primaryLight },
  clinicIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  clinicIconText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.primary },
  clinicNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  clinicName: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  verifiedBadge: { backgroundColor: colors.successLight, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3 },
  verifiedText: { fontSize: 10, color: colors.success, fontWeight: typography.weights.medium },
  clinicSub: { fontSize: typography.sizes.xs, color: colors.gray400 },
  footer: { padding: 14, borderTopWidth: 0.5, borderTopColor: colors.gray200 },
  confirmBtn: {
    height: 42, borderRadius: 9, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  confirmBtnText: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: '#fff' },
  clinicSubRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  detailBtn: { fontSize: typography.sizes.xs, color: colors.primary },
})