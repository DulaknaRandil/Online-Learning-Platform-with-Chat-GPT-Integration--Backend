/**
 * Jest Setup File
 * 
 * This file runs before all tests to set up the test environment.
 */

// Suppress punycode deprecation warning in tests
process.removeAllListeners('warning');
process.on('warning', (warning) => {
  if (warning.name === 'DeprecationWarning' && 
      (warning.message.includes('punycode') || warning.code === 'DEP0040')) {
    // Suppress punycode deprecation warning (DEP0040)
    return;
  }
  // Log other warnings
  console.warn(`${warning.name}: ${warning.message}`);
});

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = 5001; // Use a different port for tests
process.env.JWT_SECRET = 'test-secret-key';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/online-learning-test';

// Global test setup
beforeAll(async () => {
  // Global setup that runs once before all tests
});

// Global test teardown
afterAll(async () => {
  // Global cleanup that runs once after all tests
});
