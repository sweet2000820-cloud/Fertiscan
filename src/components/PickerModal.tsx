import { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { colors, typography } from '../theme'

type Props = {
  visible: boolean
  title: string
  value: string
  items: string[]
  unit?: string
  onConfirm: (value: string) => void
  onCancel: () => void
}

export default function PickerModal({ visible, title, value, items, unit, onConfirm, onCancel }: Props) {
  const [selected, setSelected] = useState(value || items[0])

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onCancel}>
              <Text style={styles.cancelBtn}>取消</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={() => onConfirm(selected)}>
              <Text style={styles.confirmBtn}>儲存</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.pickerRow}>
            <Picker selectedValue={selected} onValueChange={setSelected} style={styles.picker}>
              {items.map(item => <Picker.Item key={item} label={`${item}${unit || ''}`} value={item} />)}
            </Picker>
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
  pickerRow: { paddingBottom: 20 },
  picker: { width: '100%' },
})