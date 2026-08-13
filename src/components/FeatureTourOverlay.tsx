import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Platform } from 'react-native'
import Svg, { Rect, Circle, Path, Text as SvgText, Mask, Defs, Marker } from 'react-native-svg'
import { colors } from '../theme'
import { useFeatureTour } from '../context/FeatureTourContext'

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window')
const PADDING = 8
// 對應 navigation.tsx 裡 Stack.Navigator 的 contentStyle.paddingTop，
// FeatureTourOverlay 的畫布本身被這個 padding 往下推，所有座標都要統一扣掉這個量
const CONTENT_TOP_OFFSET = 50

export default function FeatureTourOverlay() {
  const { stage, activeSteps, skipAll } = useFeatureTour()
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(0)
  }, [activeSteps])

  if (!stage || activeSteps.length === 0) return null
  const step = activeSteps[Math.min(index, activeSteps.length - 1)]
  if (!step) return null

  const isCircle = step.shape === 'circle'
  const rectX = step.rect.x
  const rectY = step.rect.y - CONTENT_TOP_OFFSET

  const holeX = Math.max(0, rectX - PADDING)
  const holeY = Math.max(0, rectY - PADDING)
  const holeW = Math.min(step.rect.width + PADDING * 2, SCREEN_W - holeX)
  const holeH = Math.max(step.rect.height + PADDING * 2, step.minHeight ?? 0)
  const cornerRadius = step.cornerRadius ?? 16

  const circleCx = holeX + holeW / 2
  const circleCy = holeY + holeH / 2
  const circleR = Math.max(holeW, holeH) / 2

  const holeCenterX = holeX + holeW / 2
  const holeCenterY = holeY + holeH / 2

  const TEXT_MARGIN = 24
  const labelX = Math.min(
    Math.max(holeCenterX, TEXT_MARGIN),
    SCREEN_W - TEXT_MARGIN
  )

  const labelOnTop = step.labelSide ? step.labelSide === 'top' : holeCenterY > SCREEN_H * 0.55
  const labelY = labelOnTop ? Math.max(60, holeY - 20) : Math.min(SCREEN_H - 50, holeY + holeH + 30)

  function advance() {
    if (step.passthrough) return
    if (index >= activeSteps.length - 1) {
      skipAll()
      return
    }
    setIndex(i => i + 1)
  }

  return (
    <View style={[StyleSheet.absoluteFill, styles.forceOnTop]} pointerEvents="box-none">
      <TouchableOpacity
        activeOpacity={1}
        style={StyleSheet.absoluteFill}
        onPress={advance}
        disabled={!!step.passthrough}
      >
        <Svg width={SCREEN_W} height={SCREEN_H} viewBox={`0 0 ${SCREEN_W} ${SCREEN_H}`}>
          <Defs>
            <Mask id="tour-hole-mask">
              <Rect x={0} y={0} width={SCREEN_W} height={SCREEN_H} fill="white" />
              {isCircle ? (
                <Circle cx={circleCx} cy={circleCy} r={circleR} fill="black" />
              ) : (
                <Rect x={holeX} y={holeY} width={holeW} height={holeH} rx={cornerRadius} fill="black" />
              )}
            </Mask>
          </Defs>

          <Rect x={0} y={0} width={SCREEN_W} height={SCREEN_H} fill="rgba(15,20,25,0.55)" mask="url(#tour-hole-mask)" />

          {isCircle ? (
            <Circle cx={circleCx} cy={circleCy} r={circleR} fill="none" stroke="#fff" strokeWidth={2.5} />
          ) : (
            <Rect x={holeX} y={holeY} width={holeW} height={holeH} rx={cornerRadius} fill="none" stroke="#fff" strokeWidth={2.5} />
          )}

          <SvgText x={labelX} y={labelY} fontSize={17} fontWeight="600" fill="#fff" textAnchor="middle">
            {step.label}
          </SvgText>
          {!step.passthrough && (
            <SvgText x={SCREEN_W / 2} y={SCREEN_H - 40} fontSize={12} fill="rgba(255,255,255,0.6)" textAnchor="middle">
              點畫面繼續
            </SvgText>
          )}
        </Svg>
      </TouchableOpacity>

      {step.passthrough && (
        <TouchableOpacity
          activeOpacity={0.6}
          style={
            isCircle
              ? { position: 'absolute', left: circleCx - circleR, top: circleCy - circleR, width: circleR * 2, height: circleR * 2, borderRadius: circleR }
              : { position: 'absolute', left: holeX, top: holeY, width: holeW, height: holeH }
          }
          onPress={() => step.onPress?.()}
        />
      )}

      <View style={styles.skipWrap} pointerEvents="box-none">
        <Text style={styles.skipText} onPress={skipAll}>略過導覽</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  forceOnTop: {
    zIndex: 999,
    elevation: Platform.OS === 'android' ? 999 : 0,
  },
  skipWrap: { position: 'absolute', top: 54, right: 20 },
  skipText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, padding: 6 },
})