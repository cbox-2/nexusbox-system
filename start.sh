#!/bin/bash

echo "🚀 Starting NexusBox..."
echo ""

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB not running. Starting..."
    mongod --dbpath ~/data/db --fork --logpath ~/mongodb.log
    sleep 2
fi

# Start server
echo "✅ Starting server..."
node server.js
