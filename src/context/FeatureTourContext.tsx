import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { TargetRect } from '../hooks/useMeasureTargets'

export type TourStage = 'dashboard' | 'history' | 'calibration' | 'shop' | 'settings'

export const STAGE_ORDER: TourStage[] = ['dashboard', 'history', 'calibration', 'shop', 'settings']
export const STAGE_TAB_LABEL: Record<TourStage, string> = {
  dashboard: '首頁',
  history: '紀錄',
  calibration: '校準',
  shop: '商店',
  settings: '設定',
}


type FeatureTourContextValue = {
  stage: TourStage | null
  startTour: () => void
  skipAll: () => void
  completeTour: () => void
  registerSteps: (steps: TourStep[]) => void
  activeSteps: TourStep[]
  setStageDirectly: (next: TourStage) => void
}

const FeatureTourContext = createContext<FeatureTourContextValue>({
  stage: null,
  startTour: () => {},
  skipAll: () => {},
  completeTour: () => {},
  registerSteps: () => {},
  activeSteps: [],
  setStageDirectly: () => {},
})

export type TourStep = {
  key: string
  label: string
  rect: TargetRect
  cornerRadius?: number
  labelSide?: 'top' | 'bottom'
  passthrough?: boolean
  onPress?: () => void
  shape?: 'rect' | 'circle'
  minHeight?: number
}

export function useFeatureTour() {
  return useContext(FeatureTourContext)
}

export function FeatureTourProvider({ children }: { children: ReactNode }) {
  const [stage, setStage] = useState<TourStage | null>(null)
  const [activeSteps, setActiveSteps] = useState<TourStep[]>([])

  useEffect(() => {
    const user = auth.currentUser
    if (!user) return
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      const shown = snap.exists() && snap.data()?.featureTourShown
      if (!shown) setStage('dashboard')
    })
  }, [])

  function markTourShown() {
    const user = auth.currentUser
    if (user) {
      setDoc(doc(db, 'users', user.uid), { featureTourShown: true }, { merge: true })
    }
  }

  function startTour() {
    setStage('dashboard')
  }

  function skipAll() {
    markTourShown()
    setStage(null)
    setActiveSteps([])
  }

  function completeTour() {
    markTourShown()
    setStage(null)
    setActiveSteps([])
  }

  function registerSteps(steps: TourStep[]) {
    setActiveSteps(steps)
  }

  function setStageDirectly(next: TourStage) {
    setActiveSteps([])
    setStage(next)
  }

  return (
    <FeatureTourContext.Provider
      value={{ stage, startTour, skipAll, completeTour, registerSteps, activeSteps, setStageDirectly }}
    >
      {children}
    </FeatureTourContext.Provider>
  )
}