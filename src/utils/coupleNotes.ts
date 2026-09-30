// utils/coupleNotes.ts
// AI 解讀頁「孕事小語／相處小語」的文字內容。
// 以紫微斗數排盤（iztro 套件：npm install iztro）：
//   - 有填出生時辰 → 用實際時辰排盤
//   - 沒填出生時辰 → 依「時辰不詳」的常見做法，預設用午時排盤
//   - 連生日都沒填 → 用帳號 id 固定挑一種相處類型
// 原則：只談伴侶相處與家庭氛圍，一律正向或中性；不預測是否懷孕、懷孕時間、子女多寡或健康狀況。
// 畫面上不顯示命盤、宮位、星曜、干支等命理字眼。

import { astro } from 'iztro'

export type ReadingContext = 'ttc' | 'general' // ttc = 正在準備／計畫生育
export type NoteSection = 'self' | 'couple' | 'family'

interface Archetype {
  keyword: string
  couple: string
  family: string
  self: string
}

// 14 主星對應的解讀文字（key 是星曜名稱，只在程式內部使用）
const STAR_READINGS: Record<string, Archetype> = {
  紫微: {
    keyword: '尊重與擔當',
    couple: '你在感情裡習慣扛起責任、替兩人做決定，給對方很大的安全感。不過有時太想掌握全局，對方可能覺得意見沒被聽見。重要的事情試著先問一句「你覺得呢？」，兩人的默契會更好。',
    family: '你對家庭有很強的責任感，心中的家是有秩序、讓人安心的地方。準備的過程中不用把所有事都攬在自己身上，把分工說清楚，兩個人都會輕鬆很多。',
    self: '你在感情裡是可靠的一方，重承諾也重面子。偶爾放下身段、撒個嬌，反而更能拉近兩人的距離。',
  },
  天機: {
    keyword: '溝通與彈性',
    couple: '你們的相處靠的是聊天和默契，你很會觀察對方的心情變化。只是你容易想太多，一句話可能在心裡轉好幾圈。有疑問就直接問，比自己猜更省力，也更不傷感情。',
    family: '你是很會做功課的人，對未來的家庭生活會想得很細。準備期間資訊很多，別被網路上各種說法牽著走，挑一兩個可靠的來源就好，其餘交給專業。',
    self: '你心思細膩、反應快，很懂得體貼對方的需要。記得也把自己的需求說出口，對方才有機會照顧你。',
  },
  太陽: {
    keyword: '熱情付出',
    couple: '你對伴侶很大方，喜歡付出，也樂於照顧對方的家人朋友。只是忙著照顧大家的時候，容易忽略兩人獨處的時間。偶爾把行程空下來，只留給彼此。',
    family: '你心中的家是熱鬧、溫暖、常有笑聲的地方。準備的日子裡，把這份熱情也分一點給自己，睡飽、吃好、少熬夜，就是最實在的準備。',
    self: '你熱情直率，在感情裡是會主動表達的一方。熱情之外多留一點耐心，把對方想說的話聽完，會讓你們更貼近。',
  },
  武曲: {
    keyword: '務實行動',
    couple: '你是用行動表達愛的人，比起甜言蜜語，更習慣直接把事情處理好。不過對方有時需要的只是被聽見，不一定要馬上解決。試著多說一句「辛苦了」，效果常常比你想的好。',
    family: '你很務實，會把家庭需要的條件一項項準備好。準備期間正適合發揮你的執行力，和伴侶一起把作息、飲食調整成固定的習慣。',
    self: '你務實可靠，承諾的事一定做到。在感情裡多一點柔軟的表達，會讓對方更感受到你的用心。',
  },
  天同: {
    keyword: '和樂溫暖',
    couple: '你們的相處輕鬆自在，你很會製造生活中的小快樂。遇到需要做決定的事，你可能習慣先放著、晚點再說。重要的事情一起約個時間好好聊，會比一直擱著更安心。',
    family: '你理想中的家是舒服、放鬆、沒有壓力的地方。這份從容正是準備期最需要的心態，不必把每一天都過得像在趕進度。',
    self: '你溫和好相處，是讓人放鬆的伴侶。偶爾主動規劃一次約會，會帶給對方很大的驚喜。',
  },
  廉貞: {
    keyword: '真誠投入',
    couple: '你對感情很投入，愛恨分明，也很在意兩人之間的信任。情緒上來時說話可能比較直，先深呼吸幾秒再開口，能避免很多不必要的誤會。',
    family: '你對家人有很強的保護欲，會全心全意想給家人最好的。準備的路上難免有起伏，把心情說出來，比一個人悶著更健康。',
    self: '你重感情、有原則，一旦認定就很專一。在堅持之外保留一點彈性，感情會走得更順。',
  },
  天府: {
    keyword: '穩定包容',
    couple: '你是伴侶穩定的依靠，重視生活品質，也擅長把家裡打理得井井有條。有時太習慣維持現狀，對方想嘗試新東西時，不妨陪著一起試試看。',
    family: '你很會為家庭做長遠規劃，給人很強的安全感。準備期間的時間和預算安排交給你會很放心，也別忘了保留兩人的生活樂趣。',
    self: '你穩重大方，是讓人安心的伴侶。偶爾表現一點脆弱，對方會更懂你、也更靠近你。',
  },
  太陰: {
    keyword: '細膩體貼',
    couple: '你細心溫柔，很會記得對方在意的小事。只是你的心事常放在心裡，對方不一定察覺得到。試著把感受說出來，不需要等到累積很多才開口。',
    family: '你重視家的氣氛，想給家人溫柔、安定的環境。準備期間照顧好自己的情緒，比任何營養品都重要。',
    self: '你感性體貼、情感細膩。你不需要一直當照顧別人的那個人，也讓對方有機會照顧你。',
  },
  貪狼: {
    keyword: '多元活力',
    couple: '你們的相處充滿新鮮感，你懂得製造浪漫，也喜歡和對方一起嘗試新事物。興趣廣泛的你，偶爾要留意把注意力放回兩人身上。',
    family: '你會是個好玩、有創意的家人，想像中的家充滿樂趣。準備期間不妨把健康習慣變成兩人的小遊戲，例如一起挑戰每天走路八千步。',
    self: '你有魅力、懂生活情趣，很容易讓人喜歡。穩定的陪伴，是讓對方安心的關鍵。',
  },
  巨門: {
    keyword: '深入交流',
    couple: '你們之間需要大量的溝通，你很會分析事情，也願意把話說清楚。只是說得太直時，討論容易變成辯論。聊之前先確認對方的感受，再談誰對誰錯。',
    family: '你對家庭的事情會想得很仔細，也會有很多疑問。這是好事，準備期間把問題記下來，回診或檢查時一次問清楚，會比自己上網查更安心。',
    self: '你觀察力敏銳、口才好，是很好的聊天對象。說話時多一點溫度，對方會更願意跟你分享心事。',
  },
  天相: {
    keyword: '協調互助',
    couple: '你是感情裡的協調者，很重視公平，也很會顧及對方的感受。有時太在意和諧，會把不滿吞下去。適度說出真實的想法，關係反而會更穩。',
    family: '你會是講道理、有分寸的家人，家裡的大小事都能處理得很妥當。準備期間兩人的分工，也可以用你擅長的方式好好討論。',
    self: '你圓融有禮、很好相處。別總是配合對方，你的想法同樣重要。',
  },
  天梁: {
    keyword: '照顧與守護',
    couple: '你很會照顧人，常扮演伴侶的後盾。但照顧過了頭，對方可能覺得像被管。試著先問「需要我幫忙嗎？」，而不是直接出手。',
    family: '你天生有守護家人的特質，是讓家人放心依靠的角色。準備期間也要照顧好自己，你的健康就是家人最大的安全感。',
    self: '你成熟可靠，是對方的避風港。偶爾也讓自己被照顧，不需要永遠當大人。',
  },
  七殺: {
    keyword: '積極開拓',
    couple: '你行動力強、想到就做，和你在一起很有衝勁。只是步調太快時，對方可能跟不上。重要決定前先停一下，確認兩人的節奏一致。',
    family: '你面對目標很有決心，一旦決定就會全力以赴。準備這件事有時需要時間，給自己和伴侶多一點耐心，不必急著看到結果。',
    self: '你直率果斷、敢愛敢恨。多一點溫柔的表達，會讓你的真心更容易被看見。',
  },
  破軍: {
    keyword: '突破創新',
    couple: '你喜歡變化，常為兩人的生活帶來新的可能。有時改變來得太突然，對方需要時間消化。重大決定提早和對方商量，會順利很多。',
    family: '你對未來的家有很多新想法，不喜歡照著別人的模式走。準備期間的生活調整，可以用你的方式重新安排，找到兩人都舒服的節奏。',
    self: '你勇於突破，是感情裡帶來新鮮感的人。在變化之中保持穩定的承諾，會讓對方更安心。',
  },
}
const ARCHETYPES = Object.values(STAR_READINGS)

// ── 每週固定的內容（幸運日、相處小任務） ──
// 依生日與週次產生，同一週（週一到週日）內結果固定，每週換一次。
// 刻意不跟行房或受孕時機連結（易孕期應以排卵推算為準）。

function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  // 再混一次，讓相鄰週次的結果分散
  h ^= h >>> 16
  h = Math.imul(h, 0x45d9f3b)
  h ^= h >>> 16
  return h >>> 0
}

// 以「週一」為一週的開始（1970/1/1 是週四，所以位移 3 天）
function weekIndex(date: Date): number {
  const days = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000)
  return Math.floor((days + 3) / 7)
}

const WEEKDAYS = ['週一', '週二', '週三', '週四', '週五', '週六', '週日']
const LUCKY_DAY_HINTS = [
  '這天適合安排一場兩人的小約會，去一間一直想去的店。',
  '這天適合一起吃頓好料，聊聊最近的生活和心情。',
  '這天適合一起散步，把手機收進口袋，好好聊天。',
  '這天適合給對方一個小驚喜，一杯飲料或一張紙條都好。',
  '這天適合一起做一件沒做過的事，替生活加點新鮮感。',
]

export function getWeeklyLuckyDay(birthKey: string, date: Date): { day: string, hint: string } {
  const h = hashString(`${birthKey}-lucky-${weekIndex(date)}`)
  return {
    day: WEEKDAYS[h % 7],
    hint: LUCKY_DAY_HINTS[Math.floor(h / 7) % LUCKY_DAY_HINTS.length],
  }
}

const COUPLE_TASKS_TTC = [
  { title: '一起早睡一晚', text: '挑一天兩人都在 11 點前關燈。睡眠充足對荷爾蒙分泌有幫助，也讓隔天心情更好。' },
  { title: '一起煮一頓晚餐', text: '菜單裡多放一份深綠色蔬菜，一邊煮一邊聊天，比外食更有參與感。' },
  { title: '飯後散步 30 分鐘', text: '不用走很快，重點是兩個人一起動一動，順便聊聊這週的事。' },
  { title: '說一件感謝對方的事', text: '各自說出這週最想謝謝對方的一件小事。準備的路上，被看見的感覺很重要。' },
  { title: '安排一次不聊備孕的約會', text: '這一次只聊別的話題：旅行、電影、以前的回憶。讓兩人記得，你們首先是彼此的伴侶。' },
  { title: '一起看看最近的紀錄', text: '花 10 分鐘一起看這個月的檢測紀錄和生活習慣，不評分、不檢討，只是一起了解。' },
  { title: '寫一張小卡給對方', text: '幾句話就好，寫下最近想對對方說、但沒說出口的話。' },
  { title: '列出三件想一起完成的事', text: '可以是小旅行、學一道新菜，或一起開始運動，讓生活不只圍繞著準備這件事。' },
]

const COUPLE_TASKS_GENERAL = [
  { title: '一起早睡一晚', text: '挑一天兩人都在 11 點前關燈，好好休息一晚。' },
  { title: '一起煮一頓晚餐', text: '一起挑菜單、一起下廚，比外食多了很多聊天的機會。' },
  { title: '飯後散步 30 分鐘', text: '把手機收進口袋，一邊走一邊聊這週發生的事。' },
  { title: '說一件感謝對方的事', text: '各自說出這週最想謝謝對方的一件小事。' },
  { title: '看一部對方挑的電影', text: '這次由對方決定，你負責準備零食。' },
  { title: '去一個沒去過的地方', text: '不用走太遠，附近沒去過的公園或小店都可以。' },
  { title: '寫一張小卡給對方', text: '幾句話就好，寫下最近想對對方說的話。' },
  { title: '規劃一次小旅行', text: '一起挑一個下個月可以去的地方，光是規劃就很開心。' },
]

export function getWeeklyCoupleTask(
  birthKey: string,
  date: Date,
  context: ReadingContext
): { title: string, text: string } {
  const list = context === 'ttc' ? COUPLE_TASKS_TTC : COUPLE_TASKS_GENERAL
  const h = hashString(`${birthKey}-task-${weekIndex(date)}`)
  return list[h % list.length]
}

// ── 排盤 ──

export const DEFAULT_BIRTH_HOUR = 12 // 午時（11:00–13:00）

// 出生小時（0–23）轉換成 iztro 的時辰索引
// 0 = 早子時(00–01)、1 = 丑時 … 6 = 午時 … 11 = 亥時、12 = 晚子時(23)
export function hourToTimeIndex(hour: number): number {
  if (hour === 23) return 12
  return Math.floor((hour + 1) / 2)
}

type PalaceName = '命宮' | '夫妻' | '子女'
const SECTION_PALACE: Record<NoteSection, PalaceName> = { self: '命宮', couple: '夫妻', family: '子女' }
// 空宮（沒有主星）時借對宮主星
const OPPOSITE: Record<PalaceName, string> = { 命宮: '遷移', 夫妻: '官祿', 子女: '田宅' }

export interface BirthInfo {
  year: number
  month: number
  day: number
  hour: number | null // 未填為 null → 用午時
}

const chartCache = new Map<string, Record<PalaceName, string[]> | null>()

function getPalaceStars(birth: BirthInfo): Record<PalaceName, string[]> | null {
  const hour = birth.hour ?? DEFAULT_BIRTH_HOUR
  const key = `${birth.year}-${birth.month}-${birth.day}-${hour}`
  if (chartCache.has(key)) return chartCache.get(key)!
  let result: Record<PalaceName, string[]> | null = null
  try {
    const chart = astro.bySolar(`${birth.year}-${birth.month}-${birth.day}`, hourToTimeIndex(hour), '男', true, 'zh-TW')
    const stars = {} as Record<PalaceName, string[]>
    ;(['命宮', '夫妻', '子女'] as PalaceName[]).forEach(name => {
      const p = chart.palace(name)
      let list = p ? p.majorStars.map(s => s.name) : []
      if (list.length === 0) {
        const opp = chart.palace(OPPOSITE[name] as any)
        list = opp ? opp.majorStars.map(s => s.name) : []
      }
      stars[name] = list
    })
    result = stars
  } catch (e) {
    result = null
  }
  chartCache.set(key, result)
  return result
}

function composeReading(stars: string[], section: NoteSection, context: ReadingContext): string {
  const [main, second] = stars
  const r = STAR_READINGS[main] || FALLBACK_READING
  const secondKw = second && STAR_READINGS[second] ? STAR_READINGS[second].keyword : null
  const extra = !secondKw ? ''
    : section === 'self' ? `另外，你身上也帶有「${secondKw}」的特質。`
    : section === 'family' ? `另外，家中也帶有「${secondKw}」的氛圍。`
    : `另外，你們之間也帶有「${secondKw}」的特質。`
  const body = (section === 'self' ? r.self : section === 'family' ? r.family : r.couple) + extra
  return section === 'couple' && context === 'ttc'
    ? body + '準備的路上壓力容易累積，多聊聊彼此的感受，比單純計算日子更重要。'
    : body
}

const FALLBACK_READING: Archetype = {
  keyword: '順其自然',
  couple: '你們的相處很有彈性，能依彼此的狀態調整步調。多花點時間了解對方最近在意的事，默契會越來越好。',
  family: '你對家庭的想像很開放，願意和伴侶一起慢慢摸索。準備的過程不必求快，找到兩人都舒服的節奏最重要。',
  self: '你在感情裡懂得適應，能依對方調整自己。記得也把自己的想法說出來。',
}

// 取得某一段的解讀文字。birth 為 null（沒填生日）時，改用 seed 固定挑一種類型
export function getCoupleReading(
  section: NoteSection,
  context: ReadingContext,
  birth: BirthInfo | null,
  seed: string
): string {
  const stars = birth ? getPalaceStars(birth) : null
  if (stars) return composeReading(stars[SECTION_PALACE[section]], section, context)
  const r = ARCHETYPES[hashString(`${seed}-${section}`) % ARCHETYPES.length]
  return composeReading([Object.keys(STAR_READINGS).find(k => STAR_READINGS[k] === r)!], section, context)
}