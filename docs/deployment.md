# Deployment

This document provides deployment instructions for various platforms.

## Supported Platforms
- [x] DigitalOcean
- [ ] Vercel
- [ ] Railway
- [ ] AWS
- [ ] Docker

---

## DigitalOcean Deployment Guide

DigitalOcean offers two deployment options:

1. **App Platform** (Recommended) - Fully managed Platform-as-a-Service with automatic scaling, SSL, and Git-based deployments
2. **Droplet** - Manual server setup with full control (for advanced users)

---

## Option 1: App Platform (Recommended) 🚀

**App Platform** is the easiest way to deploy your application. It handles:
- Automatic SSL certificates
- Managed PostgreSQL database
- Git-based deployments
- Auto-scaling
- Health checks and monitoring
- No server management needed

### Prerequisites

- A DigitalOcean account
- Your code pushed to GitHub/GitLab
- A domain name (optional, but recommended)

### Step 1: Connect Repository

1. Log in to your DigitalOcean dashboard
2. Go to **App Platform** → **Create App**
3. Connect your GitHub/GitLab repository
4. Select the repository and branch (usually `main` or `master`)

### Step 2: Configure Application

**Option A: Use App Spec File (Recommended)**

If you want to use the `app.yaml` file included in this project:

1. In App Platform, select **"Upload an App Spec"** instead of auto-detection
2. Upload or paste the contents of `app.yaml` from your repository
3. Customize the `app.yaml` file:
   - Update `github.repo` with your repository path
   - Update `github.branch` if different from `main`
   - Adjust instance sizes as needed
4. Add environment variables in the dashboard (see below)

**Option B: Manual Configuration**

1. **App Platform will detect Node.js automatically**
2. Configure build settings:
   - **Build Command**: `pnpm install && pnpm build`
   - **Run Command**: `node bin/server.js`
   - **HTTP Port**: `3333`

3. **Environment Variables** (Add in App Platform dashboard):

   ```
   NODE_ENV=production
   PORT=3333
   HOST=0.0.0.0
   APP_KEY=your_generated_key_here
   SESSION_DRIVER=cookie
   LOG_LEVEL=info
   ```

   **Generate APP_KEY** (run locally):
   ```bash
   node ace generate:key
   ```

### Step 3: Add Managed PostgreSQL Database

1. In App Platform dashboard, click **"Add Resource"** → **"Database"**
2. Select **PostgreSQL** (version 15 or latest)
3. Choose database plan (start with the smallest for testing)
4. App Platform will automatically provide connection variables:
   - `DB_HOST`
   - `DB_PORT`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_DATABASE`

### Step 4: Run Database Migrations

After first deployment, you need to run migrations. Use App Platform's console:

1. In App Platform dashboard, go to your app
2. Click **"Console"** tab
3. Run migrations:
   ```bash
   node ace migration:run
   ```

Or use a **one-time job** in App Platform:
- Add a **"Job"** component with:
  - **Run Command**: `node ace migration:run`
  - **Run Once**: Enabled

### Step 5: Configure Custom Domain (Optional)

1. In App Platform dashboard, go to **"Settings"** → **"Domains"**
2. Add your domain
3. Update DNS records as instructed by DigitalOcean
4. SSL certificate will be automatically provisioned

### Step 6: Deploy

1. Click **"Create Resources"** or **"Save"**
2. App Platform will:
   - Install dependencies
   - Build your application
   - Deploy and start the service
   - Provision SSL certificate

### Step 7: Post-Deployment

#### Run Migrations

After the first deployment, access the console and run:

```bash
node ace migration:run
```

#### Monitor Your App

- View logs in **"Runtime Logs"** tab
- Check metrics in **"Metrics"** tab
- Monitor database in **"Databases"** section

### Automatic Deployments

App Platform automatically deploys when you push to the connected branch. To deploy manually:

1. Go to **"Deployments"** tab
2. Click **"Create Deployment"**
3. Select branch and commit

### Environment Variables

Manage environment variables in:
- **Settings** → **App-Level Environment Variables** (shared across all components)
- **Component Settings** → **Environment Variables** (component-specific)

### Scaling

1. Go to **Component Settings** → **Resource Limits**
2. Adjust:
   - **Instance Size**: CPU and RAM
   - **Instance Count**: Number of instances (for horizontal scaling)

### Cost Considerations

- **Basic tier**: ~$5/month (512 MB RAM, basic-xxs instance)
- **Professional tier**: Starts at ~$12/month (better performance)
- **Database**: Separate cost (~$7-15/month for basic PostgreSQL)

### Troubleshooting App Platform

#### Build Failures

- Check **"Build Logs"** in the Deployments tab
- Verify build command: `pnpm install && pnpm build`
- Ensure all dependencies are in `package.json`

#### Application Errors

- Check **"Runtime Logs"** tab
- Verify environment variables are set correctly
- Check database connection (managed databases auto-connect)

#### Database Connection Issues

- Verify database component is added
- Check that database environment variables are automatically injected
- Ensure migrations have been run

---

## Option 2: DigitalOcean Droplet (Advanced)

This guide covers deploying your AdonisJS + React application to a DigitalOcean Droplet (Ubuntu server) for users who need full server control.

### Prerequisites

- A DigitalOcean account
- A domain name (optional, but recommended)
- SSH access configured
- Basic knowledge of Linux commands

### Step 1: Create a DigitalOcean Droplet

1. Log in to your DigitalOcean dashboard
2. Create a new Droplet:
   - **Image**: Ubuntu 22.04 LTS (or latest LTS)
   - **Plan**: At least 1 GB RAM / 1 vCPU (2 GB recommended)
   - **Region**: Choose closest to your users
   - **Authentication**: SSH keys (recommended) or password
3. Note your Droplet's IP address

### Step 2: Set Up Server Environment

Connect to your Droplet via SSH:

```bash
ssh root@YOUR_DROPLET_IP
```

#### 2.1. Update System

```bash
apt update && apt upgrade -y
```

#### 2.2. Install Node.js and pnpm

```bash
# Install Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Verify installations
node --version
pnpm --version
```

#### 2.3. Install PostgreSQL

```bash
# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE USER your_app_user WITH PASSWORD 'your_secure_password';
CREATE DATABASE your_database_name OWNER your_app_user;
ALTER USER your_app_user CREATEDB;
\q
EOF
```

#### 2.4. Install Nginx

```bash
apt install -y nginx

# Start and enable Nginx
systemctl start nginx
systemctl enable nginx
```

#### 2.5. Install PM2 (Process Manager)

```bash
npm install -g pm2
```

#### 2.6. Install Certbot (for SSL)

```bash
apt install -y certbot python3-certbot-nginx
```

#### 2.7. Create Application User

```bash
# Create a non-root user for the application
adduser --disabled-password --gecos "" appuser
usermod -aG sudo appuser

# Switch to app user
su - appuser
```

### Step 3: Deploy Application

#### 3.1. Clone Repository

```bash
# As appuser
cd /home/appuser
git clone https://github.com/your-username/your-repo.git my-awesome-app
cd my-awesome-app
```

#### 3.2. Install Dependencies

```bash
pnpm install --production=false
```

#### 3.3. Set Up Environment Variables

```bash
# Copy environment example
cp .env.example .env

# Edit environment file
nano .env
```

Configure the following variables:

```env
# Application
NODE_ENV=production
PORT=3333
HOST=0.0.0.0
APP_KEY=your_generated_app_key
LOG_LEVEL=info

# Server
HOST=0.0.0.0

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_app_user
DB_PASSWORD=your_secure_password
DB_DATABASE=your_database_name

# Session
SESSION_DRIVER=cookie
```

Generate APP_KEY:

```bash
node ace generate:key
```

Copy the generated key to your `.env` file.

#### 3.4. Build Application

```bash
# Build frontend assets and backend
pnpm build
```

#### 3.5. Run Migrations

```bash
node ace migration:run
```

#### 3.6. Create Admin User

Create an admin account for testing:

```bash
# Create admin user (will prompt for password)
node ace create:admin admin@example.com

# Or with password directly
node ace create:admin admin@example.com your-secure-password

# With name
node ace create:admin admin@example.com your-secure-password --name="Admin User"
```

The command will:
- Create a new user with admin role
- Set status to 'active'
- Automatically hash the password
- If user already exists, it will ask if you want to update them to admin

**Example:**
```bash
node ace create:admin admin@yourdomain.com
# Enter password when prompted
```

#### 3.7. Test Application

```bash
# Test if the application starts
pnpm start
```

Press `Ctrl+C` to stop the test server.

### Step 4: Configure PM2

#### 4.1. Create PM2 Ecosystem File

The `ecosystem.config.js` file should already exist in the project root. If not, create it:

```bash
# Back in the project directory
pm2 ecosystem
```

Edit `ecosystem.config.js` to match your setup (see the file in project root).

#### 4.2. Start Application with PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

The last command will output a command to run as root - execute it:

```bash
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u appuser --hp /home/appuser
```

### Step 5: Configure Nginx

#### 5.1. Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/my-awesome-app
```

Add the following configuration (see `nginx.conf.example` in project root for reference):

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3333;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve static assets
    location /assets/ {
        alias /home/appuser/my-awesome-app/public/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Serve public files
    location /pdfjs/ {
        alias /home/appuser/my-awesome-app/public/pdfjs/;
    }
}
```

#### 5.2. Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/my-awesome-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 6: Set Up SSL Certificate

#### 6.1. Obtain SSL Certificate

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Follow the prompts. Certbot will automatically update your Nginx configuration.

#### 6.2. Auto-renewal (already configured)

Certbot automatically sets up a cron job for renewal. Verify:

```bash
sudo certbot renew --dry-run
```

### Step 7: Configure Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

### Step 8: Final Checklist

- [ ] Application is running on PM2
- [ ] Database migrations are complete
- [ ] Nginx is serving the application
- [ ] SSL certificate is configured
- [ ] Firewall is configured
- [ ] Domain DNS is pointing to the Droplet IP
- [ ] Environment variables are set correctly

### Step 9: Monitoring and Maintenance

#### View Application Logs

```bash
# PM2 logs
pm2 logs

# Application logs
pm2 logs my-awesome-app

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

#### Restart Application

```bash
pm2 restart my-awesome-app
```

#### Update Application

```bash
cd /home/appuser/my-awesome-app
git pull origin main
pnpm install
pnpm build
node ace migration:run
pm2 restart my-awesome-app
```

### Troubleshooting

#### Application Not Starting

1. Check PM2 status: `pm2 status`
2. Check logs: `pm2 logs my-awesome-app`
3. Verify environment variables: `cat .env`
4. Check database connection

#### Nginx 502 Bad Gateway

1. Verify application is running: `pm2 status`
2. Check application port: `netstat -tlnp | grep 3333`
3. Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`

#### Database Connection Issues

1. Verify PostgreSQL is running: `sudo systemctl status postgresql`
2. Check database credentials in `.env`
3. Test connection: `psql -h localhost -U your_app_user -d your_database_name`

### Security Considerations

1. **Firewall**: Only allow necessary ports (22, 80, 443)
2. **SSH**: Disable password authentication, use SSH keys only
3. **Database**: Use strong passwords, restrict access
4. **Environment Variables**: Never commit `.env` file
5. **Updates**: Keep system and dependencies updated
6. **Backups**: Set up regular database backups

### Backup Strategy

#### Database Backup

```bash
# Create backup script
sudo nano /home/appuser/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/appuser/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
pg_dump -U your_app_user your_database_name > $BACKUP_DIR/backup_$DATE.sql
# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

```bash
chmod +x /home/appuser/backup-db.sh

# Add to crontab (run daily at 2 AM)
crontab -e
# Add: 0 2 * * * /home/appuser/backup-db.sh
```

---

## Coming Soon

Detailed deployment guides for other platforms will be added here.