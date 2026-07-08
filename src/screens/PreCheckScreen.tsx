import { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Easing } from 'react-native'
import { colors, typography } from '../theme'

const checkItems = [
  '試紙包裝完整、未過期',
  '光學夾具已安裝，遮光腔體密合',
  '已完成採樣（射精後樣本已收集）',
  '樣本已與裂解液混合均勻，並滴入試紙加樣孔',
]

function DropAnimation() {
  const dropY = useRef(new Animated.Value(0)).current
  const dropOpacity = useRef(new Animated.Value(1)).current
  const rippleScale = useRef(new Animated.Value(0.4)).current
  const rippleOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    function runCycle() {
      dropY.setValue(0)
      dropOpacity.setValue(1)
      rippleScale.setValue(0.4)
      rippleOpacity.setValue(0)

      Animated.sequence([
        // 水滴落下
        Animated.timing(dropY, {
          toValue: 38,
          duration: 700,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        // 水滴消失、漣漪浮現
        Animated.parallel([
          Animated.timing(dropOpacity, {
            toValue: 0,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.timing(rippleOpacity, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
        // 漣漪擴散並淡出
        Animated.parallel([
          Animated.timing(rippleScale, {
            toValue: 1.6,
            duration: 450,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(rippleOpacity, {
            toValue: 0,
            duration: 450,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(600),
      ]).start(() => runCycle())
    }
    runCycle()
  }, [])

  return (
    <View style={styles.dropStage}>
      {/* 試紙卡匣本體（橫放） */}
      <View style={styles.stripBody} />

      {/* 圓形滴樣孔 */}
      <View style={styles.sampleWell} />

      {/* 漣漪 */}
      <Animated.View
        style={[
          styles.ripple,
          {
            opacity: rippleOpacity,
            transform: [{ scale: rippleScale }],
          },
        ]}
      />

      {/* 判讀窗（帶訊號點） */}
      <View style={styles.resultWindow}>
        <View style={[styles.resultDot, { opacity: 1 }]} />
        <View style={[styles.resultDot, { opacity: 0.5 }]} />
        <View style={[styles.resultDot, { opacity: 0.3 }]} />
      </View>

      {/* 水滴（疊在最上層） */}
      <Animated.View
        style={[
          styles.drop,
          {
            opacity: dropOpacity,
            transform: [{ translateY: dropY }],
          },
        ]}
      />
    </View>
  )
}

export default function PreCheckScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>檢測準備</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.progressRow}>
          <Text style={styles.hint}>步驟 1 / 6</Text>
          <Text style={styles.hint}>準備確認</Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: '20%' }]} />
        </View>

        <View style={styles.iconArea}>
          <DropAnimation />
          <Text style={styles.iconTitle}>準備試紙與夾具</Text>
          <Text style={styles.iconSub}>確認試紙效期、安裝夾具，並完成採樣與裂解液混合</Text>
        </View>

        <View style={styles.listCard}>
          <Text style={styles.sectionTitle}>開始前請確認</Text>
          {checkItems.map((item, i) => (
            <View key={i} style={styles.checkRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.checkText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.tealCard}>
          <Text style={styles.tealTitle}>夾具使用說明</Text>
          <Text style={styles.tealText}>光學夾具需緊貼前鏡頭，讓螢幕白光均勻透過試紙。避免環境強光干擾。</Text>
        </View>

        <TouchableOpacity
          style={styles.nextBtn}
          onPress={() => navigation.navigate('RestTimer')}
        >
          <Text style={styles.nextBtnText}>已完成滴樣，開始檢測 ›</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  appbar: {
    height: 46, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: colors.gray200,
  },
  back: { fontSize: 30, color: colors.primary, marginRight: 6 },
  appbarTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  scroll: { flex: 1, padding: 18 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  hint: { fontSize: typography.sizes.sm, color: colors.gray400 },
  progressBg: { height: 4, backgroundColor: colors.gray200, borderRadius: 2, marginBottom: 16 },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  iconArea: { alignItems: 'center', paddingVertical: 12, gap: 8, marginBottom: 20, marginTop: 40 },

  dropStage: {
    width: 150, height: 80,
    position: 'relative',
  },
  stripBody: {
    position: 'absolute',
    top: 26, left: 0,
    width: 150, height: 46,
    backgroundColor: '#FAFAF8',
    borderWidth: 1, borderColor: colors.gray300,
    borderRadius: 10,
    zIndex: 1,
  },
  sampleWell: {
    position: 'absolute',
    top: 36, left: 14,
    width: 26, height: 26,
    borderRadius: 13,
    backgroundColor: colors.gray100,
    borderWidth: 2, borderColor: colors.gray300,
    zIndex: 2,
  },
  ripple: {
    position: 'absolute',
    top: 36, left: 14,
    width: 26, height: 26,
    borderRadius: 13,
    borderWidth: 2, borderColor: colors.primary,
    zIndex: 3,
  },
  resultWindow: {
    position: 'absolute',
    top: 39, left: 60,
    width: 76, height: 20,
    backgroundColor: colors.white,
    borderWidth: 1, borderColor: colors.gray300,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    zIndex: 2,
  },
  resultDot: {
    width: 5, height: 5,
    borderRadius: 2.5,
    backgroundColor: '#F0997B',
  },
  drop: {
    position: 'absolute',
    left: 23, top: 0,
    width: 9, height: 13,
    borderRadius: 5,
    backgroundColor: colors.primary,
    zIndex: 5,
  },

  iconTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  iconSub: { fontSize: typography.sizes.sm, color: colors.gray500, textAlign: 'center', lineHeight: 18 },
  listCard: { borderWidth: 0.5, borderColor: colors.gray200, borderRadius: 10, padding: 12, marginBottom: 12 },
  sectionTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.gray500, marginBottom: 10 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  bulletDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 7, flexShrink: 0,
  },
  checkText: { fontSize: typography.sizes.md, color: colors.gray900, flex: 1, lineHeight: 20 },
  tealCard: { backgroundColor: colors.primaryLight, borderRadius: 10, padding: 12, marginBottom: 14 },
  tealTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.primary, marginBottom: 4 },
  tealText: { fontSize: typography.sizes.sm, color: '#0d7a8f', lineHeight: 18 },
  nextBtn: {
    height: 42, borderRadius: 9, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  nextBtnText: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.white },
})