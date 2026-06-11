import { useState, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { colors, typography } from '../theme'

export default function CamCaptureScreen({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions()
  const [captured, setCaptured] = useState(false)
  const cameraRef = useRef<CameraView>(null)

  if (!permission) return <View style={styles.container} />

  if (!permission.granted) {
    return (
      <View style={styles.permContainer}>
        <Text style={styles.permText}>需要相機權限才能拍攝試紙</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>授予相機權限</Text>
        </TouchableOpacity>
      </View>
    )
  }

  async function takePicture() {
    if (cameraRef.current && !captured) {
      setCaptured(true)
      try {
        await cameraRef.current.takePictureAsync({ quality: 0.8 })
        navigation.navigate('Analysis')
      } catch (e) {
        Alert.alert('拍攝失敗', '請再試一次')
        setCaptured(false)
      }
    }
  }

  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFill} facing="front" ref={cameraRef} />

      <View style={styles.maskTop} />
      <View style={styles.maskMiddle}>
        <View style={styles.maskSide} />
        <View style={styles.frameBox}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
          <Text style={styles.frameHint}>將試紙對準框內</Text>
        </View>
        <View style={styles.maskSide} />
      </View>
      <View style={styles.maskBottom} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.stepText}>步驟 3/5 — 試紙拍攝</Text>
        <View style={styles.liveBadge}>
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.hintText}>保持手機穩定，確認 C、T 兩條線清晰可見</Text>
        <View style={styles.captureRow}>
          <TouchableOpacity style={styles.sideBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.sideBtnText}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
            <View style={styles.captureInner} />
          </TouchableOpacity>
          <View style={styles.sideBtn} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  permContainer: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', padding: 24 },
  permText: { color: '#fff', fontSize: typography.sizes.md, textAlign: 'center', marginBottom: 20 },
  permBtn: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 9 },
  permBtnText: { color: '#fff', fontSize: typography.sizes.md, fontWeight: typography.weights.medium },
  maskTop: { position: 'absolute', top: 0, left: 0, right: 0, height: '35%', backgroundColor: 'rgba(0,0,0,0.6)' },
  maskMiddle: { position: 'absolute', top: '35%', left: 0, right: 0, height: 160, flexDirection: 'row' },
  maskSide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  maskBottom: { position: 'absolute', top: '35%', left: 0, right: 0, bottom: 0, marginTop: 160, backgroundColor: 'rgba(0,0,0,0.6)' },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, paddingTop: 60,
  },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 14, paddingBottom: 50,
  },
  backBtn: { fontSize: typography.sizes.sm, color: 'rgba(255,255,255,0.7)' },
  stepText: { fontSize: typography.sizes.xs, color: 'rgba(255,255,255,0.5)' },
  liveBadge: {
    backgroundColor: 'rgba(74,222,128,0.15)', borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.3)', borderRadius: 4,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  liveText: { fontSize: typography.sizes.xs, color: '#4ade80' },
  frameBox: {
    width: 280, height: 160,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  corner: { position: 'absolute', width: 20, height: 20, borderColor: '#4ade80' },
  cornerTL: { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 4 },
  cornerTR: { top: -1, right: -1, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 4 },
  cornerBL: { bottom: -1, left: -1, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 4 },
  frameHint: { color: 'rgba(255,255,255,0.5)', fontSize: typography.sizes.xs, textAlign: 'center' },
  hintText: { color: 'rgba(255,255,255,0.5)', fontSize: typography.sizes.xs, textAlign: 'center', marginBottom: 16 },
  captureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 40 },
  sideBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  sideBtnText: { color: 'rgba(255,255,255,0.6)', fontSize: 22 },
  captureBtn: {
    width: 70, height: 70, borderRadius: 35,
    borderWidth: 3, borderColor: '#fff',
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  captureInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#fff' },
})