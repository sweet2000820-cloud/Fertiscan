import { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { colors, typography } from '../theme'

const { width, height } = Dimensions.get('window')
const BOX_SIZE = 260
const BOX_TOP = (height - BOX_SIZE) / 2 - 40

export default function ClinicQRScreen({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)

  if (!permission) return <View style={styles.container} />

  if (!permission.granted) {
    return (
      <View style={styles.permContainer}>
        <Text style={styles.permText}>需要相機權限才能掃描診所 QR Code</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>授予相機權限</Text>
        </TouchableOpacity>
      </View>
    )
  }

  function handleScan({ data }: { data: string }) {
    if (scanned) return
    setScanned(true)
    navigation.navigate('Consent', { clinicName: data })
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleScan}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      <View style={[styles.mask, { top: 0, left: 0, right: 0, height: BOX_TOP }]} />
      <View style={[styles.mask, { top: BOX_TOP + BOX_SIZE, left: 0, right: 0, bottom: 0 }]} />

      <View style={[styles.row, { top: BOX_TOP, height: BOX_SIZE }]}>
        <View style={[styles.mask, { position: 'absolute', top: 0, left: 0, bottom: 0, width: (width - BOX_SIZE) / 2 }]} />
        <View style={styles.scanBox}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>
        <View style={[styles.mask, { position: 'absolute', top: 0, right: 0, bottom: 0, width: (width - BOX_SIZE) / 2 }]} />
      </View>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>掃描診所 QR Code</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.hint}>將診所提供的 QR Code 對準框內</Text>
        {scanned && (
          <TouchableOpacity style={styles.resetBtn} onPress={() => setScanned(false)}>
            <Text style={styles.resetBtnText}>重新掃描</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  permContainer: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', padding: 24 },
  permText: { color: '#fff', fontSize: typography.sizes.md, textAlign: 'center', marginBottom: 20 },
  permBtn: { backgroundColor: colors.primary, paddingHorizontal: 26, paddingVertical: 12, borderRadius: 22 },
  permBtnText: { color: '#fff', fontSize: typography.sizes.md, fontWeight: typography.weights.medium },
  mask: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.6)' },
  row: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  scanBox: { width: BOX_SIZE, height: BOX_SIZE },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: '#4ade80' },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, paddingTop: 60,
  },
  backBtn: { fontSize: typography.sizes.sm, color: 'rgba(255,255,255,0.85)' },
  title: { fontSize: typography.sizes.md, fontWeight: '600', color: '#fff' },
  footer: { position: 'absolute', bottom: 80, left: 0, right: 0, alignItems: 'center', gap: 16 },
  hint: { color: 'rgba(255,255,255,0.7)', fontSize: typography.sizes.sm },
  resetBtn: { backgroundColor: colors.primary, paddingHorizontal: 26, paddingVertical: 12, borderRadius: 22 },
  resetBtnText: { color: '#fff', fontSize: typography.sizes.md, fontWeight: typography.weights.medium },
})