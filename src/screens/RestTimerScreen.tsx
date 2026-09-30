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
  // [修正] 原解說寫「退燒後再檢測」，但發燒的影響通常延後 1–3 個月才出現
  {
    q: '感冒發燒會影響精子檢測結果嗎？',
    opts: ['完全不會', '可能會，而且影響常延後 1–3 個月才出現', '只影響白血球'],
    correct: 1,
    explain: '高燒可能暫時影響精子生成，但因為精子要 2–3 個月才成熟，數值下降常在發燒後 1–3 個月才看到。檢測時記得在問卷註明，之後持續追蹤即可 🤒',
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
  // [修正] 原說法「過量水分會稀釋樣本」證據不足；喝水主要影響尿液
  {
    q: '檢測前多喝水，會把精液樣本稀釋嗎？',
    opts: ['會，喝越多數值越低', '一般飲水量不會明顯稀釋精液', '喝越多數值越準'],
    correct: 1,
    explain: '喝水主要影響的是尿液，一般飲水量不會明顯稀釋精液。維持平常飲水即可，禁慾天數和完整收集樣本比較重要 💧',
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
  // [刪除] 「運動後馬上做檢測，數值會準嗎？」：運動當下的體溫對已經生成的精子影響有限，原解說沒有根據
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
  // ── 以下為新增：精子冷知識與小歷史 ──
  {
    q: '第一個用顯微鏡觀察到精子的人是誰？',
    opts: ['達文西', '雷文霍克', '達爾文'],
    correct: 1,
    explain: '荷蘭科學家雷文霍克於 1677 年首次用自製顯微鏡觀察到精子，是微生物學史上的重要一刻 🔬',
  },
  {
    q: '「精子」spermatozoon 這個字的字源來自？',
    opts: ['拉丁文，意指「戰士」', '希臘文，「種子」+「動物」', '法文，「生命之源」'],
    correct: 1,
    explain: 'spermatozoon 源自希臘文 sperma（種子）加上 zoon（動物），字面意思就是「會動的種子」🧬',
  },
  {
    q: '人類精子跟藍鯨的精子，體積差異有多大？',
    opts: ['藍鯨精子大上數千倍', '兩者大小其實差不多', '人類精子反而比較大'],
    correct: 1,
    explain: '哺乳類的精子大小跟體型無關，儘管藍鯨體型是人類的數萬倍，兩者精子大小卻相差無幾 🐋',
  },
  {
    q: '17 世紀曾流行一時的「預成論」，認為精子裡藏著什麼？',
    opts: ['完整縮小版的人形', '決定性別的基因', '未來的記憶'],
    correct: 0,
    explain: '早期顯微鏡技術有限，曾有科學家誤以為在精子裡看到蜷縮的迷你人形，這個理論後來被證實是錯誤的 🔍',
  },
  {
    q: '動物界中，精子「相對體長」最誇張的生物是？',
    opts: ['大象', '某些果蠅', '藍鯨'],
    correct: 1,
    explain: '某些果蠅（如 Drosophila bifurca）的精子可長達約 6 公分，是自身體長的 20 倍左右，堪稱動物界紀錄 🪰',
  },
  {
    q: '精子擺動尾巴前進所需的能量，主要來自哪個部位？',
    opts: ['頭部', '中段（密集分佈粒線體）', '尾巴末端'],
    correct: 1,
    explain: '精子中段密集堆疊著粒線體，是名副其實的「發電廠」，負責產生能量讓尾巴持續擺動 ⚡',
  },
  // [修正] 「第一批精子銀行成立於 1970 年代」的年份有爭議，改成有明確文獻的里程碑
  {
    q: '第一次用「冷凍過的精子」成功懷孕，大約是在什麼年代？',
    opts: ['1950 年代', '1900 年代', '1990 年代'],
    correct: 0,
    explain: '1953 年美國研究團隊首次報告以冷凍保存的精子成功懷孕，為日後的精子銀行奠定基礎 🧊',
  },
  {
    q: 'WHO（世界衛生組織）發布精液分析標準手冊的主要用途是？',
    opts: ['提供全球一致的檢測方法與參考範圍', '規定合法生育年齡', '僅用於動物實驗'],
    correct: 0,
    explain: 'WHO 定期更新精液分析手冊，讓全球實驗室與臨床能用一致的方法判讀檢測結果 📖',
  },
  {
    q: '精子細胞的基本結構主要分為幾個部分？',
    opts: ['兩部分：頭、尾', '三部分：頭、中段、尾', '四部分'],
    correct: 1,
    explain: '精子主要分為頭部（含遺傳物質）、中段（能量來源）與尾部（推進動力）三個部分 🧫',
  },
  {
    q: '跟女性一生卵子數量固定不同，男性睪丸製造精子的狀況是？',
    opts: ['40 歲左右就會停止', '終生持續製造，速度隨年齡減緩', '只能持續到 30 歲'],
    correct: 1,
    explain: '男性睪丸終生都在持續製造精子，不像女性卵子數量有限，只是隨年齡增長速度可能減緩、品質也可能受影響 ♾️',
  },
  {
    q: '世界上第一個「試管嬰兒」誕生於哪一年？',
    opts: ['1978 年', '1958 年', '1998 年'],
    correct: 0,
    explain: '露易絲·布朗（Louise Brown）於 1978 年在英國誕生，是全球第一位體外受精（IVF）技術下出生的嬰兒 👶',
  },
  // [修正] 「像螺旋槳旋轉」是細菌鞭毛的運動方式，精子尾巴是鞭狀波動
  {
    q: '精子游動時尾巴擺動的方式，比較接近哪種運動模式？',
    opts: ['像鞭子一樣波浪狀擺動', '像螺旋槳一樣整根旋轉', '完全隨機亂動'],
    correct: 0,
    explain: '精子尾巴是以波浪狀的鞭打方式前進，帶動頭部邊轉邊游；像螺旋槳一樣整根旋轉的，其實是細菌的鞭毛 🌀',
  },
  // [修正] 大猩猩精子活動力也偏低，只保留黑猩猩作比較
  {
    q: '相較於黑猩猩，人類精子的活動力表現如何？',
    opts: ['明顯優於黑猩猩', '兩者差不多', '明顯低於黑猩猩'],
    correct: 2,
    explain: '研究發現黑猩猩精子活動力普遍優於人類，推測與黑猩猩群體中精子競爭較激烈的交配策略有關 🦍',
  },
  {
    q: '最早的「不孕症」相關記載，可以追溯到哪個古文明？',
    opts: ['古埃及', '古羅馬', '這是近代才有的醫學概念'],
    correct: 0,
    explain: '古埃及莎草紙文獻中已有關於生育相關問題的記載，顯示這是人類歷史上長期關注的課題 📜',
  },
  {
    q: '精子的「頂體」（acrosome）主要功能是什麼？',
    opts: ['儲存能量', '幫助穿透卵子外層', '控制游動方向'],
    correct: 1,
    explain: '頂體位於精子頭部前端，內含酵素，能幫助精子穿透卵子外層的保護構造，是受精過程的關鍵 🎯',
  },
  {
    q: '20 世紀中期，科學家開始用什麼物質成功冷凍保存精子？',
    opts: ['甘油（glycerol）作為保護劑', '純水直接冷凍', '酒精浸泡'],
    correct: 0,
    explain: '1949 年科學家發現甘油能保護精子細胞在冷凍過程中不被冰晶破壞，是精子冷凍技術的重大突破 ❄️',
  },
  {
    q: '哪一種動物的精子「沒有尾巴」，靠爬行方式移動？',
    opts: ['某些線蟲', '青蛙', '海豚'],
    correct: 0,
    explain: '線蟲（如秀麗隱桿線蟲）的精子沒有鞭毛尾巴，而是靠變形蟲式的爬行方式移動，跟一般認知很不一樣 🐛',
  },
  {
    q: '「精液分析」在臨床上最早被系統性使用，大約始於？',
    opts: ['19 世紀末～20 世紀初', '中世紀時期', '21 世紀才開始'],
    correct: 0,
    explain: '隨著顯微鏡技術與細胞學發展，19 世紀末開始有醫師系統性地將精液顯微觀察應用於臨床評估 👨‍⚕️',
  },
  {
    q: '人類精子的游動速度，大約是多少？',
    opts: ['每分鐘幾乎不動', '每分鐘約可移動數毫米', '每分鐘可移動超過 1 公尺'],
    correct: 1,
    explain: '健康精子的游動速度約為每分鐘數毫米，聽起來不快，但相對於自身體積來說已經是很有效率的移動 🏊',
  },
  {
    q: '「Y 染色體」與「X 染色體」精子，兩者在游動表現上有明確差異嗎？',
    opts: ['科學上並無可靠證據支持兩者游動速度不同', 'Y 精子確定游得比較快', 'X 精子確定游得比較快'],
    correct: 0,
    explain: '坊間常有「快慢精子決定性別」的說法，但目前並無可靠科學證據證實兩者游動能力有系統性差異 ⚖️',
  },
  {
    q: '人類每次射精大約含有多少精子？',
    opts: ['數十萬個', '數千萬到數億個不等', '固定 1 億個'],
    correct: 1,
    explain: '每次射精的精子數量會因人、因禁慾天數而異，一般範圍大約落在數千萬到數億個之間 🔢',
  },
  // [修正] 愛德華茲得獎原因是開發體外受精技術，不是「研究精子與受精機制」
  {
    q: '2010 年因開發「體外受精（試管嬰兒）」技術，獲頒諾貝爾生理學或醫學獎的是？',
    opts: ['羅伯特·愛德華茲（Robert Edwards）', '達爾文', '巴斯德'],
    correct: 0,
    explain: '英國生理學家羅伯特·愛德華茲因開發體外受精技術，於 2010 年獲得諾貝爾生理學或醫學獎 🏅',
  },
  {
    q: '精子在女性生殖道內，一般可以存活多久？',
    opts: ['數小時', '約 3–5 天', '超過一個月'],
    correct: 1,
    explain: '在適合的環境下，精子在女性生殖道內可存活約 3–5 天，這也是排卵推算「受孕窗口」的重要依據 🗓️',
  },
  // [修正] azoospermia 中文為「無精症」，不是「精蟲症」
  {
    q: '「無精症」（azoospermia，精液中完全沒有精子）這個詞的字首 a- 是什麼意思？',
    opts: ['希臘文字首，表示「無、缺乏」', '代表 A 型', '是發現者的姓氏縮寫'],
    correct: 0,
    explain: '希臘文字首 a- 表示否定或缺乏，azoospermia 字面意思就是「沒有精子」，是臨床上明確定義的診斷名詞 📋',
  },

  // ── 以下為新增（2026/09/29）：身體冷知識 ──
  {
    q: '卵子是人體最大的細胞，它的直徑大約是多少？',
    opts: ['約 0.1 毫米，接近肉眼可見', '約 1 毫米，像一粒芝麻', '約 0.001 毫米，要電子顯微鏡才看得到'],
    correct: 0,
    explain: '卵子直徑約 0.1 毫米，差不多是一根頭髮的粗細，是少數接近肉眼可見的人體細胞 🥚',
  },
  {
    q: '一隻精子（含尾巴）大約有多長？',
    opts: ['約 0.05 毫米', '約 0.5 毫米', '約 5 毫米'],
    correct: 0,
    explain: '精子全長約 50–60 微米（0.05 毫米），大部分長度都是用來游泳的尾巴，大約只有卵子直徑的一半 📏',
  },
  {
    q: '健康男性的睪丸每天大約製造多少精子？',
    opts: ['數千萬到上億個', '數萬個', '數十億個'],
    correct: 0,
    explain: '睪丸每秒鐘大約能製造上千個精子，一天累積起來可達數千萬到上億個，是人體最忙碌的「工廠」之一 🏭',
  },
  {
    q: '精子剛從睪丸出來時還不太會游泳，要先到哪裡「進修」？',
    opts: ['副睪', '前列腺', '儲精囊'],
    correct: 0,
    explain: '精子會在緊貼睪丸的副睪裡待上約 1–2 週，在這裡逐漸成熟、學會游泳 🎓',
  },
  {
    q: '一次射精的精液中，精子本身大約占多少體積？',
    opts: ['不到 5%', '大約一半', '超過八成'],
    correct: 0,
    explain: '精子數量雖然多，但體積很小，只占精液的一小部分；其餘大多是儲精囊和前列腺分泌的液體，負責提供養分與保護 🧪',
  },
  {
    q: '精液中大部分的液體，主要是由哪裡分泌的？',
    opts: ['儲精囊', '睪丸', '膀胱'],
    correct: 0,
    explain: '精液約六到七成來自儲精囊，其次是前列腺；睪丸製造的精子只占其中一小部分 💧',
  },
  {
    q: '精液剛射出時會呈凝膠狀，通常多久內會自動變成液體？',
    opts: ['通常在 1 小時內', '大約 6 小時', '大約一整天'],
    correct: 0,
    explain: '這個過程叫「液化」，通常 15 分鐘左右開始、1 小時內完成。先凝固可以幫助精液留在體內，液化後精子才能自由游動 ⏲️',
  },
  {
    q: '人類精子帶有幾條染色體？',
    opts: ['23 條', '46 條', '12 條'],
    correct: 0,
    explain: '一般體細胞有 46 條染色體，精子和卵子各只帶一半（23 條），受精後合起來剛好是 46 條 🧬',
  },
  {
    q: '雙側睪丸一高一低、大小略有差異，通常代表什麼？',
    opts: ['大多是正常現象，很多人左邊比較低', '一定要立刻就醫', '只有極少數人會這樣'],
    correct: 0,
    explain: '兩側睪丸不完全對稱很常見。但如果突然腫大、疼痛，或摸到硬塊，就要盡快就醫 ⚖️',
  },
  {
    q: '精索靜脈曲張比較常發生在哪一側？',
    opts: ['左側', '右側', '兩側機率差不多'],
    correct: 0,
    explain: '大約九成發生在左側，因為左側靜脈回流的路徑比較長、角度也比較不利，血液較容易淤積 🩸',
  },
  {
    q: '睪固酮在一天之中，通常什麼時候最高？',
    opts: ['早上', '傍晚', '半夜 12 點'],
    correct: 0,
    explain: '睪固酮有晝夜節律，通常早上最高、晚上較低，而且主要在睡眠期間分泌，這也是睡不好會影響荷爾蒙的原因之一 🌅',
  },

  // ── 以下為新增：受孕與懷孕冷知識 ──
  {
    q: '受精時，最後通常有幾隻精子能真正進入卵子？',
    opts: ['1 隻', '大約 10 隻', '大約 100 隻'],
    correct: 0,
    explain: '數千萬隻出發，最後只有 1 隻能進入卵子。一旦成功，卵子外層會立刻改變，阻止其他精子再進來 🏁',
  },
  {
    q: '寶寶的生理性別，主要是由什麼決定的？',
    opts: ['受精的精子帶 X 還是 Y 染色體', '卵子的染色體', '媽媽懷孕期間的飲食'],
    correct: 0,
    explain: '卵子都帶 X 染色體，精子則帶 X 或 Y：X 精子受精是女生，Y 精子受精是男生。飲食「生男生女」的說法沒有科學根據 👶',
  },
  {
    q: '同卵雙胞胎是怎麼形成的？',
    opts: ['一個受精卵分裂成兩個胚胎', '兩個卵子分別和兩隻精子受精', '一個卵子同時被兩隻精子受精'],
    correct: 0,
    explain: '同卵雙胞胎來自同一個受精卵，基因幾乎相同；異卵雙胞胎則是兩個卵子各自受精，像一般兄弟姊妹一樣 👯',
  },
  {
    q: '「容易生雙胞胎」的家族傾向，主要跟誰的遺傳有關？',
    opts: ['媽媽（一次排出多個卵子的傾向）', '爸爸（精子數量比較多）', '跟遺傳完全無關'],
    correct: 0,
    explain: '異卵雙胞胎的家族傾向來自媽媽容易一次排出多個卵子。爸爸也可能帶有這個基因，但要傳給女兒才會表現出來 👨‍👩‍👧‍👧',
  },
  {
    q: '懷孕週數是從哪一天開始算的？',
    opts: ['最後一次月經的第一天', '受精的那一天', '驗孕出現兩條線的那一天'],
    correct: 0,
    explain: '醫學上從最後一次月經的第一天開始算，所以「懷孕 2 週」時，其實才剛要排卵、還沒受精 🗓️',
  },
  {
    q: '驗孕棒偵測的是哪一種荷爾蒙？',
    opts: ['hCG（人類絨毛膜促性腺激素）', 'LH（黃體生成素）', '黃體素'],
    correct: 0,
    explain: 'hCG 是胚胎著床後才開始分泌的荷爾蒙；排卵試紙偵測的則是 LH，兩種試紙不能互相替代 🧪',
  },
  {
    q: '排卵試紙偵測的是哪一種荷爾蒙？',
    opts: ['LH（黃體生成素）', 'hCG（人類絨毛膜促性腺激素）', '睪固酮'],
    correct: 0,
    explain: '排卵前 LH 會突然大量上升，排卵試紙就是抓這個高峰，通常之後 1–2 天內會排卵 📈',
  },
  {
    q: '女性通常在什麼時候排卵？',
    opts: ['大約在下次月經來之前 14 天', '每個人都固定在月經第 14 天', '月經結束的當天'],
    correct: 0,
    explain: '「月經第 14 天排卵」只適用於 28 天的週期。比較準確的算法是從下次月經往前推約 14 天，週期不規律的人差異會更大 📆',
  },
  {
    q: '一對健康、沒有避孕的年輕夫妻，每個月自然懷孕的機率大約是多少？',
    opts: ['大約 20–25%', '大約 80%', '大約 50%'],
    correct: 0,
    explain: '就算雙方都很健康，每個月懷孕的機率也只有兩成左右，所以試了幾個月沒成功是很正常的，不用太焦慮 🍀',
  },
  {
    q: '健康的年輕夫妻規律行房，一年內懷孕的比例大約是？',
    opts: ['大約 85%', '大約 50%', '幾乎 100%'],
    correct: 0,
    explain: '大約 85% 的夫妻會在一年內懷孕，這也是「嘗試一年未懷孕」被當作就醫參考點的原因 📊',
  },
  {
    q: '懷孕大約幾週時，可以用超音波看到胎兒心跳？',
    opts: ['大約 6 週', '大約 12 週', '大約 20 週'],
    correct: 0,
    explain: '懷孕 6 週左右，陰道超音波通常就能看到胎心跳動，這是很多準爸媽第一次「聽見」寶寶的時刻 💓',
  },

  // ── 以下為新增：常見迷思 ──
  {
    q: '精子離開人體、在空氣中乾掉之後，還能存活多久？',
    opts: ['很快就會失去活性', '可以活好幾天', '可以活一個月'],
    correct: 0,
    explain: '精子需要溫暖潮濕的環境，一旦乾掉就很快失去活性。能存活數天的，是在女性生殖道內的特殊環境 🌬️',
  },
  {
    q: '男性吃高劑量的鋅加葉酸補充品，一定能提升精子品質嗎？',
    opts: ['不一定，大型研究發現沒有明顯改善', '一定會，而且效果很明顯', '吃越多效果越好'],
    correct: 0,
    explain: '2020 年一項兩千多對夫妻參與的大型研究發現，男性補充鋅和葉酸並沒有改善精液品質。均衡飲食比單吃補充品實在 💊',
  },
  {
    q: '研究發現，常穿哪一種內褲的男性，精子濃度平均比較高？',
    opts: ['寬鬆的四角褲', '緊身的三角褲', '兩者完全沒有差別'],
    correct: 0,
    explain: '2018 年哈佛的研究觀察到，常穿寬鬆內褲的男性，精子濃度平均高出約兩成多，推測和陰囊溫度較低有關 🩳',
  },
  {
    q: '想提高受孕機會，易孕期怎麼安排行房比較好？',
    opts: ['每 1–2 天一次', '先禁慾存精一個月，再集中一次', '只在排卵當天一次'],
    correct: 0,
    explain: '易孕期是排卵前 5 天到排卵日。每 1–2 天一次能兼顧精子數量與品質，禁慾太久反而可能讓精子活動力下降 💞',
  },
  {
    q: '二手菸會影響伴侶懷孕嗎？',
    opts: ['會，可能影響女方生育力與胎兒健康', '不會，只影響抽菸的人自己', '只要不在同一個房間抽就沒關係'],
    correct: 0,
    explain: '二手菸和女性受孕率下降、懷孕併發症風險增加都有關聯。戒菸不只是為了自己，也是為了伴侶和寶寶 🚭',
  },
  {
    q: '為了增肌而自行補充睪固酮，對精子數量可能有什麼影響？',
    opts: ['可能大幅減少，甚至暫時變成零', '會讓精子變多', '只會影響肌肉，跟精子無關'],
    correct: 0,
    explain: '外來的睪固酮會讓大腦以為「夠了」，減少送給睪丸的訊號，精子生成就跟著下降。備孕期間使用前一定要先問醫師 🏋️',
  },
  {
    q: '青春期後感染哪一種病毒，可能引起睪丸發炎而影響生育？',
    opts: ['腮腺炎（俗稱豬頭皮）', '流感', '腸病毒'],
    correct: 0,
    explain: '青春期後的男性感染腮腺炎，約有兩到三成會併發睪丸炎，這也是 MMR 疫苗很重要的原因之一 💉',
  },

  // ── 以下為新增：就醫與檢查 ──
  {
    q: '在不孕的夫妻中，和男性因素有關的比例大約是？',
    opts: ['大約一半', '不到一成', '幾乎全部'],
    correct: 0,
    explain: '約一半的不孕案例跟男性因素有關（單獨或合併女性因素），所以備孕檢查最好夫妻一起做 🤝',
  },
  {
    q: '女性未滿 35 歲，規律且無避孕的性生活多久還沒懷孕，建議夫妻一起就醫？',
    opts: ['1 年', '3 個月', '3 年'],
    correct: 0,
    explain: '未滿 35 歲建議試 1 年，35 歲以上縮短為 6 個月。有已知問題（例如月經很不規則）的話，可以更早就醫 🏥',
  },
  {
    q: '居家精子試紙和醫院的精液分析，最大的差別是什麼？',
    opts: ['試紙適合追蹤趨勢；醫院會完整檢查濃度、活動力和型態', '試紙比醫院更準確', '兩者檢查的項目完全一樣'],
    correct: 0,
    explain: '居家試紙方便在家定期追蹤變化，但醫院的精液分析會看更多項目。數值持續偏低時，建議做一次完整檢查 🔬',
  },
  {
    q: '睪丸自我檢查，什麼時候做最適合？',
    opts: ['洗完熱水澡後，陰囊放鬆的時候', '剛起床、還沒下床時', '剛運動完、身體很熱的時候'],
    correct: 0,
    explain: '熱水澡後陰囊皮膚放鬆，比較容易摸清楚。每月檢查一次，留意有沒有硬塊、腫脹或疼痛 🚿',
  },
  {
    q: '睪丸癌最好發在哪個年齡層？',
    opts: ['15–40 歲的年輕男性', '60 歲以上的長者', '12 歲以下的兒童'],
    correct: 0,
    explain: '睪丸癌雖然少見，卻是年輕男性最常見的癌症之一，好在早期發現的治癒率非常高，所以自我檢查很重要 🎗️',
  },
  {
    q: '男性可以像女性凍卵一樣，把精子冷凍保存起來嗎？',
    opts: ['可以，常用於癌症治療前保存生育力', '不行，只有女性可以凍卵', '可以，但最多只能保存一週'],
    correct: 0,
    explain: '精子冷凍技術很成熟，可以保存很多年。接受化療、放療等可能影響生育力的治療前，醫師常會建議先凍精 ❄️',
  },

  // ── 以下為新增（2026/09/30）：補到 100 題 ──
  {
    q: '卵子排出後，可以受精的時間大約有多久？',
    opts: ['大約 12–24 小時', '大約 3–5 天', '大約 1 週'],
    correct: 0,
    explain: '卵子的受精窗口很短，精子卻能在體內存活好幾天，所以在排卵前就行房，讓精子先「等在那裡」，受孕機會比較高 ⏳',
  },
  {
    q: '女嬰出生時，卵巢裡大約已經有多少個卵子？',
    opts: ['大約 100–200 萬個', '大約 400 個', '出生時還沒有，青春期才開始製造'],
    correct: 0,
    explain: '女性出生時卵子數量就已固定，之後逐年減少；一生中真正排出的只有約 400–500 個。這和男性終生持續製造精子很不一樣 🎀',
  },
  {
    q: '精液的酸鹼值偏向哪一邊？這對精子有什麼幫助？',
    opts: ['偏鹼性，可以中和陰道的酸性環境', '偏酸性，可以殺死細菌', '完全中性，對精子沒有影響'],
    correct: 0,
    explain: '陰道平常偏酸性，用來抵抗細菌，但對精子不友善。精液偏鹼性，可以暫時中和酸性，替精子爭取游過去的時間 🧫',
  },
  {
    q: '精液偶爾出現淡紅或褐色（血精），最常見的原因是？',
    opts: ['多半是良性的輕微發炎或微血管破裂', '一定是癌症', '代表精子品質很好'],
    correct: 0,
    explain: '血精大多是良性的，常會自己消失。但如果反覆出現、年紀超過 40 歲，或伴隨疼痛、發燒、排尿不適，建議到泌尿科檢查 🩺',
  },
]

// ── [新增] 稱號規則 ──
type QuizTitle = { key: string; emoji: string; name: string; desc: string }

function getQuizTitle(answered: number, correct: number): QuizTitle {
  const rate = answered > 0 ? correct / answered : 0
  if (rate >= 0.9 && answered >= 10)
    return { key: 'master', emoji: '🏆', name: '備孕知識大師', desc: '你對生育知識的掌握非常紮實！' }
  if (rate >= 0.75 && answered >= 8)
    return { key: 'expert', emoji: '🌱', name: '生育知識小達人', desc: '大部分觀念都很正確，再接再厲！' }
  if (rate >= 0.5)
    return { key: 'learner', emoji: '📘', name: '備孕見習生', desc: '已經有不錯的基礎，下次會更好。' }
  return { key: 'explorer', emoji: '🔍', name: '知識探險家', desc: '每答一題都在累積知識，謝謝你的挑戰！' }
}

// 答對率夠高、但題數還不夠拿更高稱號時的提示
function getUpgradeHint(answered: number, correct: number): string | null {
  if (answered === 0) return null
  const rate = correct / answered
  if (rate >= 0.9 && answered < 10) return `再多答 ${10 - answered} 題，就有機會拿到「備孕知識大師」`
  if (rate >= 0.75 && answered < 8) return `再多答 ${8 - answered} 題，就有機會拿到「生育知識小達人」`
  return null
}

function shuffleIndices(length: number) {
  const arr = Array.from({ length }, (_, i) => i)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export default function RestTimerScreen({ navigation, route }: any) {
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS)
  const orderRef = useRef<number[]>(shuffleIndices(quizzes.length))
  const posRef = useRef(0)
  const [quizIndex, setQuizIndex] = useState(() => orderRef.current[0])
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null)
  const timerRef = useRef<any>(null)

  // [新增] 計分與結算狀態
  const [answeredCount, setAnsweredCount] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [finished, setFinished] = useState(false)

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

  // [修改] 倒數結束不再直接跳頁，改為先結算
  useEffect(() => {
    if (secondsLeft === 0 && !finished) finishQuiz()
  }, [secondsLeft])

  // [新增] 結算：有作答就顯示稱號卡，一題都沒答就照原流程直接跳頁
  function finishQuiz() {
    clearInterval(timerRef.current)
    if (answeredCount === 0) {
      proceed()
    } else {
      setFinished(true)
    }
  }

  // [修改] 跳頁時把本次答題成績一起帶到下一頁，存檢測紀錄時可一併寫入 Firestore
  function proceed() {
    clearInterval(timerRef.current)
    const quizResult =
      answeredCount > 0
        ? {
            answered: answeredCount,
            correct: correctCount,
            titleKey: getQuizTitle(answeredCount, correctCount).key,
          }
        : null
    navigation.navigate('PreQuestionnaire', {
      ...route?.params,
      restTimeConfirmed: true,
      quizResult,
    })
  }

  function nextQuiz() {
    setSelectedOpt(null)
    posRef.current += 1
    if (posRef.current >= orderRef.current.length) {
      let newOrder = shuffleIndices(quizzes.length)
      const lastShown = orderRef.current[orderRef.current.length - 1]
      if (newOrder[0] === lastShown && newOrder.length > 1) {
        ;[newOrder[0], newOrder[1]] = [newOrder[1], newOrder[0]]
      }
      orderRef.current = newOrder
      posRef.current = 0
    }
    setQuizIndex(orderRef.current[posRef.current])
  }

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const timeText = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  const rawQuiz = quizzes[quizIndex]

  const shuffledQuiz = useMemo(() => {
    const opts = [...rawQuiz.opts]
    const indices = opts.map((_, i) => i)
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

  // [修改] 作答時同步累計題數與答對數（移到 quiz 定義之後，才拿得到打亂後的正解）
  function selectAnswer(i: number) {
    if (selectedOpt !== null || finished) return
    setSelectedOpt(i)
    setAnsweredCount(c => c + 1)
    if (i === quiz.correct) setCorrectCount(c => c + 1)
  }

  const title = getQuizTitle(answeredCount, correctCount)
  const upgradeHint = getUpgradeHint(answeredCount, correctCount)
  const ratePct = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0

  return (
    <View style={styles.container}>
      <View style={styles.appbar}>
        <Text style={styles.appbarTitle}>{finished ? '試紙顯色完成' : '試紙靜置中'}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {finished ? (
          // ── [新增] 稱號結算卡 ──
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>本次等待你獲得的稱號</Text>
            <View style={styles.resultBadge}>
              <Text style={styles.resultEmoji}>{title.emoji}</Text>
            </View>
            <Text style={styles.resultTitle}>{title.name}</Text>
            <Text style={styles.resultDesc}>{title.desc}</Text>

            <View style={styles.resultStats}>
              <View style={styles.resultStat}>
                <Text style={styles.resultStatNum}>{answeredCount}</Text>
                <Text style={styles.resultStatCap}>作答題數</Text>
              </View>
              <View style={styles.resultStat}>
                <Text style={styles.resultStatNum}>{correctCount}</Text>
                <Text style={styles.resultStatCap}>答對題數</Text>
              </View>
              <View style={styles.resultStat}>
                <Text style={styles.resultStatNum}>{ratePct}%</Text>
                <Text style={styles.resultStatCap}>答對率</Text>
              </View>
            </View>

            {upgradeHint && <Text style={styles.upgradeHint}>{upgradeHint}</Text>}

            <Text style={styles.resultNotice}>試紙已顯色完成，請盡快進行拍攝</Text>
          </View>
        ) : (
          <>
            <Text style={styles.subtitle}>請讓試紙靜置顯色，滿 5 分鐘後即可拍攝</Text>

            <View style={styles.timerCircle}>
              <Ionicons name="time-outline" size={20} color={colors.primary} style={{ marginBottom: 2 }} />
              <Text style={styles.timerText}>{timeText}</Text>
              <Text style={styles.timerLabel}>倒數中</Text>
            </View>

            <View style={styles.quizCard}>
              <Text style={styles.quizLabel}>生殖健康小知識</Text>
              {/* [新增] 即時成績 */}
              <Text style={styles.quizScore}>本次已答 {answeredCount} 題・答對 {correctCount} 題</Text>
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
          </>
        )}
      </ScrollView>

      <View style={styles.bottomArea}>
        {finished ? (
          // [新增] 結算後的主要按鈕
          <TouchableOpacity style={styles.proceedBtn} onPress={proceed}>
            <Text style={styles.proceedBtnText}>開始拍攝 ›</Text>
          </TouchableOpacity>
        ) : (
          // [修改] 跳過等待也先結算
          <TouchableOpacity style={styles.skipBtn} onPress={finishQuiz}>
            <Text style={styles.skipBtnText}>已經等超過 5 分鐘，跳過等待 ›</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  appbar: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 30,
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
  appbarTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.gray900,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, alignItems: 'center', paddingTop: 20, paddingBottom: 20 },
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
    borderRadius: 20,
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
    marginBottom: 4,
  },
  // [新增]
  quizScore: {
    fontSize: 11,
    color: colors.gray400,
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
    borderRadius: 16,
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
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optLetterCorrect: { backgroundColor: colors.success },
  optLetterWrong: { backgroundColor: colors.danger },
  optLetterText: { fontSize: 11, fontWeight: typography.weights.medium, color: colors.primary },
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
    paddingHorizontal: 22,
    paddingVertical: 9,
    borderRadius: 18,
  },
  nextQuizBtnText: { fontSize: typography.sizes.sm, color: colors.white, fontWeight: typography.weights.medium },

  // ── [新增] 稱號結算卡 ──
  resultCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: colors.gray200,
    padding: 24,
    alignItems: 'center',
    marginTop: 12,
  },
  resultLabel: { fontSize: typography.sizes.sm, color: colors.gray400 },
  resultBadge: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  resultEmoji: { fontSize: 52 },
  resultTitle: { fontSize: 22, fontWeight: '700', color: colors.primary, marginBottom: 6 },
  resultDesc: { fontSize: typography.sizes.sm, color: colors.gray500, textAlign: 'center', lineHeight: 20 },
  resultStats: { flexDirection: 'row', gap: 10, marginTop: 20, width: '100%' },
  resultStat: {
    flex: 1,
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  resultStatNum: { fontSize: 20, fontWeight: '600', color: colors.gray900 },
  resultStatCap: { fontSize: 11, color: colors.gray400, marginTop: 2 },
  upgradeHint: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 20,
  },
  resultNotice: {
    fontSize: typography.sizes.sm,
    color: colors.gray400,
    textAlign: 'center',
    marginTop: 16,
  },

  bottomArea: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 12,
    alignItems: 'center',
  },
  skipBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  skipBtnText: { fontSize: typography.sizes.sm, color: colors.primary },
  // [新增]
  proceedBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proceedBtnText: { fontSize: typography.sizes.md, color: colors.white, fontWeight: typography.weights.medium },
})