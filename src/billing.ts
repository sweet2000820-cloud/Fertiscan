// src/billing.ts
// [新增 2026/10/01] 訂閱相關的共用設定與動作。
// 目前尚未串接 App Store／Google Play 內購（還沒有開發者帳號），
// 串接時只需要改這個檔案裡的 purchasePlan()、restorePurchases()，畫面不用動。

import { Linking, Platform } from 'react-native'
import { getUserPlan } from './plan'

// 兩個商店後台要建立的訂閱商品（同一個訂閱群組「iMotile Pro」，皆 7 天免費試用）
export const PRODUCTS = {
  monthly: { id: 'pro_monthly', label: '月訂閱', price: 'NT$149', period: '月', priceLine: 'NT$149 / 月' },
  yearly: { id: 'pro_yearly', label: '年訂閱', price: 'NT$1,068', period: '年', priceLine: 'NT$1,068 / 年' },
} as const
export type PlanType = keyof typeof PRODUCTS
export const TRIAL_DAYS = 7

// 使用條款、隱私權政策網址：上架前一定要有（Apple 審核會檢查付費頁上的連結）
// 尚未設定時，付費頁不顯示連結
export const TERMS_URL = ''
export const PRIVACY_URL = ''

// 還沒串接內購前，正式版不能讓使用者「假訂閱」拿到 Pro
export const BILLING_READY = false

export const STORE_NAME = Platform.OS === 'ios' ? 'App Store' : 'Google Play'

// 自動續訂說明（Apple／Google 規定付費頁要清楚揭露）
export function autoRenewNotice() {
  return `訂閱會自動續訂。${TRIAL_DAYS} 天免費試用結束後，依所選方案收費（月訂 ${PRODUCTS.monthly.priceLine}、年訂 ${PRODUCTS.yearly.priceLine}），費用由你的 ${STORE_NAME} 帳號扣款。如不續訂，請在當期結束至少 24 小時前到 ${STORE_NAME} 的訂閱設定取消。`
}

// 開啟商店的訂閱管理頁（取消、變更方案都在這裡，App 不能自己取消訂閱）
export function openManageSubscriptions() {
  const url = Platform.OS === 'ios'
    ? 'https://apps.apple.com/account/subscriptions'
    : 'https://play.google.com/store/account/subscriptions'
  return Linking.openURL(url)
}

// 恢復購買：串接內購後改為向商店查詢；目前先重新讀取帳號方案
export async function restorePurchases(): Promise<'pro' | 'free'> {
  const { plan } = await getUserPlan()
  return plan === 'pro' ? 'pro' : 'free'
}
