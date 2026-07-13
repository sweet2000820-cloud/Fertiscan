import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Image } from 'react-native'
import { colors, typography } from '../theme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import DatePickerModal from '../components/DatePickerModal'
import PickerModal from '../components/PickerModal'
import * as ImagePicker from 'expo-image-picker'

const occupationOpts = [
  { label: '久坐辦公', value: 'sedentary' },
  { label: '站立走動', value: 'active' },
  { label: '高溫作業', value: 'highHeat' },
  { label: '其他', value: 'other' },
]
const tryingOpts = [
  { label: '是', value: 'yes' },
  { label: '否', value: 'no' },
  { label: '尚未決定', value: 'undecided' },
]

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
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showHeightPicker, setShowHeightPicker] = useState(false)
  const [showWeightPicker, setShowWeightPicker] = useState(false)
  const [avatar, setAvatar] = useState<string | null>(null)

  // 新增的生殖健康背景欄位
  const [varicocele, setVaricocele] = useState<boolean | null>(null)
  const [testicularHistory, setTesticularHistory] = useState<boolean | null>(null)
  const [endocrineDisease, setEndocrineDisease] = useState<boolean | null>(null)
  const [hadSemenTest, setHadSemenTest] = useState<boolean | null>(null)
  const [occupationType, setOccupationType] = useState<string | null>(null)
  const [tryingToConceive, setTryingToConceive] = useState<string | null>(null)

  useEffect(() => {
    AsyncStorage.getItem('userName').then(val => { if (val) setName(val) })
    AsyncStorage.getItem('userEmail').then(val => { if (val) setEmail(val) })
    AsyncStorage.getItem('userBirthYear').then(val => { if (val) setBirthYear(val) })
    AsyncStorage.getItem('userBirthMonth').then(val => { if (val) setBirthMonth(val) })
    AsyncStorage.getItem('userBirthDay').then(val => { if (val) setBirthDay(val) })
    AsyncStorage.getItem('userHeight').then(val => { if (val) setHeight(val) })
    AsyncStorage.getItem('userWeight').then(val => { if (val) setWeight(val) })
    AsyncStorage.getItem('userSmoke').then(val => { if (val !== null) setSmoke(val === 'true') })
    AsyncStorage.getItem('userSmokeYears').then(val => { if (val) setSmokeYears(val) })
    AsyncStorage.getItem('userDrink').then(val => { if (val !== null) setDrink(parseInt(val)) })
    AsyncStorage.getItem('userAvatar').then(val => { if (val) setAvatar(val) })
    AsyncStorage.getItem('userVaricocele').then(val => { if (val !== null) setVaricocele(val === 'true') })
    AsyncStorage.getItem('userTesticularHistory').then(val => { if (val !== null) setTesticularHistory(val === 'true') })
    AsyncStorage.getItem('userEndocrineDisease').then(val => { if (val !== null) setEndocrineDisease(val === 'true') })
    AsyncStorage.getItem('userHadSemenTest').then(val => { if (val !== null) setHadSemenTest(val === 'true') })
    AsyncStorage.getItem('userOccupationType').then(val => { if (val) setOccupationType(val) })
    AsyncStorage.getItem('userTryingToConceive').then(val => { if (val) setTryingToConceive(val) })
  }, [])

  async function handleSave() {
    if (name) await AsyncStorage.setItem('userName', name)
    if (height) await AsyncStorage.setItem('userHeight', height)
    if (weight) await AsyncStorage.setItem('userWeight', weight)
    await AsyncStorage.setItem('userSmoke', smoke ? 'true' : 'false')
    await AsyncStorage.setItem('userDrink', String(drink))
    if (birthYear) await AsyncStorage.setItem('userBirthYear', birthYear)
    if (birthMonth) await AsyncStorage.setItem('userBirthMonth', birthMonth)
    if (birthDay) await AsyncStorage.setItem('userBirthDay', birthDay)
      
    if (smoke && smokeYears) {
      await AsyncStorage.setItem('userSmokeYears', smokeYears)
    } else {
      await AsyncStorage.removeItem('userSmokeYears')
    }

    if (varicocele !== null) await AsyncStorage.setItem('userVaricocele', varicocele ? 'true' : 'false')
    if (testicularHistory !== null) await AsyncStorage.setItem('userTesticularHistory', testicularHistory ? 'true' : 'false')
    if (endocrineDisease !== null) await AsyncStorage.setItem('userEndocrineDisease', endocrineDisease ? 'true' : 'false')
    if (hadSemenTest !== null) await AsyncStorage.setItem('userHadSemenTest', hadSemenTest ? 'true' : 'false')
    if (occupationType) await AsyncStorage.setItem('userOccupationType', occupationType)
    if (tryingToConceive) await AsyncStorage.setItem('userTryingToConceive', tryingToConceive)

    if (avatar) {
      await AsyncStorage.setItem('userAvatar', avatar)
    } else {
      await AsyncStorage.removeItem('userAvatar')
    }
    Alert.alert('已儲存', '個人資料已更新')
    navigation.goBack()
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

  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>個人資料</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveBtn}>儲存</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        <TouchableOpacity style={styles.avatarArea} onPress={handlePickAvatar}>
          <View style={styles.avatarBig}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={{ width: 68, height: 68, borderRadius: 34 }} />
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
          <TouchableOpacity style={[styles.fieldRow, { borderBottomWidth: 0 }]} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.fieldLabel}>出生年月日</Text>
            <Text style={[styles.fieldValue, { color: colors.primary }]}>{birthDisplay} ›</Text>
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
          <YesNoRow label="曾做過正式精液檢查" value={hadSemenTest} onChange={setHadSemenTest} />

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
            <Text style={styles.fieldLabel}>是否正在備孕</Text>
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
              { text: '寄送', onPress: () => {
                Alert.alert('已寄出', `密碼重設連結已寄至 ${email}，請查看信箱。`)
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
    height: 46, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: colors.gray200,
  },
  back: { fontSize: 30, color: colors.primary, marginRight: 6 },
  appbarTitle: { flex: 1, fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  saveBtn: { fontSize: typography.sizes.md, color: colors.primary },
  scroll: { flex: 1, padding: 18 },
  avatarArea: { alignItems: 'center', paddingVertical: 16, gap: 8, marginBottom: 8 },
  avatarBig: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarText: { fontSize: 24, fontWeight: typography.weights.medium, color: colors.primary },
  avatarHint: { fontSize: typography.sizes.xs, color: colors.gray400 },
  sectionTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.gray500, marginBottom: 8 },
  listCard: { borderWidth: 0.5, borderColor: colors.gray200, borderRadius: 10, paddingHorizontal: 14, marginBottom: 16 },
  fieldRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: colors.gray100,
  },
  fieldLabel: { fontSize: typography.sizes.md, color: colors.gray900 },
  fieldInput: { fontSize: typography.sizes.md, color: colors.gray900, minWidth: 80 },
  fieldRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fieldValue: { fontSize: typography.sizes.md, color: colors.gray500 },
  verifiedBadge: { fontSize: typography.sizes.xs, color: colors.success },
  unit: { fontSize: typography.sizes.sm, color: colors.gray400 },
  optRow: { flexDirection: 'row', gap: 6 },
  optRowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingBottom: 10, flex: 1, justifyContent: 'flex-end' },
  opt: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 0.5, borderColor: colors.gray200 },
  optSelected: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  optText: { fontSize: typography.sizes.sm, color: colors.gray500 },
  optTextSelected: { color: colors.primary, fontWeight: typography.weights.medium },
  arrow: { fontSize: typography.sizes.md, color: colors.gray400 },
})