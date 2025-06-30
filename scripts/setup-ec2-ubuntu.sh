#!/bin/bash

# Inteliexamen EC2 Ubuntu Setup Script
# This script sets up a fresh Ubuntu EC2 instance for deployment

set -e

echo "🔧 Setting up Ubuntu EC2 instance for Inteliexamen..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/home/ec2-user/inteliexamen-web"
USER="ec2-user"

# Function to log messages
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    error "Please run as root or with sudo"
fi

log "Updating system packages..."
apt update && apt upgrade -y

log "Installing required packages..."
apt install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    nginx \
    certbot \
    python3-certbot-nginx

log "Installing Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install -y docker-ce docker-ce-cli containerd.io

log "Installing Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

log "Adding user to docker group..."
usermod -aG docker $USER

log "Creating project directory..."
mkdir -p $PROJECT_DIR
chown $USER:$USER $PROJECT_DIR

log "Setting up firewall..."
ufw allow ssh
ufw allow 80
ufw allow 443
ufw allow 3006
ufw --force enable

log "Setting up Nginx..."
cat > /etc/nginx/sites-available/inteliexamen << 'EOF'
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://localhost:3006;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/inteliexamen /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

log "Setting up SSL with Let's Encrypt..."
# Note: You'll need to replace 'your-domain.com' with your actual domain
# certbot --nginx -d your-domain.com --non-interactive --agree-tos --email your-email@example.com

log "Creating systemd service for auto-restart..."
cat > /etc/systemd/system/inteliexamen.service << EOF
[Unit]
Description=Inteliexamen Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$PROJECT_DIR
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl enable inteliexamen.service

log "Setting up log rotation..."
cat > /etc/logrotate.d/inteliexamen << EOF
$PROJECT_DIR/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
}
EOF

log "Creating monitoring script..."
cat > /usr/local/bin/monitor-inteliexamen << 'EOF'
#!/bin/bash
# Simple monitoring script for Inteliexamen

PROJECT_DIR="/home/ec2-user/inteliexamen-web"
LOG_FILE="/var/log/inteliexamen-monitor.log"

cd $PROJECT_DIR

# Check if containers are running
if ! docker-compose ps | grep -q "Up"; then
    echo "$(date): Containers not running, restarting..." >> $LOG_FILE
    docker-compose up -d
fi

# Check application health
if ! curl -f http://localhost:3006/api/health > /dev/null 2>&1; then
    echo "$(date): Health check failed, restarting..." >> $LOG_FILE
    docker-compose restart app
fi
EOF

chmod +x /usr/local/bin/monitor-inteliexamen

# Add to crontab for monitoring every 5 minutes
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/monitor-inteliexamen") | crontab -

log "Setting up backup script..."
cat > /usr/local/bin/backup-inteliexamen << 'EOF'
#!/bin/bash
# Backup script for Inteliexamen

PROJECT_DIR="/home/ec2-user/inteliexamen-web"
BACKUP_DIR="/opt/backups/inteliexamen"
DATE=$(date +%Y%m%d-%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
cd $PROJECT_DIR
docker-compose exec -T db mysqldump -u root -p$DB_ROOT_PASSWORD $DB_NAME > $BACKUP_DIR/db-backup-$DATE.sql

# Backup application files
tar -czf $BACKUP_DIR/app-backup-$DATE.tar.gz -C $PROJECT_DIR .

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /usr/local/bin/backup-inteliexamen

# Add to crontab for daily backups at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-inteliexamen") | crontab -

log "EC2 Ubuntu setup completed successfully! 🎉"
log ""
log "Next steps:"
log "1. Clone your repository to $PROJECT_DIR"
log "2. Create .env file with your environment variables"
log "3. Run the deployment script: ./scripts/deploy.sh"
log "4. Configure your domain DNS to point to this server"
log "5. Run: certbot --nginx -d your-domain.com"
log ""
log "Useful commands:"
log "- Check status: docker-compose ps"
log "- View logs: docker-compose logs -f"
log "- Restart: docker-compose restart"
log "- Monitor: tail -f /var/log/inteliexamen-monitor.log"
log ""
log "Application will be available at:"
log "- Direct access: http://your-ip:3006"
log "- Through nginx: http://your-domain.com" 