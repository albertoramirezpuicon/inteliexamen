#!/bin/bash

# Inteliexamen Deployment Script
# This script deploys the application to EC2

set -e

echo "🚀 Starting Inteliexamen deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/opt/inteliexamen"
BACKUP_DIR="/opt/backups/inteliexamen"
LOG_FILE="/var/log/inteliexamen-deploy.log"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Function to log messages
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a $LOG_FILE
    exit 1
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a $LOG_FILE
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    error "Please run as root or with sudo"
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    error "Docker is not installed"
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose is not installed"
fi

log "Creating backup of current deployment..."
if [ -d "$PROJECT_DIR" ]; then
    tar -czf "$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz" -C "$PROJECT_DIR" .
    log "Backup created successfully"
else
    warning "No existing deployment found, skipping backup"
fi

log "Stopping existing containers..."
cd $PROJECT_DIR
docker-compose down || warning "No containers to stop"

log "Pulling latest changes from Git..."
git pull origin main || error "Failed to pull latest changes"

log "Checking environment file..."
if [ ! -f ".env" ]; then
    error "Environment file (.env) not found. Please create it with required variables."
fi

log "Building and starting containers..."
docker-compose up -d --build || error "Failed to build and start containers"

log "Waiting for services to be ready..."
sleep 30

log "Running health check..."
if curl -f http://localhost:3006/api/health > /dev/null 2>&1; then
    log "Health check passed!"
else
    error "Health check failed. Application may not be running properly."
fi

log "Cleaning up old Docker images..."
docker image prune -f

log "Deployment completed successfully! 🎉"
log "Application is available at: http://localhost:3006"
log "Health check: http://localhost:3006/api/health"

# Show container status
echo ""
log "Container status:"
docker-compose ps 