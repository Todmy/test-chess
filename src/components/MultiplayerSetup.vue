<template>
  <div class="multiplayer-setup" @click.self="emit('close')">
    <div class="setup-container">
      <div class="modal-header">
        <h2>Multiplayer Chess</h2>
        <button class="close-btn" @click="emit('close')">×</button>
      </div>
      
      <div v-if="multiplayerStore.connectionStatus === 'disconnected'" class="connection-options">
        <div class="option-card">
          <h3>Host a Game</h3>
          <p>Create a new game and share the room code with your friend</p>
          <button @click="hostGame" class="action-btn host-btn">
            Host Game
          </button>
        </div>
        
        <div class="option-card">
          <h3>Join a Game</h3>
          <p>Enter the room code shared by your friend</p>
          <div class="join-form">
            <input 
              v-model="joinRoomId" 
              placeholder="Enter room code" 
              class="room-input"
              @keyup.enter="joinGame"
              maxlength="6"
            />
            <button @click="joinGame" :disabled="!joinRoomId.trim()" class="action-btn join-btn">
              Join Game
            </button>
          </div>
        </div>
      </div>

      <div v-else-if="multiplayerStore.connectionStatus === 'waiting_for_peer'" class="waiting-state">
        <div class="status-card">
          <h3>Waiting for Player</h3>
          <p>Share this room code with your friend:</p>
          <div class="room-code">
            <span class="code">{{ multiplayerStore.roomId }}</span>
            <button @click="copyRoomCode" class="copy-btn">📋 Copy</button>
          </div>
          <div class="loading-spinner"></div>
          <button @click="cancelConnection" class="cancel-btn">Cancel</button>
        </div>
      </div>

      <div v-else-if="multiplayerStore.connectionStatus === 'connecting'" class="connecting-state">
        <div class="status-card">
          <h3>Connecting...</h3>
          <p>Establishing connection to room: {{ multiplayerStore.roomId }}</p>
          <div class="loading-spinner"></div>
          <button @click="cancelConnection" class="cancel-btn">Cancel</button>
        </div>
      </div>

      <div v-else-if="multiplayerStore.connectionStatus === 'connected'" class="connected-state">
        <div class="status-card connected">
          <h3>✅ Connected!</h3>
          <p>Playing as: <strong>{{ multiplayerStore.playerColor === 'white' ? 'White' : 'Black' }}</strong></p>
          <p>Room: {{ multiplayerStore.roomId }}</p>
          <div class="connected-actions">
            <button @click="emit('close')" class="play-btn">Start Playing</button>
            <button @click="disconnectGame" class="disconnect-btn">Disconnect</button>
          </div>
        </div>
      </div>

      <div v-else-if="multiplayerStore.connectionStatus === 'error'" class="error-state">
        <div class="status-card error">
          <h3>❌ Connection Error</h3>
          <p>{{ multiplayerStore.error }}</p>
          <button @click="resetConnection" class="retry-btn">Try Again</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useMultiplayerStore } from '../stores/multiplayer.js'

export default {
  name: 'MultiplayerSetup',
  emits: ['close'],
  setup(props, { emit }) {
    const multiplayerStore = useMultiplayerStore()
    const joinRoomId = ref('')

    const hostGame = async () => {
      await multiplayerStore.hostGame()
    }

    const joinGame = async () => {
      if (joinRoomId.value.trim()) {
        await multiplayerStore.joinGame(joinRoomId.value.trim())
      }
    }

    const copyRoomCode = async () => {
      try {
        await navigator.clipboard.writeText(multiplayerStore.roomId)
        // Could add a toast notification here
      } catch (err) {
        console.error('Failed to copy room code:', err)
      }
    }

    const cancelConnection = () => {
      multiplayerStore.disconnect()
    }

    const disconnectGame = () => {
      multiplayerStore.disconnect()
    }

    const resetConnection = () => {
      multiplayerStore.disconnect()
    }

    return {
      multiplayerStore,
      joinRoomId,
      hostGame,
      joinGame,
      copyRoomCode,
      cancelConnection,
      disconnectGame,
      resetConnection
    }
  }
}
</script>

<style scoped>
.multiplayer-setup {
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
  max-width: 500px;
  width: 90%;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
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

.connection-options {
  display: grid;
  gap: 1.5rem;
}

.option-card {
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.option-card:hover {
  border-color: #4CAF50;
  transform: translateY(-2px);
}

.option-card h3 {
  color: #333;
  margin-bottom: 0.5rem;
}

.option-card p {
  color: #666;
  margin-bottom: 1rem;
}

.join-form {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.room-input {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
  text-transform: uppercase;
  text-align: center;
  font-family: monospace;
}

.room-input:focus {
  outline: none;
  border-color: #4CAF50;
}

.action-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.host-btn {
  background: #4CAF50;
  color: white;
  width: 100%;
}

.host-btn:hover {
  background: #45a049;
}

.join-btn {
  background: #2196F3;
  color: white;
}

.join-btn:hover:not(:disabled) {
  background: #1976D2;
}

.join-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.status-card {
  border-radius: 10px;
  padding: 2rem;
  border: 2px solid #e0e0e0;
}

.status-card.connected {
  border-color: #4CAF50;
  background: #f1f8e9;
}

.status-card.error {
  border-color: #f44336;
  background: #ffebee;
}

.room-code {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin: 1rem 0;
}

.code {
  font-family: monospace;
  font-size: 1.5rem;
  font-weight: bold;
  background: #f5f5f5;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  border: 2px solid #ddd;
  letter-spacing: 2px;
}

.copy-btn {
  padding: 0.5rem;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9rem;
}

.copy-btn:hover {
  background: #1976D2;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 1rem auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.cancel-btn, .disconnect-btn, .retry-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 1rem;
}

.cancel-btn {
  background: #666;
  color: white;
}

.cancel-btn:hover {
  background: #555;
}

.disconnect-btn {
  background: #f44336;
  color: white;
}

.disconnect-btn:hover {
  background: #d32f2f;
}

.connected-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 1rem;
}

.play-btn {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
}

.play-btn:hover {
  background: #45a049;
}

.retry-btn {
  background: #ff9800;
  color: white;
}

.retry-btn:hover {
  background: #f57c00;
}
</style>