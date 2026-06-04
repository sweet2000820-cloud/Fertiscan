import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { colors, typography } from '../theme'

export default function CamCaptureScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>試紙拍攝</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.text}>相機畫面（開發中）</Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Analysis')}>
          <Text style={styles.btnText}>模擬拍攝成功 → 分析</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnRed} onPress={() => navigation.navigate('QCFail')}>
          <Text style={styles.btnRedText}>模擬 QC 失敗</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  appbar: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.gray200,
  },
  back: { fontSize: 22, color: colors.primary, marginRight: 6 },
  appbarTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.gray900,
  },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  text: { fontSize: typography.sizes.md, color: colors.gray500 },
  btn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 9,
  },
  btnText: { color: colors.white, fontSize: typography.sizes.md, fontWeight: typography.weights.medium },
  btnRed: {
    borderWidth: 1.5,
    borderColor: colors.danger,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 9,
  },
  btnRedText: { color: colors.danger, fontSize: typography.sizes.md },
})