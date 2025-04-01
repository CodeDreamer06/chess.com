'use client'

import { useDrag } from "react-dnd"
import { Square as ChessSquare, Piece as ChessPiece } from "chess.js"
import { DragSourceMonitor } from "react-dnd"

interface PieceProps {
  piece: ChessPiece
  square: ChessSquare
}

interface DragItem {
  type: string
  square: ChessSquare
}

export default function Piece({ piece, square }: PieceProps) {
  const [{ isDragging }, dragRef] = useDrag<DragItem, void, { isDragging: boolean }>(() => ({
    type: "piece",
    item: { type: "piece", square },
    collect: (monitor: DragSourceMonitor<DragItem>) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [square])

  const pieceClass = `
    absolute inset-0
    flex items-center justify-center
    text-4xl cursor-move
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