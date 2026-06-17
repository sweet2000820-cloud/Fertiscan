import { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { colors, typography } from '../theme'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function ClinicQRScreen({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)

  if (!permission) {
    return <View style={styles.container} />
  }

  if (!permission.granted) {
    return (
      <View style={styles.permContainer}>
        <Text style={styles.permText}>需要相機權限才能掃描 QR Code</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>授予相機權限</Text>
        </TouchableOpacity>
      </View>
    )
  }

  function handleScan({ data }: { data: string }) {
    if (scanned) return
    setScanned(true)
    Alert.alert(
      '掃描成功',
      `已掃描到診所 QR Code`,
      [{ text: '繼續', onPress: () => navigation.navigate('Consent') }]
    )
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleScan}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backBtn}>‹ 返回</Text>
          </TouchableOpacity>
          <Text style={styles.title}>掃描診所 QR Code</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.viewfinder}>
          <View style={styles.frameBox}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <Text style={styles.hint}>將鏡頭對準診所提供的 QR Code</Text>
        </View>

        <View style={styles.footer}>
          {scanned && (
            <TouchableOpacity style={styles.resetBtn} onPress={() => setScanned(false)}>
              <Text style={styles.resetBtnText}>重新掃描</Text>
            </TouchableOpacity>
          )}
        </View>

      </CameraView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  permContainer: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', padding: 24 },
  permText: { color: '#fff', fontSize: typography.sizes.md, textAlign: 'center', marginBottom: 20 },
  permBtn: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 9 },
  permBtnText: { color: '#fff', fontSize: typography.sizes.md, fontWeight: typography.weights.medium },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, paddingTop: 60,
  },
  backBtn: { fontSize: typography.sizes.sm, color: 'rgba(255,255,255,0.7)' },
  title: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: '#fff' },
  viewfinder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  frameBox: {
    width: 250, height: 250,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 8,
  },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: '#4ade80' },
  cornerTL: { top: -1, left: -1, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 4 },
  cornerTR: { top: -1, right: -1, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 4 },
  cornerBL: { bottom: -1, left: -1, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: -1, right: -1, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 4 },
  hint: { color: 'rgba(255,255,255,0.6)', fontSize: typography.sizes.sm, textAlign: 'center' },
  footer: { padding: 24, alignItems: 'center' },
  resetBtn: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 9 },
  resetBtnText: { color: '#fff', fontSize: typography.sizes.md, fontWeight: typography.weights.medium },
})