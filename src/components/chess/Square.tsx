'use client'

import { useDrop } from "react-dnd"
import { Square as ChessSquare, Piece as ChessPiece } from "chess.js"
import Piece from "./Piece"
import { DropTargetMonitor } from "react-dnd"

interface SquareProps {
  square: ChessSquare
  piece: ChessPiece | null
  color: "light" | "dark"
  selected: boolean
  validMove: boolean
  isInCheck: boolean
  onClick: () => void
  onDrop: (fromSquare: ChessSquare) => void
}

interface DragItem {
  type: string
  square: ChessSquare
}

export default function Square({ square, piece, color, selected, validMove, isInCheck, onClick, onDrop }: SquareProps) {
  const [{ isOver }, dropRef] = useDrop<DragItem, void, { isOver: boolean }>(() => ({
    accept: "piece",
    drop: (item: DragItem) => {
      onDrop(item.square)
    },
    collect: (monitor: DropTargetMonitor<DragItem>) => ({
      isOver: !!monitor.isOver(),
    }),
  }), [square, onDrop])

  const squareClass = `
    w-full h-full relative
    ${color === "light" ? "bg-amber-100" : "bg-amber-800"}
    ${selected ? "ring-2 ring-blue-500" : ""}
    ${validMove ? "ring-2 ring-green-500" : ""}
    ${isInCheck ? "bg-red-400" : ""}
    ${isOver ? "ring-2 ring-yellow-500" : ""}
  `

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <div ref={dropRef as any} className={squareClass} onClick={onClick}>
      {piece && <Piece piece={piece} square={square} />}
    </div>
  )
}