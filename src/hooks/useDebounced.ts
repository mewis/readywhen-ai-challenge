'use client'

import { useEffect, useState } from 'react'

export function useDebounced(value: string, delay = 250): string {
  const [settled, setSettled] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return settled
}
