#!/bin/bash

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Emojis
ROCKET="🚀"
DATABASE="🗄️ "
SERVER="⚡"
CHECK="✅"
CROSS="❌"
INFO="ℹ️ "

# Function to print colored banner
print_banner() {
    echo -e "${CYAN}${BOLD}"
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║                                                        ║"
    echo "║           CONDUCTOR TOOL - Service Starter            ║"
    echo "║                                                        ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Function to print step
print_step() {
    echo -e "${BLUE}${BOLD}▶ $1${NC}"
}

# Function to print success
print_success() {
    echo -e "${GREEN}${CHECK} $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}${CROSS} $1${NC}"
}

# Function to print info
print_info() {
    echo -e "${YELLOW}${INFO} $1${NC}"
}

# Function to check if port is in use
check_port() {
    lsof -ti:$1 > /dev/null 2>&1
}

# Function to kill process on port
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port)
    if [ ! -z "$pids" ]; then
        echo "$pids" | xargs kill -9
        print_info "Killed process on port $port"
    fi
}

# Cleanup function
cleanup() {
    echo ""
    print_step "Shutting down services..."

    # Kill backend server
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        print_info "Backend server stopped"
    fi

    # Stop database
    print_step "Stopping database..."
    npm run db:stop > /dev/null 2>&1

    print_success "All services stopped"
    exit 0
}

# Register cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Clear screen and show banner
clear
print_banner

# Check if ports are already in use
print_step "Checking ports..."
if check_port 5433; then
    print_error "Port 5433 (Database) is already in use"
    print_info "Attempting to stop existing database container..."
    npm run db:stop > /dev/null 2>&1
    sleep 2

    if check_port 5433; then
        print_info "Port still busy after compose stop, killing local process..."
        kill_port 5433
    fi
fi

if check_port 8081; then
    print_error "Port 8081 (Backend) is already in use"
    print_info "Killing existing process..."
    kill_port 8081
fi

print_success "Ports are available"
echo ""

# Start database
print_step "${DATABASE} Starting PostgreSQL database..."
npm run db:start > /dev/null 2>&1 &
DB_PID=$!

# Wait for database to be ready
sleep 3

if check_port 5433; then
    print_success "Database started on port 5433"
else
    print_error "Failed to start database"
    exit 1
fi

echo ""

# Start backend server
print_step "${SERVER} Starting backend server..."
cd backend
node src/server.js 2>&1 | while IFS= read -r line; do
    echo -e "${MAGENTA}[BACKEND]${NC} $line"
done &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
sleep 2

if check_port 8081; then
    print_success "Backend server started on port 8081"
else
    print_error "Failed to start backend server"
    exit 1
fi

echo ""
echo -e "${GREEN}${BOLD}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║                                                        ║${NC}"
echo -e "${GREEN}${BOLD}║  ${ROCKET}  ALL SERVICES RUNNING!                            ║${NC}"
echo -e "${GREEN}${BOLD}║                                                        ║${NC}"
echo -e "${GREEN}${BOLD}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
print_info "Database:       ${CYAN}http://localhost:5433${NC}"
print_info "Backend API:    ${CYAN}http://localhost:8081${NC}"
print_info "Dev Login:      ${CYAN}http://localhost:8081/dev-login${NC}"
print_info "Standup Tool:   ${CYAN}http://localhost:8081/html/standup/index.html${NC}"
echo ""
print_info "Press ${BOLD}Ctrl+C${NC} to stop all services"
echo ""
echo -e "${YELLOW}${BOLD}════════════════════ SERVER LOGS ═══════════════════════${NC}"
echo ""

# Keep script running
wait $BACKEND_PID
