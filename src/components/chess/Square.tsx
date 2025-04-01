'use client'

import { useDrop } from 'react-dnd'
import { useGameStore } from '@/store/useGameStore'
import { Square as ChessSquare } from 'chess.js'

interface SquareProps {
  square: ChessSquare
  color: 'light' | 'dark'
  selected: boolean
  validMove: boolean
  children?: React.ReactNode
  onClick: () => void
}

interface DragItem {
  type: string
  square: ChessSquare
}

export default function Square({ square, color, selected, validMove, children, onClick }: SquareProps) {
  const { makeMove } = useGameStore()

  const [{ isOver }, drop] = useDrop<DragItem, void, { isOver: boolean }>(() => ({
    accept: 'piece',
    drop: (item) => {
      makeMove(item.square, square)
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }), [square, makeMove])

  return (
    <div
      ref={drop}
      className={`relative flex h-full w-full items-center justify-center ${
        color === 'light'
          ? 'bg-amber-50 dark:bg-amber-900'
          : 'bg-amber-600 dark:bg-amber-800'
      } ${selected ? 'ring-2 ring-blue-500 ring-inset' : ''} ${
        validMove
          ? 'after:absolute after:h-3 after:w-3 after:rounded-full after:bg-blue-500/50'
          : ''
      } ${isOver ? 'bg-blue-200 dark:bg-blue-900' : ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
} 