'use client'

import { useDrag } from 'react-dnd'
import { useGameStore } from '@/store/useGameStore'
import { Square as ChessSquare, Move } from 'chess.js'

interface PieceProps {
  type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k'
  color: 'w' | 'b'
  square: ChessSquare
}

interface DragItem {
  type: string
  square: ChessSquare
}

const pieceSymbols = {
  w: {
    k: '♔',
    q: '♕',
    r: '♖',
    b: '♗',
    n: '♘',
    p: '♙',
  },
  b: {
    k: '♚',
    q: '♛',
    r: '♜',
    b: '♝',
    n: '♞',
    p: '♟',
  },
} as const

export default function Piece({ type, color, square }: PieceProps) {
  const { game, setMoveFrom, setPossibleMoves } = useGameStore()

  const [{ isDragging }, drag] = useDrag<DragItem, void, { isDragging: boolean }>(() => ({
    type: 'piece',
    item: { type: 'piece', square },
    canDrag: () => game.turn() === color,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [square, color, game.turn()])

  const handleMouseDown = () => {
    if (game.turn() === color) {
      setMoveFrom(square)
      const moves = game.moves({ square, verbose: true }) as Move[]
      setPossibleMoves(moves.map(move => move.to))
    }
  }

  return (
    <div
      ref={drag}
      className={`cursor-grab select-none text-4xl ${
        color === 'w' ? 'text-white' : 'text-black'
      } ${isDragging ? 'opacity-50' : ''}`}
      onMouseDown={handleMouseDown}
    >
      {pieceSymbols[color][type]}
    </div>
  )
} 