import { useState, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { colors, typography } from '../theme'
import { auth } from '../firebase'
import * as ImageManipulator from 'expo-image-manipulator'
import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'

// 取景框在螢幕上距離頂部的比例。這個數字必須跟下面 styles.maskMiddle 的
// top 值保持一致——兩處分別用來「畫出框」和「算出裁切範圍」，
// 如果各自寫死不同數字，畫面上的框跟實際裁切範圍就會對不齊
// （這正是之前 869818C7 那張照片判讀窗被切到只剩下半部的原因：
//  框實際貼在螢幕 35% 高度，但裁切計算誤用「垂直置中」去算，
//  兩者換算成螢幕比例差了 5.5%，裁切範圍整個往下偏移）。
const FRAME_TOP_PERCENT = 0.35

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

  // 除錯用：把後端回傳的失敗原圖（debug_fail_image, base64）存到手機本地，
  // 再跳出系統分享面板，讓你可以直接存到「檔案」App、AirDrop 給電腦，
  // 或傳到任何地方——完全不需要接雲端儲存服務。
  // 只在偵測失敗時才會呼叫，成功案例不會產生這個檔案。
  async function saveAndShareDebugImage(base64: string, index: number) {
    try {
      const fileUri = `${FileSystem.cacheDirectory}fertiscan_debug_${Date.now()}_${index}.jpg`
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      })
      const canShare = await Sharing.isAvailableAsync()
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'image/jpeg',
          dialogTitle: '匯出偵測失敗的原始照片',
        })
      }
      return fileUri
    } catch (e) {
      console.log('[CamCapture] 儲存/分享除錯照片失敗:', e)
      return null
    }
  }

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
        // 收集這次拍攝流程裡每一張失敗案例的 debug_fail_image，
        // 全部失敗時可以讓使用者選擇要匯出哪一張
        const failedDebugImages: string[] = []

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

          const { width, height } = photo

          // 👉 你的 UI 框（寫死的，這個不用改，是設計尺寸）
          const FRAME_W = 280
          const FRAME_H = 160

          // 👉 畫面比例：改用裝置實際的螢幕尺寸，而不是寫死的數字。
          // 原本寫死 360x640，跟實際手機螢幕點數（不同機型完全不同）對不上，
          // 換算出來的裁切位置會跟畫面上看到的取景框對不齊。
          const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window')

          // 👉 換算比例
          const cropWidth = width * (FRAME_W / SCREEN_W)
          const cropHeight = height * (FRAME_H / SCREEN_H)

          // 👉 中間裁切：水平方向框本來就置中，維持原本算法沒問題；
          // 垂直方向框不是置中的，是貼在距頂部 FRAME_TOP_PERCENT 的位置，
          // 要直接用這個比例算裁切起點，不能假設垂直置中，
          // 否則裁切範圍會跟畫面上實際看到的框對不齊（見上面常數的註解）
          const originX = (width - cropWidth) / 2
          const originY = height * FRAME_TOP_PERCENT

          console.log(`[CamCapture] 螢幕尺寸: ${SCREEN_W}x${SCREEN_H}, 裁切區域: ${cropWidth.toFixed(0)}x${cropHeight.toFixed(0)} @ (${originX.toFixed(0)}, ${originY.toFixed(0)})`)

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
          } else if (result.debug_fail_image) {
            // 後端實際收到、拿去分析失敗的那張原圖，先收集起來
            failedDebugImages.push(result.debug_fail_image)
          }

          // 下一張
          if (i < 2) {
            setProcessStep(`拍攝第 ${i + 2} 張...`)
            await new Promise(r => setTimeout(r, 500))
          }
        }

        setIsProcessing(false)

        if (results.length === 0) {
          // 三張全失敗：問要不要匯出後端實際收到的原圖來排查問題，
          // 而不是只顯示「請重新拍攝」讓人猜不到哪裡出錯
          if (failedDebugImages.length > 0) {
            Alert.alert(
              '分析失敗',
              '要匯出後端實際收到的照片，方便排查問題嗎？',
              [
                { text: '不用了', style: 'cancel', onPress: () => setCaptured(false) },
                {
                  text: '匯出',
                  onPress: async () => {
                    await saveAndShareDebugImage(failedDebugImages[0], 0)
                    setCaptured(false)
                  },
                },
              ]
            )
          } else {
            Alert.alert('分析失敗', '請重新拍攝')
            setCaptured(false)
          }
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
  maskTop: { position: 'absolute', top: 0, left: 0, right: 0, height: `${FRAME_TOP_PERCENT * 100}%`, backgroundColor: 'rgba(0,0,0,0.6)' },
  maskMiddle: { position: 'absolute', top: `${FRAME_TOP_PERCENT * 100}%`, left: 0, right: 0, height: 160, flexDirection: 'row' },
  maskSide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  maskBottom: { position: 'absolute', top: `${FRAME_TOP_PERCENT * 100}%`, left: 0, right: 0, bottom: 0, marginTop: 160, backgroundColor: 'rgba(0,0,0,0.6)' },
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