# FertiScan App

生殖功能試紙光學定量 App，讓使用者拍攝試紙照片、透過後端 API 分析 T/C 比值，並提供健康趨勢追蹤、與診所分享報告等功能。

## 技術棧

- **框架**：Expo（React Native）+ TypeScript
- **導航**：React Navigation（Bottom Tabs + Native Stack），依 Firebase 登入狀態做條件式整組畫面切換
- **帳號系統**：Firebase Authentication（Email/Password）
- **資料庫**：Firestore（幾乎所有使用者資料）+ AsyncStorage（僅剩裝置層級狀態）
- **後端 API**：[fertiscan-api](後端 repo 連結) — 負責試紙照片分析

## 專案結構

```
App.tsx                  # 進入點
src/
  navigation.tsx           # 導航邏輯，依 Firebase 登入狀態切換畫面組
  firebase.ts               # Firebase 初始化（Auth + Firestore）
  storage.ts                 # 檢測紀錄的 Firestore 存取邏輯
  inventory.ts                 # 試紙數量／批號／上次檢測時間的 Firestore 存取邏輯
  plan.ts                       # 訂閱方案狀態的 Firestore 存取邏輯
  clinics.ts                     # 診所連結／分享歷程的 Firestore 存取邏輯
  theme.ts                        # 顏色/字體等共用樣式
  screens/                         # 所有畫面元件
  components/                       # 共用元件（Button、PickerModal、DatePickerModal）
  utils/                             # 工具函式
```

## 資料架構現況

**這是這個專案最重要的部分，接手前務必先看懂。**

### Firestore 結構（`users/{uid}` 文件 + 子集合）

```
users/{uid}                          # 單一文件，存所有「一份就好」的欄位
  ├─ name, birthYear/Month/Day        # 個人資料
  ├─ height, weight, smoke, ...        # 健康背景
  ├─ varicocele, occupationType, ...    # 生殖健康背景
  ├─ userPlan, userPlanType              # 訂閱方案狀態
  ├─ strips, lotNumber, lastTestDate      # 試紙庫存/批號/上次檢測時間

users/{uid}/records/{recordId}         # 子集合，每次檢測一筆文件
users/{uid}/clinics/{clinicId}          # 子集合，每個已連結診所一筆文件
users/{uid}/sharedHistory/{entryId}      # 子集合，每次分享一筆文件
```

**設計原則**：單一數值型欄位（姓名、方案狀態等）直接放在 `users/{uid}` 文件裡；「多筆、會持續新增」的資料（檢測紀錄、診所、分享歷程）用子集合，不是塞進單一陣列欄位——這是 Firestore 處理一對多資料的標準做法，避免陣列大小限制跟多裝置寫入衝突。

### 還留在 AsyncStorage 的欄位（刻意保留，不是漏改）

| 欄位 | 保留原因 |
|---|---|
| `onboardingShown` | 裝置層級狀態（這支手機看過新手教學了嗎），跟帳號無關，換帳號不該重置 |
| `reminderWeeks` | 通知排程設定，性質上偏裝置端設定，非核心健康/帳號資料，尚未評估是否要遷移 |

### Firestore 安全規則

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /records/{recordId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /clinics/{clinicId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /sharedHistory/{entryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

只有本人能讀寫自己 UID 底下的資料，包含所有子集合。**新增子集合時記得同步更新這份規則，不然會被 Firestore 擋掉讀寫。**

## Firebase 專案

- 專案 ID：`fertiscan-7039b`
- 已啟用：Authentication（Email/Password）、Firestore
- 如需存取權限，請 repo owner 到 Firebase Console → 專案設定 → 使用者和權限 → 新增協作者（**不要共用帳號密碼**，Console 權限跟前端 `apiKey` 是兩回事，`apiKey` 本身可以公開，不是存取控制的關鍵）

## 已知限制與待辦（給接手的工程師）

### 🔴 目前是「假的」、需要優先處理

- [ ] **濃度換算數字是寫死公式**（`ReportOverviewScreen.tsx`、`ReportLinkScreen.tsx` 裡的 `22 * tcVal / 0.68`），不是真實校準結果，需要接上真正的批號校準曲線
- [ ] **付費訂閱沒有真實金流**，`PaymentScreen.tsx` 按下確認只是把 `userPlan` 寫進 Firestore，沒有 Apple/Google IAP 驗證，理論上可被技術使用者繞過（雖然比之前寫在本機 AsyncStorage 稍微難改一點，但沒有後端驗證收據，本質問題還在）
- [ ] **每月檢測次數限制沒有後端強制執行**，計數只是前端統計 `records` 筆數，`/analyze` API 沒有身份驗證或次數控管
- [ ] **「連結診所」功能是純前端模擬**，資料雖然已經搬到 Firestore、有正確的帳號隔離，但**診所端完全不存在**——沒有診所帳號系統，資料不會真的傳送給任何醫師

### 🟠 核心架構缺口

- [ ] `CalibrationScreen.tsx` 顯示的批號校準曲線資料來源需要確認（是否為真實資料庫或展示用假資料）——這支還沒有被這次的 Firestore 遷移涵蓋到
- [ ] 耗材購買（`ShopScreen.tsx`、`OrderConfirmScreen.tsx`）目前沒有接金流、訂單系統、物流——注意實體商品**不能走 Apple/Google IAP**，需要串接第三方支付（如綠界/TapPay）
- [ ] `getSharedHistory()` 目前查詢上限寫死 50 筆，分享歷程超過這個數量時，「是否已分享過」的判斷會失準，需要之後優化查詢方式（例如改用 where 條件查詢而非撈全部再篩選）

### 🟡 已知程式碼問題

- [ ] `RegisterScreen.tsx` 存在「按一次觸發兩次」的問題，目前用 `submitting` 狀態防重複提交擋住症狀，根因未查明
- [ ] `CamCaptureScreen.tsx` 裡有除錯用的 `Alert.alert('三張結果', ...)` 彈窗，正式上線前需要移除

### 已修復的重要問題（供參考，避免重蹈覆轍）

- 登出/註冊清空個人資料 → 已改為 Firestore + UID 隔離
- 手動 `navigation.navigate()` 跟自動畫面切換（依登入狀態 conditional render）互相打架，導致畫面卡住 → 已排查移除多處殘留呼叫
- Firebase Auth 在 React Native 環境需要額外設定 persistence（`getReactNativePersistence`），否則 App 重啟會登出
- `emailVerified` 更新後畫面不會自動跳轉 → 需用 `updateCurrentUser(null)` 再 `updateCurrentUser(user)` 強制觸發 `onAuthStateChanged`
- **AsyncStorage 資料不跟著 Firebase 帳號走**（換帳號/換手機資料不同步、不隔離）→ 已大範圍遷移個人資料、方案狀態、檢測紀錄、試紙庫存、診所連結到 Firestore，用 UID 隔離

## 本地開發

```bash
npm install
npx expo start --tunnel
```

## 建置與部署

目前透過 Expo Go 開發測試，尚未產生正式的 development build 或上架版本。如需要 Deep Link（例如信箱驗證後自動跳轉回 App）等原生功能，需要先建立 development build（`eas build --profile development`），Expo Go 不支援自訂 URL Scheme。
