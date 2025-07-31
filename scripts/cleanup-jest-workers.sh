#!/bin/bash

# Smart Jest Worker Cleanup Script
# This script intelligently cleans up Jest worker processes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to log messages
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Function to check if Jest workers are actively working
check_jest_workers_activity() {
    local jest_processes=$(ps aux | grep jest-worker | grep -v grep)
    
    if [ -n "$jest_processes" ]; then
        log "Found Jest worker processes:"
        echo "$jest_processes"
        
        # Check if any are running for more than 10 minutes (likely stuck)
        local stuck_processes=$(echo "$jest_processes" | awk '$10 > "10:00" {print $0}')
        
        if [ -n "$stuck_processes" ]; then
            warning "Found Jest worker processes running for more than 10 minutes (likely stuck):"
            echo "$stuck_processes"
            
            # Kill stuck processes
            local stuck_pids=$(echo "$stuck_processes" | awk '{print $2}')
            for pid in $stuck_pids; do
                log "Killing stuck Jest worker process PID: $pid"
                kill -9 $pid 2>/dev/null || warning "Failed to kill process $pid"
            done
            
            return 1
        else
            log "Jest worker processes appear to be actively working (running for less than 10 minutes)"
            return 0
        fi
    else
        log "No Jest worker processes found"
        return 0
    fi
}

# Function to force cleanup all Jest workers (use after build completion)
force_cleanup_jest_workers() {
    local jest_processes=$(ps aux | grep jest-worker | grep -v grep)
    
    if [ -n "$jest_processes" ]; then
        log "Force cleaning up all Jest worker processes after build completion:"
        echo "$jest_processes"
        
        # Kill all Jest worker processes
        local pids=$(echo "$jest_processes" | awk '{print $2}')
        for pid in $pids; do
            log "Killing Jest worker process PID: $pid"
            kill -9 $pid 2>/dev/null || warning "Failed to kill process $pid"
        done
        
        log "All Jest worker processes cleaned up"
    else
        log "No Jest worker processes to clean up"
    fi
}

# Function to wait for Jest workers to finish naturally (with timeout)
wait_for_jest_workers() {
    local timeout_seconds=300  # 5 minutes
    local elapsed=0
    
    log "Waiting for Jest worker processes to finish naturally (timeout: ${timeout_seconds}s)..."
    
    while [ $elapsed -lt $timeout_seconds ]; do
        local jest_processes=$(ps aux | grep jest-worker | grep -v grep)
        
        if [ -z "$jest_processes" ]; then
            log "All Jest worker processes finished naturally"
            return 0
        fi
        
        sleep 5
        elapsed=$((elapsed + 5))
        
        if [ $((elapsed % 30)) -eq 0 ]; then
            log "Still waiting... elapsed: ${elapsed}s"
        fi
    done
    
    warning "Timeout reached, forcing cleanup of remaining Jest worker processes"
    force_cleanup_jest_workers
    return 1
}

# Main function
main() {
    local action=${1:-"check"}
    
    case $action in
        "check")
            log "Checking Jest worker processes..."
            check_jest_workers_activity
            ;;
        "wait")
            log "Waiting for Jest workers to finish..."
            wait_for_jest_workers
            ;;
        "force")
            log "Force cleaning up all Jest workers..."
            force_cleanup_jest_workers
            ;;
        "smart")
            log "Smart cleanup: checking first, then waiting, then forcing..."
            check_jest_workers_activity
            if [ $? -eq 1 ]; then
                log "Stuck processes found and killed"
            else
                wait_for_jest_workers
            fi
            ;;
        *)
            echo "Usage: $0 {check|wait|force|smart}"
            echo "  check - Check for stuck Jest worker processes"
            echo "  wait  - Wait for Jest workers to finish naturally"
            echo "  force - Force kill all Jest worker processes"
            echo "  smart - Smart cleanup (check, wait, then force)"
            exit 1
            ;;
    esac
}

# Run main function
main "$@" 