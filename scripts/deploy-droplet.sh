#!/bin/bash

# Deployment Script for DigitalOcean Droplet
# 
# This script automates the deployment process to a DigitalOcean Droplet.
# 
# Usage:
#   chmod +x scripts/deploy-droplet.sh
#   ./scripts/deploy-droplet.sh user@159.223.195.1

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DROPLET_IP="${1:-159.223.195.1}"
DROPLET_USER="${2:-appuser}"
APP_DIR="/home/${DROPLET_USER}/my-awesome-app"
APP_NAME="my-awesome-app"

echo -e "${BLUE}🚀 Starting deployment to Droplet ${DROPLET_IP}${NC}"

# Check if SSH connection works
echo -e "${YELLOW}📡 Testing SSH connection...${NC}"
if ! ssh -o ConnectTimeout=5 "${DROPLET_USER}@${DROPLET_IP}" "echo 'Connection successful'" 2>/dev/null; then
    echo -e "${RED}❌ Error: Cannot connect to ${DROPLET_USER}@${DROPLET_IP}${NC}"
    echo -e "${YELLOW}💡 Make sure:${NC}"
    echo "   1. SSH key is added to the Droplet"
    echo "   2. User '${DROPLET_USER}' exists on the server"
    echo "   3. IP address is correct: ${DROPLET_IP}"
    exit 1
fi

echo -e "${GREEN}✅ SSH connection successful${NC}"

# Deploy application
echo -e "${BLUE}📦 Deploying application...${NC}"
ssh "${DROPLET_USER}@${DROPLET_IP}" << 'ENDSSH'
    set -e
    cd /home/appuser/my-awesome-app || exit 1
    
    echo "📥 Pulling latest changes..."
    git pull origin master || git pull origin main
    
    echo "📦 Installing dependencies..."
    pnpm install --production=false
    
    echo "🔨 Building application..."
    pnpm build
    
    echo "🗄️  Running database migrations..."
    node ace migration:run
    
    echo "🔄 Restarting application..."
    pm2 restart my-awesome-app || pm2 start ecosystem.config.js
    
    echo "✅ Deployment complete!"
    pm2 status
ENDSSH

echo -e "${GREEN}🎉 Deployment successful!${NC}"
echo -e "${YELLOW}💡 Next steps:${NC}"
echo "   1. Create admin user: ssh ${DROPLET_USER}@${DROPLET_IP} 'cd ${APP_DIR} && node ace create:admin admin@example.com'"
echo "   2. Check logs: ssh ${DROPLET_USER}@${DROPLET_IP} 'pm2 logs ${APP_NAME}'"
echo "   3. Check status: ssh ${DROPLET_USER}@${DROPLET_IP} 'pm2 status'"
