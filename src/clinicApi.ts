// src/clinicApi.ts
// 合作診所、預約、分享報告給診所：呼叫後端 API 的共用函式

import { auth } from './firebase'

const API_BASE = 'https://fertiscan-api.onrender.com'

export type PartnerClinic = {
  id: string
  name: string
  area: string
  lat: number | null
  lng: number | null
  url: string | null
  phone: string | null
  department: string | null
  hours: string | null
}

export type AppointmentStatus = 'new' | 'contacted' | 'booked' | 'closed' | 'cancelled'

export type SharedReport = {
  shareId: string
  date: string
  time: string
  tc: string
  status: string
  sharedAt: string | null
  viewed: boolean
  state: 'active' | 'expired' | 'revoked'
}

export type Appointment = {
  id: string
  clinicId: string
  clinicName: string
  slots: string[]
  status: AppointmentStatus
  scheduledText: string | null
  createdAt: string | null
  updatedAt: string | null
  reports: SharedReport[]
}

export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  new: '已送出，等待診所聯絡',
  contacted: '診所已聯絡',
  booked: '已約診',
  closed: '已結束',
  cancelled: '已取消',
}

export const SLOT_OPTIONS = ['平日上午', '平日下午', '平日晚上', '週六', '週日']

async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const user = auth.currentUser
  if (!user) throw new Error('找不到登入狀態，請重新登入')
  const idToken = await user.getIdToken()
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}`, ...(options.headers || {}) },
    })
  } catch (e) {
    throw new Error('網路連線失敗，請稍後再試')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    // FastAPI 驗證錯誤的 detail 是陣列，其他錯誤是文字
    if (res.status === 422) console.log('[clinicApi] 資料格式被後端擋下:', JSON.stringify(data?.detail))
    const msg = typeof data?.detail === 'string'
      ? data.detail
      : res.status === 422 ? '資料格式有誤（422），請截圖給開發人員' : `操作失敗（${res.status}），請稍後再試`
    throw new Error(msg)
  }
  return data as T
}

// 只送醫師需要的欄位（跟分享連結頁的格式相同）
// [修正 2026/09/30] 後端對每個欄位有長度與型別檢查，不符合會整筆被擋（422 → 操作失敗）。
// 這裡先把資料整理成後端接受的格式：T/C 取到小數 3 位、問卷的是/否一律轉成 true/false
const clip = (v: any, n: number) => String(v ?? '').slice(0, n)
const num = (v: any) => (v != null && v !== '' && !isNaN(Number(v)) ? Number(v) : null)
function yesNo(v: any): boolean | null {
  if (v === true || v === false) return v
  if (v == null || v === '') return null
  const t = String(v).trim().toLowerCase()
  if (['yes', 'y', 'true', '1', '是', '有', '完整'].includes(t)) return true
  if (['no', 'n', 'false', '0', '否', '沒有', '無', '不完整'].includes(t)) return false
  return null
}
export function toSharePayload(r: any, includeSurvey: boolean) {
  const s = r?.preTestSurvey
  const tcNum = num(r?.tc)
  const days = num(s?.abstinenceDays)
  return {
    date: clip(r?.date, 20),
    time: clip(r?.time, 20),
    tc: tcNum != null ? String(Math.round(tcNum * 1000) / 1000) : clip(r?.tc, 10),
    status: clip(r?.status, 10),
    lot: clip(r?.lot, 40),
    cIntensity: num(r?.cIntensity),
    tIntensity: num(r?.tIntensity),
    survey: includeSurvey && s ? {
      abstinenceDays: days != null ? Math.min(365, Math.max(0, Math.round(days))) : null,
      sampleComplete: yesNo(s.sampleComplete),
      sampleVolume: s.sampleVolume != null ? clip(s.sampleVolume, 10) : null,
      usedLubricant: yesNo(s.usedLubricant),
      hadFever: yesNo(s.hadFever),
      newMedication: yesNo(s.newMedication),
      heavyDrinking: yesNo(s.heavyDrinking),
    } : null,
  }
}

export async function fetchClinics(): Promise<PartnerClinic[]> {
  const data = await request<{ clinics: PartnerClinic[] }>('/clinics')
  return data.clinics
}

export async function fetchMyAppointments(): Promise<Appointment[]> {
  const data = await request<{ appointments: Appointment[] }>('/appointments/mine')
  return data.appointments
}

export async function createAppointment(input: {
  clinicId: string
  name: string
  phone: string
  slots: string[]
  note: string
  shareReport: boolean
  includeSurvey: boolean
  record: any | null
}) {
  return request<{ appointmentId: string, reportShared: boolean }>('/appointments', {
    method: 'POST',
    body: JSON.stringify({
      clinicId: input.clinicId,
      name: input.name.trim(),
      phone: input.phone.trim(),
      slots: input.slots,
      note: input.note.trim() || null,
      agreeBooking: true,
      shareReport: input.shareReport && !!input.record,
      record: input.shareReport && input.record ? toSharePayload(input.record, input.includeSurvey) : null,
    }),
  })
}

export async function shareReportToAppointment(appointmentId: string, record: any, includeSurvey: boolean) {
  return request(`/appointments/${encodeURIComponent(appointmentId)}/reports`, {
    method: 'POST',
    body: JSON.stringify({ record: toSharePayload(record, includeSurvey) }),
  })
}

export async function cancelAppointment(appointmentId: string) {
  return request(`/appointments/${encodeURIComponent(appointmentId)}/cancel`, { method: 'POST' })
}

export async function revokeReport(shareId: string) {
  return request(`/share/${encodeURIComponent(shareId)}`, { method: 'DELETE' })
}

// 仍在進行中的預約（可以再分享報告）
export function isActiveAppointment(a: Appointment) {
  return a.status === 'new' || a.status === 'contacted' || a.status === 'booked'
}