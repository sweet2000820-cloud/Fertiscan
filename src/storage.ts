import AsyncStorage from '@react-native-async-storage/async-storage'

export type TestRecord = {
  date: string
  time: string
  tc: string
  status: string
  lot: string
}

export async function saveRecord(record: TestRecord) {
  const existing = await getRecords()
  const updated = [record, ...existing].slice(0, 20)
  await AsyncStorage.setItem('testRecords', JSON.stringify(updated))
}

export async function getRecords(): Promise<TestRecord[]> {
  const raw = await AsyncStorage.getItem('testRecords')
  return raw ? JSON.parse(raw) : []
}