#!/bin/bash

# Script to start all RWA web applications
# Ports: 4001 (web-identity), 4002 (web-registry-trusted), 4003 (web-token)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 RWA Web Applications Launcher${NC}"
echo -e "${BLUE}=================================${NC}\n"

# Function to kill process on a port
kill_port() {
    local port=$1
    echo -e "${YELLOW}🔍 Checking port ${port}...${NC}"
    
    if lsof -ti:${port} > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Port ${port} is in use, killing process...${NC}"
        lsof -ti:${port} | xargs kill -9 2>/dev/null || true
        sleep 1
        echo -e "${GREEN}✅ Port ${port} is now free${NC}"
    else
        echo -e "${GREEN}✅ Port ${port} is already free${NC}"
    fi
}

# Kill processes on all ports
echo -e "\n${BLUE}📍 Step 1: Freeing ports...${NC}"
kill_port 4001
kill_port 4002
kill_port 4003

# Wait a bit to ensure ports are free
sleep 2

# Start applications
echo -e "\n${BLUE}📍 Step 2: Starting applications...${NC}\n"

# Start web-identity on port 4001
echo -e "${GREEN}🌐 Starting web-identity on port 4001...${NC}"
cd web-identity
npm run dev -- -p 4001 > ../logs/web-identity.log 2>&1 &
WEB_IDENTITY_PID=$!
echo -e "${GREEN}   PID: ${WEB_IDENTITY_PID}${NC}"
cd ..

sleep 1

# Start web-registry-trusted on port 4002
echo -e "${GREEN}🎫 Starting web-registry-trusted on port 4002...${NC}"
cd web-registry-trusted
npm run dev -- -p 4002 > ../logs/web-registry-trusted.log 2>&1 &
WEB_REGISTRY_PID=$!
echo -e "${GREEN}   PID: ${WEB_REGISTRY_PID}${NC}"
cd ..

sleep 1

# Start web-token on port 4003
echo -e "${GREEN}🪙 Starting web-token on port 4003...${NC}"
cd web-token
npm run dev -- -p 4003 > ../logs/web-token.log 2>&1 &
WEB_TOKEN_PID=$!
echo -e "${GREEN}   PID: ${WEB_TOKEN_PID}${NC}"
cd ..

# Wait for servers to start
echo -e "\n${YELLOW}⏳ Waiting for servers to start...${NC}"
sleep 8

# Check if servers are running
echo -e "\n${BLUE}📍 Step 3: Verifying servers...${NC}\n"

check_server() {
    local port=$1
    local name=$2
    
    if lsof -ti:${port} > /dev/null 2>&1; then
        echo -e "${GREEN}✅ ${name} is running on port ${port}${NC}"
        echo -e "${BLUE}   http://localhost:${port}${NC}"
        return 0
    else
        echo -e "${RED}❌ ${name} failed to start on port ${port}${NC}"
        echo -e "${YELLOW}   Check logs/$(echo ${name} | tr ' ' '-' | tr '[:upper:]' '[:lower:]').log${NC}"
        return 1
    fi
}

check_server 4001 "web-identity"
check_server 4002 "web-registry-trusted"
check_server 4003 "web-token"

# Summary
echo -e "\n${BLUE}=================================${NC}"
echo -e "${GREEN}🎉 All applications started!${NC}\n"

echo -e "${BLUE}📱 Access your applications:${NC}"
echo -e "   🌐 Identity Management:    ${GREEN}http://localhost:4001${NC}"
echo -e "   🎫 Issuer Registry:        ${GREEN}http://localhost:4002${NC}"
echo -e "   🪙 Token Factory:          ${GREEN}http://localhost:4003${NC}"

echo -e "\n${BLUE}📊 Process IDs:${NC}"
echo -e "   web-identity:         ${WEB_IDENTITY_PID}"
echo -e "   web-registry-trusted: ${WEB_REGISTRY_PID}"
echo -e "   web-token:            ${WEB_TOKEN_PID}"

echo -e "\n${BLUE}📝 Logs:${NC}"
echo -e "   tail -f logs/web-identity.log"
echo -e "   tail -f logs/web-registry-trusted.log"
echo -e "   tail -f logs/web-token.log"

echo -e "\n${BLUE}🛑 To stop all servers:${NC}"
echo -e "   ./stop-all.sh"
echo -e "   or: kill ${WEB_IDENTITY_PID} ${WEB_REGISTRY_PID} ${WEB_TOKEN_PID}"

echo -e "\n${BLUE}=================================${NC}\n"

# Save PIDs to file for stop script
echo "${WEB_IDENTITY_PID}" > .pids/web-identity.pid
echo "${WEB_REGISTRY_PID}" > .pids/web-registry-trusted.pid
echo "${WEB_TOKEN_PID}" > .pids/web-token.pid

echo -e "${GREEN}✨ Ready to use!${NC}\n"

