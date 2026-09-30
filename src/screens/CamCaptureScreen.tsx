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

// [修改] 原本固定連拍 3 張再取平均，等待時間太長。
// 改為只拍 1 張；只有辨識失敗時才自動補拍，最多拍 MAX_ATTEMPTS 張。
// 設成 1 = 完全不補拍，失敗就請使用者重按。
const MAX_ATTEMPTS = 2

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
      setProcessStep('拍攝中...')
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

        let result: any = null
        // 收集失敗案例的 debug_fail_image，全部失敗時可以讓使用者匯出排查
        const failedDebugImages: string[] = []

        // [修改] 成功就停；失敗才自動再拍一次
        for (let i = 0; i < MAX_ATTEMPTS; i++) {
          console.log(`[CamCapture] 第 ${i + 1} 次拍攝`)
          const photo = await cameraRef.current.takePictureAsync({
            quality: 1,
            skipProcessing: true
          })
          console.log(`[CamCapture] 第 ${i + 1} 次拍照完成，photo.uri:`, photo?.uri)

          if (!photo) throw new Error('拍照失敗')

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

          setProcessStep(i === 0 ? '分析中...' : '重新分析中...')

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

          const json = await response.json()
          console.log(`第 ${i + 1} 次結果:`, json.success ? 'success' : `失敗原因: ${json.error}`)

          if (json.success) {
            result = json.data
            break // [新增] 成功就不再拍
          }
          if (json.debug_fail_image) {
            // 後端實際收到、拿去分析失敗的那張原圖，先收集起來
            failedDebugImages.push(json.debug_fail_image)
          }

          // 失敗且還有補拍機會：提示使用者保持不動，稍等再拍
          if (i < MAX_ATTEMPTS - 1) {
            setProcessStep('沒有辨識成功，請保持不動，自動重拍中...')
            await new Promise(r => setTimeout(r, 500))
          }
        }

        setIsProcessing(false)

        if (!result) {
          // 全部失敗：問要不要匯出後端實際收到的原圖來排查問題，
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

        // [修改] 只有一張結果，不再需要中位數過濾與平均
        const avgResult = {
          tc_ratio: Math.round(result.tc_ratio * 1000) / 1000,
          c_intensity: Math.round(result.c_intensity * 100) / 100,
          t_intensity: Math.round(result.t_intensity * 100) / 100,
          qc_pass: true,
          sample_count: 1,
          debug_inner: result.debug_inner,
          debug_full: result.debug_full,
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
          {/* 虛線參考框：實際試紙的黑色邊框比整個取景框小很多，
              沒有這個參考的話使用者不知道該把黑框對準框的哪個位置
              （邊緣？中心？），容易對準得太鬆散，導致送到後端的照片
              判讀窗位置跑掉。這個虛線框尺寸抓真實黑框量到的長寬比
              （約1.68），讓使用者直接把黑框套進這個虛線裡，
              對準目標明確很多。*/}
          <View style={styles.innerGuide} />
          <Text style={styles.frameHint}>將試紙黑框對準虛線</Text>
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
  frameHint: { color: 'rgba(255,255,255,0.5)', fontSize: typography.sizes.xs, textAlign: 'center', marginTop: 10 },
  innerGuide: {
    width: 200, height: 119,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(74,222,128,0.7)',
    borderRadius: 40,
  },
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