import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

const app = createApp(App)

// Install Pinia
const pinia = createPinia()
app.use(pinia)

// Install Router
app.use(router)

app.mount('#app')