import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from './firebase'

export async function getUserPlan(): Promise<{ plan: string, planType: string | null }> {
  const user = auth.currentUser
  if (!user) return { plan: 'free', planType: null }
  const snap = await getDoc(doc(db, 'users', user.uid))
  if (snap.exists()) {
    const data: any = snap.data()
    return { plan: data.userPlan || 'free', planType: data.userPlanType || null }
  }
  return { plan: 'free', planType: null }
}

export async function setUserPlan(plan: string, planType?: string) {
  const user = auth.currentUser
  if (!user) return
  await setDoc(doc(db, 'users', user.uid), {
    userPlan: plan,
    ...(planType ? { userPlanType: planType } : {}),
  }, { merge: true })
}