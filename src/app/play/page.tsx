'use client'

import dynamic from 'next/dynamic'

// We need to use dynamic import for the ChessBoard component because it uses browser APIs
const ChessBoard = dynamic(() => import('@/components/chess/ChessBoard'), {
  ssr: false,
})

export default function PlayPage() {
  return (
    <div className="container mx-auto flex min-h-full flex-col items-center justify-center px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">Play Chess</h1>
      <div className="w-full max-w-2xl">
        <ChessBoard />
      </div>
    </div>
  )
} 