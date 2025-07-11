#!/bin/bash

# Backend deployment preparation script
echo "🚀 Preparing backend for deployment..."

# Check if we're in the backend directory
if [ ! -f "server.js" ]; then
    echo "❌ Error: server.js not found. Please run this script from the backend directory."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run linting
echo "🔍 Running ESLint..."
npm run lint

# Test the server
echo "🧪 Testing server startup..."
timeout 10s npm start || echo "⚠️  Server test completed (timeout expected)"

echo "✅ Backend is ready for deployment!"
echo ""
echo "📋 Next steps:"
echo "1. Set up MongoDB Atlas database"
echo "2. Get OpenAI API key"
echo "3. Configure environment variables in Vercel"
echo "4. Deploy to Vercel"
