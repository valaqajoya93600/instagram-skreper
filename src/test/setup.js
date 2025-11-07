// Test setup for Vitest
import { vi } from 'vitest'

// Mock WebSocket for all tests
global.WebSocket = class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3
  
  constructor(url) {
    this.url = url
    this.readyState = MockWebSocket.CONNECTING
    this.onopen = null
    this.onmessage = null
    this.onclose = null
    this.onerror = null
    
    // Store instances for test access
    if (!global.WebSocket.instances) {
      global.WebSocket.instances = []
    }
    global.WebSocket.instances.push(this)
  }
  
  send(data) {
    // Mock implementation
  }
  
  close(code = 1000, reason = '') {
    this.readyState = MockWebSocket.CLOSED
    if (this.onclose) {
      this.onclose({ code, reason, wasClean: code === 1000 })
    }
  }
}