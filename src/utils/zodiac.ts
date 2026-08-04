// 星座起訖日期（西曆），用來依生日月日判斷星座
const zodiacRanges: { name: string, element: string, startMonth: number, startDay: number, endMonth: number, endDay: number }[] = [
  { name: '魔羯座', element: '土象', startMonth: 12, startDay: 22, endMonth: 1, endDay: 19 },
  { name: '水瓶座', element: '風象', startMonth: 1, startDay: 20, endMonth: 2, endDay: 18 },
  { name: '雙魚座', element: '水象', startMonth: 2, startDay: 19, endMonth: 3, endDay: 20 },
  { name: '牡羊座', element: '火象', startMonth: 3, startDay: 21, endMonth: 4, endDay: 19 },
  { name: '金牛座', element: '土象', startMonth: 4, startDay: 20, endMonth: 5, endDay: 20 },
  { name: '雙子座', element: '風象', startMonth: 5, startDay: 21, endMonth: 6, endDay: 20 },
  { name: '巨蟹座', element: '水象', startMonth: 6, startDay: 21, endMonth: 7, endDay: 22 },
  { name: '獅子座', element: '火象', startMonth: 7, startDay: 23, endMonth: 8, endDay: 22 },
  { name: '處女座', element: '土象', startMonth: 8, startDay: 23, endMonth: 9, endDay: 22 },
  { name: '天秤座', element: '風象', startMonth: 9, startDay: 23, endMonth: 10, endDay: 22 },
  { name: '天蠍座', element: '水象', startMonth: 10, startDay: 23, endMonth: 11, endDay: 21 },
  { name: '射手座', element: '火象', startMonth: 11, startDay: 22, endMonth: 12, endDay: 21 },
]

export function getZodiacSign(month: number, day: number) {
  for (const z of zodiacRanges) {
    if (z.startMonth === z.endMonth) {
      if (month === z.startMonth && day >= z.startDay && day <= z.endDay) return z
    } else if (z.startMonth < z.endMonth) {
      if ((month === z.startMonth && day >= z.startDay) || (month === z.endMonth && day <= z.endDay)) return z
    } else {
      // 跨年份的星座（魔羯座：12月22日 ~ 隔年1月19日）
      if ((month === z.startMonth && day >= z.startDay) || (month === z.endMonth && day <= z.endDay)) return z
    }
  }
  return zodiacRanges[0] // 理論上不會走到這裡，保底回傳魔羯座
}

export const zodiacColors: Record<string, string> = {
  '牡羊座': '#D9534F', '金牛座': '#4A9D5C', '雙子座': '#E8C547', '巨蟹座': '#3B7DBF',
  '獅子座': '#E08B3D', '處女座': '#B08050', '天秤座': '#8E6FB3', '天蠍座': '#5C2D2D',
  '射手座': '#C0A062', '魔羯座': '#6B6B6B', '水瓶座': '#3BA3BF', '雙魚座': '#7FB3D9',
}

export const zodiacReadings: Record<string, { trait: string, fortune: string }> = {
  '牡羊座': {
    trait: '行動力十足、直率熱情，喜歡挑戰新事物，做事講求效率不喜拖泥帶水。',
    fortune: '近期精力充沛、適合展開新計畫，但也容易衝動，建議行事前多想一步。',
  },
  '金牛座': {
    trait: '務實穩重、重視安全感，做事按部就班，對喜歡的事物專注且持久。',
    fortune: '近期適合穩紮穩打累積成果，避免躁進，飲食與作息規律有助於狀態穩定。',
  },
  '雙子座': {
    trait: '思路靈活、善於溝通，好奇心強，喜歡多元嘗試與資訊交流。',
    fortune: '近期腦力活躍、適合學習新知，但也容易分心，建議適時聚焦、避免同時處理太多事。',
  },
  '巨蟹座': {
    trait: '重視情感連結、細膩體貼，家庭與人際關係是重要的心靈支柱。',
    fortune: '近期情緒較敏感，建議多留意休息與情緒調適，適合與親近的人相處放鬆。',
  },
  '獅子座': {
    trait: '自信大方、具領導特質，喜歡受到肯定，行事風格明快果決。',
    fortune: '近期能量旺盛、適合主動出擊，但也要留意勿過度逞強，適度休息很重要。',
  },
  '處女座': {
    trait: '細心謹慎、追求完美，做事有條理，對細節有高度要求。',
    fortune: '近期適合整理規劃、盤點目標，但也容易因過度要求自己而累積壓力，宜適度放鬆。',
  },
  '天秤座': {
    trait: '重視和諧、善於協調，審美感佳，喜歡在人際互動中維持平衡。',
    fortune: '近期人際運不錯，適合多與人交流合作，但決策上容易猶豫，建議設定明確的判斷標準。',
  },
  '天蠍座': {
    trait: '意志堅定、洞察力強，情感深刻專一，做事全力以赴。',
    fortune: '近期直覺敏銳、適合深入鑽研，但也容易鑽牛角尖，建議適時抽離、轉換心情。',
  },
  '射手座': {
    trait: '樂觀開朗、崇尚自由，喜歡探索與冒險，對生活抱持正向態度。',
    fortune: '近期適合安排新的體驗或短期出遊，心情放鬆有助於整體狀態提升。',
  },
  '魔羯座': {
    trait: '踏實自律、目標導向，做事有耐心，願意為長遠目標持續努力。',
    fortune: '近期適合設定具體計畫並穩步執行，避免給自己過大壓力，留意休息與睡眠品質。',
  },
  '水瓶座': {
    trait: '獨立思考、重視個人空間，想法前衛，不喜歡被傳統框架侷限。',
    fortune: '近期適合嘗試新方法或跳脫慣性思維，但也要留意與身邊的人保持良好溝通。',
  },
  '雙魚座': {
    trait: '感性浪漫、富有同理心，直覺敏銳，容易受周遭情緒氛圍影響。',
    fortune: '近期情緒起伏可能較明顯，建議透過藝術、音樂或靜心活動安定心神。',
  },
}