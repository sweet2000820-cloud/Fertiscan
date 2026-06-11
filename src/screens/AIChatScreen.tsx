import { useState, useRef } from 'react'
import { colors, typography } from '../theme'
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image } from 'react-native'

type Message = { role: 'user' | 'bot', text: string }

const quickQuestions = [
  'T/C 比值是什麼意思？',
  '睡眠不足對生殖功能有何影響？',
  '壓力大會影響生殖健康嗎？',
  '多久應該檢測一次比較好？',
]

export default function AIChatScreen({ navigation }: any) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: '你好！我是你的 AI 生育小幫手，可以幫你了解生殖健康知識或生活習慣建議。有什麼想問的嗎？' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showQuick, setShowQuick] = useState(true)
  const scrollRef = useRef<ScrollView>(null)

  function sendMessage(text: string) {
    if (!text.trim()) return
    setInput('')
    const newMessages: Message[] = [...messages, { role: 'user', text }]
    setMessages(newMessages)
    setLoading(true)

    setTimeout(() => {
      let reply = '這是個好問題！建議您諮詢生殖科醫師以獲得更專業的建議。'
      if (text.includes('T/C') || text.includes('比值')) {
        reply = 'T/C 比值是試紙上 Test line 與 Control line 的灰階強度比值，數值越高代表樣本濃度越高，正常值建議 ≥ 0.85。'
      } else if (text.includes('睡眠')) {
        reply = '睡眠不足會導致皮質醇偏高，影響荷爾蒙平衡，建議每晚保持 7-8 小時睡眠。'
      } else if (text.includes('壓力')) {
        reply = '長期壓力確實會影響生殖健康，建議透過運動、冥想等方式減壓。'
      } else if (text.includes('檢測') || text.includes('幾次')) {
        reply = '一般建議每 2-4 週檢測一次，可以追蹤趨勢變化。如有異常建議諮詢醫師。'
      } else if (text.includes('運動')) {
        reply = '規律運動有助於改善睡眠品質、降低壓力荷爾蒙，建議每週至少 3 次有氧運動。'
      }
      setMessages([...newMessages, { role: 'bot', text: reply }])
      setLoading(false)
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
    }, 1000)
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.appbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <View style={styles.appbarCenter}>
          <View style={styles.botAvatar}>
            <Image source={require('../../assets/sprite.png')} style={{ width: 28, height: 30 }} />
            </View>
          <View>
            <Text style={styles.appbarTitle}>AI 生育小幫手</Text>
            <Text style={styles.onlineText}>線上</Text>
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg, i) => (
          <View key={i} style={[styles.msgRow, msg.role === 'user' && styles.msgRowUser]}>
            {msg.role === 'bot' && (
              <View style={styles.botAvatarSmall}>
                <Image source={require('../../assets/sprite.png')} style={{ width: 36, height: 38 }} />
              </View>
            )}
            <View style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleBot]}>
              <Text style={[styles.bubbleText, msg.role === 'user' && { color: '#fff' }]}>{msg.text}</Text>
            </View>
          </View>
        ))}
        {loading && (
          <View style={styles.msgRow}>
            <View style={styles.botAvatarSmall}>
              <Image source={require('../../assets/sprite.png')} style={{ width: 40, height: 42 }} />
            </View>
            <View style={styles.bubbleBot}>
              <Text style={styles.bubbleText}>思考中...</Text>
            </View>
          </View>
        )}
        {showQuick && (
          <View style={styles.quickArea}>
            {quickQuestions.map((q, i) => (
              <TouchableOpacity key={i} style={styles.quickChip} onPress={() => sendMessage(q)}>
                <Text style={styles.quickChipText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View style={{ height: 10 }} />
      </ScrollView>

      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder="輸入訊息…"
          placeholderTextColor={colors.gray400}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => sendMessage(input)}
          returnKeyType="send"
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, !input.trim() && { opacity: 0.4 }]}
          onPress={() => sendMessage(input)}
          disabled={!input.trim()}
        >
          <Text style={styles.sendBtnText}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  appbar: {
    height: 46, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: colors.gray200,
  },
  back: { fontSize: 28, color: colors.primary, marginRight: 6 },
  appbarCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  botAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'transparent',
    alignItems: 'center', justifyContent: 'center',
  },
  botAvatarSmall: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'transparent',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  appbarTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.medium, color: colors.gray900 },
  onlineText: { fontSize: typography.sizes.xs, color: '#4ade80' },
  messages: { flex: 1, padding: 14 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginBottom: 10 },
  msgRowUser: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '80%', borderRadius: 12, padding: 10 },
  bubbleBot: { backgroundColor: colors.gray100, borderBottomLeftRadius: 2 },
  bubbleUser: { backgroundColor: colors.primary, borderBottomRightRadius: 2 },
  bubbleText: { fontSize: typography.sizes.md, color: colors.gray900, lineHeight: 20 },
  quickArea: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  quickChip: {
    backgroundColor: colors.primaryLight, borderWidth: 1,
    borderColor: colors.primary, borderRadius: 16,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  quickChipText: { fontSize: typography.sizes.sm, color: colors.primary },
  inputArea: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    padding: 10, paddingBottom: 30, borderTopWidth: 0.5, borderTopColor: colors.gray200,
  },
  input: {
    flex: 1, borderWidth: 0.5, borderColor: colors.gray300,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    fontSize: typography.sizes.sm, color: colors.gray900, maxHeight: 100,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnText: { color: '#fff', fontSize: 14 },
})