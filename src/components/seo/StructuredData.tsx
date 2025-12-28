'use client'

import { useEffect } from 'react'

interface StructuredDataProps {
  data: Record<string, any>
}

export default function StructuredData({ data }: StructuredDataProps) {
  useEffect(() => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(data)
    script.id = `structured-data-${Date.now()}`
    document.head.appendChild(script)

    return () => {
      const existingScript = document.getElementById(script.id)
      if (existingScript) {
        document.head.removeChild(existingScript)
      }
    }
  }, [data])

  return null
}





