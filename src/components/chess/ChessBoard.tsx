'use client'

import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { useGameStore } from '@/store/useGameStore'
import Square from './Square'
import Piece from './Piece'
import { Move, Square as ChessSquare } from 'chess.js'

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const ranks = ['8', '7', '6', '5', '4', '3', '2', '1']

export default function ChessBoard() {
  const { game, fen, moveFrom, possibleMoves, setMoveFrom, setPossibleMoves, makeMove } = useGameStore()

  const calculateSquareColor = (file: string, rank: string) => {
    const fileIndex = files.indexOf(file)
    const rankIndex = ranks.indexOf(rank)
    return (fileIndex + rankIndex) % 2 === 0 ? 'light' : 'dark'
  }

  const handleSquareClick = (square: ChessSquare) => {
    const piece = game.get(square)

    if (moveFrom === null) {
      if (piece) {
        setMoveFrom(square)
        const moves = game.moves({ square, verbose: true }) as Move[]
        setPossibleMoves(moves.map(move => move.to))
      }
    } else {
      if (possibleMoves.includes(square)) {
        makeMove(moveFrom, square)
      } else if (square === moveFrom) {
        setMoveFrom(null)
        setPossibleMoves([])
      } else if (piece && piece.color === game.turn()) {
        setMoveFrom(square)
        const moves = game.moves({ square, verbose: true }) as Move[]
        setPossibleMoves(moves.map(move => move.to))
      } else {
        setMoveFrom(null)
        setPossibleMoves([])
      }
    }
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="aspect-square w-full max-w-2xl border border-gray-200 dark:border-gray-700">
        <div className="grid h-full w-full grid-cols-8 grid-rows-8">
          {ranks.map((rank) =>
            files.map((file) => {
              const square = `${file}${rank}` as ChessSquare
              const piece = game.get(square)
              const squareColor = calculateSquareColor(file, rank)
              const isSelected = square === moveFrom
              const isValidMove = possibleMoves.includes(square)

              return (
                <Square
                  key={square}
                  square={square}
                  color={squareColor}
                  selected={isSelected}
                  validMove={isValidMove}
                  onClick={() => handleSquareClick(square)}
                >
                  {piece && (
                    <Piece
                      type={piece.type}
                      color={piece.color}
                      square={square}
                    />
                  )}
                </Square>
              )
            })
          )}
        </div>
      </div>
    </DndProvider>
  )
} 