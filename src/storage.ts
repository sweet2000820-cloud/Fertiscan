import { collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase'

// [新增] 靜置等待期間的衛教問答成績
export type QuizResult = {
  answered: number   // 作答題數
  correct: number    // 答對題數
  titleKey: 'master' | 'expert' | 'learner' | 'explorer' // 稱號代碼（備孕知識大師／生育知識小達人／備孕見習生／知識探險家）
}

export type TestRecord = {
  date: string
  time: string
  tc: string
  status: string
  lot: string

  // 訊號強度數值
  cIntensity?: number
  tIntensity?: number

  // 每次檢測當下的問卷脈絡
  preTestSurvey?: {
    abstinenceDays: number        // 禁慾天數
    sampleIntervalMinutes?: number // 採樣間隔（分鐘）［修正：問卷目前沒有收集，改為選填］
    restTimeConfirmed?: boolean   // ［新增］是否完成 5 分鐘靜置等待（問卷已有存，型別補上）
    sampleComplete: boolean       // 檢體是否完整採集
    sampleVolume?: string         // ［新增］檢體總量（'<1'、'1'～'7'、'>7'，是分類字串不是數字）
    usedLubricant: boolean        // 是否使用潤滑劑
    hadFever: boolean             // 近2週是否發燒
    newMedication: boolean        // 近3個月是否新增用藥
    heavyDrinking: boolean        // 近48小時是否大量飲酒
    heatExposure: 'never' | 'occasional' | 'often' | 'almostDaily'
    sleepHours: 'lt5' | '5to6' | '7to8' | 'gt9'
    stressLevel: 'low' | 'moderate' | 'high' | 'veryHigh'
  }

  // [新增] 本次等待時的問答成績；沒作答或直接跳過時為 null
  quizResult?: QuizResult | null
}

// [新增] Firestore 不接受 undefined 欄位，寫入前先移除，
// 避免某次沒帶到 quizResult（或其他選填欄位）時整筆紀錄存檔失敗
function stripUndefined<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T
}

export async function saveRecord(record: TestRecord) {
  const user = auth.currentUser
  if (!user) return
  await addDoc(collection(db, 'users', user.uid, 'records'), {
    ...stripUndefined(record),
    createdAt: serverTimestamp(),
  })
}

export async function getRecords(): Promise<TestRecord[]> {
  const user = auth.currentUser
  if (!user) return []
  const q = query(
    collection(db, 'users', user.uid, 'records'),
    orderBy('createdAt', 'desc'),
    limit(20)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data() as TestRecord)
}