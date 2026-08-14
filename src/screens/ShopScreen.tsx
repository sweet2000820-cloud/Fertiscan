import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Dimensions } from 'react-native'
import { colors, typography } from '../theme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Svg, { Rect, Line, Text as SvgText, G } from 'react-native-svg'
import { useMeasureTargets } from '../hooks/useMeasureTargets'
import { useFeatureTour, TourStep } from '../context/FeatureTourContext'
import { useIsFocused } from '@react-navigation/native'

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window')
const TAB_BAR_HEIGHT = 80
const TAB_INDEX = { dashboard: 0, history: 1, calibration: 2, shop: 3, settings: 4 }

function tabRect(index: number) {
  return { x: (SCREEN_W / 5) * index, y: SCREEN_H - TAB_BAR_HEIGHT, width: SCREEN_W / 5, height: TAB_BAR_HEIGHT }
}

const SHOP_TARGET_KEYS = ['qtySelector', 'checkoutBtn']

export default function ShopScreen({ navigation }: any) {
  const [qty, setQty] = useState(1)

  const unitPrice = 720
  const total = unitPrice * qty

  const isFocused = useIsFocused()
  const { stage, registerSteps, setStageDirectly } = useFeatureTour()
  const isMyTurn = stage === 'shop' && isFocused
  const { setRef, measureAll } = useMeasureTargets(SHOP_TARGET_KEYS)

 useEffect(() => {
      if (!isMyTurn) return
      const timer = setTimeout(async () => {
        const t = await measureAll()
        const steps: TourStep[] = [
          ...(t.qtySelector ? [{ key: 'qtySelector', label: '這裡可以增減購買數量', rect: t.qtySelector as any }] : []),
          ...(t.checkoutBtn ? [{ key: 'checkoutBtn', label: '點這裡可以進行付款', rect: t.checkoutBtn as any }] : []),
          {
            key: 'tab-next',
            label: '點擊「設定」前往下一步',
            rect: tabRect(TAB_INDEX.settings),
            shape: 'circle',
            labelSide: 'top',
            passthrough: true,
            onPress: () => {
              setStageDirectly('settings')
              navigation.navigate('設定')
            },
          },
        ]
        registerSteps(steps)
      }, 300)
      return () => clearTimeout(timer)
    }, [isMyTurn])

  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <Text style={styles.appbarTitle}>購買試紙</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* 商品卡片 */}
        <View style={styles.productCard}>
          <View style={styles.productImg}>
            <Svg width="150" height="150" viewBox="190 60 300 270">
              <Rect x="190" y="60" width="300" height="270" rx="12" fill="#5BC8D8"/>
              <Rect x="190" y="60" width="300" height="70" rx="12" fill="#3ABCCE"/>
              <Rect x="190" y="108" width="300" height="22" fill="#3ABCCE"/>
              <Rect x="190" y="60" width="18" height="270" rx="4" fill="rgba(255,255,255,0.15)"/>
              <Rect x="210" y="135" width="260" height="140" rx="8" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
              <SvgText x="340" y="105" fontFamily="sans-serif" fontSize="30" fontWeight="700" fill="white" textAnchor="middle" letterSpacing="3">iMotile</SvgText>
              <Line x1="220" y1="120" x2="460" y2="120" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8"/>
              <G transform="translate(270, 152)">
                <Rect x="0" y="0" width="18" height="50" rx="9" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="1"/>
                <Rect x="4" y="30" width="10" height="18" rx="5" fill="#00C896"/>
                <Rect x="26" y="0" width="18" height="50" rx="9" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="1"/>
                <Rect x="30" y="26" width="10" height="22" rx="5" fill="#00C896"/>
                <Rect x="52" y="0" width="18" height="50" rx="9" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="1"/>
                <Rect x="56" y="32" width="10" height="16" rx="5" fill="#00C896"/>
                <Rect x="78" y="0" width="18" height="50" rx="9" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="1"/>
                <Rect x="82" y="28" width="10" height="20" rx="5" fill="#00C896"/>
                <Rect x="104" y="0" width="18" height="50" rx="9" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="1"/>
                <Rect x="108" y="30" width="10" height="18" rx="5" fill="#00C896"/>
                <Rect x="130" y="0" width="18" height="50" rx="9" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="1"/>
                <Rect x="134" y="26" width="10" height="22" rx="5" fill="#00C896"/>
              </G>
              <SvgText x="340" y="228" fontFamily="sans-serif" fontSize="20" fill="white" textAnchor="middle" fontWeight="500">精子活力檢測試紙</SvgText>
              <Line x1="220" y1="242" x2="460" y2="242" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>
              <SvgText x="340" y="268" fontFamily="sans-serif" fontSize="18" fill="rgba(255,255,255,0.85)" textAnchor="middle">搭配 iMotile App 使用</SvgText>
              <Rect x="308" y="282" width="64" height="28" rx="14" fill="white"/>
              <SvgText x="340" y="301" fontFamily="sans-serif" fontSize="18" fontWeight="700" fill="#0A5C6B" textAnchor="middle">6 入裝</SvgText>
            </Svg>
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.brandName}>iMotile</Text>
            <Text style={styles.productName}>精子活力檢測試紙</Text>
            <Text style={styles.productSpec}>6 片裝</Text>
            <Text style={styles.productPrice}>NT$ 720</Text>
          </View>
        </View>

        {/* 數量選擇 */}
          <View ref={setRef('qtySelector')} style={styles.listCard}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>購買數量</Text>
              <View style={styles.qtyRow}>
              <TouchableOpacity
                style={[styles.qtyBtn, qty <= 1 && { opacity: 0.3 }]}
                onPress={() => setQty(q => Math.max(1, q - 1))}
                disabled={qty <= 1}
              >
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyNum}>{qty}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQty(q => q + 1)}
              >
                <Text style={styles.qtyBtnText}>＋</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.rowLabel}>共 {qty * 6} 片</Text>
            <Text style={styles.totalPrice}>NT$ {total.toLocaleString()}</Text>
          </View>
        </View>

        {/* 商品說明 */}
        <View style={styles.listCard}>
          <Text style={styles.sectionTitle}>商品說明</Text>
          <Text style={styles.descText}>iMotile 精子活力檢測試紙採用免疫層析技術，可在家自行檢測精子活力，結合 iMotile App 進行光學定量分析，提供 T/C 比值與換算濃度。</Text>
          <View style={styles.divider} />
          {[
            { label: '每盒內容', value: '試紙 6 片、採樣管 6 支、說明書' },
            { label: '有效期限', value: '製造日起 24 個月' },
            { label: '儲存方式', value: '常溫避光保存（15-30°C）' },
            { label: '適用對象', value: '成年男性' },
          ].map((item, i) => (
            <View key={i} style={[styles.infoRow, i === 3 && { borderBottomWidth: 0 }]}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* 注意事項 */}
        <View style={styles.tealCard}>
          <Text style={styles.tealTitle}>注意事項</Text>
          <Text style={styles.tealText}>本產品僅供初步參考，不構成醫療診斷。如有疑慮請諮詢生殖科醫師。</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 結帳按鈕 */}
      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <Text style={styles.footerQty}>{qty} 盒 × NT$ {unitPrice}</Text>
          <Text style={styles.footerTotal}>NT$ {total.toLocaleString()}</Text>
        </View>
        <TouchableOpacity
          ref={setRef('checkoutBtn')}
          style={styles.checkoutBtn}
          onPress={() => navigation.navigate('OrderConfirm', { qty })}
        >
          <Text style={styles.checkoutBtnText}>立即購買</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  appbar: {
    paddingTop: 30, paddingHorizontal: 18, paddingBottom: 20,
  },
  appbarTitle: { fontSize: 22, fontWeight: '600', color: colors.gray900 },
  scroll: { flex: 1, paddingHorizontal: 18 },
  productCard: {
    flexDirection: 'row', gap: 14,
    backgroundColor: colors.primaryLight, borderRadius: 20,
    padding: 14, marginBottom: 12,
  },
  productImg: {
    width: 140, height: 140, borderRadius: 14,
    backgroundColor: '#5BC8D8',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  productImgText: { fontSize: 36 },
  productInfo: { flex: 1, justifyContent: 'center', gap: 2 },
  brandName: { fontSize: typography.sizes.lg, color: colors.primary, fontWeight: '600' },
  productName: { fontSize: typography.sizes.lg, fontWeight: '600', color: colors.gray900, marginTop: 4 },
  productSpec: { fontSize: typography.sizes.md, color: colors.gray500, marginTop: 4 },
  productPrice: { fontSize: typography.sizes.lg, fontWeight: '700', color: colors.primary, marginTop: 4 },
  listCard: {
    backgroundColor: colors.white, borderWidth: 0.5, borderColor: colors.gray200,
    borderRadius: 18, paddingHorizontal: 14, marginBottom: 12,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: colors.gray100,
  },
  rowLabel: { fontSize: typography.sizes.md, color: colors.gray900 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  qtyNum: { fontSize: typography.sizes.md, fontWeight: '600', color: colors.gray900, minWidth: 20, textAlign: 'center' },
  totalPrice: { fontSize: typography.sizes.lg, fontWeight: '700', color: colors.primary },
  sectionTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.gray500, marginBottom: 8, paddingTop: 12 },
  descText: { fontSize: typography.sizes.sm, color: colors.gray500, lineHeight: 20, marginBottom: 10 },
  divider: { height: 0.5, backgroundColor: colors.gray200, marginBottom: 8 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 7, borderBottomWidth: 0.5, borderBottomColor: colors.gray100,
  },
  infoLabel: { fontSize: typography.sizes.sm, color: colors.gray400 },
  infoValue: { fontSize: typography.sizes.sm, color: colors.gray900, flex: 1, textAlign: 'right' },
  tealCard: { backgroundColor: colors.primaryLight, borderRadius: 16, padding: 14, marginBottom: 14 },
  tealTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.primary, marginBottom: 4 },
  tealText: { fontSize: typography.sizes.xs, color: '#0d7a8f', lineHeight: 18 },
  footer: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderTopWidth: 0.5, borderTopColor: colors.gray200,
    backgroundColor: colors.white,
  },
  footerInfo: { flex: 1 },
  footerQty: { fontSize: typography.sizes.xs, color: colors.gray400 },
  footerTotal: { fontSize: typography.sizes.lg, fontWeight: '700', color: colors.primary },
  checkoutBtn: {
    height: 42, paddingHorizontal: 26, borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  checkoutBtnText: { fontSize: typography.sizes.md, fontWeight: '600', color: '#fff' },
})