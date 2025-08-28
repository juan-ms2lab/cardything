# Kanban Todo App - Production Deployment Guide

This guide covers deploying the Kanban Todo App on Ubuntu Server 24.04.3 in a Proxmox VM environment.

## Server Requirements

- **OS**: Ubuntu Server 24.04.3 LTS
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: Minimum 20GB
- **CPU**: 2+ cores recommended
- **Network**: Internet access for package downloads

## Quick Deploy

1. **Run the automated deployment script**:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/juan-ms2lab/cardything/main/deploy.sh | bash
   ```
   
   **Or manually:**
   ```bash
   wget https://raw.githubusercontent.com/juan-ms2lab/cardything/main/deploy.sh
   chmod +x deploy.sh
   ./deploy.sh
   ```

2. **Access your application** at `http://your-server-ip`

The deploy script automatically:
- Checks system requirements
- Clones the repository from GitHub
- Sets up Docker environment
- Generates secure environment variables
- Builds and starts all services

## Manual Setup Instructions

### Step 1: Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget git unzip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install -y docker-compose

# Add your user to docker group
sudo usermod -aG docker $USER

# Log out and back in for group changes to take effect
exit
```

### Step 2: Application Setup

```bash
# Create application user (optional but recommended)
sudo useradd -m -s /bin/bash kanban
sudo usermod -aG docker kanban

# Clone the repository
sudo mkdir -p /opt/kanban-app
sudo chown $USER:$USER /opt/kanban-app
git clone https://github.com/juan-ms2lab/cardything.git /opt/kanban-app

cd /opt/kanban-app
```

### Step 3: Environment Configuration

```bash
# Copy and customize environment file
cp .env.example .env.production

# Edit the environment file with your settings
nano .env.production
```

**Important**: Update the following in `.env.production`:
- `NEXTAUTH_SECRET`: Generate a secure random string
- `NEXTAUTH_URL`: Set to your server's IP or domain
- Database credentials if needed

### Step 4: Deploy Application

```bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

### Step 5: Set Up System Service (Optional)

```bash
# Copy service file
sudo cp kanban-app.service /etc/systemd/system/

# Enable and start service
sudo systemctl enable kanban-app.service
sudo systemctl start kanban-app.service

# Check status
sudo systemctl status kanban-app.service
```

## Application Architecture

### Services
- **Nginx**: Reverse proxy server (Port 80)
- **Next.js App**: Application server (Internal port 3000)
- **PostgreSQL**: Database server (Internal port 5432)

### Data Persistence
- PostgreSQL data: `/var/lib/docker/volumes/kanban-app_postgres_data`
- Application data: `/var/lib/docker/volumes/kanban-app_app_data`

## Management Commands

### Docker Compose Commands
```bash
cd /opt/kanban-app

# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Rebuild and restart
docker-compose up --build -d
```

### Systemd Service Commands
```bash
# Start application
sudo systemctl start kanban-app

# Stop application
sudo systemctl stop kanban-app

# Restart application
sudo systemctl restart kanban-app

# Check status
sudo systemctl status kanban-app

# View logs
journalctl -u kanban-app -f
```

## Database Management

### Backup Database
```bash
# Create backup
docker-compose exec postgres pg_dump -U kanban_user kanban_db > backup.sql

# Or with timestamp
docker-compose exec postgres pg_dump -U kanban_user kanban_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Database
```bash
# Restore from backup
docker-compose exec -T postgres psql -U kanban_user -d kanban_db < backup.sql
```

### Database Migrations
```bash
# Run migrations (if schema changes)
docker-compose exec app npx prisma migrate deploy
```

## Monitoring

### Check Application Health
```bash
# Test application response
curl http://localhost/health

# Check container status
docker-compose ps

# View resource usage
docker stats
```

### Log Locations
- Nginx logs: `/var/lib/docker/volumes/[nginx_container]/var/log/nginx/`
- Application logs: `docker-compose logs app`
- Database logs: `docker-compose logs postgres`

## Security Considerations

### Firewall Setup
```bash
# Install UFW
sudo apt install -y ufw

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS (if SSL configured)
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

### SSL/TLS Setup (Recommended)

For production, set up SSL with Let's Encrypt:

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com

# Update docker-compose.yml to expose port 443
# Update nginx.conf for SSL configuration
```

## Troubleshooting

### Common Issues

**Application not accessible:**
```bash
# Check if containers are running
docker-compose ps

# Check nginx configuration
docker-compose exec nginx nginx -t

# Check application logs
docker-compose logs app
```

**Database connection issues:**
```bash
# Check database is running
docker-compose exec postgres pg_isready -U kanban_user

# Check database logs
docker-compose logs postgres

# Reset database (WARNING: destroys data)
docker-compose down -v
docker-compose up -d
```

**Permission issues:**
```bash
# Fix file permissions
sudo chown -R kanban:kanban /opt/kanban-app

# Fix docker permissions
sudo usermod -aG docker $USER
```

### Performance Tuning

**For high-traffic deployments:**

1. **Increase PostgreSQL resources** in `docker-compose.yml`:
   ```yaml
   postgres:
     deploy:
       resources:
         limits:
           memory: 1G
         reservations:
           memory: 512M
   ```

2. **Scale application instances**:
   ```yaml
   app:
     scale: 3
   ```

3. **Configure Nginx caching** in `nginx.conf`

## Updates and Maintenance

### Update Application
```bash
cd /opt/kanban-app

# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose up --build -d

# Run database migrations if needed
docker-compose exec app npx prisma migrate deploy
```

### Regular Maintenance
```bash
# Clean up old Docker images
docker system prune -a

# Backup database regularly
# Set up automated backups with cron
```

## VM-Specific Considerations

### Proxmox VM Settings
- Enable QEMU Guest Agent for better integration
- Configure appropriate resource limits
- Set up automated backups in Proxmox
- Consider using cloud-init for initial setup

### Network Configuration
- Ensure VM has internet access for package downloads
- Configure static IP if needed
- Set up port forwarding if behind NAT

## Support

For issues and questions:
- Check logs first: `docker-compose logs -f`
- Verify all services are running: `docker-compose ps`
- Check system resources: `htop` or `docker stats`
- Review this documentation for common solutions

## Production Checklist

- [ ] Server updated and secured
- [ ] Docker and Docker Compose installed
- [ ] Application deployed and accessible
- [ ] SSL certificate configured (recommended)
- [ ] Firewall configured
- [ ] Database backups set up
- [ ] Monitoring configured
- [ ] System service enabled for auto-start
- [ ] Documentation reviewed and customized