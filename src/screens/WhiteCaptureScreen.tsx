import { useState, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { colors, typography } from '../theme'

export default function WhiteCaptureScreen({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions()
  const [captured, setCaptured] = useState(false)
  const cameraRef = useRef<CameraView>(null)

  if (!permission) return <View style={styles.container} />

  if (!permission.granted) {
    return (
      <View style={styles.permContainer}>
        <Text style={styles.permText}>需要相機權限才能拍攝白場</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>授予相機權限</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const API_URL = 'https://fertiscan-api-production-8841.up.railway.app'

async function takeWhiteCapture() {
  if (cameraRef.current && !captured) {
    setCaptured(true)
    try {
      // 拍白場照片
      const photo = await cameraRef.current.takePictureAsync({ 
        quality: 0.8,
        base64: false 
      })
      
      if (!photo) throw new Error('拍照失敗')

      // 送到 API 校準
      const formData = new FormData()
      formData.append('file', {
        uri: photo.uri,
        type: 'image/jpeg',
        name: 'white.jpg',
      } as any)

      const response = await fetch(`${API_URL}/calibrate`, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const result = await response.json()

      if (result.success) {
        // 白場校準成功，繼續下一步
        Alert.alert(
          '白場校準完成', 
          `平均亮度：${result.data.white_mean}`,
          [{ text: '繼續', onPress: () => navigation.navigate('CamCapture') }]
        )
      } else {
        Alert.alert('校準失敗', result.error || '請重新拍攝')
        setCaptured(false)
      }

    } catch (e: any) {
      Alert.alert('錯誤詳情', e?.message || JSON.stringify(e))
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
          <Text style={styles.frameHint}>請勿放入試紙{'\n'}純白場拍攝</Text>
        </View>
        <View style={styles.maskSide} />
      </View>
      <View style={styles.maskBottom} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.stepText}>步驟 2/5 — 白場校準</Text>
        <View style={styles.calibBadge}>
          <Text style={styles.calibText}>CALIBRATING</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.hintText}>對準夾具視窗，拍攝空白背景基準</Text>
        <View style={styles.captureRow}>
          <TouchableOpacity style={styles.sideBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.sideBtnText}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.captureBtn} onPress={takeWhiteCapture}>
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
  calibBadge: {
    backgroundColor: 'rgba(74,222,128,0.15)', borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.3)', borderRadius: 4,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  calibText: { fontSize: typography.sizes.xs, color: '#4ade80' },
  frameBox: {
    width: 280, height: 160,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  corner: { position: 'absolute', width: 20, height: 20, borderColor: 'rgba(255,255,255,0.4)' },
  cornerTL: { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 4 },
  cornerTR: { top: -1, right: -1, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 4 },
  cornerBL: { bottom: -1, left: -1, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 4 },
  frameHint: { color: 'rgba(255,255,255,0.5)', fontSize: typography.sizes.xs, textAlign: 'center', lineHeight: 18 },
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