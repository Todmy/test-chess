import { defineStore } from 'pinia'
import { useMultiplayerStore } from './multiplayer.js'
import { useChessEngineStore } from './chessEngine.js'

const INITIAL_BOARD = [
  ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
  ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
  ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
]

export const useChessStore = defineStore('chess', {
  state: () => ({
    board: JSON.parse(JSON.stringify(INITIAL_BOARD)),
    currentPlayer: 'white',
    selectedSquare: null,
    validMoves: [],
    gameStatus: 'playing',
    moveHistory: []
  }),

  getters: {
    isWhitePiece: () => (piece) => piece && piece === piece.toUpperCase(),
    isBlackPiece: () => (piece) => piece && piece === piece.toLowerCase(),
    
    getPieceAt: (state) => (row, col) => {
      return state.board[row]?.[col] || null
    },

    isSquareSelected: (state) => (row, col) => {
      return state.selectedSquare?.row === row && state.selectedSquare?.col === col
    },

    isValidMove: (state) => (row, col) => {
      return state.validMoves.some(move => move.row === row && move.col === col)
    }
  },

  actions: {
    selectSquare(row, col) {
      const multiplayerStore = useMultiplayerStore()
      
      if (multiplayerStore.isConnected && !multiplayerStore.canMakeMove(this.currentPlayer)) {
        return
      }
      
      const piece = this.getPieceAt(row, col)
      
      if (this.selectedSquare) {
        if (this.isValidMove(row, col)) {
          this.movePiece(this.selectedSquare.row, this.selectedSquare.col, row, col)
        } else if (piece && this.isPieceOwnedByCurrentPlayer(piece)) {
          this.selectedSquare = { row, col }
          this.calculateValidMoves(row, col)
        } else {
          this.clearSelection()
        }
      } else if (piece && this.isPieceOwnedByCurrentPlayer(piece)) {
        this.selectedSquare = { row, col }
        this.calculateValidMoves(row, col)
      }
    },

    movePiece(fromRow, fromCol, toRow, toCol, isRemoteMove = false) {
      const piece = this.board[fromRow][fromCol]
      const capturedPiece = this.board[toRow][toCol]
      
      this.board[toRow][toCol] = piece
      this.board[fromRow][fromCol] = null
      
      this.moveHistory.push({
        from: { row: fromRow, col: fromCol },
        to: { row: toRow, col: toCol },
        piece,
        captured: capturedPiece
      })

      this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white'
      this.clearSelection()
      
      if (!isRemoteMove) {
        const multiplayerStore = useMultiplayerStore()
        if (multiplayerStore.isConnected) {
          multiplayerStore.sendMove(fromRow, fromCol, toRow, toCol, piece)
        }
      }
      
      this.checkGameStatus()
      
      // Check if AI should make a move (only if not a remote move)
      if (!isRemoteMove) {
        setTimeout(() => {
          this.checkAIMove()
        }, 500)
      }
    },

    clearSelection() {
      this.selectedSquare = null
      this.validMoves = []
    },

    isPieceOwnedByCurrentPlayer(piece) {
      if (this.currentPlayer === 'white') {
        return this.isWhitePiece(piece)
      } else {
        return this.isBlackPiece(piece)
      }
    },

    calculateValidMoves(row, col) {
      const piece = this.getPieceAt(row, col)
      if (!piece) return

      this.validMoves = []
      const pieceLower = piece.toLowerCase()

      switch (pieceLower) {
        case 'p':
          this.calculatePawnMoves(row, col, piece)
          break
        case 'r':
          this.calculateRookMoves(row, col, piece)
          break
        case 'n':
          this.calculateKnightMoves(row, col, piece)
          break
        case 'b':
          this.calculateBishopMoves(row, col, piece)
          break
        case 'q':
          this.calculateQueenMoves(row, col, piece)
          break
        case 'k':
          this.calculateKingMoves(row, col, piece)
          break
      }

      this.validMoves = this.validMoves.filter(move => 
        !this.wouldMoveResultInCheck(row, col, move.row, move.col)
      )
    },

    calculatePawnMoves(row, col, piece) {
      const isWhite = this.isWhitePiece(piece)
      const direction = isWhite ? -1 : 1
      const startRow = isWhite ? 6 : 1

      if (this.isValidSquare(row + direction, col) && !this.getPieceAt(row + direction, col)) {
        this.validMoves.push({ row: row + direction, col })
        
        if (row === startRow && !this.getPieceAt(row + 2 * direction, col)) {
          this.validMoves.push({ row: row + 2 * direction, col })
        }
      }

      [col - 1, col + 1].forEach(c => {
        if (this.isValidSquare(row + direction, c)) {
          const target = this.getPieceAt(row + direction, c)
          if (target && this.isWhitePiece(target) !== isWhite) {
            this.validMoves.push({ row: row + direction, col: c })
          }
        }
      })
    },

    calculateRookMoves(row, col, piece) {
      const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]]
      this.calculateLinearMoves(row, col, piece, directions)
    },

    calculateBishopMoves(row, col, piece) {
      const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]]
      this.calculateLinearMoves(row, col, piece, directions)
    },

    calculateQueenMoves(row, col, piece) {
      const directions = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]
      this.calculateLinearMoves(row, col, piece, directions)
    },

    calculateLinearMoves(row, col, piece, directions) {
      const isWhite = this.isWhitePiece(piece)
      
      directions.forEach(([dRow, dCol]) => {
        for (let i = 1; i < 8; i++) {
          const newRow = row + dRow * i
          const newCol = col + dCol * i
          
          if (!this.isValidSquare(newRow, newCol)) break
          
          const target = this.getPieceAt(newRow, newCol)
          if (!target) {
            this.validMoves.push({ row: newRow, col: newCol })
          } else {
            if (this.isWhitePiece(target) !== isWhite) {
              this.validMoves.push({ row: newRow, col: newCol })
            }
            break
          }
        }
      })
    },

    calculateKnightMoves(row, col, piece) {
      const moves = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
      ]
      
      const isWhite = this.isWhitePiece(piece)
      
      moves.forEach(([dRow, dCol]) => {
        const newRow = row + dRow
        const newCol = col + dCol
        
        if (this.isValidSquare(newRow, newCol)) {
          const target = this.getPieceAt(newRow, newCol)
          if (!target || this.isWhitePiece(target) !== isWhite) {
            this.validMoves.push({ row: newRow, col: newCol })
          }
        }
      })
    },

    calculateKingMoves(row, col, piece) {
      const moves = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1]
      ]
      
      const isWhite = this.isWhitePiece(piece)
      
      moves.forEach(([dRow, dCol]) => {
        const newRow = row + dRow
        const newCol = col + dCol
        
        if (this.isValidSquare(newRow, newCol)) {
          const target = this.getPieceAt(newRow, newCol)
          if (!target || this.isWhitePiece(target) !== isWhite) {
            this.validMoves.push({ row: newRow, col: newCol })
          }
        }
      })
    },

    isValidSquare(row, col) {
      return row >= 0 && row < 8 && col >= 0 && col < 8
    },

    resetGame(isRemoteReset = false) {
      this.board = JSON.parse(JSON.stringify(INITIAL_BOARD))
      this.currentPlayer = 'white'
      this.selectedSquare = null
      this.validMoves = []
      this.gameStatus = 'playing'
      this.moveHistory = []
      
      if (!isRemoteReset) {
        const multiplayerStore = useMultiplayerStore()
        if (multiplayerStore.isConnected) {
          multiplayerStore.sendGameReset()
        }
      }
    },

    handleRemoteMove(moveData) {
      this.movePiece(moveData.from.row, moveData.from.col, moveData.to.row, moveData.to.col, true)
    },

    handleRemoteReset() {
      this.resetGame(true)
    },

    async checkAIMove() {
      const engineStore = useChessEngineStore()
      
      if (engineStore.shouldAIMakeMove(this.currentPlayer) && this.gameStatus === 'playing' && !engineStore.isThinking) {
        const bestMove = await engineStore.getBestMove(this.board, this)
        
        if (bestMove) {
          // Mark as AI move to prevent infinite recursion
          this.movePiece(
            bestMove.from.row, 
            bestMove.from.col, 
            bestMove.to.row, 
            bestMove.to.col, 
            true // Mark as remote/AI move to prevent triggering another AI move
          )
        }
      }
    },

    findKing(isWhite) {
      const kingSymbol = isWhite ? 'K' : 'k'
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          if (this.board[row][col] === kingSymbol) {
            return { row, col }
          }
        }
      }
      return null
    },

    isSquareUnderAttack(row, col, byWhite) {
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = this.board[r][c]
          if (piece && this.isWhitePiece(piece) === byWhite) {
            if (this.canPieceAttackSquare(r, c, row, col, piece)) {
              return true
            }
          }
        }
      }
      return false
    },

    canPieceAttackSquare(fromRow, fromCol, toRow, toCol, piece) {
      const pieceLower = piece.toLowerCase()
      const isWhite = this.isWhitePiece(piece)
      
      switch (pieceLower) {
        case 'p':
          return this.canPawnAttack(fromRow, fromCol, toRow, toCol, isWhite)
        case 'r':
          return this.canRookAttack(fromRow, fromCol, toRow, toCol)
        case 'n':
          return this.canKnightAttack(fromRow, fromCol, toRow, toCol)
        case 'b':
          return this.canBishopAttack(fromRow, fromCol, toRow, toCol)
        case 'q':
          return this.canQueenAttack(fromRow, fromCol, toRow, toCol)
        case 'k':
          return this.canKingAttack(fromRow, fromCol, toRow, toCol)
      }
      return false
    },

    canPawnAttack(fromRow, fromCol, toRow, toCol, isWhite) {
      const direction = isWhite ? -1 : 1
      return fromRow + direction === toRow && Math.abs(fromCol - toCol) === 1
    },

    canRookAttack(fromRow, fromCol, toRow, toCol) {
      if (fromRow !== toRow && fromCol !== toCol) return false
      return this.isPathClear(fromRow, fromCol, toRow, toCol)
    },

    canBishopAttack(fromRow, fromCol, toRow, toCol) {
      if (Math.abs(fromRow - toRow) !== Math.abs(fromCol - toCol)) return false
      return this.isPathClear(fromRow, fromCol, toRow, toCol)
    },

    canQueenAttack(fromRow, fromCol, toRow, toCol) {
      return this.canRookAttack(fromRow, fromCol, toRow, toCol) || 
             this.canBishopAttack(fromRow, fromCol, toRow, toCol)
    },

    canKnightAttack(fromRow, fromCol, toRow, toCol) {
      const rowDiff = Math.abs(fromRow - toRow)
      const colDiff = Math.abs(fromCol - toCol)
      return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2)
    },

    canKingAttack(fromRow, fromCol, toRow, toCol) {
      return Math.abs(fromRow - toRow) <= 1 && Math.abs(fromCol - toCol) <= 1
    },

    isPathClear(fromRow, fromCol, toRow, toCol) {
      const rowStep = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0
      const colStep = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0
      
      let currentRow = fromRow + rowStep
      let currentCol = fromCol + colStep
      
      while (currentRow !== toRow || currentCol !== toCol) {
        if (this.board[currentRow][currentCol] !== null) return false
        currentRow += rowStep
        currentCol += colStep
      }
      
      return true
    },

    isInCheck(isWhite) {
      const king = this.findKing(isWhite)
      if (!king) return false
      return this.isSquareUnderAttack(king.row, king.col, !isWhite)
    },

    wouldMoveResultInCheck(fromRow, fromCol, toRow, toCol) {
      const originalPiece = this.board[fromRow][fromCol]
      const capturedPiece = this.board[toRow][toCol]
      const isWhite = this.isWhitePiece(originalPiece)
      
      this.board[toRow][toCol] = originalPiece
      this.board[fromRow][fromCol] = null
      
      const inCheck = this.isInCheck(isWhite)
      
      this.board[fromRow][fromCol] = originalPiece
      this.board[toRow][toCol] = capturedPiece
      
      return inCheck
    },

    getAllValidMovesForPlayer(isWhite) {
      const moves = []
      
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = this.board[row][col]
          if (piece && this.isWhitePiece(piece) === isWhite) {
            this.calculateValidMoves(row, col)
            this.validMoves.forEach(move => {
              if (!this.wouldMoveResultInCheck(row, col, move.row, move.col)) {
                moves.push({ from: { row, col }, to: move })
              }
            })
          }
        }
      }
      
      return moves
    },

    checkGameStatus() {
      const isWhiteToMove = this.currentPlayer === 'white'
      const inCheck = this.isInCheck(isWhiteToMove)
      const validMoves = this.getAllValidMovesForPlayer(isWhiteToMove)
      
      if (validMoves.length === 0) {
        if (inCheck) {
          this.gameStatus = isWhiteToMove ? 'black_wins' : 'white_wins'
        } else {
          this.gameStatus = 'stalemate'
        }
      } else if (inCheck) {
        this.gameStatus = 'check'
      } else {
        this.gameStatus = 'playing'
      }
    }
  }
})