import { collection, doc, addDoc, deleteDoc, updateDoc, getDocs, query, where, orderBy, limit as fsLimit, writeBatch } from 'firebase/firestore'
import { auth, db } from './firebase'

export type Clinic = {
  id: string
  name: string
  autoShare: boolean
}

export type SharedHistoryEntry = {
  date: string
  time: string
  tc: string
  clinicName: string
  sharedAt: string
}

export async function getClinics(): Promise<Clinic[]> {
  const user = auth.currentUser
  if (!user) return []
  const snap = await getDocs(collection(db, 'users', user.uid, 'clinics'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Clinic))
}

export async function addClinic(name: string): Promise<Clinic> {
  const user = auth.currentUser
  if (!user) throw new Error('未登入')
  const ref = await addDoc(collection(db, 'users', user.uid, 'clinics'), { name, autoShare: false })
  return { id: ref.id, name, autoShare: false }
}

export async function setClinicAutoShare(id: string, val: boolean) {
  const user = auth.currentUser
  if (!user) return
  await updateDoc(doc(db, 'users', user.uid, 'clinics', id), { autoShare: val })
}

export async function removeClinic(id: string, name: string) {
  const user = auth.currentUser
  if (!user) return
  await deleteDoc(doc(db, 'users', user.uid, 'clinics', id))
  // 順便清除這間診所的分享歷程
  const q = query(collection(db, 'users', user.uid, 'sharedHistory'), where('clinicName', '==', name))
  const snap = await getDocs(q)
  const batch = writeBatch(db)
  snap.docs.forEach(d => batch.delete(d.ref))
  await batch.commit()
}

export async function getSharedHistory(max = 10): Promise<SharedHistoryEntry[]> {
  const user = auth.currentUser
  if (!user) return []
  const q = query(
    collection(db, 'users', user.uid, 'sharedHistory'),
    orderBy('sharedAt', 'desc'),
    fsLimit(max)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data() as SharedHistoryEntry)
}

export async function addSharedHistoryEntry(entry: SharedHistoryEntry) {
  const user = auth.currentUser
  if (!user) return
  await addDoc(collection(db, 'users', user.uid, 'sharedHistory'), entry)
}

export async function clearAllClinicsAndHistory() {
  const user = auth.currentUser
  if (!user) return
  const clinicsSnap = await getDocs(collection(db, 'users', user.uid, 'clinics'))
  const historySnap = await getDocs(collection(db, 'users', user.uid, 'sharedHistory'))
  const batch = writeBatch(db)
  clinicsSnap.docs.forEach(d => batch.delete(d.ref))
  historySnap.docs.forEach(d => batch.delete(d.ref))
  await batch.commit()
}