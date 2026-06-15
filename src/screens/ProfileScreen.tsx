import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Image } from 'react-native'
import { colors, typography } from '../theme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import DatePickerModal from '../components/DatePickerModal'
import PickerModal from '../components/PickerModal'
import * as ImagePicker from 'expo-image-picker'

export default function ProfileScreen({ navigation }: any) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [smoke, setSmoke] = useState(false)
  const [drink, setDrink] = useState(0)
  const [birthYear, setBirthYear] = useState('')
  const [birthMonth, setBirthMonth] = useState('')
  const [birthDay, setBirthDay] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showHeightPicker, setShowHeightPicker] = useState(false)
  const [showWeightPicker, setShowWeightPicker] = useState(false)
  const [avatar, setAvatar] = useState<string | null>(null)

  useEffect(() => {
    AsyncStorage.getItem('userName').then(val => { if (val) setName(val) })
    AsyncStorage.getItem('userEmail').then(val => { if (val) setEmail(val) })
    AsyncStorage.getItem('userBirthYear').then(val => { if (val) setBirthYear(val) })
    AsyncStorage.getItem('userBirthMonth').then(val => { if (val) setBirthMonth(val) })
    AsyncStorage.getItem('userBirthDay').then(val => { if (val) setBirthDay(val) })
    AsyncStorage.getItem('userHeight').then(val => { if (val) setHeight(val) })
    AsyncStorage.getItem('userWeight').then(val => { if (val) setWeight(val) })
    AsyncStorage.getItem('userSmoke').then(val => { if (val !== null) setSmoke(val === '1') })
    AsyncStorage.getItem('userDrink').then(val => { if (val !== null) setDrink(parseInt(val)) })
    AsyncStorage.getItem('userAvatar').then(val => { if (val) setAvatar(val) })
  }, [])

  async function handleSave() {
    await AsyncStorage.setItem('userName', name)
    await AsyncStorage.setItem('userHeight', height)
    await AsyncStorage.setItem('userWeight', weight)
    await AsyncStorage.setItem('userSmoke', smoke ? '1' : '0')
    await AsyncStorage.setItem('userDrink', String(drink))
    await AsyncStorage.setItem('userBirthYear', birthYear)
    await AsyncStorage.setItem('userBirthMonth', birthMonth)
    await AsyncStorage.setItem('userBirthDay', birthDay)
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
  opt: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 0.5, borderColor: colors.gray200 },
  optSelected: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  optText: { fontSize: typography.sizes.sm, color: colors.gray500 },
  optTextSelected: { color: colors.primary, fontWeight: typography.weights.medium },
  arrow: { fontSize: typography.sizes.md, color: colors.gray400 },
})