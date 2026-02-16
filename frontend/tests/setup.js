// Test setup file for Vitest
// Runs before each test file

// Stub for window.matchMedia (used by some components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

// Stub for window.scrollTo
window.scrollTo = vi.fn()

// Suppress console.error in tests unless debugging
// Uncomment to debug: 
// const originalError = console.error
// console.error = (...args) => originalError(...args)
