#!/bin/bash

# Deployment Script for DigitalOcean
# 
# This script automates the deployment process after initial server setup.
# 
# Usage:
#   chmod +x scripts/deploy.sh
#   ./scripts/deploy.sh

set -e  # Exit on error

echo "🚀 Starting deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/home/appuser/my-awesome-app"
APP_NAME="my-awesome-app"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Navigate to application directory
cd "$APP_DIR" || {
    echo -e "${RED}Error: Application directory not found at $APP_DIR${NC}"
    exit 1
}

echo -e "${GREEN}📦 Pulling latest changes...${NC}"
git pull origin main || git pull origin master

echo -e "${GREEN}📥 Installing dependencies...${NC}"
pnpm install --production=false

echo -e "${GREEN}🔨 Building application...${NC}"
pnpm build

echo -e "${GREEN}🗄️  Running database migrations...${NC}"
node ace migration:run

echo -e "${GREEN}🔄 Restarting application...${NC}"
pm2 restart "$APP_NAME" || pm2 start ecosystem.config.js

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${YELLOW}📊 Checking application status...${NC}"
pm2 status

echo -e "${GREEN}🎉 Deployment successful!${NC}"
echo -e "${YELLOW}💡 View logs with: pm2 logs $APP_NAME${NC}"
