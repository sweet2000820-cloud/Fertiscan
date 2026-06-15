import { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native'
import { colors, typography } from '../theme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Ionicons } from '@expo/vector-icons'

const validCodes: Record<string, { clinicName: string}> = {
  '123456': { clinicName: '艾微芙國際生殖醫學中心'},
  '654321': { clinicName: '華育婦產科診所'},
  '111111': { clinicName: '王家瑋婦產科診所'},
  '999999': { clinicName: '茂盛醫院生殖醫學中心'},
  '888888': { clinicName: '送子鳥診所'},
}

export default function ClinicCodeScreen({ navigation }: any) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleVerify() {
    if (code.length !== 6) {
      Alert.alert('格式錯誤', '請輸入 6 位數字邀請碼')
      return
    }
    setLoading(true)
    setTimeout(async () => {
      setLoading(false)
      if (validCodes[code]) {
        const raw = await AsyncStorage.getItem('clinics')
        const existing = raw ? JSON.parse(raw) : []
        const alreadyLinked = existing.some((c: any) => c.name === validCodes[code].clinicName)
        if (alreadyLinked) {
          Alert.alert('已連結', `您已經連結了${validCodes[code].clinicName}，無法重複連結。`)
          setLoading(false)
          return
        }
        navigation.navigate('Consent', {
          clinicName: validCodes[code].clinicName,
        })
      } else {
        Alert.alert('邀請碼無效', '請確認邀請碼是否正確，或向診所重新索取')
      }
    }, 1000)
  }

  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>輸入診所邀請碼</Text>
      </View>

      <View style={styles.content}>

        <View style={styles.iconArea}>
          <View style={styles.iconBox}>
          <Ionicons name="keypad-outline" size={36} color={colors.primary} />
        </View>
          <Text style={styles.title}>輸入 6 位數邀請碼</Text>
          <Text style={styles.sub}>由診所提供的邀請碼，輸入後即可建立連結</Text>
        </View>

        {/* 6格輸入框 */}
        <View style={styles.codeRow}>
          {[0,1,2,3,4,5].map(i => (
            <View key={i} style={[styles.codeBox, code.length === i && styles.codeBoxActive, code.length > i && styles.codeBoxFilled]}>
              <Text style={styles.codeChar}>{code[i] || ''}</Text>
            </View>
          ))}
        </View>

        {/* 隱藏的真實輸入框 */}
        <TextInput
          style={styles.hiddenInput}
          value={code}
          onChangeText={t => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
        />

        <TouchableOpacity
          style={[styles.verifyBtn, (code.length !== 6 || loading) && { opacity: 0.4 }]}
          onPress={handleVerify}
          disabled={code.length !== 6 || loading}
        >
          <Text style={styles.verifyBtnText}>{loading ? '驗證中...' : '驗證邀請碼'}</Text>
        </TouchableOpacity>

        <View style={styles.tealCard}>
          <Text style={styles.tealTitle}>測試用邀請碼</Text>
          <Text style={styles.tealText}>123456 · 654321 · 111111 · 999999 · 888888</Text>
        </View>

        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>取消</Text>
        </TouchableOpacity>

      </View>
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
  content: { flex: 1, padding: 24 },
  iconArea: { alignItems: 'center', paddingVertical: 20, gap: 8, marginBottom: 20 },
  iconBox: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  iconText: { fontSize: 32, color: colors.primary },
  title: { fontSize: typography.sizes.lg, fontWeight: typography.weights.medium, color: colors.gray900 },
  sub: { fontSize: typography.sizes.sm, color: colors.gray400, textAlign: 'center', lineHeight: 20 },
  codeRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 16 },
  codeBox: {
    width: 46, height: 56, borderRadius: 10,
    borderWidth: 1.5, borderColor: colors.gray200,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.gray100,
  },
  codeBoxActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  codeBoxFilled: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  codeChar: { fontSize: 22, fontWeight: typography.weights.medium, color: colors.gray900 },
  hiddenInput: { position: 'absolute', opacity: 0, width: 1, height: 1 },
  verifyBtn: {
    height: 42, borderRadius: 9, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  verifyBtnText: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: '#fff' },
  tealCard: { backgroundColor: colors.primaryLight, borderRadius: 10, padding: 12, marginBottom: 16 },
  tealTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.primary, marginBottom: 4 },
  tealText: { fontSize: typography.sizes.sm, color: '#0d7a8f' },
  backBtn: { alignItems: 'center' },
  backBtnText: { fontSize: typography.sizes.sm, color: colors.gray500 },
})