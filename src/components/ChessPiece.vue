<template>
  <div 
    class="chess-piece" 
    :class="{ 'white': isWhite, 'black': isBlack, 'draggable': draggable }"
    :draggable="draggable"
    @dragstart="$emit('dragstart', $event)"
    @dragend="$emit('dragend', $event)"
  >
    {{ pieceSymbol }}
  </div>
</template>

<script>
export default {
  name: 'ChessPiece',
  emits: ['dragstart', 'dragend'],
  props: {
    piece: {
      type: String,
      required: true
    },
    draggable: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    isWhite() {
      return this.piece === this.piece.toUpperCase()
    },
    isBlack() {
      return this.piece === this.piece.toLowerCase()
    },
    pieceSymbol() {
      const symbols = {
        'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
        'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
      }
      return symbols[this.piece] || this.piece
    }
  }
}
</script>

<style scoped>
.chess-piece {
  font-size: 2.5rem;
  line-height: 1;
  user-select: none;
  pointer-events: none;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.chess-piece.white {
  color: #ffffff;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.chess-piece.black {
  color: #333333;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.3);
}

.chess-piece.draggable {
  cursor: grab;
}

.chess-piece.draggable:active {
  cursor: grabbing;
}
</style>