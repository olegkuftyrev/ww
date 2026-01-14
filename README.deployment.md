# Quick Deployment Checklist

This is a quick reference checklist for deploying to DigitalOcean. For detailed instructions, see [docs/deployment.md](./docs/deployment.md).

## Choose Your Deployment Method

**Recommended: App Platform** (Easiest - No server management)

- ✅ Automatic SSL
- ✅ Managed PostgreSQL
- ✅ Git-based deployments
- ✅ Auto-scaling

**Alternative: Droplet** (Full server control)

- Full server access
- Custom configurations
- Manual setup required

## App Platform Deployment Checklist

### Prerequisites

- [ ] DigitalOcean account created
- [ ] Code pushed to GitHub/GitLab
- [ ] Domain name (optional)

### Setup Steps

- [ ] Connect repository to App Platform
- [ ] Configure build command: `pnpm install && pnpm build`
- [ ] Configure run command: `node bin/server.js`
- [ ] Set HTTP port: `3333`
- [ ] Add environment variables (NODE_ENV, APP_KEY, etc.)
- [ ] Add managed PostgreSQL database
- [ ] Run database migrations
- [ ] Configure custom domain (optional)
- [ ] Deploy application

### Post-Deployment

- [ ] Run migrations: `node ace migration:run`
- [ ] Verify application is running
- [ ] Test all features
- [ ] Monitor logs and metrics

## Droplet Deployment Checklist (Alternative)

### Prerequisites

- [ ] DigitalOcean Droplet created (Ubuntu 22.04 LTS recommended)
- [ ] Domain name configured (DNS pointing to Droplet IP)
- [ ] SSH access to the Droplet

## Server Setup

- [ ] Node.js 20.x installed
- [ ] pnpm installed globally
- [ ] PostgreSQL installed and configured
- [ ] Nginx installed
- [ ] PM2 installed globally
- [ ] Certbot installed (for SSL)
- [ ] Firewall configured (UFW)

## Application Deployment

- [ ] Repository cloned to server
- [ ] Dependencies installed (`pnpm install`)
- [ ] Environment variables configured (`.env` file)
- [ ] APP_KEY generated (`node ace generate:key`)
- [ ] Application built (`pnpm build`)
- [ ] Database migrations run (`node ace migration:run`)
- [ ] PM2 process started
- [ ] Nginx configured and enabled
- [ ] SSL certificate obtained (Let's Encrypt)

## Configuration Files

All necessary configuration files have been created:

### For App Platform (Recommended)

- `app.yaml` - App Platform configuration file (optional, can also configure via dashboard)

### For Droplet (Alternative)

- `env.example` - Environment variables template
- `ecosystem.config.js` - PM2 process manager configuration
- `nginx.conf.example` - Nginx reverse proxy configuration
- `scripts/deploy.sh` - Automated deployment script

## Quick Commands Reference

```bash
# On the server, navigate to app directory
cd /home/appuser/my-awesome-app

# Pull latest changes and deploy
./scripts/deploy.sh

# Or manually:
git pull
pnpm install
pnpm build
node ace migration:run
pm2 restart my-awesome-app

# Check application status
pm2 status
pm2 logs my-awesome-app

# Check Nginx status
sudo systemctl status nginx
sudo nginx -t
```

## Troubleshooting

See [docs/deployment.md](./docs/deployment.md) for detailed troubleshooting steps.
