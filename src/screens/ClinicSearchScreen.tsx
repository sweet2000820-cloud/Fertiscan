import { useState, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Linking, Alert, ActivityIndicator } from 'react-native'
import { colors, typography } from '../theme'
import * as Location from 'expo-location'
import { Ionicons } from '@expo/vector-icons'
import { fetchClinics, fetchMyAppointments, isActiveAppointment, PartnerClinic } from '../clinicApi'

// [改版 2026/09/30] 「諮詢專業醫師」的合作診所列表
// - 名單改從後端讀取（Firestore partnerClinics），新增或修改診所不必重新上架 App
// - 點診所進入「診所資訊」，在那裡預約並分享報告
// - 原本「連結診所 → 同意書」的流程由預約取代

// 國健署公告的衛福部許可人工生殖機構完整名單（非合作）
const HPA_LIST_URL = 'https://www.hpa.gov.tw/Pages/Detail.aspx?nodeid=500&pid=14267'

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function ClinicSearchScreen({ navigation, route }: any) {
  const record = route?.params?.record // 從報告頁帶來的本次檢測，預約時可一起分享

  const [clinics, setClinics] = useState<PartnerClinic[]>([])
  const [bookedClinicIds, setBookedClinicIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null)
  const [locating, setLocating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [list, mine] = await Promise.all([
        fetchClinics(),
        fetchMyAppointments().catch(() => []),
      ])
      setClinics(list)
      setBookedClinicIds(mine.filter(isActiveAppointment).map(a => a.clinicId))
    } catch (e: any) {
      setError(e?.message || '診所資料讀取失敗')
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleLocate() {
    setLocating(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('需要定位權限', '請在設定中允許存取位置，或直接搜尋地區')
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

  const withDistance = clinics.map(c => ({
    ...c,
    distance: userLocation && c.lat != null && c.lng != null
      ? getDistance(userLocation.lat, userLocation.lng, c.lat, c.lng)
      : null,
  }))
  const sorted = userLocation
    ? [...withDistance].sort((a, b) => (a.distance ?? 99999) - (b.distance ?? 99999))
    : withDistance
  const q = query.trim()
  const filtered = q ? sorted.filter(c => c.name.includes(q) || c.area.includes(q)) : sorted

  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>諮詢專業醫師</Text>
        <TouchableOpacity onPress={handleLocate} style={styles.locateBtn} accessibilityLabel="依目前位置排序">
          {locating
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Ionicons name={userLocation ? 'locate' : 'locate-outline'} size={20} color={userLocation ? colors.primary : colors.gray400} />}
        </TouchableOpacity>
      </View>

      <View style={styles.searchArea}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color={colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="輸入診所名稱或地區"
            placeholderTextColor={colors.gray400}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={16} color={colors.gray400} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>居家檢測可以幫你追蹤趨勢</Text>
          <Text style={styles.introText}>
            但無法取代醫院的完整精液分析。選一家合作診所，就能預約並把這次的檢測報告一起送過去。
          </Text>
        </View>

        {userLocation ? (
          <View style={styles.locationBanner}>
            <Ionicons name="location" size={14} color={colors.primary} />
            <Text style={styles.locationText}>已依距離排序</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.locationBanner} onPress={handleLocate}>
            <Ionicons name="navigate-outline" size={14} color={colors.primary} />
            <Text style={styles.locationText}>點這裡依目前位置排序（位置只用來計算距離）</Text>
          </TouchableOpacity>
        )}

        {loading ? (
          <View style={styles.stateBox}><ActivityIndicator color={colors.primary} /></View>
        ) : error ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity onPress={load}><Text style={styles.retry}>重新載入</Text></TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateText}>{q ? '找不到符合的診所，請嘗試其他關鍵字' : '目前沒有合作診所資料'}</Text>
          </View>
        ) : (
          <View style={styles.listCard}>
            {filtered.map((clinic, i) => (
              <TouchableOpacity
                key={clinic.id}
                style={[styles.clinicRow, i === filtered.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => navigation.navigate('ClinicDetail', { clinic, record })}
              >
                <View style={styles.clinicIcon}>
                  <Text style={styles.clinicIconText}>{clinic.name.slice(0, 2)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.clinicNameRow}>
                    <Text style={styles.clinicName}>{clinic.name}</Text>
                    <View style={styles.partnerBadge}><Text style={styles.partnerText}>合作診所</Text></View>
                    {bookedClinicIds.includes(clinic.id) && (
                      <View style={[styles.partnerBadge, { backgroundColor: colors.primaryLight }]}>
                        <Text style={[styles.partnerText, { color: colors.primary }]}>已預約</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.clinicSub} numberOfLines={1}>{clinic.area}</Text>
                  {clinic.distance != null && (
                    <Text style={styles.distanceText}>
                      距離約 {clinic.distance < 1 ? `${Math.round(clinic.distance * 1000)} 公尺` : `${clinic.distance.toFixed(1)} 公里`}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.moreBtn} onPress={() => Linking.openURL(HPA_LIST_URL).catch(() => {})}>
          <Text style={styles.moreText}>查看衛福部許可的全台生殖醫學機構名單</Text>
          <Ionicons name="open-outline" size={14} color={colors.gray500} />
        </TouchableOpacity>
        <Text style={styles.disclaimer}>
          合作診所為本 App 的合作夥伴，排列順序不代表醫療品質評比。您可自由選擇任何醫療院所就醫。
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  appbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 10, paddingHorizontal: 18, paddingBottom: 14,
  },
  back: { fontSize: 40, color: colors.primary, marginRight: 6, paddingBottom: 4 },
  appbarTitle: { flex: 1, fontSize: 22, fontWeight: '600', color: colors.gray900 },
  locateBtn: { padding: 4, minWidth: 28, alignItems: 'center' },
  searchArea: { paddingHorizontal: 18, paddingBottom: 12 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderWidth: 0.5, borderColor: colors.gray200, borderRadius: 20,
    paddingHorizontal: 14, height: 42, gap: 8,
  },
  searchInput: { flex: 1, fontSize: typography.sizes.md, color: colors.gray900 },
  scroll: { flex: 1, paddingHorizontal: 18 },
  introCard: { backgroundColor: colors.primaryLight, borderRadius: 16, padding: 14, marginBottom: 10 },
  introTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.primary, marginBottom: 4 },
  introText: { fontSize: typography.sizes.sm, color: colors.gray900, lineHeight: 20 },
  locationBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10,
    borderWidth: 0.5, borderColor: colors.gray200,
  },
  locationText: { fontSize: typography.sizes.xs, color: colors.primary },
  stateBox: { borderWidth: 0.5, borderColor: colors.gray200, borderRadius: 16, padding: 24, alignItems: 'center', gap: 8 },
  stateText: { fontSize: typography.sizes.sm, color: colors.gray500, textAlign: 'center', lineHeight: 20 },
  retry: { fontSize: typography.sizes.sm, color: colors.primary, fontWeight: typography.weights.medium },
  listCard: { backgroundColor: colors.white, borderWidth: 0.5, borderColor: colors.gray200, borderRadius: 18, overflow: 'hidden' },
  clinicRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderBottomWidth: 0.5, borderBottomColor: colors.gray100,
  },
  clinicIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  clinicIconText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.primary },
  clinicNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' },
  clinicName: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  partnerBadge: { backgroundColor: colors.successLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  partnerText: { fontSize: 10, color: colors.success, fontWeight: typography.weights.medium },
  clinicSub: { fontSize: typography.sizes.xs, color: colors.gray400 },
  distanceText: { fontSize: typography.sizes.xs, color: colors.primary, marginTop: 2 },
  moreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 14 },
  moreText: { fontSize: typography.sizes.sm, color: colors.gray500, textDecorationLine: 'underline' },
  disclaimer: { fontSize: typography.sizes.xs, color: colors.gray400, textAlign: 'center', lineHeight: 17, paddingHorizontal: 8 },
})