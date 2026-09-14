import { useState, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { colors, typography } from '../theme'
import { auth } from '../firebase'
import * as ImageManipulator from 'expo-image-manipulator'

export default function CamCaptureScreen({ navigation, route }: any) {
  const [permission, requestPermission] = useCameraPermissions()
  const [captured, setCaptured] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processStep, setProcessStep] = useState('')
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

  const API_URL = 'https://fertiscan-api.onrender.com/analyze'

async function takePicture() {
  if (cameraRef.current && !captured) {
    setCaptured(true)
    setIsProcessing(true)
    setProcessStep('拍攝第 1 張...')
    try {
      // 取得目前登入使用者的憑證，之後每次呼叫 API 都要附上
      const user = auth.currentUser
      if (!user) {
        setIsProcessing(false)
        Alert.alert('請重新登入', '找不到登入狀態，請重新登入後再試一次')
        setCaptured(false)
        return
      }
      const idToken = await user.getIdToken()

      const results = []
      
      for (let i = 0; i < 3; i++) {
        console.log(`[CamCapture] 準備拍第 ${i+1} 張`)
        // 拍照
        const photo = await cameraRef.current.takePictureAsync({ 
          quality: 1,
          skipProcessing: true
        })
        console.log(`[CamCapture] 第 ${i+1} 張拍照完成，photo.uri:`, photo?.uri)
        
        if (!photo) throw new Error('拍照失敗')
          console.log(`[CamCapture] 開始讀取檔案轉 blob`)
        // ====== 加在這裡 ======
          const { width, height } = photo

          // 👉 你的 UI 框（寫死的）
          const FRAME_W = 280
          const FRAME_H = 160

          // 👉 畫面比例（假設全螢幕）
          const SCREEN_W = 360
          const SCREEN_H = 640

          // 👉 換算比例
          const cropWidth = width * (FRAME_W / SCREEN_W)
          const cropHeight = height * (FRAME_H / SCREEN_H)

          // 👉 中間裁切（因為你的框在正中間）
          const originX = (width - cropWidth) / 2
          const originY = (height - cropHeight) / 2

          // ✂️ Crop + 放大
          const cropped = await ImageManipulator.manipulateAsync(
            photo.uri,
            [
              {
                crop: {
                  originX,
                  originY,
                  width: cropWidth,
                  height: cropHeight
                }
              },
              {
                resize: {
                  width: cropWidth * 2,
                  height: cropHeight * 2
                }
              }
            ],
            { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
          )

        // 送 API
        const fileResponse = await fetch(cropped.uri)
        const blob = await fileResponse.blob()
        console.log(`[CamCapture] blob 轉換完成，大小:`, blob.size)
        const formData = new FormData()
        formData.append('file', blob, `strip_${i}.jpg`)

        console.log(`[CamCapture] 開始呼叫 API`)
        const response = await fetch(API_URL, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${idToken}`,
          },
        })
        console.log(`[CamCapture] API 回應狀態:`, response.status)

        if (response.status === 401) {
          setIsProcessing(false)
          Alert.alert('登入已過期', '請重新登入後再試一次')
          setCaptured(false)
          return
        }

        const result = await response.json()

        console.log(`第 ${i+1} 張結果:`, result.success ? 'success' : `失敗原因: ${result.error}`)

        if (result.success) {
          results.push(result.data)
        }
        
        // 下一張
        if (i < 2) {
          setProcessStep(`拍攝第 ${i + 2} 張...`)
          await new Promise(r => setTimeout(r, 500))
        }
      }

      setIsProcessing(false)

      if (results.length === 0) {
        Alert.alert('分析失敗', '請重新拍攝')
        setCaptured(false)
        return
      }

      // 過濾異常值：排除偏差超過 50% 的結果
     const tcValues = results.map(r => r.tc_ratio)
     const medianTC = tcValues.sort((a, b) => a - b)[Math.floor(tcValues.length / 2)]
     const filteredResults = results.filter(r => 
      Math.abs(r.tc_ratio - medianTC) / medianTC < 0.5
     )

     const validResults = filteredResults.length > 0 ? filteredResults : results

     const avgTC = validResults.reduce((sum, r) => sum + r.tc_ratio, 0) / validResults.length
     const avgC = validResults.reduce((sum, r) => sum + r.c_intensity, 0) / validResults.length
     const avgT = validResults.reduce((sum, r) => sum + r.t_intensity, 0) / validResults.length

      // 取最接近中位數那張的 debug 圖片作為代表（三張圖沒辦法平均，只能選一張）
      const representative = validResults.reduce((closest, r) =>
        Math.abs(r.tc_ratio - medianTC) < Math.abs(closest.tc_ratio - medianTC) ? r : closest
      , validResults[0])

      const avgResult = {
        tc_ratio: Math.round(avgTC * 1000) / 1000,
        c_intensity: Math.round(avgC * 100) / 100,
        t_intensity: Math.round(avgT * 100) / 100,
        qc_pass: true,
        sample_count: results.length,
        debug_inner: representative.debug_inner,
        debug_full: representative.debug_full,
      }

      setCaptured(false)
      navigation.navigate('Analysis', { analysisResult: avgResult, ...route?.params })

    } catch (e) {
      console.log('[CamCapture] 真正的錯誤:', e)
      setIsProcessing(false)
      Alert.alert('錯誤', '網路連線失敗或拍攝失敗，請再試一次')
      setCaptured(false)
    }
  }
}
  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFill} facing="back" ref={cameraRef} zoom={0.25} />

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
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <Text style={styles.processingText}>{processStep}</Text>
          </View>
        )}
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
  processingOverlay: {
  position: 'absolute',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.7)',
  alignItems: 'center',
  justifyContent: 'center',
},
processingBox: {
  backgroundColor: '#1a1a1a',
  borderRadius: 12,
  padding: 24,
  alignItems: 'center',
  gap: 8,
},
processingText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: '600',
},
processingHint: {
  color: 'rgba(255,255,255,0.5)',
  fontSize: 13,
},
})