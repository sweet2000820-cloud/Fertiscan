import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Linking, Alert } from 'react-native'
import { colors, typography } from '../theme'
import { getClinics } from '../clinics'
import * as Location from 'expo-location'
import { Ionicons } from '@expo/vector-icons'

// phone 為選填：有填才會出現「撥打電話」按鈕
const clinics: { id: number, name: string, area: string, verified: boolean, url: string, lat: number, lng: number, phone?: string }[] = [
  { id: 1, name: '華育婦產科診所', area: '臺北市大安區敦化南路二段39號12樓', verified: true, url: 'https://huayuivf.com/', lat: 25.0268, lng: 121.5509 },
  { id: 2, name: '王家瑋婦產科診所', area: '臺北市信義區基隆路二段60號', verified: true, url: 'https://www.bestivf.com.tw/TW/home/Default.asp', lat: 25.0268, lng: 121.5609 },
  { id: 3, name: '艾微芙國際生殖醫學中心', area: '新竹縣竹北市文興路二段360號', verified: true, url: 'https://www.taiwanivfgroup.com/', lat: 24.8364, lng: 121.0087 },
  { id: 4, name: '送子鳥診所', area: '新竹市東區忠孝路80號', verified: true, url: 'https://www.e-stork.com.tw/', lat: 24.8013, lng: 120.9714 },
  { id: 5, name: '茂盛醫院生殖醫學中心', area: '臺中市北屯區昌平路一段30-6號', verified: true, url: 'https://www.ivftaiwan.tw/', lat: 24.1726, lng: 120.6805 },
]

// 國健署公告的衛福部許可人工生殖機構完整名單（非合作）
const HPA_LIST_URL = 'https://www.hpa.gov.tw/Pages/Detail.aspx?nodeid=500&pid=14267'

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

export default function ClinicSearchScreen({ navigation, route }: any) {
  // [新增] 諮詢模式：從報告頁「諮詢專業醫師」進來時為 true
  // 諮詢模式下，點診所是展開聯絡方式，不會走「連結診所」的流程
  const isConsult = route?.params?.mode === 'consult'
  const record = route?.params?.record

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

  // [新增]
  function open(url: string, failMsg: string) {
    Linking.openURL(url).catch(() => Alert.alert('無法開啟', failMsg))
  }
  function openMap(c: typeof clinics[number]) {
    const q = encodeURIComponent(`${c.name} ${c.area}`)
    open(`https://www.google.com/maps/search/?api=1&query=${q}`, '無法開啟地圖')
  }
  function callClinic(phone: string) {
    open(`tel:${phone.replace(/[^\d+]/g, '')}`, '此裝置無法撥打電話')
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
        <Text style={styles.appbarTitle}>{isConsult ? '諮詢專業醫師' : '搜尋合作診所'}</Text>
        <TouchableOpacity onPress={handleLocate} style={styles.locateBtn}>
          <Ionicons name={locating ? 'locate' : 'locate-outline'} size={20} color={userLocation ? colors.primary : colors.gray400} />
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
            autoFocus={!isConsult} // [修改] 諮詢模式不自動跳出鍵盤，先讓使用者看到說明與列表
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

        {/* [新增] 諮詢模式的說明與「帶報告去看診」 */}
        {isConsult && (
          <>
            <View style={styles.introCard}>
              <Text style={styles.introTitle}>居家檢測可以幫你追蹤趨勢</Text>
              <Text style={styles.introText}>
                但無法取代醫院的完整精液分析。若數值持續偏低，或備孕一段時間仍未懷孕，建議找醫師做進一步檢查。
              </Text>
            </View>
            {record && (
              <TouchableOpacity
                style={styles.reportBtn}
                onPress={() => navigation.navigate('ReportLink', { records: [record] })}
              >
                <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.reportBtnTitle}>帶著報告去看診</Text>
                  <Text style={styles.reportBtnSub}>產生本次結果的分享連結，看診時給醫師參考</Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            )}
          </>
        )}

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
          {filtered.map((clinic, i) => {
            const isLinked = linkedNames.includes(clinic.name)
            const isSelected = selected === clinic.id
            return (
              <TouchableOpacity
                key={clinic.id}
                style={[
                  styles.clinicRow,
                  i === filtered.length - 1 && { borderBottomWidth: 0 },
                  isSelected && styles.clinicRowSelected,
                  // [修改] 已連結變淡只在連結模式；諮詢模式下已連結的診所一樣可以聯絡
                  !isConsult && isLinked && { opacity: 0.5 },
                ]}
                // [修改] 諮詢模式：再點一次收合
                onPress={() => setSelected(isConsult && isSelected ? null : clinic.id)}
              >
                <View style={styles.clinicTop}>
                  <View style={styles.clinicIcon}>
                    <Text style={styles.clinicIconText}>{clinic.name.slice(0, 2)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.clinicNameRow}>
                      <Text style={[styles.clinicName, isSelected && { color: colors.primary }]}>
                        {clinic.name}
                      </Text>
                      {clinic.verified && (
                        // [修改] 「✓ 認證」容易被誤會成官方或品質認證，改為「合作診所」
                        <View style={styles.verifiedBadge}>
                          <Text style={styles.verifiedText}>合作診所</Text>
                        </View>
                      )}
                      {isLinked && (
                        <View style={[styles.verifiedBadge, { backgroundColor: colors.primaryLight }]}>
                          <Text style={[styles.verifiedText, { color: colors.primary }]}>已連結</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.clinicSubRow}>
                      <Text style={styles.clinicSub} numberOfLines={1}>{clinic.area}</Text>
                      {!isConsult && (
                        <TouchableOpacity onPress={() => open(clinic.url, '無法開啟網頁')}>
                          <Text style={styles.detailBtn}>詳情 ›</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    {clinic.distance !== null && (
                      <Text style={styles.distanceText}>
                        距離約 {clinic.distance < 1 ? `${Math.round(clinic.distance * 1000)} 公尺` : `${clinic.distance.toFixed(1)} 公里`}
                      </Text>
                    )}
                  </View>
                  {isConsult ? (
                    <Ionicons name={isSelected ? 'chevron-up' : 'chevron-down'} size={18} color={colors.gray400} />
                  ) : isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </View>

                {/* [新增] 諮詢模式：展開聯絡方式 */}
                {isConsult && isSelected && (
                  <View style={styles.actionRow}>
                    {!!clinic.phone && (
                      <TouchableOpacity style={styles.actionBtn} onPress={() => callClinic(clinic.phone!)}>
                        <Ionicons name="call-outline" size={15} color={colors.primary} />
                        <Text style={styles.actionText}>撥打電話</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.actionBtn} onPress={() => openMap(clinic)}>
                      <Ionicons name="navigate-outline" size={15} color={colors.primary} />
                      <Text style={styles.actionText}>地圖導航</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionBtnPrimary]}
                      onPress={() => open(clinic.url, '無法開啟網頁')}
                    >
                      <Ionicons name="calendar-outline" size={15} color={colors.white} />
                      <Text style={[styles.actionText, { color: colors.white }]}>官網／預約</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </View>

        {/* [新增] 諮詢模式：完整名單與說明 */}
        {isConsult && (
          <>
            <TouchableOpacity style={styles.moreBtn} onPress={() => open(HPA_LIST_URL, '無法開啟網頁')}>
              <Text style={styles.moreText}>查看衛福部許可的全台生殖醫學機構名單</Text>
              <Ionicons name="open-outline" size={14} color={colors.gray500} />
            </TouchableOpacity>
            <Text style={styles.disclaimer}>
              合作診所為本 App 的合作夥伴，排列順序不代表醫療品質評比。您可自由選擇任何醫療院所就醫。
            </Text>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 連結模式才有的底部按鈕（原本的流程） */}
      {!isConsult && selected !== null && (
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop:10, paddingHorizontal: 18, paddingBottom: 20,
  },
  back: { fontSize: 40, color: colors.primary, marginRight: 6, paddingBottom: 4 },
  appbarTitle: { flex: 1, fontSize: 22, fontWeight: '600', color: colors.gray900 },
  locateBtn: { padding: 4 },
  searchArea: { paddingHorizontal: 18, paddingBottom: 14 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderWidth: 0.5, borderColor: colors.gray200, borderRadius: 20,
    paddingHorizontal: 14, height: 42, gap: 8,
  },
  searchInput: { flex: 1, fontSize: typography.sizes.md, color: colors.gray900 },
  locationBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primaryLight, marginHorizontal: 18, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 8, marginBottom: 10,
  },
  locationText: { fontSize: typography.sizes.xs, color: colors.primary },
  scroll: { flex: 1, paddingHorizontal: 18 },
  hint: { fontSize: typography.sizes.sm, color: colors.gray400, marginBottom: 10 },
  locateTip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primaryLight, borderRadius: 16,
    padding: 12, marginBottom: 12,
  },
  locateTipText: { fontSize: typography.sizes.sm, color: colors.primary },
  emptyArea: { alignItems: 'center', paddingVertical: 40, gap: 6 },
  emptyText: { fontSize: typography.sizes.md, color: colors.gray500 },
  listCard: {
    backgroundColor: colors.white,
    borderWidth: 0.5, borderColor: colors.gray200,
    borderRadius: 18, overflow: 'hidden',
  },
  // [修改] 列改成直向排列，讓諮詢模式能在下方展開按鈕
  clinicRow: {
    padding: 12, borderBottomWidth: 0.5, borderBottomColor: colors.gray100,
  },
  clinicTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  clinicRowSelected: { backgroundColor: colors.primaryLight },
  clinicIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  clinicIconText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.primary },
  clinicNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' },
  clinicName: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  verifiedBadge: { backgroundColor: colors.successLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  verifiedText: { fontSize: 10, color: colors.success, fontWeight: typography.weights.medium },
  clinicSub: { fontSize: typography.sizes.xs, color: colors.gray400, flex: 1 },
  clinicSubRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  distanceText: { fontSize: typography.sizes.xs, color: colors.primary },
  detailBtn: { fontSize: 14, color: colors.primary, fontWeight: '500' },
  footer: { padding: 14, paddingBottom: 20 },
  confirmBtn: {
    height: 48, borderRadius: 24, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  confirmBtnText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: '#fff' },

  // ── [新增] 諮詢模式 ──
  introCard: { backgroundColor: colors.primaryLight, borderRadius: 16, padding: 14, marginBottom: 12 },
  introTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.primary, marginBottom: 4 },
  introText: { fontSize: typography.sizes.sm, color: colors.gray900, lineHeight: 20 },
  reportBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: colors.gray200, borderRadius: 16,
    padding: 14, marginBottom: 14,
  },
  reportBtnTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  reportBtnSub: { fontSize: typography.sizes.xs, color: colors.gray400, marginTop: 2 },
  arrow: { fontSize: 20, color: colors.gray400 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: {
    flex: 1, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: colors.white,
  },
  actionBtnPrimary: { backgroundColor: colors.primary },
  actionText: { fontSize: typography.sizes.xs, color: colors.primary, fontWeight: typography.weights.medium },
  moreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 14 },
  moreText: { fontSize: typography.sizes.sm, color: colors.gray500, textDecorationLine: 'underline' },
  disclaimer: { fontSize: typography.sizes.xs, color: colors.gray400, textAlign: 'center', lineHeight: 17, paddingHorizontal: 8 },
})