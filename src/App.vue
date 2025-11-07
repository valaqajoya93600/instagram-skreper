<template>
  <div id="app">
    <header class="app-header">
      <h1>Task Monitor Dashboard</h1>
    </header>
    <main class="app-main">
      <TaskMonitor />
    </main>
  </div>
</template>

<script>
import TaskMonitor from './components/TaskMonitor.vue'

export default {
  name: 'App',
  components: {
    TaskMonitor
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #f5f5f5;
  color: #333;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background-color: #fff;
  border-bottom: 1px solid #e0e0e0;
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.app-header h1 {
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: 600;
}

.app-main {
  flex: 1;
  padding: 2rem;
}
</style>