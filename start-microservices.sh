#!/bin/bash

# PharmaTrace Microservices Startup Script
# This script starts all microservices for local development

echo "🚀 Starting PharmaTrace Microservices..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base directory
BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVICES_DIR="$BASE_DIR/services"

# Check if .env exists
if [ ! -f "$BASE_DIR/.env" ]; then
    echo -e "${RED}Error: .env file not found in $BASE_DIR${NC}"
    exit 1
fi

# Function to start a service
start_service() {
    local service_name=$1
    local service_dir=$2
    local port=$3
    
    echo -e "${YELLOW}Starting $service_name on port $port...${NC}"
    cd "$service_dir"
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        echo "  Installing dependencies..."
        npm install > /dev/null 2>&1
    fi
    
    # Start the service in background - No longer saving logs to files
    npm start > /dev/null 2>&1 &
    echo $! > "$service_name.pid"
    echo -e "${GREEN}  ✓ $service_name started (PID: $(cat $service_name.pid))${NC}"
}

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    
    for service in auth-service product-service tracking-service api-gateway; do
        if [ -f "$SERVICES_DIR/$service/$service.pid" ]; then
            pid=$(cat "$SERVICES_DIR/$service/$service.pid")
            if kill -0 $pid 2>/dev/null; then
                kill $pid
                echo -e "${GREEN}  ✓ Stopped $service${NC}"
            fi
            rm "$SERVICES_DIR/$service/$service.pid"
        fi
    done
    
    echo -e "${GREEN}All services stopped.${NC}"
    exit 0
}

# Trap SIGINT and SIGTERM
trap cleanup SIGINT SIGTERM

# Start MongoDB if using local (comment out if using Atlas)
# echo -e "${YELLOW}Starting MongoDB...${NC}"
# mongod --dbpath "$BASE_DIR/db_data" --fork --logpath "$BASE_DIR/mongod.log"

# Start microservices
start_service "auth-service" "$SERVICES_DIR/auth-service" 3001
sleep 1
start_service "product-service" "$SERVICES_DIR/product-service" 3002
sleep 1
start_service "tracking-service" "$SERVICES_DIR/tracking-service" 3003
sleep 1
start_service "api-gateway" "$SERVICES_DIR/api-gateway" 3000

echo ""
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  PharmaTrace Microservices Running!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo ""
echo "  API Gateway:      http://localhost:3000"
echo "  Auth Service:     http://localhost:3001"
echo "  Product Service:  http://localhost:3002"
echo "  Tracking Service: http://localhost:3003"
echo ""
echo "  Health Check:     http://localhost:3000/health"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Wait for all background jobs
wait
