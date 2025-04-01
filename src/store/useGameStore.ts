import { create } from 'zustand'
import { Chess, Square } from 'chess.js'

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
  selectedSquare: Square | null
  validMoves: Square[]
  setMoveFrom: (square: string | null) => void
  setPossibleMoves: (squares: string[]) => void
  setSelectedSquare: (square: Square | null) => void
  setValidMoves: (moves: Square[]) => void
  makeMove: (from: Square, to: Square) => void
  applyOpponentMove: (fen: string) => void
  reset: () => void
}

export const useGameStore = create<GameState>((set, _get) => {
  // Dummy log to mark _get as used
  if (process.env.NODE_ENV === 'development') {
    console.log('Zustand get state function:', _get);
  }
  return {
    game: new Chess(),
    fen: new Chess().fen(),
    history: [],
    isCheck: false,
    isCheckmate: false,
    isDraw: false,
    turn: 'w',
    moveFrom: null,
    possibleMoves: [],
    selectedSquare: null,
    validMoves: [],

    setMoveFrom: (square) => set({ moveFrom: square }),
    
    setPossibleMoves: (squares) => set({ possibleMoves: squares }),
    
    setSelectedSquare: (square) => set({ selectedSquare: square }),
    
    setValidMoves: (moves) => set({ validMoves: moves }),
    
    makeMove: (from, to) => set((state) => {
      try {
        const moveResult = state.game.move({ from, to })
        if (!moveResult) throw new Error("Invalid move object from chess.js");
        
        return {
          game: state.game,
          fen: state.game.fen(),
          history: state.game.history(),
          isCheck: state.game.isCheck(),
          isCheckmate: state.game.isCheckmate(),
          isDraw: state.game.isDraw(),
          turn: state.game.turn() as 'w' | 'b',
          selectedSquare: null,
          validMoves: [],
        }
      } catch (e) {
        console.error('Invalid move attempted:', { from, to, error: e })
        return state
      }
    }),

    applyOpponentMove: (fen) => set((state) => {
      try {
        state.game.load(fen);
        return {
          game: state.game,
          fen: state.game.fen(),
          history: state.game.history(),
          isCheck: state.game.isCheck(),
          isCheckmate: state.game.isCheckmate(),
          isDraw: state.game.isDraw(),
          turn: state.game.turn() as 'w' | 'b',
          selectedSquare: null,
          validMoves: [],
        }
      } catch (e) {
        console.error('Error loading FEN from opponent move:', { fen, error: e })
        return state
      }
    }),

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
        selectedSquare: null,
        validMoves: [],
      })
    },
  }
}) 