/**
 * Jest Setup File
 * Configures the testing environment for Earth System Model Visualization
 */

// Import Jest DOM matchers
require('@testing-library/jest-dom');

// Mock global fetch
global.fetch = jest.fn();

// Mock console methods for cleaner test output
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock window.gtag for analytics
global.gtag = jest.fn();

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

// Mock HTML5 Canvas
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  clearRect: jest.fn(),
  beginPath: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  stroke: jest.fn(),
  fillText: jest.fn(),
  measureText: jest.fn(() => ({ width: 100 })),
  drawImage: jest.fn(),
  getImageData: jest.fn(),
  putImageData: jest.fn(),
  canvas: { width: 800, height: 600 }
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock matchMedia
global.matchMedia = jest.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));

// Mock Service Worker
global.navigator.serviceWorker = {
  register: jest.fn(() => Promise.resolve()),
  ready: Promise.resolve(),
};

// Setup DOM environment
beforeEach(() => {
  // Reset DOM
  document.body.innerHTML = '';
  
  // Reset mocks
  jest.clearAllMocks();
  
  // Reset fetch mock
  fetch.mockClear();
});

// Cleanup after each test
afterEach(() => {
  // Clear any timers
  jest.clearAllTimers();
  
  // Restore console for specific tests that need it
  if (process.env.TEST_CONSOLE) {
    global.console = originalConsole;
  }
});

// Global test utilities
global.createMockElement = (tag, attributes = {}) => {
  const element = document.createElement(tag);
  Object.assign(element, attributes);
  return element;
};

global.createMockEvent = (type, properties = {}) => {
  const event = new Event(type);
  Object.assign(event, properties);
  return event;
};

// Mock data for testing
global.mockEarthSystemData = {
  metadata: {
    title: "Test Earth System Data",
    version: "1.0.0-test",
    totalVariables: 2
  },
  models: [
    {
      name: "ECCO",
      fullName: "Test ECCO Model",
      description: "Test ocean model"
    },
    {
      name: "ISSM", 
      fullName: "Test ISSM Model",
      description: "Test ice model"
    }
  ],
  categories: [
    {
      name: "Ocean Variables",
      description: "Test ocean variables"
    },
    {
      name: "Ice Variables", 
      description: "Test ice variables"
    }
  ],
  variables: [
    {
      id: "test1",
      variable: "Test Sea Surface Height",
      category: "Ocean Variables",
      sources: ["TEST-SAT1", "TEST-SAT2"],
      models: ["ECCO"],
      units: "m",
      description: "Test variable 1"
    },
    {
      id: "test2",
      variable: "Test Ice Velocity",
      category: "Ice Variables", 
      sources: ["TEST-SAT3"],
      models: ["ISSM"],
      units: "m/year",
      description: "Test variable 2"
    }
  ]
};

// Setup fetch mock with default responses
beforeEach(() => {
  fetch.mockImplementation((url) => {
    if (url.includes('earth-system-data.json')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(global.mockEarthSystemData)
      });
    }
    
    return Promise.reject(new Error(`Unmocked fetch call to ${url}`));
  });
});

// Error boundary for tests
global.testErrorBoundary = (testFn) => {
  return async () => {
    try {
      await testFn();
    } catch (error) {
      console.error('Test error:', error);
      throw error;
    }
  };
};

// Async test helper
global.waitFor = (condition, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const check = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for condition'));
      } else {
        setTimeout(check, 50);
      }
    };
    
    check();
  });
};

console.log('🧪 Jest testing environment configured for Earth System Model Visualization');