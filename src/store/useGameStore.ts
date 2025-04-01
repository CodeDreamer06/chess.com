import { create } from 'zustand'
import { Chess } from 'chess.js'

interface GameState {
  game: Chess
  fen: string
  history: string[]
  isCheck: boolean
  isCheckmate: boolean
  isDraw: boolean
  turn: 'w' | 'b'
  moveFrom: string | null
  possibleMoves: string[]
  setMoveFrom: (square: string | null) => void
  setPossibleMoves: (squares: string[]) => void
  makeMove: (from: string, to: string, promotion?: string) => boolean
  reset: () => void
}

export const useGameStore = create<GameState>((set, get) => ({
  game: new Chess(),
  fen: new Chess().fen(),
  history: [],
  isCheck: false,
  isCheckmate: false,
  isDraw: false,
  turn: 'w',
  moveFrom: null,
  possibleMoves: [],

  setMoveFrom: (square) => set({ moveFrom: square }),
  
  setPossibleMoves: (squares) => set({ possibleMoves: squares }),
  
  makeMove: (from, to, promotion) => {
    const { game } = get()
    try {
      const move = game.move({
        from,
        to,
        promotion,
      })

      if (move) {
        set({
          fen: game.fen(),
          history: game.history(),
          isCheck: game.isCheck(),
          isCheckmate: game.isCheckmate(),
          isDraw: game.isDraw(),
          turn: game.turn() as 'w' | 'b',
          moveFrom: null,
          possibleMoves: [],
        })
        return true
      }
    } catch (e) {
      console.error('Invalid move:', e)
    }
    return false
  },

  reset: () => {
    const game = new Chess()
    set({
      game,
      fen: game.fen(),
      history: [],
      isCheck: false,
      isCheckmate: false,
      isDraw: false,
      turn: 'w',
      moveFrom: null,
      possibleMoves: [],
    })
  },
})) 