'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

interface BackButtonProps {
  label?: string
  href?: string
}

export default function BackButton({ label = 'Back', href }: BackButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (href) {
      router.push(href)
    } else {
      router.back()
    }
  }

  return (
    <motion.button
      onClick={handleClick}
      whileHover={{ x: -2 }}
      whileTap={{ scale: 0.98 }}
      className="group flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
    >
      <svg
        className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 19l-7-7 7-7"
        />
      </svg>
      <span className="font-medium">{label}</span>
    </motion.button>
  )
}


