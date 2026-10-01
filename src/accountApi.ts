// src/accountApi.ts
// [新增 2026/10/01] 刪除帳號（App Store / Google Play 審核要求）

import { EmailAuthProvider, reauthenticateWithCredential, signOut } from 'firebase/auth'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Notifications from 'expo-notifications'
import { auth } from './firebase'

const API_BASE = 'https://fertiscan-api.onrender.com'

// 只清跟帳號有關的本機設定；onboardingShown 是這支手機看過教學與否，保留
const LOCAL_KEYS_TO_CLEAR = ['reminderWeeks']

function authErrorMessage(e: any): string {
  const code = e?.code || ''
  if (code === 'auth/wrong-password' || code === 'auth/invalid-credential' || code === 'auth/invalid-login-credentials') {
    return '密碼不正確'
  }
  if (code === 'auth/too-many-requests') return '嘗試次數過多，請稍後再試'
  if (code === 'auth/network-request-failed') return '網路連線失敗，請稍後再試'
  return '驗證失敗，請稍後再試'
}

/**
 * 1. 用密碼重新驗證（後端要求 10 分鐘內登入過）
 * 2. 呼叫後端刪除所有資料與登入帳號
 * 3. 清掉本機通知與設定，登出
 * 失敗時丟出可直接顯示給使用者的錯誤訊息
 */
export async function deleteMyAccount(password: string): Promise<void> {
  const user = auth.currentUser
  if (!user || !user.email) throw new Error('找不到登入狀態，請重新登入')

  try {
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password))
  } catch (e) {
    throw new Error(authErrorMessage(e))
  }

  const idToken = await user.getIdToken(true)
  let res: Response
  try {
    res = await fetch(`${API_BASE}/account`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${idToken}` },
    })
  } catch {
    throw new Error('網路連線失敗，請稍後再試')
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(typeof data?.detail === 'string' ? data.detail : `刪除失敗（${res.status}），請稍後再試`)
  }

  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {})
  await AsyncStorage.multiRemove(LOCAL_KEYS_TO_CLEAR).catch(() => {})
}

// 帳號已經在後端刪除，登出讓畫面回到登入頁
export async function finishAccountDeletion() {
  await signOut(auth).catch(() => {})
}
