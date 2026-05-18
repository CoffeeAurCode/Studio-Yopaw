import { useEffect, useState } from 'react'

export interface BreedEntry {
  breed: { en: string; fr: string }
  serviceIds: string[]
}

export function useBreedSchedule(startDate: string, endDate: string) {
  const [schedule, setSchedule] = useState<Record<string, BreedEntry[]>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    setSchedule({})
    fetch(`/api/breeds?startDate=${startDate}&endDate=${endDate}`)
      .then(r => r.json())
      .then((data: { schedule?: Record<string, BreedEntry[]> }) => {
        setSchedule(data.schedule ?? {})
      })
      .catch(() => setSchedule({}))
      .finally(() => setLoading(false))
  }, [startDate, endDate])

  return { schedule, loading }
}
