import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Image } from 'react-native'
import { colors, typography } from '../theme'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import DatePickerModal from '../components/DatePickerModal'
import PickerModal from '../components/PickerModal'
import * as ImagePicker from 'expo-image-picker'
import { signOut, sendPasswordResetEmail } from 'firebase/auth'

const occupationOpts = [
  { label: '久坐辦公', value: 'sedentary' },
  { label: '站立走動', value: 'active' },
  { label: '高溫作業', value: 'highHeat' },
  { label: '其他', value: 'other' },
]
// [修改] 生育計畫改為四個選項；原本的 'yes' / 'no' / 'undecided' 保留，舊資料不用搬
const tryingOpts = [
  { label: '正在備孕', value: 'yes' },
  { label: '1–3 年內可能', value: 'planning' },
  { label: '目前沒有計畫', value: 'no' },
  { label: '尚未決定', value: 'undecided' },
]

// [新增] 出生時辰（選填）。存到 Firestore 的是每個時辰的代表整點，未填為 null
const BIRTH_HOUR_UNKNOWN = '不清楚'
const birthHourOpts: { label: string, short: string, value: number }[] = [
  { label: '子時 23:00–01:00', short: '子時（23–01 點）', value: 0 },
  { label: '丑時 01:00–03:00', short: '丑時（01–03 點）', value: 2 },
  { label: '寅時 03:00–05:00', short: '寅時（03–05 點）', value: 4 },
  { label: '卯時 05:00–07:00', short: '卯時（05–07 點）', value: 6 },
  { label: '辰時 07:00–09:00', short: '辰時（07–09 點）', value: 8 },
  { label: '巳時 09:00–11:00', short: '巳時（09–11 點）', value: 10 },
  { label: '午時 11:00–13:00', short: '午時（11–13 點）', value: 12 },
  { label: '未時 13:00–15:00', short: '未時（13–15 點）', value: 14 },
  { label: '申時 15:00–17:00', short: '申時（15–17 點）', value: 16 },
  { label: '酉時 17:00–19:00', short: '酉時（17–19 點）', value: 18 },
  { label: '戌時 19:00–21:00', short: '戌時（19–21 點）', value: 20 },
  { label: '亥時 21:00–23:00', short: '亥時（21–23 點）', value: 22 },
]

// 任意整點換算成所屬時辰的代表值（例如 9 點 → 辰時 8）
function normalizeBirthHour(hour: any): number | null {
  if (hour == null || hour === '') return null
  const h = Number(hour)
  if (isNaN(h) || h < 0 || h > 23) return null
  if (h === 23) return 0
  return Math.floor((h + 1) / 2) * 2
}

export default function ProfileScreen({ navigation }: any) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [smoke, setSmoke] = useState(false)
  const [smokeYears, setSmokeYears] = useState('')
  const [drink, setDrink] = useState(0)
  const [birthYear, setBirthYear] = useState('')
  const [birthMonth, setBirthMonth] = useState('')
  const [birthDay, setBirthDay] = useState('')
  const [birthHour, setBirthHour] = useState<number | null>(null) // [新增]
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showBirthHourPicker, setShowBirthHourPicker] = useState(false) // [新增]
  const [showHeightPicker, setShowHeightPicker] = useState(false)
  const [showWeightPicker, setShowWeightPicker] = useState(false)
  const [avatar, setAvatar] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [varicocele, setVaricocele] = useState<boolean | null>(null)
  const [testicularHistory, setTesticularHistory] = useState<boolean | null>(null)
  const [endocrineDisease, setEndocrineDisease] = useState<boolean | null>(null)
  const [occupationType, setOccupationType] = useState<string | null>(null)
  const [tryingToConceive, setTryingToConceive] = useState<string | null>(null)

  useEffect(() => {
    async function loadProfile() {
      const user = auth.currentUser
      if (!user) {
        setLoading(false)
        return
      }
      setEmail(user.email || '')
      try {
        const snap = await getDoc(doc(db, 'users', user.uid))
        if (snap.exists()) {
          const data: any = snap.data()
          if (data.name) setName(data.name)
          if (data.birthYear) setBirthYear(data.birthYear)
          if (data.birthMonth) setBirthMonth(data.birthMonth)
          if (data.birthDay) setBirthDay(data.birthDay)
          setBirthHour(normalizeBirthHour(data.birthHour)) // [新增]
          if (data.height) setHeight(data.height)
          if (data.weight) setWeight(data.weight)
          if (data.smoke !== undefined) setSmoke(data.smoke)
          if (data.smokeYears) setSmokeYears(data.smokeYears)
          if (data.drink !== undefined) setDrink(data.drink)
          if (data.avatar) setAvatar(data.avatar)
          if (data.varicocele !== undefined) setVaricocele(data.varicocele)
          if (data.testicularHistory !== undefined) setTesticularHistory(data.testicularHistory)
          if (data.endocrineDisease !== undefined) setEndocrineDisease(data.endocrineDisease)
          if (data.occupationType) setOccupationType(data.occupationType)
          if (data.tryingToConceive) setTryingToConceive(data.tryingToConceive)
        }
      } catch (e) {
        Alert.alert('讀取失敗', '無法讀取個人資料，請稍後再試')
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  async function handleSave() {
    const user = auth.currentUser
    if (!user) {
      Alert.alert('請重新登入', '找不到登入狀態')
      return
    }
    try {
      await setDoc(doc(db, 'users', user.uid), {
        name,
        birthYear,
        birthMonth,
        birthDay,
        birthHour, // [新增] 未填為 null
        height,
        weight,
        smoke,
        smokeYears: smoke ? smokeYears : null,
        drink,
        avatar: avatar || null,
        varicocele,
        testicularHistory,
        endocrineDisease,
        occupationType,
        tryingToConceive,
      }, { merge: true })
      Alert.alert('已儲存', '個人資料已更新')
      navigation.goBack()
    } catch (e) {
      Alert.alert('儲存失敗', '請稍後再試')
    }
  }

  async function handlePickAvatar() {
    Alert.alert('更換頭像', '選擇頭像來源', [
      { text: '取消', style: 'cancel' },
      { text: '刪除頭像', style: 'destructive', onPress: async () => {
        setAvatar(null)
      }},
      { text: '從相簿選取', onPress: async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        })
        if (!result.canceled) {
          setAvatar(result.assets[0].uri)
        }
      }},
      { text: '拍照', onPress: async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync()
        if (!permission.granted) {
          Alert.alert('需要相機權限', '請在設定中允許存取相機')
          return
        }
        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        })
        if (!result.canceled) {
          setAvatar(result.assets[0].uri)
        }
      }},
    ])
  }

  const birthDisplay = birthYear && birthMonth && birthDay
    ? `${birthYear}/${birthMonth.padStart(2, '0')}/${birthDay.padStart(2, '0')}`
    : '未設定'

  // [新增]
  const selectedBirthHour = birthHourOpts.find(o => o.value === birthHour)
  const birthHourDisplay = selectedBirthHour ? selectedBirthHour.short : '未填寫'

  function YesNoRow({ label, value, onChange }: { label: string, value: boolean | null, onChange: (v: boolean) => void }) {
    return (
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={styles.optRow}>
          {['是', '否'].map((opt, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.opt, value === (i === 0) && styles.optSelected]}
              onPress={() => onChange(i === 0)}
            >
              <Text style={[styles.optText, value === (i === 0) && styles.optTextSelected]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.appbar}>
          <Text style={styles.appbarTitle}>個人資料</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>個人資料</Text>
        <TouchableOpacity style={styles.saveBtnWrap} onPress={handleSave}>
          <Text style={styles.saveBtn}>儲存</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        <TouchableOpacity style={styles.avatarArea} onPress={handlePickAvatar}>
          <View style={styles.avatarBig}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={{ width: 80, height: 80, borderRadius: 34 }} />
            ) : (
              <Text style={styles.avatarText}>{name ? name.slice(0, 1) : '?'}</Text>
            )}
          </View>
          <Text style={styles.avatarHint}>點擊更換頭像</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>基本資料</Text>
        <View style={styles.listCard}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>姓名</Text>
            <TextInput
              style={styles.fieldInput}
              value={name}
              onChangeText={setName}
              textAlign="right"
            />
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>電子信箱</Text>
            <View style={styles.fieldRight}>
              <Text style={styles.fieldValue}>{email}</Text>
              <Text style={styles.verifiedBadge}>✓ 已驗證</Text>
            </View>
          </View>
          {/* [修改] 移除 borderBottomWidth: 0，因為下面多了出生時辰一行 */}
          <TouchableOpacity style={styles.fieldRow} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.fieldLabel}>出生年月日</Text>
            <Text style={[styles.fieldValue, { color: colors.primary }]}>{birthDisplay} ›</Text>
          </TouchableOpacity>
          {/* [新增] 出生時辰（選填） */}
          <TouchableOpacity style={[styles.fieldRow, { borderBottomWidth: 0 }]} onPress={() => setShowBirthHourPicker(true)}>
            <Text style={styles.fieldLabel}>
              出生時辰<Text style={styles.optionalTag}>（選填）</Text>
            </Text>
            <Text style={[styles.fieldValue, selectedBirthHour && { color: colors.primary }]}>{birthHourDisplay} ›</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>健康背景</Text>
        <View style={styles.listCard}>
          <TouchableOpacity style={styles.fieldRow} onPress={() => setShowHeightPicker(true)}>
            <Text style={styles.fieldLabel}>身高</Text>
            <View style={styles.fieldRight}>
              <Text style={[styles.fieldValue, { color: colors.primary }]}>{height || '—'}</Text>
              <Text style={styles.unit}>cm ›</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.fieldRow} onPress={() => setShowWeightPicker(true)}>
            <Text style={styles.fieldLabel}>體重</Text>
            <View style={styles.fieldRight}>
              <Text style={[styles.fieldValue, { color: colors.primary }]}>{weight || '—'}</Text>
              <Text style={styles.unit}>kg ›</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>吸菸習慣</Text>
            <View style={styles.optRow}>
              {['是', '否'].map((opt, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.opt, smoke === (i === 0) && styles.optSelected]}
                  onPress={() => setSmoke(i === 0)}
                >
                  <Text style={[styles.optText, smoke === (i === 0) && styles.optTextSelected]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {smoke && (
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>吸菸年資</Text>
              <View style={styles.fieldRight}>
                <TextInput
                  style={[styles.fieldInput, { minWidth: 40 }]}
                  value={smokeYears}
                  onChangeText={setSmokeYears}
                  keyboardType="number-pad"
                  textAlign="right"
                  placeholder="—"
                />
                <Text style={styles.unit}>年</Text>
              </View>
            </View>
          )}
          <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.fieldLabel}>飲酒頻率</Text>
            <View style={styles.optRow}>
              {['不喝', '偶爾', '每天'].map((opt, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.opt, drink === i && styles.optSelected]}
                  onPress={() => setDrink(i)}
                >
                  <Text style={[styles.optText, drink === i && styles.optTextSelected]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>生殖健康背景</Text>
        <View style={styles.listCard}>
          <YesNoRow label="精索靜脈曲張病史" value={varicocele} onChange={setVaricocele} />
          <YesNoRow label="隱睪症／睪丸手術病史" value={testicularHistory} onChange={setTesticularHistory} />
          <YesNoRow label="內分泌相關疾病" value={endocrineDisease} onChange={setEndocrineDisease} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>職業型態</Text>
          </View>
          <View style={[styles.fieldRow, { paddingTop: 0 }]}>
            <View style={styles.optRowWrap}>
              {occupationOpts.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.opt, occupationType === opt.value && styles.optSelected]}
                  onPress={() => setOccupationType(opt.value)}
                >
                  <Text style={[styles.optText, occupationType === opt.value && styles.optTextSelected]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.fieldRow}>
            {/* [修改] 標題改為「生育計畫」，搭配四個選項 */}
            <Text style={styles.fieldLabel}>生育計畫</Text>
          </View>
          <View style={[styles.fieldRow, { borderBottomWidth: 0, paddingTop: 0 }]}>
            <View style={styles.optRowWrap}>
              {tryingOpts.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.opt, tryingToConceive === opt.value && styles.optSelected]}
                  onPress={() => setTryingToConceive(opt.value)}
                >
                  <Text style={[styles.optText, tryingToConceive === opt.value && styles.optTextSelected]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>帳號安全</Text>
<View style={styles.listCard}>
  <TouchableOpacity style={[styles.fieldRow, { borderBottomWidth: 0 }]} onPress={() => {
    Alert.alert('更改密碼', '將寄送密碼重設連結至您的信箱\n' + email, [
      { text: '取消', style: 'cancel' },
      { text: '寄送', onPress: async () => {
        try {
          await sendPasswordResetEmail(auth, email)
          Alert.alert('已寄出', `密碼重設連結已寄至 ${email}，請查看信箱。`)
        } catch (e: any) {
          const msg = e?.code === 'auth/too-many-requests'
            ? '請求過於頻繁，請稍後再試'
            : e?.code === 'auth/invalid-email'
            ? '信箱格式有誤，請確認個人資料中的信箱'
            : '寄送失敗，請稍後再試'
          Alert.alert('寄送失敗', msg)
        }
      }},
    ])
  }}>
    <Text style={styles.fieldLabel}>更改密碼</Text>
    <Text style={styles.arrow}>›</Text>
  </TouchableOpacity>
</View>

        <View style={{ height: 30 }} />
        <DatePickerModal
          visible={showDatePicker}
          year={birthYear}
          month={birthMonth}
          day={birthDay}
          onConfirm={(y, m, d) => {
            setBirthYear(y)
            setBirthMonth(m)
            setBirthDay(d)
            setShowDatePicker(false)
          }}
          onCancel={() => setShowDatePicker(false)}
        />
        {/* [新增] 出生時辰選擇器：第一個選項「不清楚」會清除時辰 */}
        <PickerModal
          visible={showBirthHourPicker}
          title="出生時辰（選填）"
          value={selectedBirthHour ? selectedBirthHour.label : BIRTH_HOUR_UNKNOWN}
          items={[BIRTH_HOUR_UNKNOWN, ...birthHourOpts.map(o => o.label)]}
          unit=""
          onConfirm={(val) => {
            const picked = birthHourOpts.find(o => o.label === val)
            setBirthHour(picked ? picked.value : null)
            setShowBirthHourPicker(false)
          }}
          onCancel={() => setShowBirthHourPicker(false)}
        />
        <PickerModal
          visible={showHeightPicker}
          title="身高"
          value={height || '170'}
          items={Array.from({ length: 81 }, (_, i) => String(140 + i))}
          unit=" cm"
          onConfirm={(val) => {
              setHeight(val)
            setShowHeightPicker(false)
          }}
          onCancel={() => setShowHeightPicker(false)}
        />
        <PickerModal
          visible={showWeightPicker}
          title="體重"
          value={weight || '65'}
          items={Array.from({ length: 101 }, (_, i) => String(30 + i))}
          unit=" kg"
          onConfirm={(val) => {
            setWeight(val)
            setShowWeightPicker(false)
          }}
          onCancel={() => setShowWeightPicker(false)}
        />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  appbar: {
  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  paddingTop: 10, paddingHorizontal: 18, paddingBottom: 0,
  },
  back: { fontSize: 40, color: colors.primary, marginRight: 6, paddingBottom: 4 },
  appbarTitle: { flex: 1, fontSize: 22, fontWeight: '600', color: colors.gray900 },
  saveBtnWrap: {
  backgroundColor: colors.white, borderWidth: 0.5, borderColor: colors.primary,
  paddingHorizontal: 20,
  paddingVertical: 10,
  borderRadius: 20,
  },
  saveBtn: { fontSize: typography.sizes.md, color: colors.primary, fontWeight: '600' },
  scroll: { flex: 1, padding: 18 },
  avatarArea: { alignItems: 'center', paddingVertical: 0, gap: 8, marginBottom: 8 },
  avatarBig: {
    width: 80, height: 80, borderRadius:  40,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarText: { fontSize: 40, fontWeight: typography.weights.medium, color: colors.primary },
  avatarHint: { fontSize: typography.sizes.xs, color: colors.gray400 },
  sectionTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.gray500, marginBottom: 8 },
  listCard: {
    backgroundColor: colors.white,
    borderWidth: 0.5, borderColor: colors.gray200,
    borderRadius: 16, paddingHorizontal: 14, marginBottom: 16,
  },
  fieldRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 11, borderBottomWidth: 0.5, borderBottomColor: colors.gray100,
  },
  fieldLabel: { fontSize: typography.sizes.md, color: colors.gray900 },
  optionalTag: { fontSize: typography.sizes.sm, color: colors.gray400 }, // [新增]
  fieldInput: { fontSize: typography.sizes.md, color: colors.gray900, minWidth: 80 },
  fieldRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fieldValue: { fontSize: typography.sizes.md, color: colors.gray500 },
  verifiedBadge: { fontSize: typography.sizes.xs, color: colors.success },
  unit: { fontSize: typography.sizes.sm, color: colors.gray400 },
  optRow: { flexDirection: 'row', gap: 6 },
  optRowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingBottom: 10, flex: 1, justifyContent: 'flex-end' },
  opt: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, borderWidth: 0.5, borderColor: colors.gray200 },
  optSelected: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  optText: { fontSize: typography.sizes.sm, color: colors.gray500 },
  optTextSelected: { color: colors.primary, fontWeight: '600' },
  arrow: { fontSize: typography.sizes.md, color: colors.gray400 },
})