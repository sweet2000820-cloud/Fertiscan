import { useState } from 'react'
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { colors, typography } from '../theme'
import Button from '../components/Button'
import AsyncStorage from '@react-native-async-storage/async-storage'
import DatePickerModal from '../components/DatePickerModal'



export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [birthYear, setBirthYear] = useState('')
  const [birthMonth, setBirthMonth] = useState('')
  const [birthDay, setBirthDay] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)

  async function handleRegister() {
    if (!name || !email || !password) {
      Alert.alert('請填寫', '請填寫所有欄位')
      return
    }
    if (!agreed) {
      Alert.alert('請同意', '請同意服務條款與隱私政策')
      return
    }
    await AsyncStorage.multiRemove([
      'userName', 'userEmail', 'userBirthYear', 'userBirthMonth', 'userBirthDay',
      'userHeight', 'userWeight', 'userSmoke', 'userDrink',
      'strips', 'lastTestDate', 'testRecords', 'clinics', 'reminderWeeks', 'lotNumber', 'onboardingShown'
    ])
    await AsyncStorage.setItem('userName', name)
    await AsyncStorage.setItem('userEmail', email)
    await AsyncStorage.setItem('userBirthYear', birthYear)
    await AsyncStorage.setItem('userBirthMonth', birthMonth)
    await AsyncStorage.setItem('userBirthDay', birthDay)
    navigation.navigate('VerifyEmail', { email })
  }

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 3 : 4

  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>建立帳號</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <View style={styles.field}>
          <Text style={styles.label}>姓名</Text>
          <TextInput
            style={styles.input}
            placeholder="陳小明"
            placeholderTextColor={colors.gray400}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>出生年月日</Text>
          <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
            <Text style={{ color: birthYear ? colors.gray900 : colors.gray400, fontSize: typography.sizes.md, lineHeight: 38 }}>
              {birthYear && birthMonth && birthDay ? `${birthYear}/${birthMonth.padStart(2,'0')}/${birthDay.padStart(2,'0')}` : '請選擇出生年月日'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>電子信箱</Text>
          <TextInput
            style={styles.input}
            placeholder="example@gmail.com"
            placeholderTextColor={colors.gray400}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>密碼</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={colors.gray400}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <View style={styles.strengthRow}>
            {[1, 2, 3, 4].map(i => (
              <View key={i} style={[styles.strengthBar, i <= strength && styles.strengthBarFill]} />
            ))}
          </View>
          <Text style={styles.hint}>
            密碼強度：{strength === 0 ? '—' : strength === 1 ? '弱' : strength === 3 ? '良好' : '強'}
          </Text>
        </View>

        <TouchableOpacity style={styles.agreeRow} onPress={() => setAgreed(!agreed)}>
          <View style={[styles.checkbox, agreed && styles.checkboxDone]}>
            {agreed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.agreeText}>
            我同意<Text style={styles.link}>服務條款</Text>與<Text style={styles.link}>隱私政策</Text>，我的檢測數據僅存於本機
          </Text>
        </TouchableOpacity>

        <Button title="建立帳號" onPress={handleRegister} />

        <View style={{ height: 30 }} />
        <DatePickerModal
          visible={showDatePicker}
          year={birthYear || '1992'}
          month={birthMonth || '01'}
          day={birthDay || '01'}
          onConfirm={(y, m, d) => {
            setBirthYear(y)
            setBirthMonth(m)
            setBirthDay(d)
            setShowDatePicker(false)
          }}
          onCancel={() => setShowDatePicker(false)}
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
  back: { fontSize: 50, color: colors.primary, marginRight: 6 },
  appbarTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  scroll: { flex: 1, padding: 18 },
  field: { marginBottom: 14 },
  label: { fontSize: typography.sizes.xs, color: colors.gray500, fontWeight: typography.weights.medium, marginBottom: 4 },
  input: {
    height: 40, borderWidth: 0.5, borderColor: colors.gray300,
    borderRadius: 8, paddingHorizontal: 12,
    fontSize: typography.sizes.md, color: colors.gray900,
  },
  dateRow: { flexDirection: 'row', gap: 6 },
  hint: { fontSize: typography.sizes.xs, color: colors.gray400, marginTop: 4 },
  strengthRow: { flexDirection: 'row', gap: 3, marginTop: 6 },
  strengthBar: { flex: 1, height: 3, borderRadius: 2, backgroundColor: colors.gray200 },
  strengthBarFill: { backgroundColor: colors.primary },
  agreeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 16 },
  checkbox: {
    width: 14, height: 14, borderRadius: 3,
    borderWidth: 1.5, borderColor: colors.gray300,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2, flexShrink: 0,
  },
  checkboxDone: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  checkmark: { fontSize: 9, color: colors.primary },
  agreeText: { fontSize: typography.sizes.xs, color: colors.gray400, flex: 1, lineHeight: 18 },
  link: { color: colors.primary },
})