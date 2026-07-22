import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Linking, Alert } from 'react-native'
import { colors, typography } from '../theme'
import { getClinics } from '../clinics'
import * as Location from 'expo-location'
import { Ionicons } from '@expo/vector-icons'

const clinics = [
  { id: 1, name: '華育婦產科診所', area: '臺北市大安區敦化南路二段39號12樓', verified: true, url: 'https://huayuivf.com/', lat: 25.0268, lng: 121.5509 },
  { id: 2, name: '王家瑋婦產科診所', area: '臺北市信義區基隆路二段60號', verified: true, url: 'https://www.bestivf.com.tw/TW/home/Default.asp', lat: 25.0268, lng: 121.5609 },
  { id: 3, name: '艾微芙國際生殖醫學中心', area: '新竹縣竹北市文興路二段360號', verified: true, url: 'https://www.taiwanivfgroup.com/', lat: 24.8364, lng: 121.0087 },
  { id: 4, name: '送子鳥診所', area: '新竹市東區忠孝路80號', verified: true, url: 'https://www.e-stork.com.tw/', lat: 24.8013, lng: 120.9714 },
  { id: 5, name: '茂盛醫院生殖醫學中心', area: '臺中市北屯區昌平路一段30-6號', verified: true, url: 'https://www.ivftaiwan.tw/', lat: 24.1726, lng: 120.6805 },
]

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

export default function ClinicSearchScreen({ navigation }: any) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<number | null>(null)
  const [linkedNames, setLinkedNames] = useState<string[]>([])
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null)
  const [locating, setLocating] = useState(false)

  useEffect(() => {
  getClinics().then(list => setLinkedNames(list.map(c => c.name)))
}, [])

  async function handleLocate() {
    setLocating(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('需要定位權限', '請在設定中允許存取位置')
        setLocating(false)
        return
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude })
    } catch (e) {
      Alert.alert('定位失敗', '請稍後再試')
    }
    setLocating(false)
  }

  const clinicsWithDistance = clinics.map(c => ({
    ...c,
    distance: userLocation ? getDistance(userLocation.lat, userLocation.lng, c.lat, c.lng) : null
  }))

  const sorted = userLocation
    ? [...clinicsWithDistance].sort((a, b) => (a.distance || 0) - (b.distance || 0))
    : clinicsWithDistance

  const filtered = sorted.filter(c =>
    c.name.includes(query) || c.area.includes(query)
  )

  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>搜尋合作診所</Text>
        <TouchableOpacity onPress={handleLocate} style={styles.locateBtn}>
          <Ionicons name={locating ? 'locate' : 'locate-outline'} size={20} color={userLocation ? colors.primary : colors.gray400} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchArea}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color={colors.gray400} />
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
              <Ionicons name="close-circle" size={16} color={colors.gray400} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {userLocation && (
        <View style={styles.locationBanner}>
          <Ionicons name="location" size={14} color={colors.primary} />
          <Text style={styles.locationText}>已依距離排序，顯示最近的診所</Text>
        </View>
      )}

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {query.length === 0 && !userLocation && (
          <TouchableOpacity style={styles.locateTip} onPress={handleLocate}>
            <Ionicons name="navigate-outline" size={16} color={colors.primary} />
            <Text style={styles.locateTipText}>點擊右上角定位，查看附近診所距離</Text>
          </TouchableOpacity>
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
                linkedNames.includes(clinic.name) && { opacity: 0.5 },
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
                  {linkedNames.includes(clinic.name) && (
                    <View style={[styles.verifiedBadge, { backgroundColor: colors.primaryLight }]}>
                      <Text style={[styles.verifiedText, { color: colors.primary }]}>已連結</Text>
                    </View>
                  )}
                </View>
                <View style={styles.clinicSubRow}>
                  <Text style={styles.clinicSub} numberOfLines={1}>{clinic.area}</Text>
                  <TouchableOpacity onPress={() => Linking.openURL(clinic.url)}>
                    <Text style={styles.detailBtn}>詳情 ›</Text>
                  </TouchableOpacity>
                </View>
                {clinic.distance !== null && (
                  <Text style={styles.distanceText}>
                    距離約 {clinic.distance < 1 ? `${Math.round(clinic.distance * 1000)} 公尺` : `${clinic.distance.toFixed(1)} 公里`}
                  </Text>
                )}
              </View>
              {selected === clinic.id && (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

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
              navigation.navigate('Consent', { clinicName: clinic.name })
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
  back: { fontSize: 30, color: colors.primary, marginRight: 6 },
  appbarTitle: { flex: 1, fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  locateBtn: { padding: 4 },
  searchArea: { padding: 14, borderBottomWidth: 0.5, borderBottomColor: colors.gray200 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.gray100, borderRadius: 10,
    paddingHorizontal: 12, height: 40, gap: 8,
  },
  searchInput: { flex: 1, fontSize: typography.sizes.md, color: colors.gray900 },
  locationBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primaryLight, paddingHorizontal: 16, paddingVertical: 8,
  },
  locationText: { fontSize: typography.sizes.xs, color: colors.primary },
  scroll: { flex: 1, padding: 16 },
  hint: { fontSize: typography.sizes.sm, color: colors.gray400, marginBottom: 10 },
  locateTip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primaryLight, borderRadius: 8,
    padding: 10, marginBottom: 12,
  },
  locateTipText: { fontSize: typography.sizes.sm, color: colors.primary },
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
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  clinicIconText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.primary },
  clinicNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  clinicName: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  verifiedBadge: { backgroundColor: colors.successLight, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3 },
  verifiedText: { fontSize: 10, color: colors.success, fontWeight: typography.weights.medium },
  clinicSub: { fontSize: typography.sizes.xs, color: colors.gray400, flex: 1 },
  clinicSubRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  distanceText: { fontSize: typography.sizes.xs, color: colors.primary },
  detailBtn: { fontSize: 14, color: colors.primary, fontWeight: '500' },
  footer: { padding: 14, borderTopWidth: 0.5, borderTopColor: colors.gray200 },
  confirmBtn: {
    height: 42, borderRadius: 9, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  confirmBtnText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: '#fff' },
})