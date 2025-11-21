#!/bin/bash

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Emojis
STOP="🛑"
DATABASE="🗄️ "
SERVER="⚡"
CHECK="✅"
INFO="ℹ️ "

# Function to print colored banner
print_banner() {
    echo -e "${CYAN}${BOLD}"
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║                                                        ║"
    echo "║           CONDUCTOR TOOL - Service Stopper            ║"
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
    local service_name=$2
    local pids=$(lsof -ti:$port)
    if [ ! -z "$pids" ]; then
        echo "$pids" | xargs kill -9
        print_success "$service_name stopped (port $port)"
    else
        print_info "$service_name not running on port $port"
    fi
}

# Clear screen and show banner
clear
print_banner

# Stop backend server
print_step "${SERVER} Stopping backend server..."
if check_port 8081; then
    kill_port 8081 "Backend server"
else
    print_info "Backend server not running"
fi

echo ""

# Stop database
print_step "${DATABASE} Stopping PostgreSQL database..."
npm run db:stop > /dev/null 2>&1

# Wait a moment for cleanup
sleep 1

if check_port 5433; then
    print_info "Database container still running, force killing..."
    kill_port 5433 "Database"
else
    print_success "Database stopped"
fi

echo ""
echo -e "${GREEN}${BOLD}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║                                                        ║${NC}"
echo -e "${GREEN}${BOLD}║  ${STOP}  ALL SERVICES STOPPED!                           ║${NC}"
echo -e "${GREEN}${BOLD}║                                                        ║${NC}"
echo -e "${GREEN}${BOLD}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
