import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import { colors, typography } from '../theme'

type ButtonVariant = 'primary' | 'secondary' | 'gray' | 'red'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: ButtonVariant
  disabled?: boolean
}

export default function Button({ title, onPress, variant = 'primary', disabled = false }: ButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.base, styles[variant], disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.text, styles[`${variant}Text`]]}>{title}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    height: 42,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  gray: {
    backgroundColor: colors.gray100,
    borderWidth: 0.5,
    borderColor: colors.gray200,
  },
  red: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.danger,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  primaryText: { color: colors.white },
  secondaryText: { color: colors.primary },
  grayText: { color: colors.gray500 },
  redText: { color: colors.danger },
})