import { useState, useEffect, useRef, useMemo } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { colors, typography } from '../theme'
import { Ionicons } from '@expo/vector-icons'

const TOTAL_SECONDS = 5 * 60 // 5 分鐘

// 互動選擇題衛教內容
const quizzes = [
  {
    q: '哪個習慣對精子濃度影響最大？',
    opts: ['久坐不動', '喝黑咖啡', '吃辣'],
    correct: 0,
    explain: '長時間久坐會讓局部溫度升高，建議每小時起來走動一下 🚶',
  },
  {
    q: '睪丸為什麼長在體外？',
    opts: ['方便活動', '需要比體溫略低的環境', '純粹演化巧合'],
    correct: 1,
    explain: '精子生成需要比體溫低 2–4°C 的環境，這是身體的巧妙設計 🌡️',
  },
  {
    q: '哪種食物對生殖健康比較有幫助？',
    opts: ['深色蔬菜與堅果', '油炸食品', '含糖飲料'],
    correct: 0,
    explain: '深色蔬菜、堅果、酪梨富含抗氧化物質，對生殖細胞有保護作用 🥑',
  },
  {
    q: '睡眠不足會影響精子嗎？',
    opts: ['會，影響荷爾蒙分泌', '不會，完全無關', '只影響女性'],
    correct: 0,
    explain: '睡眠品質會影響睪固酮等荷爾蒙分泌，規律作息也是一種保養 😴',
  },
  {
    q: '吸菸對精子的影響是？',
    opts: ['沒有影響', '可能降低活動力與濃度', '只影響味覺'],
    correct: 1,
    explain: '多項研究顯示吸菸與精子活動力下降有關，戒菸對整體健康都有益 🚭',
  },
  {
    q: '長期過量飲酒會怎樣？',
    opts: ['完全無關', '可能影響精子濃度', '只影響肝臟'],
    correct: 1,
    explain: '偶爾小酌影響不大，但長期過量飲酒可能干擾荷爾蒙與精子生成 🍺',
  },
  {
    q: '慢性壓力對生殖健康的影響？',
    opts: ['沒有直接關係', '可能干擾荷爾蒙平衡', '只影響情緒'],
    correct: 1,
    explain: '長期壓力可能影響下視丘—腦下垂體—性腺軸的荷爾蒙調節 🧘',
  },
  {
    q: '泡熱水澡/三溫暖會影響精子嗎？',
    opts: ['會，高溫會影響精子生成', '不會，完全無關', '只有女生要注意'],
    correct: 0,
    explain: '睪丸對溫度敏感，頻繁高溫暴露可能暫時降低精子生成效率 ♨️',
  },
  {
    q: '一般建議禁慾多久後採樣比較準確？',
    opts: ['當天多次射精後', '2–7 天內', '超過 2 週'],
    correct: 1,
    explain: 'WHO 建議禁慾 2–7 天內採樣，太短或太長都可能影響數值準確度 📅',
  },
  {
    q: '精子從產生到成熟大約需要多久？',
    opts: ['約 1 天', '約 2 週', '約 2–3 個月'],
    correct: 2,
    explain: '精子生成週期約 64–72 天，所以現在的生活習慣會影響 2–3 個月後的精子品質 ⏳',
  },
  {
    q: '穿緊身褲會影響精子嗎？',
    opts: ['完全無關', '可能因局部溫度升高而有影響', '只是流行趨勢問題'],
    correct: 1,
    explain: '過緊的褲子可能讓陰囊溫度上升，建議選擇透氣寬鬆的衣物 👖',
  },
  {
    q: '肥胖與精子濃度有關係嗎？',
    opts: ['沒有關係', '可能有負相關', '只影響外觀'],
    correct: 1,
    explain: '體脂過高可能影響荷爾蒙平衡，維持健康體重對生殖健康有幫助 ⚖️',
  },
  {
    q: '規律運動對精子有幫助嗎？',
    opts: ['適度運動可能有幫助', '完全沒有關係', '運動越激烈越好'],
    correct: 0,
    explain: '適度規律運動有助於荷爾蒙平衡，但過度激烈訓練反而可能有反效果 🏃',
  },
  {
    q: '維生素 C、E 對精子健康的角色？',
    opts: ['沒有任何作用', '屬於抗氧化物質，可能有保護作用', '只對皮膚有幫助'],
    correct: 1,
    explain: '抗氧化營養素可能有助於減少氧化壓力對精子的傷害，均衡飲食是關鍵 🍊',
  },
  {
    q: '年齡增長會影響精子品質嗎？',
    opts: ['完全不會', '可能會逐漸有影響', '只影響女性生育力'],
    correct: 1,
    explain: '雖然男性生育力下降較女性緩慢，但年齡增長仍可能影響精子品質與DNA完整性 🎂',
  },
  {
    q: '含糖飲料喝多會影響精子嗎？',
    opts: ['完全無關', '可能與代謝異常有關聯', '只影響牙齒'],
    correct: 1,
    explain: '過量糖分攝取可能影響代謝與荷爾蒙平衡，適量攝取才是王道 🥤',
  },
  {
    q: '筆電放大腿上使用會影響精子嗎？',
    opts: ['沒有任何影響', '長時間可能因熱源影響睪丸溫度', '只是坐姿問題'],
    correct: 1,
    explain: '筆電散熱加上大腿姿勢，可能讓局部溫度上升，建議加個散熱墊或桌上使用 💻',
  },
  {
    q: '騎腳踏車跟精子健康有關嗎？',
    opts: ['完全無關', '長時間騎乘可能有壓迫與升溫疑慮', '只影響肌肉'],
    correct: 1,
    explain: '長時間騎乘可能造成局部壓迫與溫度上升，適度休息、選對坐墊很重要 🚴',
  },
  {
    q: '喝咖啡會影響精子嗎？',
    opts: ['適量攝取目前證據不明確有害', '完全禁止飲用', '喝越多越好'],
    correct: 0,
    explain: '目前研究對適量咖啡因的影響證據並不一致，維持適量是比較保守的做法 ☕',
  },
  {
    q: '男性也有「生理時鐘」的說法嗎？',
    opts: ['沒有，只有女性有', '有，年齡增長仍會影響生育力', '完全是迷思'],
    correct: 1,
    explain: '雖然變化較女性緩慢，但男性生育力也會隨年齡逐漸改變 ⏰',
  },
  {
    q: '感冒發燒會影響精子檢測結果嗎？',
    opts: ['完全不會', '可能暫時影響，建議退燒後再檢測', '只影響白血球'],
    correct: 1,
    explain: '發燒會讓體溫升高，可能暫時影響精子生成，建議身體恢復後再進行檢測 🤒',
  },
  {
    q: '每天都可以做這個檢測嗎？',
    opts: ['可以，天天測最準確', '建議依照禁慾天數間隔安排', '一年測一次就好'],
    correct: 1,
    explain: '為了讓每次數值有意義，建議配合適當的禁慾天數安排檢測頻率 📆',
  },
  {
    q: '精索靜脈曲張跟生育力有關嗎？',
    opts: ['完全無關', '是常見的男性不孕相關因素之一', '只是外觀問題'],
    correct: 1,
    explain: '精索靜脈曲張是臨床上常見與男性生育力相關的因素之一，建議定期檢查 🩺',
  },
  {
    q: '心理壓力大時，該怎麼辦比較好？',
    opts: ['忍耐就好，不用理它', '適度紓壓、找人聊聊都是好方法', '壓力跟身體無關'],
    correct: 1,
    explain: '長期壓力可能影響身心健康，適度紓壓、規律作息都對整體健康有幫助 💬',
  },
  {
    q: '水分攝取充足對檢測有幫助嗎？',
    opts: ['完全無關', '適度即可，過量反而可能稀釋樣本', '喝越多越準確'],
    correct: 1,
    explain: '檢測前若攝取過量水分，可能讓樣本濃度被稀釋，維持正常飲水習慣即可 💧',
  },
  {
    q: '哪種顏色蔬果對抗氧化比較有幫助？',
    opts: ['深色/鮮豔色蔬果通常富含抗氧化物', '顏色跟營養無關', '只有綠色蔬菜有用'],
    correct: 0,
    explain: '番茄、藍莓、菠菜等深色蔬果富含抗氧化物質，飲食均衡最重要 🫐',
  },
  {
    q: '定期追蹤檢測數值的意義是？',
    opts: ['只是好玩', '幫助觀察長期趨勢變化，及早發現異常', '沒有太大意義'],
    correct: 1,
    explain: '單次數值容易受當下狀態影響，長期追蹤趨勢更能反映真實狀況 📈',
  },
  {
    q: '陰囊皮膚為什麼會隨溫度收縮或放鬆？',
    opts: ['純粹反射動作，沒有意義', '幫助調節睪丸溫度，是身體的溫控機制', '只是緊張反應'],
    correct: 1,
    explain: '陰囊肌肉會依環境溫度收縮或放鬆，幫助睪丸維持最適合的生成溫度 🧊',
  },
  {
    q: '長期熬夜對生殖荷爾蒙的影響？',
    opts: ['完全沒有關係', '可能干擾睪固酮等荷爾蒙分泌節律', '只影響隔天精神'],
    correct: 1,
    explain: '荷爾蒙分泌有其晝夜節律，長期熬夜可能打亂這個規律運作 🌙',
  },
  {
    q: '運動後馬上做檢測，數值會準嗎？',
    opts: ['完全不影響，隨時都可以測', '劇烈運動後體溫升高，建議稍作休息再測', '運動後測更準確'],
    correct: 1,
    explain: '劇烈運動會讓體溫短暫升高，建議讓身體恢復平靜後再進行檢測 🏋️',
  },
  {
    q: '哪個部位的溫度對精子生成最關鍵？',
    opts: ['全身體溫', '陰囊局部溫度', '手腳溫度'],
    correct: 1,
    explain: '陰囊局部溫度需維持在比核心體溫略低的狀態，精子生成才能順利進行 🌡️',
  },
  {
    q: '長期處於高壓工作環境，該怎麼調適？',
    opts: ['忽略它，繼續拼命工作', '找到適合自己的紓壓方式並規律執行', '壓力對身體沒有影響'],
    correct: 1,
    explain: '找到適合自己的紓壓管道，並養成規律習慣，對整體健康都有正面幫助 🌿',
  },
  {
    q: '飲食中攝取足夠鋅對生殖健康有幫助嗎？',
    opts: ['沒有任何關聯', '鋅是研究關注的重要微量元素之一', '只對免疫系統有用'],
    correct: 1,
    explain: '鋅是精子生成過程中受到關注的微量元素之一，均衡飲食有助於攝取足夠營養 🦪',
  },
  {
    q: '睡前使用手機、平板會怎樣？',
    opts: ['完全無關，隨便滑', '藍光可能干擾睡眠品質與褪黑激素分泌', '只影響視力'],
    correct: 1,
    explain: '睡前長時間使用發光螢幕，可能影響褪黑激素分泌，進而干擾睡眠品質 📱',
  },
  {
    q: '規律作息對生殖荷爾蒙的意義？',
    opts: ['沒有太大意義', '有助於維持穩定的荷爾蒙分泌節律', '只影響情緒穩定度'],
    correct: 1,
    explain: '規律的作息有助於身體維持穩定的荷爾蒙分泌節律，是簡單卻有效的保養方式 ⏱️',
  },
  {
    q: '身體發炎反應會影響精子品質嗎？',
    opts: ['完全不會', '慢性發炎可能與氧化壓力增加有關', '只影響局部組織'],
    correct: 1,
    explain: '慢性發炎反應可能增加體內氧化壓力，進而對精子品質產生潛在影響 🔥',
  },
  {
    q: '適量曬太陽對生殖健康有幫助嗎？',
    opts: ['完全無關', '有助於維生素D合成，可能有正面幫助', '曬越多越好'],
    correct: 1,
    explain: '適量日曬有助於身體合成維生素D，部分研究關注其與生殖健康的關聯性 ☀️',
  },
  {
    q: '長期使用類固醇藥物會有什麼影響？',
    opts: ['完全沒有影響', '可能抑制自身荷爾蒙分泌，建議諮詢醫師', '只影響肌肉量'],
    correct: 1,
    explain: '長期使用類固醇類藥物可能影響自身荷爾蒙分泌軸，用藥前後建議諮詢專業醫師 💊',
  },
]

export default function RestTimerScreen({ navigation, route }: any) {
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS)
  const [quizIndex, setQuizIndex] = useState(() => Math.floor(Math.random() * quizzes.length))
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null)
  const timerRef = useRef<any>(null)

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  useEffect(() => {
    if (secondsLeft === 0) proceed()
  }, [secondsLeft])

  function proceed() {
    clearInterval(timerRef.current)
    navigation.navigate('PreQuestionnaire', { ...route?.params, restTimeConfirmed: true })
  }

  function selectAnswer(i: number) {
    if (selectedOpt !== null) return
    setSelectedOpt(i)
  }

  function nextQuiz() {
    setSelectedOpt(null)
    setQuizIndex(prev => {
      if (quizzes.length <= 1) return prev
      let next = Math.floor(Math.random() * quizzes.length)
      while (next === prev) {
        next = Math.floor(Math.random() * quizzes.length)
      }
      return next
    })
  }

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const timeText = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  const rawQuiz = quizzes[quizIndex]

// 每次切換題目時，重新洗牌選項順序
const shuffledQuiz = useMemo(() => {
  const opts = [...rawQuiz.opts]
  const indices = opts.map((_, i) => i)
  // Fisher-Yates 洗牌
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  const newOpts = indices.map(i => opts[i])
  const newCorrect = indices.indexOf(rawQuiz.correct)
  return { ...rawQuiz, opts: newOpts, correct: newCorrect }
}, [quizIndex])

const quiz = shuffledQuiz
const answered = selectedOpt !== null
const isCorrect = selectedOpt === quiz.correct

  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <Text style={styles.appbarTitle}>試紙靜置中</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>請讓試紙靜置顯色，滿 5 分鐘後即可拍攝</Text>

        <View style={styles.timerCircle}>
          <Ionicons name="time-outline" size={20} color={colors.primary} style={{ marginBottom: 2 }} />
          <Text style={styles.timerText}>{timeText}</Text>
          <Text style={styles.timerLabel}>倒數中</Text>
        </View>

        <View style={styles.quizCard}>
          <Text style={styles.quizLabel}>生殖健康小知識</Text>
          <Text style={styles.quizQ}>{quiz.q}</Text>

          <View style={styles.quizOpts}>
            {quiz.opts.map((opt, i) => {
              const isSelected = selectedOpt === i
              const isRightAnswer = i === quiz.correct
              let optStyle = styles.quizOpt
              let textStyle = styles.quizOptText
              if (answered) {
                if (isRightAnswer) {
                  optStyle = { ...styles.quizOpt, ...styles.quizOptCorrect }
                  textStyle = { ...styles.quizOptText, ...styles.quizOptTextCorrect }
                } else if (isSelected) {
                  optStyle = { ...styles.quizOpt, ...styles.quizOptWrong }
                  textStyle = { ...styles.quizOptText, ...styles.quizOptTextWrong }
                }
              }
              return (
                <TouchableOpacity
                  key={i}
                  style={optStyle}
                  onPress={() => selectAnswer(i)}
                  disabled={answered}
                >
                  <View style={styles.optLeft}>
                    <View style={[
                      styles.optLetter,
                      answered && isRightAnswer && styles.optLetterCorrect,
                      answered && isSelected && !isRightAnswer && styles.optLetterWrong,
                    ]}>
                      <Text style={[
                        styles.optLetterText,
                        answered && isRightAnswer && styles.optLetterTextCorrect,
                        answered && isSelected && !isRightAnswer && styles.optLetterTextWrong,
                      ]}>{String.fromCharCode(65 + i)}</Text>
                    </View>
                    <Text style={textStyle}>{opt}</Text>
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>

          {answered && (
            <View style={styles.explainBox}>
              <Text style={styles.explainTitle}>{isCorrect ? '答對了！' : '答案是這個'}</Text>
              <Text style={styles.explainText}>{quiz.explain}</Text>
              <TouchableOpacity style={styles.nextQuizBtn} onPress={nextQuiz}>
                <Text style={styles.nextQuizBtnText}>下一題 ›</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomArea}>
        <TouchableOpacity style={styles.skipBtn} onPress={proceed}>
          <Text style={styles.skipBtnText}>已經等超過 5 分鐘，跳過等待 ›</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  appbar: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.gray200,
  },
  appbarTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.gray900,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, alignItems: 'center', paddingTop: 80, paddingBottom: 20 },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.gray400,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  timerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  timerText: {
    fontSize: 44,
    fontWeight: typography.weights.medium,
    color: colors.primary,
  },
  timerLabel: {
    fontSize: typography.sizes.sm,
    color: colors.gray400,
    marginTop: 4,
  },
  quizCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: colors.gray200,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  quizLabel: {
    fontSize: 11,
    fontWeight: typography.weights.medium,
    color: colors.primary,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  quizQ: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.gray900,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  quizOpts: { width: '100%', gap: 8 },
  quizOpt: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.gray200,
    backgroundColor: colors.white,
  },
  quizOptCorrect: { borderColor: colors.success, backgroundColor: colors.successLight },
  quizOptWrong: { borderColor: colors.danger, backgroundColor: colors.dangerLight },
  optLeft: { flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1 },
  optLetter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optLetterCorrect: { backgroundColor: colors.success },
  optLetterWrong: { backgroundColor: colors.danger },
  optLetterText: { fontSize: 11, fontWeight: typography.weights.medium, color: colors.gray500 },
  optLetterTextCorrect: { color: colors.white },
  optLetterTextWrong: { color: colors.white },
  quizOptText: { fontSize: typography.sizes.sm, color: colors.gray900, flex: 1 },
  quizOptTextCorrect: { color: colors.success, fontWeight: typography.weights.medium },
  quizOptTextWrong: { color: colors.danger },
  explainBox: {
    width: '100%',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 0.5,
    borderTopColor: colors.gray200,
    alignItems: 'center',
  },
  explainTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.gray900,
    marginBottom: 4,
  },
  explainText: {
    fontSize: typography.sizes.sm,
    color: colors.gray500,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  nextQuizBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  nextQuizBtnText: { fontSize: typography.sizes.sm, color: colors.white, fontWeight: typography.weights.medium },
  bottomArea: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: colors.gray200,
    alignItems: 'center',
  },
  skipBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  skipBtnText: { fontSize: typography.sizes.sm, color: colors.primary },
})