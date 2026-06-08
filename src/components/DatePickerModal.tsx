import { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { colors, typography } from '../theme'

const currentYear = new Date().getFullYear()
const years = Array.from({ length: currentYear - 1940 + 1 }, (_, i) => String(1940 + i))
const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'))

type Props = {
  visible: boolean
  year: string
  month: string
  day: string
  onConfirm: (year: string, month: string, day: string) => void
  onCancel: () => void
}

export default function DatePickerModal({ visible, year, month, day, onConfirm, onCancel }: Props) {
  const [selYear, setSelYear] = useState(year || '1992')
  const [selMonth, setSelMonth] = useState(month || '01')
  const [selDay, setSelDay] = useState(day || '01')

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onCancel}>
              <Text style={styles.cancelBtn}>取消</Text>
            </TouchableOpacity>
            <Text style={styles.title}>出生年月日</Text>
            <TouchableOpacity onPress={() => onConfirm(selYear, selMonth, selDay)}>
              <Text style={styles.confirmBtn}>儲存</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.pickerRow}>
            <View style={styles.pickerCol}>
              <Text style={styles.pickerLabel}>年</Text>
              <Picker selectedValue={selYear} onValueChange={setSelYear} style={styles.picker}>
                {years.map(y => <Picker.Item key={y} label={y} value={y} />)}
              </Picker>
            </View>
            <View style={styles.pickerCol}>
              <Text style={styles.pickerLabel}>月</Text>
              <Picker selectedValue={selMonth} onValueChange={setSelMonth} style={styles.picker}>
                {months.map(m => <Picker.Item key={m} label={m} value={m} />)}
              </Picker>
            </View>
            <View style={styles.pickerCol}>
              <Text style={styles.pickerLabel}>日</Text>
              <Picker selectedValue={selDay} onValueChange={setSelDay} style={styles.picker}>
                {days.map(d => <Picker.Item key={d} label={d} value={d} />)}
              </Picker>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  container: { backgroundColor: colors.white, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 0.5, borderBottomColor: colors.gray200,
  },
  title: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.gray900 },
  cancelBtn: { fontSize: typography.sizes.md, color: colors.gray500 },
  confirmBtn: { fontSize: typography.sizes.md, color: colors.primary, fontWeight: typography.weights.medium },
  pickerRow: { flexDirection: 'row', paddingBottom: 20 },
  pickerCol: { flex: 1, alignItems: 'center' },
  pickerLabel: { fontSize: typography.sizes.xs, color: colors.gray400, marginTop: 8 },
  picker: { width: '100%' },
})