import { describe, it, expect, vi } from 'vitest'

// Mock Vue to avoid lifecycle warnings
vi.mock('vue', () => ({
  ref: (value) => ({ value }),
  reactive: (obj) => obj,
  onUnmounted: vi.fn(),
  nextTick: () => Promise.resolve()
}))

describe('useWebSocket Simple Tests', () => {
  it('should import correctly', async () => {
    const { useWebSocket } = await import('../useWebSocket.js')
    expect(typeof useWebSocket).toBe('function')
  })
  
  it('should return expected API', async () => {
    const { useWebSocket } = await import('../useWebSocket.js')
    const result = useWebSocket()
    
    expect(result).toHaveProperty('connected')
    expect(result).toHaveProperty('reconnecting')
    expect(result).toHaveProperty('error')
    expect(result).toHaveProperty('connect')
    expect(result).toHaveProperty('disconnect')
    expect(result).toHaveProperty('subscribe')
    expect(result).toHaveProperty('unsubscribe')
    expect(result).toHaveProperty('cleanup')
  })
})