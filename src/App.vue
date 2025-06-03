<template>
  <div id="app">
    <ChessBoard />
  </div>
</template>

<script>
import ChessBoard from './components/ChessBoard.vue'

export default {
  name: 'App',
  components: {
    ChessBoard
  }
}
</script>

<style>
#app {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>