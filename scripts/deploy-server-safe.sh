#!/bin/bash

# Inteliexamen Safe Server Deployment Script
# This script safely deploys the application to the server with process monitoring

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/opt/inteliexamen"
BACKUP_DIR="/opt/backups/inteliexamen"
LOG_FILE="/var/log/inteliexamen-deploy.log"
MAX_BUILD_TIME=1800  # 30 minutes

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

# Function to kill stuck processes
kill_stuck_processes() {
    log "Checking for stuck processes..."
    
    # Kill any existing Jest worker processes
    local jest_processes=$(ps aux | grep jest-worker | grep -v grep)
    if [ -n "$jest_processes" ]; then
        warning "Found existing Jest worker processes, killing them..."
        local pids=$(echo "$jest_processes" | awk '{print $2}')
        for pid in $pids; do
            kill -9 $pid 2>/dev/null || warning "Failed to kill process $pid"
        done
    fi
    
    # Kill any high CPU Node.js processes running for more than 1 hour
    local high_cpu_processes=$(ps aux | grep node | grep -v grep | awk '$3 > 50 && $10 > "1:00" {print $2}')
    if [ -n "$high_cpu_processes" ]; then
        warning "Found long-running high CPU Node.js processes, killing them..."
        for pid in $high_cpu_processes; do
            kill -9 $pid 2>/dev/null || warning "Failed to kill process $pid"
        done
    fi
    
    log "Process cleanup complete"
}

# Function to check system resources
check_system_resources() {
    log "Checking system resources..."
    
    # Check available disk space
    local disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $disk_usage -gt 90 ]; then
        error "Disk usage is too high: ${disk_usage}%. Please free up space."
    fi
    
    # Check available memory
    local mem_available=$(free -m | awk 'NR==2 {print $7}')
    if [ $mem_available -lt 1000 ]; then
        warning "Low memory available: ${mem_available}MB. Build might be slow."
    fi
    
    # Check CPU load
    local cpu_load=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    if (( $(echo "$cpu_load > 5.0" | bc -l) )); then
        warning "High CPU load: $cpu_load. Build might be slow."
    fi
    
    log "System resources check complete"
}

# Function to clean Docker resources
clean_docker_resources() {
    log "Cleaning Docker resources..."
    
    # Remove unused containers
    docker container prune -f 2>/dev/null || warning "Failed to clean containers"
    
    # Remove unused images
    docker image prune -f 2>/dev/null || warning "Failed to clean images"
    
    # Remove unused volumes
    docker volume prune -f 2>/dev/null || warning "Failed to clean volumes"
    
    # Remove unused networks
    docker network prune -f 2>/dev/null || warning "Failed to clean networks"
    
    log "Docker cleanup complete"
}

# Function to build with timeout and monitoring
build_with_monitoring() {
    log "Starting build with monitoring..."
    
    # Start build in background with timeout
    timeout $MAX_BUILD_TIME docker-compose build --no-cache &
    local build_pid=$!
    
    # Monitor build process
    local build_start=$(date +%s)
    while kill -0 $build_pid 2>/dev/null; do
        local current_time=$(date +%s)
        local elapsed=$((current_time - build_start))
        
        # Check for stuck processes every 30 seconds
        if [ $((elapsed % 30)) -eq 0 ]; then
            local stuck_processes=$(ps aux | grep jest-worker | grep -v grep)
            if [ -n "$stuck_processes" ]; then
                warning "Detected stuck Jest worker processes during build, killing them..."
                local pids=$(echo "$stuck_processes" | awk '{print $2}')
                for pid in $pids; do
                    kill -9 $pid 2>/dev/null || true
                done
            fi
        fi
        
        # Log progress every 2 minutes
        if [ $((elapsed % 120)) -eq 0 ]; then
            log "Build in progress... elapsed: ${elapsed}s"
        fi
        
        sleep 1
    done
    
    # Wait for build to complete and check exit status
    wait $build_pid
    local build_exit_code=$?
    
    if [ $build_exit_code -eq 124 ]; then
        error "Build timed out after ${MAX_BUILD_TIME} seconds"
    elif [ $build_exit_code -ne 0 ]; then
        error "Build failed with exit code $build_exit_code"
    else
        log "Build completed successfully"
    fi
}

# Main deployment function
main() {
    log "Starting safe server deployment..."
    
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
    
    # Navigate to project directory
    cd $PROJECT_DIR || error "Project directory not found: $PROJECT_DIR"
    
    # Check system resources
    check_system_resources
    
    # Kill any stuck processes before starting
    kill_stuck_processes
    
    # Create backup
    log "Creating backup of current deployment..."
    if [ -d "$PROJECT_DIR" ]; then
        tar -czf "$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz" -C "$PROJECT_DIR" .
        log "Backup created successfully"
    else
        warning "No existing deployment found, skipping backup"
    fi
    
    # Stop existing containers
    log "Stopping existing containers..."
    docker-compose down || warning "No containers to stop"
    
    # Clean Docker resources
    clean_docker_resources
    
    # Pull latest changes
    log "Pulling latest changes from Git..."
    git pull origin main || error "Failed to pull latest changes"
    
    # Check environment file
    if [ ! -f ".env" ]; then
        error "Environment file (.env) not found. Please create it with required variables."
    fi
    
    # Build with monitoring
    build_with_monitoring
    
    # Start containers
    log "Starting containers..."
    docker-compose up -d || error "Failed to start containers"
    
    # Wait for services to be ready
    log "Waiting for services to be ready..."
    sleep 30
    
    # Run health check
    log "Running health check..."
    if curl -f http://localhost:3006/api/health > /dev/null 2>&1; then
        log "✅ Deployment successful! Application is healthy."
    else
        warning "⚠️  Application health check failed, but containers are running."
        log "Check container logs: docker-compose logs"
    fi
    
    # Final process check
    kill_stuck_processes
    
    log "Deployment complete!"
}

# Run main function
main "$@" 