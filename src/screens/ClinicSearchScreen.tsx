import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colors, typography } from '../theme'

export default function ClinicSearchScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>搜尋合作診所</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.text}>搜尋診所（開發中）</Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Consent')}>
          <Text style={styles.btnText}>選擇診所 →</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  appbar: { height: 46, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: colors.gray200 },
  back: { fontSize: 22, color: colors.primary, marginRight: 6 },
  appbarTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  text: { fontSize: typography.sizes.md, color: colors.gray500 },
  btn: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 9 },
  btnText: { color: '#fff', fontSize: typography.sizes.md, fontWeight: typography.weights.medium },
})