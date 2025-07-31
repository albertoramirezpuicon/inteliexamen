#!/bin/bash

# Inteliexamen Process Monitor
# This script monitors for stuck Jest worker processes and kills them

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Change log file to project directory to avoid permission issues
LOG_FILE="/home/ubuntu/inteliexamen-web/logs/monitor.log"

# Create logs directory if it doesn't exist
mkdir -p /home/ubuntu/inteliexamen-web/logs

# Function to log messages
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a $LOG_FILE
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a $LOG_FILE
}

# Check for stuck Jest worker processes
check_jest_processes() {
    local jest_processes=$(ps aux | grep jest-worker | grep -v grep)
    
    if [ -n "$jest_processes" ]; then
        warning "Found Jest worker processes running:"
        echo "$jest_processes"
        
        # Kill Jest worker processes
        local pids=$(echo "$jest_processes" | awk '{print $2}')
        for pid in $pids; do
            log "Killing Jest worker process PID: $pid"
            kill -9 $pid 2>/dev/null || warning "Failed to kill process $pid"
        done
        
        return 1
    else
        log "No Jest worker processes found"
        return 0
    fi
}

# Check for high CPU usage Node.js processes
check_high_cpu_processes() {
    local high_cpu_processes=$(ps aux | grep node | grep -v grep | awk '$3 > 50 {print $0}')
    
    if [ -n "$high_cpu_processes" ]; then
        warning "Found Node.js processes with high CPU usage (>50%):"
        echo "$high_cpu_processes"
        
        # Check if any are running for more than 1 hour
        local long_running=$(echo "$high_cpu_processes" | awk '$10 > "1:00" {print $0}')
        
        if [ -n "$long_running" ]; then
            warning "Found long-running high CPU processes:"
            echo "$long_running"
            
            # Kill long-running high CPU processes
            local pids=$(echo "$long_running" | awk '{print $2}')
            for pid in $pids; do
                log "Killing long-running high CPU process PID: $pid"
                kill -9 $pid 2>/dev/null || warning "Failed to kill process $pid"
            done
        fi
        
        return 1
    else
        log "No high CPU usage Node.js processes found"
        return 0
    fi
}

# Check Docker container health
check_docker_health() {
    if command -v docker &> /dev/null; then
        local container_status=$(docker ps --filter "name=inteliexamen-web-container" --format "table {{.Names}}\t{{.Status}}")
        
        if [ -n "$container_status" ]; then
            log "Docker container status:"
            echo "$container_status"
        else
            warning "Inteliexamen container not found"
        fi
    else
        log "Docker not available"
    fi
}

# Main monitoring function
main() {
    log "Starting Inteliexamen process monitoring..."
    
    local issues_found=0
    
    # Check for Jest worker processes
    if ! check_jest_processes; then
        issues_found=$((issues_found + 1))
    fi
    
    # Check for high CPU processes
    if ! check_high_cpu_processes; then
        issues_found=$((issues_found + 1))
    fi
    
    # Check Docker health
    check_docker_health
    
    if [ $issues_found -eq 0 ]; then
        log "All systems healthy - no issues found"
    else
        warning "Found $issues_found issue(s) - check logs for details"
    fi
    
    log "Monitoring complete"
}

# Run main function
main "$@" 