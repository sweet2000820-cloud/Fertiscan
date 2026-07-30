import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { colors, typography } from '../theme'
import { Ionicons } from '@expo/vector-icons'

export default function ClinicAddScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>新增診所連結</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.sectionTitle}>連結方式</Text>

        {[
          {
            iconName: 'qr-code-outline',
            title: '掃描診所 QR Code',
            sub: '由診所提供授權碼，掃描即連結',
            selected: true,
            onPress: () => navigation.navigate('ClinicQR'),
          },
          {
            iconName: 'keypad-outline',
            title: '輸入診所邀請碼',
            sub: '診所提供 6 位數字邀請碼',
            selected: false,
            onPress: () => navigation.navigate('ClinicCode'),
          },
          {
            iconName: 'search-outline',
            title: '搜尋診所名稱',
            sub: '從合作診所名單中搜尋',
            selected: false,
            onPress: () => navigation.navigate('ClinicSearch'),
          },
        ].map((item, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.optionCard, item.selected && styles.optionCardSelected]}
            onPress={item.onPress}
          >
            <View style={[styles.optionIcon, item.selected && styles.optionIconSelected]}>
              <Ionicons name={item.iconName as any} size={20} color={item.selected ? '#fff' : colors.gray500} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.optionTitle, item.selected && { color: colors.primary }]}>{item.title}</Text>
              <Text style={styles.optionSub}>{item.sub}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.warnCard}>
          <Text style={styles.warnText}>僅限已加入 iMotile 醫療合作計畫的診所可連結。連結後診所不會主動存取您的資料。</Text>
        </View>

        <View style={{ height: 20 }} />

      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  appbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 10, paddingHorizontal: 18, paddingBottom: 10,
  },
  back: { fontSize: 40, color: colors.primary, marginRight: 6, paddingBottom: 4  },
  appbarTitle: { flex: 1, fontSize: 22, fontWeight: '600', color: colors.gray900 },
  scroll: { flex: 1, paddingHorizontal: 18 },
  sectionTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.gray500, marginBottom: 10 },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.white,
    borderWidth: 0.5, borderColor: colors.gray200,
    borderRadius: 18, padding: 14, marginBottom: 10,
  },
  optionCardSelected: {
    borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.primaryLight,
  },
  optionIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.gray100, alignItems: 'center', justifyContent: 'center',
  },
  optionIconSelected: { backgroundColor: colors.primary },
  optionTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  optionSub: { fontSize: typography.sizes.xs, color: colors.gray400, marginTop: 2 },
  warnCard: { backgroundColor: colors.warningLight, borderRadius: 16, padding: 14, marginTop: 6 },
  warnText: { fontSize: typography.sizes.xs, color: colors.warning, lineHeight: 18 },
})