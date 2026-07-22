import { collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase'

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
    sampleIntervalMinutes: number // 採樣間隔（分鐘）
    sampleComplete: boolean       // 檢體是否完整採集
    usedLubricant: boolean        // 是否使用潤滑劑
    hadFever: boolean             // 近2週是否發燒
    newMedication: boolean        // 近3個月是否新增用藥
    heavyDrinking: boolean        // 近48小時是否大量飲酒
    heatExposure: 'never' | 'occasional' | 'often' | 'almostDaily'
    sleepHours: 'lt5' | '5to6' | '7to8' | 'gt9'
    stressLevel: 'low' | 'moderate' | 'high' | 'veryHigh'
  }
}

export async function saveRecord(record: TestRecord) {
  const user = auth.currentUser
  if (!user) return
  await addDoc(collection(db, 'users', user.uid, 'records'), {
    ...record,
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