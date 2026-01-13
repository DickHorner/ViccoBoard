#!/bin/bash
# ViccoBoard Build and Demo Script

echo "🎓 ViccoBoard - Build and Demo"
echo "============================================================"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."

echo "  - Installing packages/core..."
cd packages/core && npm install && cd ../..

echo "  - Installing packages/plugins..."
cd packages/plugins && npm install && cd ../..

echo "  - Installing packages/storage..."
cd packages/storage && npm install && cd ../..

echo "  - Installing modules/sport..."
cd modules/sport && npm install && cd ../..

echo "  - Installing apps/demo..."
cd apps/demo && npm install && cd ../..

# Build packages
echo ""
echo "🔨 Building packages..."

echo "  - Building packages/core..."
cd packages/core && npm run build && cd ../..

echo "  - Building packages/plugins..."
cd packages/plugins && npm run build && cd ../..

echo "  - Building packages/storage..."
cd packages/storage && npm run build && cd ../..

echo "  - Building modules/sport..."
cd modules/sport && npm run build && cd ../..

echo "  - Building apps/demo..."
cd apps/demo && npm run build && cd ../..

# Run demo
echo ""
echo "🚀 Running demo..."
echo "============================================================"
echo ""

cd apps/demo && npm start && cd ../..

echo ""
echo "✨ Complete!"
