'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

interface SearchParamsWrapperProps {
  onParamsChange: (fromId: string | null) => void
}

export default function SearchParamsWrapper({ onParamsChange }: SearchParamsWrapperProps) {
  const searchParams = useSearchParams()

  useEffect(() => {
    const fromId = searchParams.get('from_id')
    onParamsChange(fromId)
  }, [searchParams, onParamsChange])

  return null
}