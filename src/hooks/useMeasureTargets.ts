import { useRef, useCallback } from 'react'
import { View } from 'react-native'

export type TargetRect = { x: number, y: number, width: number, height: number }

export function useMeasureTargets(keys: string[]) {
  const refs = useRef<Record<string, View | null>>({})

  const setRef = useCallback((key: string) => (node: View | null) => {
    refs.current[key] = node
  }, [])

  const measureAll = useCallback((): Promise<Record<string, TargetRect | null>> => {
    return new Promise((resolve) => {
      const result: Record<string, TargetRect | null> = {}
      let remaining = keys.length
      if (remaining === 0) {
        resolve(result)
        return
      }
      keys.forEach((key) => {
        const node = refs.current[key]
        if (!node) {
          result[key] = null
          remaining -= 1
          if (remaining === 0) resolve(result)
          return
        }
        node.measureInWindow((x, y, width, height) => {
          result[key] = { x, y, width, height }
          remaining -= 1
          if (remaining === 0) resolve(result)
        })
      })
    })
  }, [keys])

  return { setRef, measureAll }
}