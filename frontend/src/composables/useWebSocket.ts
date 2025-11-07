import { ref, onUnmounted, readonly } from 'vue'
import { webSocketService, type WebSocketEventHandler } from '@/services/websocket'
import type { WebSocketMessage, Task, ScrapeJob } from '@/types'

export function useWebSocket() {
  const isConnected = ref(false)
  const lastMessage = ref<WebSocketMessage | null>(null)

  const connect = async () => {
    try {
      await webSocketService.connect()
      isConnected.value = true
    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
      isConnected.value = false
    }
  }

  const disconnect = () => {
    webSocketService.disconnect()
    isConnected.value = false
  }

  const onTaskUpdate = (handler: (task: Task) => void) => {
    const wrappedHandler: WebSocketEventHandler = (message) => {
      if (message.type === 'task_update') {
        handler(message.data as Task)
      }
    }
    webSocketService.on('task_update', wrappedHandler)
    
    return () => webSocketService.off('task_update', wrappedHandler)
  }

  const onScrapeUpdate = (handler: (job: ScrapeJob) => void) => {
    const wrappedHandler: WebSocketEventHandler = (message) => {
      if (message.type === 'scrape_update') {
        handler(message.data as ScrapeJob)
      }
    }
    webSocketService.on('scrape_update', wrappedHandler)
    
    return () => webSocketService.off('scrape_update', wrappedHandler)
  }

  const onNotification = (handler: (notification: any) => void) => {
    const wrappedHandler: WebSocketEventHandler = (message) => {
      if (message.type === 'notification') {
        handler(message.data)
      }
    }
    webSocketService.on('notification', wrappedHandler)
    
    return () => webSocketService.off('notification', wrappedHandler)
  }

  const onError = (handler: (error: any) => void) => {
    const wrappedHandler: WebSocketEventHandler = (message) => {
      if (message.type === 'error') {
        handler(message.data)
      }
    }
    webSocketService.on('error', wrappedHandler)
    
    return () => webSocketService.off('error', wrappedHandler)
  }

  const messageHandler: WebSocketEventHandler = (message) => {
    lastMessage.value = message
  }

  webSocketService.on('task_update', messageHandler)
  webSocketService.on('scrape_update', messageHandler)
  webSocketService.on('notification', messageHandler)
  webSocketService.on('error', messageHandler)

  onUnmounted(() => {
    webSocketService.off('task_update', messageHandler)
    webSocketService.off('scrape_update', messageHandler)
    webSocketService.off('notification', messageHandler)
    webSocketService.off('error', messageHandler)
  })

  return {
    isConnected: readonly(isConnected),
    lastMessage: readonly(lastMessage),
    connect,
    disconnect,
    onTaskUpdate,
    onScrapeUpdate,
    onNotification,
    onError,
  }
}