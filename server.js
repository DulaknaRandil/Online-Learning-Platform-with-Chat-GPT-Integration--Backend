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

const App = require('./src/app');

// Create the application instance
const appInstance = new App();

// For Vercel deployment, export the Express app directly
module.exports = appInstance.app;

// Start the server only if this file is run directly (not when imported)
if (require.main === module) {
  appInstance.start().catch((error) => {
    console.error('Failed to start application:', error);
    process.exit(1);
  });
}
