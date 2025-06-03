import { defineStore } from 'pinia'

// Piece values for evaluation
const PIECE_VALUES = {
  'p': -100, 'r': -500, 'n': -320, 'b': -330, 'q': -900, 'k': -20000,
  'P': 100,  'R': 500,  'N': 320,  'B': 330,  'Q': 900,  'K': 20000
}

// Positional bonus tables (from white's perspective)
const PAWN_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
  5,  5, 10, 25, 25, 10,  5,  5,
  0,  0,  0, 20, 20,  0,  0,  0,
  5, -5,-10,  0,  0,-10, -5,  5,
  5, 10, 10,-20,-20, 10, 10,  5,
  0,  0,  0,  0,  0,  0,  0,  0
]

const KNIGHT_TABLE = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50
]

const BISHOP_TABLE = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20
]

const ROOK_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  5, 10, 10, 10, 10, 10, 10,  5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  0,  0,  0,  5,  5,  0,  0,  0
]

const QUEEN_TABLE = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
  -5,  0,  5,  5,  5,  5,  0, -5,
  0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20
]

const KING_MIDDLE_GAME_TABLE = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
  20, 20,  0,  0,  0,  0, 20, 20,
  20, 30, 10,  0,  0, 10, 30, 20
]

export const useChessEngineStore = defineStore('chessEngine', {
  state: () => ({
    difficulty: 'medium',
    isThinking: false,
    gameMode: 'human', // 'human', 'computer'
    aiColor: 'black',
    searchDepth: 4
  }),

  getters: {
    shouldAIMakeMove: (state) => (currentPlayer) => {
      return state.gameMode === 'computer' && state.aiColor === currentPlayer
    }
  },

  actions: {
    setDifficulty(level) {
      this.difficulty = level
      switch (level) {
        case 'easy':
          this.searchDepth = 3
          break
        case 'medium':
          this.searchDepth = 4
          break
        case 'hard':
          this.searchDepth = 5
          break
        case 'expert':
          this.searchDepth = 6
          break
      }
    },

    setGameMode(mode) {
      this.gameMode = mode
    },

    setAIColor(color) {
      this.aiColor = color
    },

    // Main evaluation function
    evaluatePosition(board) {
      let score = 0
      
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = board[row][col]
          if (piece) {
            score += this.evaluatePiece(piece, row, col)
          }
        }
      }
      
      return score
    },

    evaluatePiece(piece, row, col) {
      const pieceValue = PIECE_VALUES[piece]
      const isWhite = piece === piece.toUpperCase()
      const adjustedRow = isWhite ? row : 7 - row
      const index = adjustedRow * 8 + col
      
      let positionalBonus = 0
      
      switch (piece.toLowerCase()) {
        case 'p':
          positionalBonus = PAWN_TABLE[index]
          break
        case 'n':
          positionalBonus = KNIGHT_TABLE[index]
          break
        case 'b':
          positionalBonus = BISHOP_TABLE[index]
          break
        case 'r':
          positionalBonus = ROOK_TABLE[index]
          break
        case 'q':
          positionalBonus = QUEEN_TABLE[index]
          break
        case 'k':
          positionalBonus = KING_MIDDLE_GAME_TABLE[index]
          break
      }
      
      return pieceValue + (isWhite ? positionalBonus : -positionalBonus)
    },

    // Get all possible moves for a player
    getAllPossibleMoves(board, isWhitePlayer, chessStore) {
      const moves = []
      
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = board[row][col]
          if (piece && this.isWhitePiece(piece) === isWhitePlayer) {
            const pieceMoves = this.getPossibleMovesForPiece(board, row, col, chessStore)
            pieceMoves.forEach(move => {
              moves.push({
                from: { row, col },
                to: { row: move.row, col: move.col }
              })
            })
          }
        }
      }
      
      return moves
    },

    getPossibleMovesForPiece(board, row, col, chessStore) {
      // Temporarily set the board and calculate moves
      const originalBoard = chessStore.board
      chessStore.board = board
      chessStore.calculateValidMoves(row, col)
      const moves = [...chessStore.validMoves]
      chessStore.board = originalBoard
      
      return moves
    },

    isWhitePiece(piece) {
      return piece === piece.toUpperCase()
    },

    // Make a move on a board copy
    makeMove(board, move) {
      const newBoard = board.map(row => [...row])
      const piece = newBoard[move.from.row][move.from.col]
      newBoard[move.to.row][move.to.col] = piece
      newBoard[move.from.row][move.from.col] = null
      return newBoard
    },

    // Minimax algorithm with Alpha-Beta pruning
    minimax(board, depth, alpha, beta, maximizingPlayer, chessStore) {
      if (depth === 0) {
        return this.evaluatePosition(board)
      }

      const moves = this.getAllPossibleMoves(board, maximizingPlayer, chessStore)
      
      if (moves.length === 0) {
        // No moves available - check if it's checkmate or stalemate
        return maximizingPlayer ? -20000 : 20000
      }

      if (maximizingPlayer) {
        let maxEval = -Infinity
        for (const move of moves) {
          const newBoard = this.makeMove(board, move)
          const eval_ = this.minimax(newBoard, depth - 1, alpha, beta, false, chessStore)
          maxEval = Math.max(maxEval, eval_)
          alpha = Math.max(alpha, eval_)
          if (beta <= alpha) {
            break // Alpha-Beta pruning
          }
        }
        return maxEval
      } else {
        let minEval = Infinity
        for (const move of moves) {
          const newBoard = this.makeMove(board, move)
          const eval_ = this.minimax(newBoard, depth - 1, alpha, beta, true, chessStore)
          minEval = Math.min(minEval, eval_)
          beta = Math.min(beta, eval_)
          if (beta <= alpha) {
            break // Alpha-Beta pruning
          }
        }
        return minEval
      }
    },

    // Get the best move for the AI
    async getBestMove(board, chessStore) {
      this.isThinking = true
      
      return new Promise((resolve) => {
        // Use setTimeout to avoid blocking the UI
        setTimeout(() => {
          const isMaximizing = this.aiColor === 'white'
          const moves = this.getAllPossibleMoves(board, isMaximizing, chessStore)
          
          if (moves.length === 0) {
            this.isThinking = false
            resolve(null)
            return
          }

          let bestMove = moves[0]
          let bestValue = isMaximizing ? -Infinity : Infinity

          for (const move of moves) {
            const newBoard = this.makeMove(board, move)
            const value = this.minimax(
              newBoard, 
              this.searchDepth - 1, 
              -Infinity, 
              Infinity, 
              !isMaximizing, 
              chessStore
            )

            if (isMaximizing) {
              if (value > bestValue) {
                bestValue = value
                bestMove = move
              }
            } else {
              if (value < bestValue) {
                bestValue = value
                bestMove = move
              }
            }
          }

          this.isThinking = false
          resolve(bestMove)
        }, 100) // Small delay to allow UI to update
      })
    }
  }
})