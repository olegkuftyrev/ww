# Quick Setup Guide for Droplet 159.223.195.1

This guide will help you quickly set up your application on the DigitalOcean Droplet.

## Prerequisites

- SSH access to the Droplet (159.223.195.1)
- Your SSH key added to the Droplet

## Quick Setup Steps

### 1. Connect to Your Droplet

```bash
ssh root@159.223.195.1
# or if you have a user account:
ssh appuser@159.223.195.1
```

### 2. Initial Server Setup (Run as root)

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install pnpm
npm install -g pnpm@9

# Install PostgreSQL
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

# Install PM2
npm install -g pm2

# Install Nginx
apt install -y nginx

# Create application user
adduser --disabled-password --gecos "" appuser
usermod -aG sudo appuser
```

### 3. Set Up Database (Run as root)

```bash
# Switch to postgres user
sudo -u postgres psql << EOF
CREATE USER appuser WITH PASSWORD 'your_secure_password_here';
CREATE DATABASE my_awesome_app_db OWNER appuser;
ALTER USER appuser CREATEDB;
\q
EOF
```

**⚠️ Important:** Replace `your_secure_password_here` with a strong password!

### 4. Deploy Application (Switch to appuser)

```bash
# Switch to app user
su - appuser

# Clone repository
cd /home/appuser
git clone https://github.com/olegkuftyrev/ww.git my-awesome-app
cd my-awesome-app

# Install dependencies
pnpm install --production=false

# Create .env file
cp env.example .env
nano .env
```

### 5. Configure Environment Variables

Edit `.env` file with these values:

```env
NODE_ENV=production
PORT=3333
HOST=0.0.0.0
APP_KEY=your_generated_key_here
LOG_LEVEL=info

SESSION_DRIVER=cookie

DB_HOST=localhost
DB_PORT=5432
DB_USER=appuser
DB_PASSWORD=your_secure_password_here
DB_DATABASE=my_awesome_app_db
```

Generate APP_KEY:

```bash
node ace generate:key
# Copy the generated key to .env file
```

### 6. Build and Deploy

```bash
# Build application
pnpm build

# Run migrations
node ace migration:run

# Create admin user
node ace create:admin admin@example.com
# Enter password when prompted

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 7. Configure PM2 Startup (Run the command PM2 outputs)

PM2 will output a command like:

```bash
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u appuser --hp /home/appuser
```

Run that command as root.

### 8. Configure Nginx (Run as root)

```bash
sudo nano /etc/nginx/sites-available/my-awesome-app
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name 159.223.195.1;

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

    location /assets/ {
        alias /home/appuser/my-awesome-app/public/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /pdfjs/ {
        alias /home/appuser/my-awesome-app/public/pdfjs/;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/my-awesome-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 9. Configure Firewall (Run as root)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

## Create Admin User

After deployment, create an admin user:

```bash
cd /home/appuser/my-awesome-app
node ace create:admin admin@yourdomain.com
# Enter password when prompted
```

Or with password directly:

```bash
node ace create:admin admin@yourdomain.com your-secure-password
```

## Verify Deployment

1. **Check PM2 status:**

   ```bash
   pm2 status
   pm2 logs my-awesome-app
   ```

2. **Check Nginx:**

   ```bash
   sudo systemctl status nginx
   ```

3. **Test application:**
   Open browser: `http://159.223.195.1`

4. **Login with admin account:**
   - Email: `admin@yourdomain.com`
   - Password: (the one you set)

## Quick Commands Reference

```bash
# View logs
pm2 logs my-awesome-app

# Restart application
pm2 restart my-awesome-app

# Update application
cd /home/appuser/my-awesome-app
git pull
pnpm install
pnpm build
node ace migration:run
pm2 restart my-awesome-app

# Create another admin user
node ace create:admin another@example.com
```

## Troubleshooting

### Application not starting

```bash
pm2 logs my-awesome-app
# Check for errors in logs
```

### Database connection issues

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -h localhost -U appuser -d my_awesome_app_db
```

### Nginx 502 error

```bash
# Check if app is running
pm2 status

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

## Using the Deployment Script

You can also use the automated deployment script from your local machine:

```bash
# From your local machine
./scripts/deploy-droplet.sh appuser@159.223.195.1
```

This will automatically:

- Pull latest changes
- Install dependencies
- Build application
- Run migrations
- Restart PM2
