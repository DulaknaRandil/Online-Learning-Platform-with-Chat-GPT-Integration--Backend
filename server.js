// Suppress punycode deprecation warning
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

let app;

try {
  const App = require('./src/app');
  
  // Create the application instance
  const appInstance = new App();
  app = appInstance.app;
  
  // For Vercel deployment, export the Express app directly
  module.exports = app;
  
  // Start the server only if this file is run directly (not when imported)
  if (require.main === module) {
    appInstance.start().catch((error) => {
      console.error('Failed to start application:', error);
      process.exit(1);
    });
  }
} catch (error) {
  console.error('❌ Failed to initialize application:', error.message);
  console.error('Full error:', error);
  
  // Create a minimal error app for debugging
  const express = require('express');
  app = express();
  
  // Enable CORS for the error app
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });
  
  app.get('*', (req, res) => {
    res.status(500).json({
      error: 'Server initialization failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  });
  
  module.exports = app;
}
