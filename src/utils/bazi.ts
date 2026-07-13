// 天干
const heavenlyStems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
// 地支
const earthlyBranches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

// 六十甲子對應的納音五行表
const nayinTable: Record<string, string> = {
  '甲子': '海中金', '乙丑': '海中金',
  '丙寅': '爐中火', '丁卯': '爐中火',
  '戊辰': '大林木', '己巳': '大林木',
  '庚午': '路旁土', '辛未': '路旁土',
  '壬申': '劍鋒金', '癸酉': '劍鋒金',
  '甲戌': '山頭火', '乙亥': '山頭火',
  '丙子': '澗下水', '丁丑': '澗下水',
  '戊寅': '城頭土', '己卯': '城頭土',
  '庚辰': '白蠟金', '辛巳': '白蠟金',
  '壬午': '楊柳木', '癸未': '楊柳木',
  '甲申': '泉中水', '乙酉': '泉中水',
  '丙戌': '屋上土', '丁亥': '屋上土',
  '戊子': '霹靂火', '己丑': '霹靂火',
  '庚寅': '松柏木', '辛卯': '松柏木',
  '壬辰': '長流水', '癸巳': '長流水',
  '甲午': '沙中金', '乙未': '沙中金',
  '丙申': '山下火', '丁酉': '山下火',
  '戊戌': '平地木', '己亥': '平地木',
  '庚子': '壁上土', '辛丑': '壁上土',
  '壬寅': '金箔金', '癸卯': '金箔金',
  '甲辰': '覆燈火', '乙巳': '覆燈火',
  '丙午': '天河水', '丁未': '天河水',
  '戊申': '大驛土', '己酉': '大驛土',
  '庚戌': '釵釧金', '辛亥': '釵釧金',
  '壬子': '桑柘木', '癸丑': '桑柘木',
  '甲寅': '大溪水', '乙卯': '大溪水',
  '丙辰': '沙中土', '丁巳': '沙中土',
  '戊午': '天上火', '己未': '天上火',
  '庚申': '石榴木', '辛酉': '石榴木',
  '壬戌': '大海水', '癸亥': '大海水',
}

/**
 * 依出生年份計算天干地支與納音五行
 * 甲子年為西元 1984、1924、2044... （每 60 年一循環，1984 為基準年）
 */
export function getBaziFromYear(year: number) {
  // 1984 年為甲子年（天干索引0、地支索引0）
  const offset = ((year - 1984) % 60 + 60) % 60
  const stem = heavenlyStems[offset % 10]
  const branch = earthlyBranches[offset % 12]
  const ganzhi = `${stem}${branch}`
  const nayin = nayinTable[ganzhi] || '未知'

  // 從納音名稱萃取出單純的五行屬性（金木水火土）
  const element = nayin.slice(-1)

  return { year, ganzhi, nayin, element }
}

export const elementColors: Record<string, string> = {
  '金': '#C0A062',
  '木': '#4A9D5C',
  '水': '#3B7DBF',
  '火': '#D9534F',
  '土': '#B08050',
}

export const elementReadings: Record<string, { trait: string, fortune: string }> = {
  '金': {
    trait: '金主義，性格剛毅果決，做事有原則、重承諾，適合穩紮穩打型的規劃。',
    fortune: '近期宜多接觸金屬、白色系事物增加氣場，行事宜謹慎收斂，忌躁進。',
  },
  '木': {
    trait: '木主仁，性格溫和有生命力，善於成長與突破，適應力強、人緣佳。',
    fortune: '近期適合多接觸綠色系、戶外自然環境，有助於調節身心，宜規律作息養精蓄銳。',
  },
  '水': {
    trait: '水主智，性格靈活善變、思路敏捷，善於溝通與應變，適合腦力密集的工作。',
    fortune: '近期宜保持彈性、順勢而為，忌過度堅持己見，適合多喝水、作息規律以養氣。',
  },
  '火': {
    trait: '火主禮，性格熱情積極、行動力強，做事果斷、有領導特質。',
    fortune: '近期精力旺盛但也容易急躁，建議適度紓壓、避免熬夜，忌過度耗損體力。',
  },
  '土': {
    trait: '土主信，性格穩重踏實、值得信賴，善於堅持與累積，適合長期經營的目標。',
    fortune: '近期宜穩紮穩打、避免躁進，適合規律運動與飲食調理，有助於厚植根基。',
  },
}

const luckyColors = ['白色', '黑色', '藍色', '紅色', '黃色', '綠色', '金色', '紫色', '橘色', '銀色', '粉色']
const activities = ['靜心閱讀', '規律運動', '早睡早起', '整理環境', '與朋友聚會', '嘗試新事物', '獨處沉澱', '學習新知', '外出踏青', '規劃未來', '整理財務']
const cautions = ['過度勞累', '衝動決策', '熬夜晚睡', '情緒起伏', '飲食過量', '爭執口角', '過度社交', '拖延事務', '過度消費', '固執己見', '忽略健康']

function seedFromDateAndElement(dateStr: string, element: string): number {
  const str = dateStr + element
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) % 1000000
  }
  return hash
}

// 五行對應顏色（傳統對應：木青、火赤、土黃、金白、水黑）
const elementColorNames: Record<string, string> = {
  '木': '青綠色', '火': '朱紅色', '土': '土黃色', '金': '素白色', '水': '玄黑色',
}

// 五行對應方位
const elementDirections: Record<string, string> = {
  '木': '東方', '火': '南方', '土': '中央', '金': '西方', '水': '北方',
}

// 五行相生：木生火、火生土、土生金、金生水、水生木
const generates: Record<string, string> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
}
// 五行相剋：木剋土、土剋水、水剋火、火剋金、金剋木
const overcomes: Record<string, string> = {
  '木': '土', '土': '水', '水': '火', '火': '金', '金': '木',
}
// 生我者（被誰生）：反查 generates
const generatedBy: Record<string, string> = {
  '火': '木', '土': '火', '金': '土', '水': '金', '木': '水',
}

// 依國曆月份對應的節氣季節五行（簡化版四季對應：春木、夏火、長夏土、秋金、冬水）
function seasonElementFromMonth(month: number): string {
  if (month === 3 || month === 4 || month === 5) return '木'   // 春
  if (month === 6 || month === 7) return '火'                  // 夏
  if (month === 8) return '土'                                  // 長夏
  if (month === 9 || month === 10 || month === 11) return '金'  // 秋
  return '水'                                                    // 冬（12,1,2月）
}

export function getDailyFortune(element: string, dateStr: string) {
  const parts = dateStr.split(/[/\-]/).map(Number)
  const month = parts[1] || new Date().getMonth() + 1

  const seasonElement = seasonElementFromMonth(month)
  const color = elementColorNames[element]

  let relation: string
  let advice: string

  if (seasonElement === element) {
    relation = '當令'
    advice = `本月正值${element}氣當旺，精神狀態容易亢奮，建議把握精力充沛之時規律運動，但避免熬夜過度耗神。`
  } else if (generates[seasonElement] === element) {
    relation = '相生（受生）'
    advice = `本月${seasonElement}氣生${element}氣，整體氣血較為順暢，適合維持良好作息，養精蓄銳。`
  } else if (generates[element] === seasonElement) {
    relation = '洩氣'
    advice = `本月為${element}氣外洩之時，容易感到疲憊，建議充足睡眠、避免過度勞累或高溫環境久待。`
  } else if (overcomes[seasonElement] === element) {
    relation = '受剋'
    advice = `本月${seasonElement}氣剋${element}氣，身體較易感到壓力，建議適度紓壓、留意情緒與飲食節制。`
  } else {
    relation = '我剋'
    advice = `本月${element}氣較為主導，行事精力旺盛，但也需注意勿過度飲酒應酬或熬夜社交，以免耗損根本。`
  }

  return {
    date: dateStr,
    luckyColor: color,
    relation,
    text: `本命屬${element}，本月與時令為「${relation}」之勢。${advice}`,
  }
}