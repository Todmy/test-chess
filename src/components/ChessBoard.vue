<template>
  <div class="chess-game">
    <div class="game-info">
      <h1>Chess Game</h1>
      
      <div v-if="multiplayerStore.isConnected" class="multiplayer-info">
        <div class="connection-status">
          🟢 Online vs Friend
        </div>
        <div class="player-info">
          You are playing as: <strong>{{ multiplayerStore.playerColor === 'white' ? 'White' : 'Black' }}</strong>
        </div>
        <div class="room-info">
          Room: {{ multiplayerStore.roomId }}
        </div>
      </div>
      
      <div v-else-if="engineStore.gameMode === 'computer'" class="ai-info">
        <div class="ai-status">
          🤖 vs Computer ({{ engineStore.difficulty }})
        </div>
        <div class="player-info">
          You are playing as: <strong>{{ engineStore.aiColor === 'white' ? 'Black' : 'White' }}</strong>
        </div>
        <div v-if="engineStore.isThinking" class="ai-thinking">
          🤔 AI is thinking...
        </div>
      </div>
      
      <div class="status-info">
        <p v-if="chessStore.gameStatus === 'playing'">
          Current Player: {{ chessStore.currentPlayer === 'white' ? 'White' : 'Black' }}
          <span v-if="multiplayerStore.isConnected && !multiplayerStore.canMakeMove(chessStore.currentPlayer)" class="waiting">
            (Waiting for opponent)
          </span>
        </p>
        <p v-else-if="chessStore.gameStatus === 'check'" class="check">
          {{ chessStore.currentPlayer === 'white' ? 'White' : 'Black' }} is in Check!
        </p>
        <p v-else-if="chessStore.gameStatus === 'white_wins'" class="winner">
          Checkmate! White Wins!
        </p>
        <p v-else-if="chessStore.gameStatus === 'black_wins'" class="winner">
          Checkmate! Black Wins!
        </p>
        <p v-else-if="chessStore.gameStatus === 'stalemate'" class="stalemate">
          Stalemate! It's a Draw!
        </p>
      </div>
      
      <div class="game-controls">
        <button @click="chessStore.resetGame()" class="reset-btn">New Game</button>
        <button v-if="!multiplayerStore.isConnected && engineStore.gameMode === 'human'" @click="showGameModeSetup = true" class="mode-btn">
          Choose Mode
        </button>
        <button v-else-if="multiplayerStore.isConnected" @click="multiplayerStore.disconnect()" class="disconnect-btn">
          Disconnect
        </button>
        <button v-else-if="engineStore.gameMode === 'computer'" @click="showGameModeSetup = true" class="mode-btn">
          Change Mode
        </button>
      </div>
    </div>
    
    <div class="chess-board">
      <div
        v-for="(row, rowIndex) in chessStore.board"
        :key="rowIndex"
        class="board-row"
      >
        <div
          v-for="(piece, colIndex) in row"
          :key="colIndex"
          class="square"
          :class="{
            'light': (rowIndex + colIndex) % 2 === 0,
            'dark': (rowIndex + colIndex) % 2 === 1,
            'selected': chessStore.isSquareSelected(rowIndex, colIndex),
            'valid-move': chessStore.isValidMove(rowIndex, colIndex),
            'has-piece': piece,
            'drag-over': dragOver && dragOverSquare?.row === rowIndex && dragOverSquare?.col === colIndex
          }"
          @click="chessStore.selectSquare(rowIndex, colIndex)"
          @dragover.prevent="handleDragOver(rowIndex, colIndex)"
          @dragleave="handleDragLeave"
          @drop="handleDrop(rowIndex, colIndex)"
        >
          <ChessPiece 
            v-if="piece" 
            :piece="piece" 
            :draggable="chessStore.isPieceOwnedByCurrentPlayer(piece)"
            @dragstart="handleDragStart(rowIndex, colIndex, $event)"
            @dragend="handleDragEnd"
          />
        </div>
      </div>
    </div>
    
    <div class="move-history" v-if="chessStore.moveHistory.length">
      <h3>Move History</h3>
      <div class="moves">
        <div
          v-for="(move, index) in chessStore.moveHistory"
          :key="index"
          class="move"
        >
          {{ index + 1 }}. {{ formatMove(move) }}
        </div>
      </div>
    </div>
    
    <GameModeSetup 
      v-if="showGameModeSetup" 
      @close="showGameModeSetup = false"
      @start-local="startLocalGame"
      @start-computer="startComputerGame"
      @start-online="showMultiplayerSetup = true; showGameModeSetup = false"
    />
    
    <MultiplayerSetup 
      v-if="showMultiplayerSetup" 
      @close="showMultiplayerSetup = false"
    />
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { useChessStore } from '../stores/chess.js'
import { useMultiplayerStore } from '../stores/multiplayer.js'
import { useChessEngineStore } from '../stores/chessEngine.js'
import ChessPiece from './ChessPiece.vue'
import MultiplayerSetup from './MultiplayerSetup.vue'
import GameModeSetup from './GameModeSetup.vue'

export default {
  name: 'ChessBoard',
  components: {
    ChessPiece,
    MultiplayerSetup,
    GameModeSetup
  },
  setup() {
    const chessStore = useChessStore()
    const multiplayerStore = useMultiplayerStore()
    const engineStore = useChessEngineStore()
    const draggedPiece = ref(null)
    const dragOver = ref(false)
    const dragOverSquare = ref(null)
    const showMultiplayerSetup = ref(false)
    const showGameModeSetup = ref(false)
    
    const formatMove = (move) => {
      const fromSquare = String.fromCharCode(97 + move.from.col) + (8 - move.from.row)
      const toSquare = String.fromCharCode(97 + move.to.col) + (8 - move.to.row)
      return `${move.piece}${fromSquare}-${toSquare}`
    }
    
    const handleDragStart = (row, col, event) => {
      const piece = chessStore.getPieceAt(row, col)
      if (chessStore.isPieceOwnedByCurrentPlayer(piece)) {
        draggedPiece.value = { row, col, piece }
        chessStore.selectSquare(row, col)
        event.dataTransfer.effectAllowed = 'move'
      } else {
        event.preventDefault()
      }
    }
    
    const handleDragEnd = () => {
      draggedPiece.value = null
      dragOver.value = false
      dragOverSquare.value = null
    }
    
    const handleDragOver = (row, col) => {
      if (draggedPiece.value) {
        dragOver.value = true
        dragOverSquare.value = { row, col }
      }
    }
    
    const handleDragLeave = () => {
      dragOver.value = false
      dragOverSquare.value = null
    }
    
    const handleDrop = (row, col) => {
      if (draggedPiece.value && chessStore.isValidMove(row, col)) {
        chessStore.movePiece(draggedPiece.value.row, draggedPiece.value.col, row, col)
      }
      handleDragEnd()
    }
    
    onMounted(() => {
      // Set up event listeners for multiplayer data
      const originalHandleReceivedData = multiplayerStore.handleReceivedData
      multiplayerStore.handleReceivedData = (data) => {
        if (data.type === 'move') {
          chessStore.handleRemoteMove(data)
        } else if (data.type === 'reset') {
          chessStore.handleRemoteReset()
        }
      }
    })
    
    const startLocalGame = () => {
      engineStore.setGameMode('human')
      chessStore.resetGame()
    }
    
    const startComputerGame = (settings) => {
      chessStore.resetGame()
      // AI move will be triggered automatically if AI plays first
      if (settings.playerColor === 'black') {
        setTimeout(() => {
          chessStore.checkAIMove()
        }, 1000)
      }
    }
    
    onMounted(() => {
      // Set up event listeners for multiplayer data
      const originalHandleReceivedData = multiplayerStore.handleReceivedData
      multiplayerStore.handleReceivedData = (data) => {
        if (data.type === 'move') {
          chessStore.handleRemoteMove(data)
        } else if (data.type === 'reset') {
          chessStore.handleRemoteReset()
        }
      }
    })
    
    onUnmounted(() => {
      // Clean up if needed
    })
    
    return {
      chessStore,
      multiplayerStore,
      engineStore,
      formatMove,
      draggedPiece,
      dragOver,
      dragOverSquare,
      showMultiplayerSetup,
      showGameModeSetup,
      startLocalGame,
      startComputerGame,
      handleDragStart,
      handleDragEnd,
      handleDragOver,
      handleDragLeave,
      handleDrop
    }
  }
}
</script>

<style scoped>
.chess-game {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  padding: 2rem;
}

.game-info {
  text-align: center;
}

.game-info h1 {
  color: #333;
  margin-bottom: 1rem;
}

.status-info p {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: #666;
}

.status-info .check {
  color: #ff9800;
  font-weight: bold;
}

.status-info .winner {
  color: #4CAF50;
  font-weight: bold;
  font-size: 1.4rem;
}

.status-info .stalemate {
  color: #2196F3;
  font-weight: bold;
}

.status-info .waiting {
  color: #ff9800;
  font-style: italic;
}

.multiplayer-info, .ai-info {
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.multiplayer-info {
  background: #e8f5e8;
  border: 2px solid #4CAF50;
}

.ai-info {
  background: #f3e5f5;
  border: 2px solid #9c27b0;
}

.connection-status, .ai-status {
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.connection-status {
  color: #2e7d32;
}

.ai-status {
  color: #7b1fa2;
}

.ai-thinking {
  color: #9c27b0;
  font-style: italic;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.player-info, .room-info {
  color: #555;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.game-controls {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.reset-btn, .mode-btn, .disconnect-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s ease;
}

.reset-btn:hover {
  background-color: #45a049;
}

.mode-btn {
  background-color: #2196F3;
}

.mode-btn:hover {
  background-color: #1976D2;
}

.disconnect-btn {
  background-color: #f44336;
}

.disconnect-btn:hover {
  background-color: #d32f2f;
}

.chess-board {
  display: grid;
  grid-template-rows: repeat(8, 1fr);
  border: 3px solid #8B4513;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.board-row {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
}

.square {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.square.light {
  background-color: #f0d9b5;
}

.square.dark {
  background-color: #b58863;
}

.square:hover {
  opacity: 0.8;
}

.square.selected {
  background-color: #7fc97f !important;
  box-shadow: inset 0 0 0 3px #4CAF50;
}

.square.valid-move {
  background-color: #ffeb3b !important;
}

.square.valid-move::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  background-color: rgba(76, 175, 80, 0.7);
  border-radius: 50%;
  pointer-events: none;
}

.square.valid-move.has-piece::after {
  width: 100%;
  height: 100%;
  border-radius: 0;
  background-color: rgba(244, 67, 54, 0.7);
}

.square.drag-over {
  background-color: #81c784 !important;
  transform: scale(1.05);
}

.move-history {
  max-width: 400px;
  text-align: left;
}

.move-history h3 {
  margin-bottom: 1rem;
  color: #333;
}

.moves {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #ddd;
  padding: 1rem;
  border-radius: 5px;
  background-color: #f9f9f9;
}

.move {
  font-family: monospace;
  font-size: 0.9rem;
  color: #555;
}
</style>