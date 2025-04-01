'use client'

import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { useGameStore } from '@/store/useGameStore'
import Square from '@/components/chess/Square'
import { Square as ChessSquare, Piece } from 'chess.js'
import { Socket } from 'socket.io-client'

interface ChessBoardProps {
  socket: Socket | null;
  roomId: string;
  playerColor: 'w' | 'b' | null;
}

export default function ChessBoard({ socket, roomId, playerColor }: ChessBoardProps) {
  const { 
    game, 
    selectedSquare, 
    setSelectedSquare, 
    validMoves, 
    setValidMoves, 
    makeMove,
    isCheck,
    isCheckmate,
    isDraw,
    turn 
  } = useGameStore()

  const handleSquareClick = (square: ChessSquare) => {
    if (!playerColor || turn !== playerColor || isCheckmate || isDraw || !socket || !roomId) return
    
    const piece = game.get(square)

    if (!selectedSquare) {
      if (piece && piece.color === turn) { 
        setSelectedSquare(square)
        const moves = game.moves({ square, verbose: true })
        setValidMoves(moves.map(move => move.to))
      }
    } else {
      if (square === selectedSquare) {
        setSelectedSquare(null)
        setValidMoves([])
        return
      }
      
      if (validMoves.includes(square)) {
        makeMove(selectedSquare, square)
        const moveData = { from: selectedSquare, to: square, fen: game.fen() }
        console.log("Emitting move:", moveData);
        socket.emit('make_move', { roomId, moveData });
        setSelectedSquare(null)
        setValidMoves([])
      } 
      else if (piece && piece.color === turn) {
        setSelectedSquare(square)
        const moves = game.moves({ square, verbose: true })
        setValidMoves(moves.map(move => move.to))
      } 
      else {
        setSelectedSquare(null)
        setValidMoves([])
      }
    }
  }

  const handleDrop = (fromSquare: ChessSquare, toSquare: ChessSquare) => {
    if (!playerColor || turn !== playerColor || isCheckmate || isDraw || !socket || !roomId) return
    
    const piece = game.get(fromSquare);
    if (!piece || piece.color !== turn) return;
    
    const possibleMoves = game.moves({ square: fromSquare, verbose: true });
    if (possibleMoves.some(move => move.to === toSquare)) {
      makeMove(fromSquare, toSquare)
      const moveData = { from: fromSquare, to: toSquare, fen: game.fen() }
      console.log("Emitting move (drop):", moveData);
      socket.emit('make_move', { roomId, moveData });
      setSelectedSquare(null)
      setValidMoves([])
    } else {
      console.log("Invalid drop target");
    }
  }

  const board = Array(8).fill(null).map((_, i) => 
    Array(8).fill(null).map((_, j) => {
      const square = `${String.fromCharCode(97 + j)}${8 - i}` as ChessSquare
      const piece = game.get(square)
      return piece || null
    })
  )

  let kingInCheckSquare: ChessSquare | null = null
  if (isCheck) {
    const kingPiece: Piece = { type: 'k', color: turn }
    board.flat().forEach((piece, index) => {
      if (piece && piece.type === kingPiece.type && piece.color === kingPiece.color) {
        const rank = 8 - Math.floor(index / 8)
        const file = String.fromCharCode(97 + (index % 8))
        kingInCheckSquare = `${file}${rank}` as ChessSquare
      }
    })
  }

  return (
    <div className="flex flex-col items-center">
      <div className="h-8 mb-2 text-xl font-semibold text-center">
        {isCheckmate && (
          <span className="text-red-600">Checkmate! {turn === 'w' ? 'Black' : 'White'} wins.</span>
        )}
        {isDraw && (
          <span className="text-gray-600">Draw!</span>
        )}
        {!isCheckmate && !isDraw && isCheck && (
          <span className="text-orange-600">Check!</span>
        )}
        {!isCheckmate && !isDraw && (
          <span className="ml-4 text-blue-700">{turn === 'w' ? 'White' : 'Black'} to move</span>
        )}
      </div>
      <DndProvider backend={HTML5Backend}>
        <div className="grid grid-cols-8 w-[640px] h-[640px] border-2 border-gray-800">
          {board.map((row, i) =>
            row.map((piece, j) => {
              const isLight = (i + j) % 2 === 0
              const square = `${String.fromCharCode(97 + j)}${8 - i}` as ChessSquare
              const isKingInCheck = square === kingInCheckSquare
              return (
                <Square 
                  key={`${i}-${j}`}
                  square={square}
                  piece={piece}
                  color={isLight ? "light" : "dark"}
                  selected={square === selectedSquare}
                  validMove={validMoves.includes(square)}
                  isInCheck={isKingInCheck}
                  onClick={() => handleSquareClick(square)}
                  onDrop={(fromSquare) => handleDrop(fromSquare, square)}
                />
              )
            })
          )}
        </div>
      </DndProvider>
    </div>
  )
} 