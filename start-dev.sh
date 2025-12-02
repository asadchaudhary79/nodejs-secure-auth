#!/bin/bash

# Start both Node.js server and Inngest dev server
# Usage: ./start-dev.sh

echo "🚀 Starting Node.js Secure Auth with Inngest..."
echo ""
echo "Starting servers in parallel..."
echo ""

# Start Node.js server in background
npm run dev &
NODE_PID=$!

# Start Inngest dev server in background
npm run dev:inngest &
INNGEST_PID=$!

echo "✅ Node.js server started (PID: $NODE_PID)"
echo "✅ Inngest dev server started (PID: $INNGEST_PID)"
echo ""
echo "📝 Server URLs:"
echo "   - API Server: http://localhost:5000"
echo "   - Inngest Dev: http://localhost:8288"
echo "   - Inngest Endpoint: http://localhost:5000/api/inngest"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait $NODE_PID $INNGEST_PID

