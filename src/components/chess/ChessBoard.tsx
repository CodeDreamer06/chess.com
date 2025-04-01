'use client'

import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { useGameStore } from '@/store/useGameStore'
import Square from '@/components/chess/Square'
import { Square as ChessSquare } from 'chess.js'

export default function ChessBoard() {
  const { game, selectedSquare, setSelectedSquare, validMoves, setValidMoves, makeMove } = useGameStore()

  const handleSquareClick = (square: ChessSquare) => {
    const piece = game.get(square)

    if (!selectedSquare) {
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square)
        const moves = game.moves({ square, verbose: true })
        setValidMoves(moves.map(move => move.to))
      }
    } else {
      if (validMoves.includes(square)) {
        makeMove(selectedSquare, square)
        setSelectedSquare(null)
        setValidMoves([])
      } else if (piece && piece.color === game.turn()) {
        setSelectedSquare(square)
        const moves = game.moves({ square, verbose: true })
        setValidMoves(moves.map(move => move.to))
      } else {
        setSelectedSquare(null)
        setValidMoves([])
      }
    }
  }

  const handleDrop = (fromSquare: ChessSquare, toSquare: ChessSquare) => {
    makeMove(fromSquare, toSquare)
    setSelectedSquare(null)
    setValidMoves([])
  }

  const board = Array(8).fill(null).map((_, i) => 
    Array(8).fill(null).map((_, j) => {
      const square = `${String.fromCharCode(97 + j)}${8 - i}` as ChessSquare
      const piece = game.get(square)
      return piece || null
    })
  )

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="grid grid-cols-8 w-[640px] h-[640px] border-2 border-gray-800">
        {board.map((row, i) =>
          row.map((piece, j) => {
            const isLight = (i + j) % 2 === 0
            const square = `${String.fromCharCode(97 + j)}${8 - i}` as ChessSquare
            return (
              <Square 
                key={`${i}-${j}`}
                square={square}
                piece={piece}
                color={isLight ? "light" : "dark"}
                selected={square === selectedSquare}
                validMove={validMoves.includes(square)}
                onClick={() => handleSquareClick(square)}
                onDrop={(fromSquare) => handleDrop(fromSquare, square)}
              />
            )
          })
        )}
      </div>
    </DndProvider>
  )
} 