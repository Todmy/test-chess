import { defineStore } from 'pinia'
import Peer from 'peerjs'

export const useMultiplayerStore = defineStore('multiplayer', {
  state: () => ({
    peer: null,
    connection: null,
    isHost: false,
    isConnected: false,
    roomId: '',
    playerColor: null,
    connectionStatus: 'disconnected',
    error: null
  }),

  getters: {
    canMakeMove: (state) => (currentPlayer) => {
      if (!state.isConnected) return true
      return state.playerColor === currentPlayer
    }
  },

  actions: {
    generateRoomId() {
      return Math.random().toString(36).substring(2, 8).toUpperCase()
    },

    async hostGame() {
      try {
        this.connectionStatus = 'initializing'
        this.roomId = this.generateRoomId()
        this.isHost = true
        this.playerColor = 'white'
        
        this.peer = new Peer(this.roomId, {
          config: {
            'iceServers': [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' }
            ]
          }
        })

        this.peer.on('open', (id) => {
          console.log('Peer opened with ID:', id)
          this.connectionStatus = 'waiting_for_peer'
        })

        this.peer.on('connection', (conn) => {
          console.log('Incoming connection from:', conn.peer)
          this.connection = conn
          this.setupConnection()
        })

        this.peer.on('error', (err) => {
          console.error('Peer error:', err)
          this.error = err.message
          this.connectionStatus = 'error'
        })

      } catch (error) {
        console.error('Error hosting game:', error)
        this.error = error.message
        this.connectionStatus = 'error'
      }
    },

    async joinGame(roomId) {
      try {
        this.connectionStatus = 'connecting'
        this.roomId = roomId.toUpperCase()
        this.isHost = false
        this.playerColor = 'black'

        this.peer = new Peer(null, {
          config: {
            'iceServers': [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' }
            ]
          }
        })

        this.peer.on('open', (id) => {
          console.log('Peer opened, connecting to:', this.roomId)
          this.connection = this.peer.connect(this.roomId)
          this.setupConnection()
        })

        this.peer.on('error', (err) => {
          console.error('Peer error:', err)
          this.error = err.message
          this.connectionStatus = 'error'
        })

      } catch (error) {
        console.error('Error joining game:', error)
        this.error = error.message
        this.connectionStatus = 'error'
      }
    },

    setupConnection() {
      if (!this.connection) return

      this.connection.on('open', () => {
        console.log('Connection opened')
        this.isConnected = true
        this.connectionStatus = 'connected'
        this.error = null
      })

      this.connection.on('data', (data) => {
        console.log('Received data:', data)
        this.handleReceivedData(data)
      })

      this.connection.on('close', () => {
        console.log('Connection closed')
        this.isConnected = false
        this.connectionStatus = 'disconnected'
      })

      this.connection.on('error', (err) => {
        console.error('Connection error:', err)
        this.error = err.message
        this.connectionStatus = 'error'
      })
    },

    sendMove(fromRow, fromCol, toRow, toCol, piece) {
      if (this.connection && this.isConnected) {
        const moveData = {
          type: 'move',
          from: { row: fromRow, col: fromCol },
          to: { row: toRow, col: toCol },
          piece,
          timestamp: Date.now()
        }
        
        console.log('Sending move:', moveData)
        this.connection.send(moveData)
      }
    },

    sendGameReset() {
      if (this.connection && this.isConnected) {
        const resetData = {
          type: 'reset',
          timestamp: Date.now()
        }
        
        console.log('Sending reset')
        this.connection.send(resetData)
      }
    },

    handleReceivedData(data) {
      // This method will be overridden by components to handle the data
      console.log('Received data that needs handling:', data)
    },

    disconnect() {
      if (this.connection) {
        this.connection.close()
      }
      if (this.peer) {
        this.peer.destroy()
      }
      
      this.peer = null
      this.connection = null
      this.isConnected = false
      this.connectionStatus = 'disconnected'
      this.roomId = ''
      this.playerColor = null
      this.isHost = false
      this.error = null
    }
  }
})