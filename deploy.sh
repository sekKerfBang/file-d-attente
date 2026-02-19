#!/bin/bash
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENV=${1:-staging}
VERSION=${2:-latest}
NODE_VERSION="20.20.0"
COMPOSE_FILE="docker-compose.prod.yml"

echo -e "${BLUE}🚀 ClinicQueue Deployment Script${NC}"
echo -e "${BLUE}=================================${NC}"
echo -e "Environment: ${YELLOW}$ENV${NC}"
echo -e "Version: ${YELLOW}$VERSION${NC}"
echo -e "Node Version: ${YELLOW}$NODE_VERSION${NC}"
echo ""

# Check Node version locally
if command -v node &> /dev/null; then
    LOCAL_NODE=$(node -v | cut -d'v' -f2)
    if [ "$LOCAL_NODE" != "$NODE_VERSION" ]; then
        echo -e "${YELLOW}⚠️  Warning: Local Node version is $LOCAL_NODE, expected $NODE_VERSION${NC}"
        echo -e "${YELLOW}   Use: nvm install $NODE_VERSION && nvm use $NODE_VERSION${NC}"
    else
        echo -e "${GREEN}✓ Node version $NODE_VERSION confirmed${NC}"
    fi
fi

# Verify required files
echo -e "${BLUE}📋 Checking required files...${NC}"
required_files=(
    "frontend-react/Dockerfile"
    "backend-django6/Dockerfile"
    "$COMPOSE_FILE"
    ".env.$ENV"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Missing file: $file${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✓ All required files present${NC}"

# Load environment variables
echo -e "${BLUE}🔐 Loading environment...${NC}"
export $(grep -v '^#' .env.$ENV | xargs)
export GITHUB_REPOSITORY="${GITHUB_REPOSITORY:-local/clinic-queue}"
export NODE_VERSION=$NODE_VERSION

# Pre-deployment checks
echo -e "${BLUE}🏥 Running health checks...${NC}"

# Check Docker
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker is running${NC}"

# Check disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 85 ]; then
    echo -e "${RED}❌ Disk usage is at ${DISK_USAGE}%. Cleanup required.${NC}"
    docker system prune -f
fi
echo -e "${GREEN}✓ Disk space OK (${DISK_USAGE}%)${NC}"

# Backup database
echo -e "${BLUE}💾 Creating database backup...${NC}"
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR
BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).sql"

if docker-compose -f $COMPOSE_FILE ps | grep -q "db.*Up"; then
    docker-compose -f $COMPOSE_FILE exec -T db pg_dump -U ${DB_USER:-clinic_user} ${DB_NAME:-clinic_db} > "$BACKUP_FILE"
    echo -e "${GREEN}✓ Backup created: $BACKUP_FILE${NC}"
else
    echo -e "${YELLOW}⚠️  Database not running, skipping backup${NC}"
fi

# Build frontend with Node 20.20.0
echo -e "${BLUE}🏗️  Building Frontend (Node $NODE_VERSION)...${NC}"
cd frontend-react

# Create .nvmrc if not exists
echo "$NODE_VERSION" > .nvmrc

# Install and build
if command -v nvm &> /dev/null; then
    nvm install $NODE_VERSION
    nvm use $NODE_VERSION
fi

npm ci
npm run build:prod
cd ..
echo -e "${GREEN}✓ Frontend build complete${NC}"

# Pull and build images
echo -e "${BLUE}🐳 Building Docker images...${NC}"
docker-compose -f $COMPOSE_FILE build --no-cache frontend
docker-compose -f $COMPOSE_FILE pull backend

# Run database migrations
echo -e "${BLUE}🔄 Running database migrations...${NC}"
docker-compose -f $COMPOSE_FILE run --rm backend python manage.py migrate --noinput
docker-compose -f $COMPOSE_FILE run --rm backend python manage.py collectstatic --noinput

# Deploy with zero downtime
echo -e "${BLUE}🚀 Deploying services...${NC}"
docker-compose -f $COMPOSE_FILE up -d --remove-orphans

# Wait for services
echo -e "${BLUE}⏳ Waiting for services to start...${NC}"
sleep 10

# Health checks
echo -e "${BLUE}🏥 Performing health checks...${NC}"

HEALTH_RETRIES=5
HEALTH_DELAY=5

check_service() {
    local name=$1
    local url=$2
    local retries=$HEALTH_RETRIES
    
    while [ $retries -gt 0 ]; do
        if curl -sf "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ $name is healthy${NC}"
            return 0
        fi
        retries=$((retries - 1))
        echo -e "${YELLOW}  Retrying $name... ($retries attempts left)${NC}"
        sleep $HEALTH_DELAY
    done
    
    echo -e "${RED}❌ $name failed health check${NC}"
    return 1
}

# Check services
check_service "Frontend" "http://localhost/health" || exit 1
check_service "Backend API" "http://localhost:8000/api/health/" || exit 1
check_service "Traefik" "http://localhost:8080/ping" || true

# Check WebSocket
echo -e "${BLUE}🔌 Testing WebSocket connection...${NC}"
if timeout 5 bash -c '</dev/tcp/localhost/8000' 2>/dev/null; then
    echo -e "${GREEN}✓ WebSocket port is open${NC}"
else
    echo -e "${YELLOW}⚠️  WebSocket port check inconclusive${NC}"
fi

# Final status
echo ""
echo -e "${GREEN}🎉 Deployment successful!${NC}"
echo -e "${BLUE}=================================${NC}"
echo -e "Environment: ${GREEN}$ENV${NC}"
echo -e "Version: ${GREEN}$VERSION${NC}"
echo -e ""
echo -e "URLs:"
echo -e "  • Application: ${YELLOW}https://clinique.fr${NC}"
echo -e "  • API: ${YELLOW}https://api.clinique.fr${NC}"
echo -e "  • Grafana: ${YELLOW}https://grafana.clinique.fr${NC}"
echo -e "  • Traefik: ${YELLOW}https://monitor.clinique.fr${NC}"
echo ""
echo -e "Commands:"
echo -e "  • Logs: ${YELLOW}docker-compose -f $COMPOSE_FILE logs -f${NC}"
echo -e "  • Status: ${YELLOW}docker-compose -f $COMPOSE_FILE ps${NC}"
echo -e "  • Shell: ${YELLOW}docker-compose -f $COMPOSE_FILE exec backend bash${NC}"

# Cleanup old images
echo ""
echo -e "${BLUE}🧹 Cleaning up old images...${NC}"
docker image prune -f --filter "until=168h"
docker volume prune -f

echo ""
echo -e "${GREEN}✅ All done!${NC}"