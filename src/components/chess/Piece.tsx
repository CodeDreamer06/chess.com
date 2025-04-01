'use client'

import { useDrag } from "react-dnd"
import { Square as ChessSquare, Piece as ChessPiece } from "chess.js"
import { DragSourceMonitor } from "react-dnd"
import { useGameStore } from "@/store/useGameStore"

interface PieceProps {
  piece: ChessPiece
  square: ChessSquare
}

interface DragItem {
  type: string
  square: ChessSquare
}

export default function Piece({ piece, square }: PieceProps) {
  const { turn } = useGameStore()

  const [{ isDragging }, dragRef] = useDrag<DragItem, void, { isDragging: boolean }>(() => ({
    type: "piece",
    item: { type: "piece", square },
    canDrag: () => piece.color === turn,
    collect: (monitor: DragSourceMonitor<DragItem>) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [square, piece.color, turn])

  const pieceClass = `
    absolute inset-0
    flex items-center justify-center
    text-4xl 
    ${piece.color === turn ? 'cursor-move' : 'cursor-default'}
    ${piece.color === "w" ? "text-white" : "text-black"}
    ${isDragging ? "opacity-50" : ""}
  `

  const getPieceSymbol = (piece: ChessPiece) => {
    const symbols: Record<string, string> = {
      p: "♟",
      n: "♞",
      b: "♝",
      r: "♜",
      q: "♛",
      k: "♚",
    }
    return symbols[piece.type]
  }

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <div ref={dragRef as any} className={pieceClass}>
      {getPieceSymbol(piece)}
    </div>
  )
} 