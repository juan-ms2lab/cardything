#!/bin/bash

# Kanban Todo App Deployment Script for Ubuntu Server
# This script sets up and deploys the application using Docker Compose

set -e

echo "🚀 Starting Kanban Todo App deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Check if Docker and Docker Compose are installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if user is in docker group
if ! groups $USER | grep &>/dev/null '\bdocker\b'; then
    print_error "Current user is not in the docker group. Please add user to docker group:"
    echo "sudo usermod -aG docker $USER"
    echo "Then log out and log back in."
    exit 1
fi

print_status "Environment checks passed ✓"

# Create application directory
APP_DIR="/opt/kanban-app"
print_status "Creating application directory at $APP_DIR"

if [ ! -d "$APP_DIR" ]; then
    sudo mkdir -p "$APP_DIR"
    sudo chown $USER:$USER "$APP_DIR"
fi

# Copy application files
print_status "Copying application files..."
cp -r . "$APP_DIR/"
cd "$APP_DIR"

# Generate a random NextAuth secret if not provided
if [ ! -f .env.production ]; then
    print_status "Creating production environment file..."
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    sed "s/your-super-secret-key-change-this-in-production/$NEXTAUTH_SECRET/g" .env.production.template > .env.production
fi

# Stop existing containers if running
print_status "Stopping existing containers..."
docker-compose down 2>/dev/null || true

# Build and start the application
print_status "Building and starting application..."
docker-compose up --build -d

# Wait for services to be healthy
print_status "Waiting for services to be ready..."
sleep 30

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    print_status "✅ Application deployed successfully!"
    print_status "🌐 Application is available at: http://localhost"
    print_status "📊 Database: PostgreSQL running in container"
    
    # Show running containers
    echo ""
    print_status "Running containers:"
    docker-compose ps
    
    echo ""
    print_status "To view logs: docker-compose logs -f"
    print_status "To stop: docker-compose down"
    print_status "To restart: docker-compose restart"
else
    print_error "❌ Deployment failed. Check logs with: docker-compose logs"
    exit 1
fi