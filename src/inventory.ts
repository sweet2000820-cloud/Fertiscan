import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from './firebase'

export async function getInventory(): Promise<{ strips: number, lotNumber: string | null, lastTestDate: string | null }> {
  const user = auth.currentUser
  if (!user) return { strips: 6, lotNumber: null, lastTestDate: null }
  const snap = await getDoc(doc(db, 'users', user.uid))
  if (snap.exists()) {
    const data: any = snap.data()
    return {
      strips: data.strips !== undefined ? data.strips : 6,
      lotNumber: data.lotNumber || null,
      lastTestDate: data.lastTestDate || null,
    }
  }
  return { strips: 6, lotNumber: null, lastTestDate: null }
}

export async function setStrips(n: number) {
  const user = auth.currentUser
  if (!user) return
  await setDoc(doc(db, 'users', user.uid), { strips: n }, { merge: true })
}

export async function setLotNumber(lot: string) {
  const user = auth.currentUser
  if (!user) return
  await setDoc(doc(db, 'users', user.uid), { lotNumber: lot }, { merge: true })
}

export async function setLastTestDate(dateISOString: string) {
  const user = auth.currentUser
  if (!user) return
  await setDoc(doc(db, 'users', user.uid), { lastTestDate: dateISOString }, { merge: true })
}