import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native'
import { colors, typography } from '../theme'
import AsyncStorage from '@react-native-async-storage/async-storage'

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

  useEffect(() => {
    AsyncStorage.getItem('userName').then(val => { if (val) setName(val) })
    AsyncStorage.getItem('userEmail').then(val => { if (val) setEmail(val) })
    AsyncStorage.getItem('userBirthYear').then(val => { if (val) setBirthYear(val) })
    AsyncStorage.getItem('userBirthMonth').then(val => { if (val) setBirthMonth(val) })
    AsyncStorage.getItem('userBirthDay').then(val => { if (val) setBirthDay(val) })
    AsyncStorage.getItem('userHeight').then(val => { if (val) setHeight(val) })
    AsyncStorage.getItem('userWeight').then(val => { if (val) setWeight(val) })
  }, [])

  async function handleSave() {
    await AsyncStorage.setItem('userName', name)
    await AsyncStorage.setItem('userHeight', height)
    await AsyncStorage.setItem('userWeight', weight)
    Alert.alert('已儲存', '個人資料已更新')
    navigation.goBack()
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

        <View style={styles.avatarArea}>
          <View style={styles.avatarBig}>
            <Text style={styles.avatarText}>{name ? name.slice(0, 1) : '?'}</Text>
          </View>
          <Text style={styles.avatarHint}>點擊更換頭像</Text>
        </View>

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
          <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.fieldLabel}>出生年月日</Text>
            <Text style={styles.fieldValue}>{birthDisplay}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>健康背景</Text>
        <View style={styles.listCard}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>身高</Text>
            <View style={styles.fieldRight}>
              <TextInput
                style={[styles.fieldInput, { width: 60 }]}
                value={height}
                onChangeText={setHeight}
                keyboardType="number-pad"
                textAlign="right"
                placeholder="—"
                placeholderTextColor={colors.gray400}
              />
              <Text style={styles.unit}>cm</Text>
            </View>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>體重</Text>
            <View style={styles.fieldRight}>
              <TextInput
                style={[styles.fieldInput, { width: 60 }]}
                value={weight}
                onChangeText={setWeight}
                keyboardType="number-pad"
                textAlign="right"
                placeholder="—"
                placeholderTextColor={colors.gray400}
              />
              <Text style={styles.unit}>kg</Text>
            </View>
          </View>
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
          <TouchableOpacity style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>更改密碼</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
          <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.fieldLabel}>雙重驗證</Text>
            <Text style={styles.fieldValue}>未開啟</Text>
          </View>
        </View>

        <View style={{ height: 30 }} />
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
  back: { fontSize: 22, color: colors.primary, marginRight: 6 },
  appbarTitle: { flex: 1, fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  saveBtn: { fontSize: typography.sizes.md, color: colors.primary },
  scroll: { flex: 1, padding: 18 },
  avatarArea: { alignItems: 'center', paddingVertical: 16, gap: 8, marginBottom: 8 },
  avatarBig: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
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