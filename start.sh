#!/bin/bash

# Configuration
PROJECT_ROOT="$PWD"
NODE_BIN="$PROJECT_ROOT/bin/node-v22.12.0-darwin-arm64/bin"
MONGO_BIN="$PROJECT_ROOT/bin/mongodb-macos-aarch64-7.0.4/bin"
export PATH="$NODE_BIN:$MONGO_BIN:$PATH"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to kill child processes on exit
cleanup() {
    echo -e "\n${BLUE}Stopping services...${NC}"
    kill $(jobs -p) 2>/dev/null
    echo -e "${GREEN}Services stopped.${NC}"
    exit
}

trap cleanup SIGINT SIGTERM

echo -e "${BLUE}Starting PharmaTrace System...${NC}"

# 1. Start MongoDB
echo -e "${GREEN}Starting MongoDB...${NC}"
mkdir -p db_data
mongod --dbpath "$PROJECT_ROOT/db_data" --logpath "$PROJECT_ROOT/mongod.log" --fork
if [ $? -ne 0 ]; then
    echo "Failed to start MongoDB. Check mongod.log"
    # Try to continue anyway if it's already running
fi

# 2. Start Backend
echo -e "${GREEN}Starting Backend Server (Port 3000)...${NC}"
cd "$PROJECT_ROOT/server"
npm install # Ensure deps are installed (fast if already done)
node index.js > output.log 2>&1 &
BACKEND_PID=$!

# 3. Start Frontend
echo -e "${GREEN}Starting Frontend (Port 5173)...${NC}"
cd "$PROJECT_ROOT/client"
npm install # Ensure deps are installed
npm run dev &
FRONTEND_PID=$!

echo -e "${BLUE}All systems go!${NC}"
echo -e "Frontend: http://localhost:5173"
echo -e "Backend: http://localhost:3000"
echo -e "Press CTRL+C to stop."

wait
