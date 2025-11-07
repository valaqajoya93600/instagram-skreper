<template>
  <div id="app">
    <h1>Railway Deployment Automation</h1>
    <p>WebSocket composable integration ready</p>
    
    <WebSocketDemo />
    
    <TaskMonitor />
  </div>
</template>

<script>
import WebSocketDemo from './components/WebSocketDemo.vue'
import TaskMonitor from './components/TaskMonitor.vue'

export default {
  name: 'App',
  components: {
    WebSocketDemo,
    TaskMonitor
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>