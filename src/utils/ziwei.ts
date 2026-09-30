// utils/ziwei.ts
// 紫微斗數排盤（使用 iztro 套件：npm install iztro）
// 僅供 AI 解讀頁的趣味內容使用，不做任何懷孕或健康預測。

import { astro } from 'iztro'

export type ZiweiPalaceName = '命宮' | '夫妻' | '子女' | '財帛' | '官祿'

export interface ZiweiPalace {
  name: ZiweiPalaceName
  stars: string[] // 主星
  borrowed: boolean // 空宮時借對宮主星
}

export interface ZiweiChart {
  yearGanzhi: string // 例：乙亥（已依立春分界）
  timeLabel: string // 例：辰時
  palaces: Record<ZiweiPalaceName, ZiweiPalace>
}

// 出生小時（0–23）轉換成 iztro 的時辰索引
// 0 = 早子時(00–01)、1 = 丑時 … 11 = 亥時、12 = 晚子時(23)
export function hourToTimeIndex(hour: number): number {
  if (hour === 23) return 12
  return Math.floor((hour + 1) / 2)
}

const OPPOSITE: Record<ZiweiPalaceName, string> = {
  命宮: '遷移',
  夫妻: '官祿',
  子女: '田宅',
  財帛: '福德',
  官祿: '夫妻',
}

export function getZiweiChart(
  year: number,
  month: number,
  day: number,
  hour: number
): ZiweiChart | null {
  try {
    const chart = astro.bySolar(`${year}-${month}-${day}`, hourToTimeIndex(hour), '男', true, 'zh-TW')
    const names: ZiweiPalaceName[] = ['命宮', '夫妻', '子女', '財帛', '官祿']
    const palaces = {} as Record<ZiweiPalaceName, ZiweiPalace>
    names.forEach(name => {
      const p = chart.palace(name)
      let stars = p ? p.majorStars.map(s => s.name) : []
      let borrowed = false
      if (stars.length === 0) {
        const opp = chart.palace(OPPOSITE[name] as any)
        stars = opp ? opp.majorStars.map(s => s.name) : []
        borrowed = stars.length > 0
      }
      palaces[name] = { name, stars, borrowed }
    })
    return {
      yearGanzhi: chart.chineseDate.split(' ')[0],
      timeLabel: chart.time,
      palaces,
    }
  } catch (e) {
    return null
  }
}

// ── 解讀文字：一律正向或中性，不寫任何吉凶斷語 ──

export const starTraits: Record<string, string> = {
  紫微: '有領導氣質，做事有主見，重視責任感。',
  天機: '腦筋靈活、善於規劃，凡事喜歡想清楚再行動。',
  太陽: '熱情開朗、樂於助人，常是身邊人的精神支柱。',
  武曲: '務實果斷、執行力強，對目標很有毅力。',
  天同: '個性溫和、懂得享受生活，人緣好、容易相處。',
  廉貞: '有原則、重感情，做事認真有衝勁。',
  天府: '穩重可靠，善於規劃與守成，給人安全感。',
  太陰: '細膩溫柔，重視家庭與生活品質。',
  貪狼: '多才多藝、好奇心旺盛，社交能力強。',
  巨門: '觀察力敏銳、口才好，擅長分析與溝通。',
  天相: '圓融有禮、重視公平，是很好的協調者。',
  天梁: '成熟穩重，有照顧人的特質，常扮演可靠的角色。',
  七殺: '勇於挑戰、行動力強，不怕困難。',
  破軍: '敢於改變、喜歡開創，常能打破僵局。',
}

const starKeywords: Record<string, string> = {
  紫微: '尊重與擔當',
  天機: '溝通與彈性',
  太陽: '熱情付出',
  武曲: '務實行動',
  天同: '和樂溫暖',
  廉貞: '真誠投入',
  天府: '穩定包容',
  太陰: '細膩體貼',
  貪狼: '多元活力',
  巨門: '深入交流',
  天相: '協調互助',
  天梁: '照顧與守護',
  七殺: '積極開拓',
  破軍: '突破創新',
}

function keywordOf(stars: string[]): string {
  const kws = stars.map(s => starKeywords[s]).filter(Boolean)
  return kws.length > 0 ? kws.join('、') : '順其自然'
}

export type ReadingContext = 'ttc' | 'general' // ttc = 正在準備／計畫生育

export function getPalaceReading(palace: ZiweiPalace, context: ReadingContext = 'general'): string {
  const kw = keywordOf(palace.stars)
  switch (palace.name) {
    case '命宮': {
      const trait = palace.stars.map(s => starTraits[s]).filter(Boolean).join('') || '個性具有彈性，能依對方調整自己。'
      return `在感情裡的你：${trait}`
    }
    case '夫妻':
      return context === 'ttc'
        ? `你們的相處重心是「${kw}」。準備的路上壓力容易累積，多聊聊彼此的感受，比單純計算日子更重要。`
        : `你們的相處重心是「${kw}」。每週留一段只屬於兩人的時間，是維繫感情最簡單的方法。`
    case '子女':
      // 只描述家庭氛圍，不預測是否懷孕、何時懷孕或子女多寡
      return `家庭氛圍帶有「${kw}」的特質。準備的過程中，保持輕鬆的心情也是一種照顧。`
    case '財帛':
      return `理財風格偏向「${kw}」，近期宜量入為出、穩穩累積。`
    case '官祿':
      return `工作上展現「${kw}」的特質，適合按部就班累積成果。`
  }
}

// ── 本週幸運日 ──
// 依生日與週次產生，同一週內結果固定。
// 只作為「兩人相處」的趣味提示，刻意不跟行房或受孕時機連結（易孕期應以排卵推算為準）。
const WEEKDAYS = ['週一', '週二', '週三', '週四', '週五', '週六', '週日']
const LUCKY_DAY_HINTS = [
  '適合安排一場兩人的小約會。',
  '適合一起吃頓好料，聊聊最近的生活。',
  '適合一起散步，把手機放一邊。',
  '適合給對方一個小驚喜。',
  '適合一起做一件新鮮事。',
]

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

export function getWeeklyLuckyDay(birthKey: string, date: Date): { day: string, hint: string } {
  // 以「週一」為一週的開始（1970/1/1 是週四，所以位移 3 天）
  const days = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000)
  const week = Math.floor((days + 3) / 7)
  const h = hashString(`${birthKey}-${week}`)
  return {
    day: WEEKDAYS[h % 7],
    hint: LUCKY_DAY_HINTS[Math.floor(h / 7) % LUCKY_DAY_HINTS.length],
  }
}