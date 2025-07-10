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

// Create and start the application
const app = new App();

// Start the server
if (require.main === module) {
  app.start().catch((error) => {
    console.error('Failed to start application:', error);
    process.exit(1);
  });
}

module.exports = app;
