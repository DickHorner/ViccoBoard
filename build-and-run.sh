#!/bin/bash
# ViccoBoard Build and Demo Script

echo "🎓 ViccoBoard - Build and Demo"
echo "============================================================"

# Install dependencies at root (handles all workspaces)
echo ""
echo "📦 Installing dependencies..."
npm ci

# Build all packages using workspace command
echo ""
echo "🔨 Building packages..."
npm run build

# Run demo
echo ""
echo "🚀 Running demo..."
echo "============================================================"
echo ""

cd apps/demo && npm start

echo ""
echo "✨ Complete!"

