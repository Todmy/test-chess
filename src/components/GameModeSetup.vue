<template>
  <div class="game-mode-setup" @click.self="closeModal">
    <div class="setup-container">
      <div class="modal-header">
        <h2>Choose Game Mode</h2>
        <button class="close-btn" @click="closeModal">×</button>
      </div>
      
      <div class="game-modes">
        <div class="mode-card" @click="selectMode('local')">
          <div class="mode-icon">🏠</div>
          <h3>Local Game</h3>
          <p>Play with a friend on the same device</p>
          <div class="mode-features">
            <span>• Pass and play</span>
            <span>• Two players locally</span>
          </div>
        </div>

        <div class="mode-card" @click="selectMode('computer')">
          <div class="mode-icon">🤖</div>
          <h3>vs Computer</h3>
          <p>Challenge our chess AI</p>
          <div class="mode-features">
            <span>• Multiple difficulty levels</span>
            <span>• Practice against AI</span>
          </div>
        </div>

        <div class="mode-card" @click="selectMode('online')">
          <div class="mode-icon">🌐</div>
          <h3>Online vs Friend</h3>
          <p>Play with a friend over the internet</p>
          <div class="mode-features">
            <span>• Peer-to-peer connection</span>
            <span>• Share room code</span>
          </div>
        </div>
      </div>

      <!-- Computer Mode Settings -->
      <div v-if="selectedMode === 'computer'" class="computer-settings">
        <h3>AI Settings</h3>
        
        <div class="setting-group">
          <label>Your Color:</label>
          <div class="color-options">
            <button 
              :class="{ active: playerColor === 'white' }" 
              @click="playerColor = 'white'"
              class="color-btn white-btn"
            >
              ♔ White
            </button>
            <button 
              :class="{ active: playerColor === 'black' }" 
              @click="playerColor = 'black'"
              class="color-btn black-btn"
            >
              ♚ Black
            </button>
          </div>
        </div>

        <div class="setting-group">
          <label>Difficulty:</label>
          <div class="difficulty-options">
            <button 
              v-for="level in difficultyLevels" 
              :key="level.value"
              :class="{ active: difficulty === level.value }" 
              @click="difficulty = level.value"
              class="difficulty-btn"
            >
              {{ level.label }}
              <small>{{ level.description }}</small>
            </button>
          </div>
        </div>

        <div class="computer-actions">
          <button @click="startComputerGame" class="start-btn">
            Start Game vs AI
          </button>
          <button @click="selectedMode = null" class="back-btn">
            Back
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useChessEngineStore } from '../stores/chessEngine.js'

export default {
  name: 'GameModeSetup',
  emits: ['close', 'start-local', 'start-computer', 'start-online'],
  setup(_, { emit }) {
    const engineStore = useChessEngineStore()
    const selectedMode = ref(null)
    const playerColor = ref('white')
    const difficulty = ref('medium')

    const difficultyLevels = [
      { value: 'easy', label: 'Easy', description: 'Beginner friendly' },
      { value: 'medium', label: 'Medium', description: 'Balanced gameplay' },
      { value: 'hard', label: 'Hard', description: 'Challenging' },
      { value: 'expert', label: 'Expert', description: 'Very difficult' }
    ]

    const selectMode = (mode) => {
      if (mode === 'computer') {
        selectedMode.value = mode
      } else {
        startGame(mode)
      }
    }

    const startGame = (mode) => {
      if (mode === 'local') {
        emit('start-local')
      } else if (mode === 'online') {
        emit('start-online')
      }
      closeModal()
    }

    const startComputerGame = () => {
      engineStore.setGameMode('computer')
      engineStore.setDifficulty(difficulty.value)
      engineStore.setAIColor(playerColor.value === 'white' ? 'black' : 'white')
      
      emit('start-computer', {
        playerColor: playerColor.value,
        difficulty: difficulty.value
      })
      closeModal()
    }

    const closeModal = () => {
      emit('close')
    }

    return {
      selectedMode,
      playerColor,
      difficulty,
      difficultyLevels,
      selectMode,
      startComputerGame,
      closeModal
    }
  }
}
</script>

<style scoped>
.game-mode-setup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.setup-container {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.modal-header h2 {
  color: #333;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: #f0f0f0;
  color: #333;
}

.game-modes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.mode-card {
  border: 2px solid #e0e0e0;
  border-radius: 15px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.mode-card:hover {
  border-color: #4CAF50;
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.mode-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.mode-card h3 {
  color: #333;
  margin-bottom: 0.5rem;
}

.mode-card p {
  color: #666;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.mode-features {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.mode-features span {
  color: #888;
  font-size: 0.8rem;
}

.computer-settings {
  border-top: 2px solid #e0e0e0;
  padding-top: 2rem;
  text-align: left;
}

.computer-settings h3 {
  text-align: center;
  color: #333;
  margin-bottom: 1.5rem;
}

.setting-group {
  margin-bottom: 1.5rem;
}

.setting-group label {
  display: block;
  font-weight: bold;
  color: #333;
  margin-bottom: 0.5rem;
}

.color-options, .difficulty-options {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.color-btn, .difficulty-btn {
  padding: 0.75rem 1rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.color-btn {
  flex: 1;
  font-size: 1rem;
}

.difficulty-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.difficulty-btn small {
  font-size: 0.7rem;
  color: #666;
  margin-top: 0.25rem;
}

.color-btn.active, .difficulty-btn.active {
  border-color: #4CAF50;
  background: #e8f5e8;
  color: #2e7d32;
}

.white-btn {
  color: #333;
}

.black-btn {
  color: #333;
}

.computer-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.start-btn {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  transition: background 0.3s ease;
}

.start-btn:hover {
  background: #45a049;
}

.back-btn {
  background: #666;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.3s ease;
}

.back-btn:hover {
  background: #555;
}
</style>