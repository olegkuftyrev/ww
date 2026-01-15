# Deployment Notes & Troubleshooting

This document contains notes from actual deployments and common issues encountered.

## Quick Deployment Checklist

### Pre-Deployment
- [ ] All changes committed and pushed to git
- [ ] Environment variables configured (`.env` file)
- [ ] `VITE_BACKEND_URL` set for production build
- [ ] Database migrations tested locally

### Deployment Steps
1. SSH to server: `ssh appuser@159.223.195.1`
2. Navigate to app: `cd /home/appuser/my-awesome-app`
3. Pull latest: `git pull origin master`
4. Install dependencies: `pnpm install --production=false`
5. **Set VITE_BACKEND_URL for build**: `export VITE_BACKEND_URL=http://159.223.195.1/api/`
6. Build: `pnpm build --ignore-ts-errors`
7. Copy assets: `rm -rf public/assets && cp -r build/public/* public/`
8. Fix permissions: `chmod -R 755 public && find public -type f -exec chmod 644 {} \;`
9. Run migrations: `node ace migration:run --force`
10. Restart PM2: `pm2 restart my-awesome-app`

### Post-Deployment
- [ ] Verify app is running: `pm2 status`
- [ ] Check logs: `pm2 logs my-awesome-app --lines 20`
- [ ] Test application in browser
- [ ] Verify assets are loading (check browser console)

---

## Common Issues & Solutions

### Issue 1: 403 Forbidden on Assets

**Symptoms:**
- Assets (CSS, JS files) return 403 Forbidden
- Browser console shows: `Failed to load resource: the server responded with a status of 403`

**Solution:**
```bash
# As root
chmod -R 755 /home/appuser/my-awesome-app/public
find /home/appuser/my-awesome-app/public -type f -exec chmod 644 {} \;
find /home/appuser/my-awesome-app/public -type d -exec chmod 755 {} \;
chown -R appuser:www-data /home/appuser/my-awesome-app/public
```

**Root Cause:** Nginx (running as `www-data`) cannot read files owned by `appuser` without proper permissions.

---

### Issue 2: Undefined Login Route Redirect

**Symptoms:**
- After login, redirects to `/undefinedauth/login` instead of `/settings`
- Browser shows 404 page

**Solution:**
- Fixed in `resources/js/lib/api-client.ts` by hardcoding the login route
- The issue was that `LOGIN_ROUTE` from routes was being tree-shaken or undefined at runtime
- **Fix applied:** Changed from `${LOGIN_ROUTE}` to hardcoded `/auth/login`

**Prevention:**
- Always test login flow after deployment
- Check browser console for JavaScript errors
- Verify routes are properly exported and not tree-shaken

---

### Issue 3: Environment Variables Not Available During Build

**Symptoms:**
- `VITE_BACKEND_URL` is undefined in production
- API calls fail or use wrong base URL

**Solution:**
```bash
# Set environment variable before build
export VITE_BACKEND_URL=http://159.223.195.1/api/
pnpm build --ignore-ts-errors
```

**Note:** Vite environment variables must be available at build time, not runtime. They are embedded into the JavaScript bundle during build.

**Permanent Fix:**
Add to `.env` file (though it won't be used by Vite, it's good documentation):
```env
VITE_BACKEND_URL=http://159.223.195.1/api/
```

---

### Issue 4: PM2 Not Reading .env File

**Symptoms:**
- Application fails to start
- PM2 logs show: "Missing environment variable APP_KEY", "Missing environment variable HOST", etc.

**Solution:**
- Set environment variables directly in `ecosystem.config.cjs`:
```javascript
env: {
  NODE_ENV: 'production',
  PORT: 3333,
  HOST: '0.0.0.0',
  APP_KEY: 'your_key_here',
  // ... all other env vars
}
```

**Note:** PM2 doesn't automatically load `.env` files. Either:
1. Set vars in ecosystem config (current approach)
2. Use `dotenv-cli` or similar
3. Source `.env` before starting PM2

---

### Issue 5: Assets Not Copied After Build

**Symptoms:**
- Application loads but styles/scripts are missing
- Console shows: `ENOENT: no such file or directory, open 'public/assets/.vite/manifest.json'`

**Solution:**
```bash
# After build, always copy assets
rm -rf public/assets
cp -r build/public/* public/
```

**Root Cause:** AdonisJS build outputs to `build/public/` but the application expects assets in `public/` directory.

---

### Issue 6: PM2 Ecosystem Config File Format

**Symptoms:**
- PM2 error: "File ecosystem.config.js malformated"
- Error: "module is not defined in ES module scope"

**Solution:**
- Rename `ecosystem.config.js` to `ecosystem.config.cjs` (CommonJS extension)
- Or change `package.json` to not use `"type": "module"` (not recommended)

**Current Setup:**
- File: `ecosystem.config.cjs`
- Uses CommonJS syntax: `module.exports = { ... }`

---

### Issue 7: Build Script Path Issues

**Symptoms:**
- PM2 error: "Script not found: /home/appuser/my-awesome-app/build/server.js"

**Solution:**
- Update ecosystem config to use correct path: `./build/bin/server.js`
- AdonisJS builds server entry point to `build/bin/server.js`, not `build/server.js`

---

### Issue 8: TypeScript Errors During Build

**Symptoms:**
- Build fails with TypeScript errors in test files
- Error: "Cannot complete the build process as there are TypeScript errors"

**Solution:**
```bash
# Use --ignore-ts-errors flag
pnpm build --ignore-ts-errors
# or
node ace build --ignore-ts-errors
```

**Note:** Test files may have TypeScript errors that don't affect production build. This flag allows build to complete.

---

## Environment Variables Reference

### Required for Application
```env
NODE_ENV=production
PORT=3333
HOST=0.0.0.0
APP_KEY=<generated_key>
LOG_LEVEL=info
SESSION_DRIVER=cookie
DB_HOST=localhost
DB_PORT=5432
DB_USER=appuser
DB_PASSWORD=<secure_password>
DB_DATABASE=my_awesome_app_db
```

### Required for Build (Vite)
```bash
# Must be set as environment variable during build, not in .env
export VITE_BACKEND_URL=http://159.223.195.1/api/
```

---

## File Permissions Reference

### Correct Permissions
```bash
# Directories
/home/appuser                         755 (appuser:appuser)
/home/appuser/my-awesome-app          755 (appuser:appuser)
/home/appuser/my-awesome-app/public   755 (appuser:www-data)
/home/appuser/my-awesome-app/public/assets  755 (appuser:www-data)

# Files
All files in public/                  644 (appuser:www-data)
All directories in public/           755 (appuser:www-data)
```

### Quick Fix Command
```bash
# Run as root
chmod -R 755 /home/appuser/my-awesome-app/public
find /home/appuser/my-awesome-app/public -type f -exec chmod 644 {} \;
find /home/appuser/my-awesome-app/public -type d -exec chmod 755 {} \;
chown -R appuser:www-data /home/appuser/my-awesome-app/public
```

---

## Quick Deployment Script

Save this as a reference for quick deployments:

```bash
#!/bin/bash
# Quick deployment script for 159.223.195.1

ssh appuser@159.223.195.1 << 'ENDSSH'
cd /home/appuser/my-awesome-app
git pull origin master
pnpm install --production=false
export VITE_BACKEND_URL=http://159.223.195.1/api/
pnpm build --ignore-ts-errors
rm -rf public/assets
cp -r build/public/* public/
chmod -R 755 public
find public -type f -exec chmod 644 {} \;
node ace migration:run --force
pm2 restart my-awesome-app
pm2 status
ENDSSH
```

---

## Server Information

- **IP:** 159.223.195.1
- **User:** appuser
- **App Directory:** /home/appuser/my-awesome-app
- **Database:** PostgreSQL (localhost)
- **Process Manager:** PM2
- **Web Server:** Nginx
- **Port:** 3333 (internal), 80 (external via Nginx)

---

## Admin User Creation

After deployment, create admin user:
```bash
ssh appuser@159.223.195.1
cd /home/appuser/my-awesome-app
node ace create:admin admin@example.com
# Enter password when prompted
```

Or with password directly:
```bash
node ace create:admin admin@example.com your-password
```

---

## Monitoring Commands

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs my-awesome-app

# View last 50 lines
pm2 logs my-awesome-app --lines 50

# Restart application
pm2 restart my-awesome-app

# Check Nginx status
sudo systemctl status nginx

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check application is responding
curl http://localhost:3333
```

---

## Notes from Deployment (2026-01-15)

### Issues Encountered:
1. **403 Forbidden on assets** - Fixed with proper file permissions
2. **Undefined login route** - Fixed by hardcoding route in api-client.ts
3. **PM2 not reading .env** - Fixed by setting env vars in ecosystem.config.cjs
4. **Assets not copied** - Fixed by adding copy step after build
5. **Build path issues** - Fixed by using correct path: `build/bin/server.js`

### Key Learnings:
- Vite environment variables must be set at build time
- PM2 doesn't auto-load .env files - set vars in config
- Always copy assets from build/public/ to public/ after build
- File permissions are critical for Nginx to serve static files
- Test login flow after every deployment

---

## Future Improvements

1. **Automate deployment** - Create a proper deployment script
2. **Environment management** - Use a tool to manage env vars
3. **Build optimization** - Investigate why LOGIN_ROUTE is tree-shaken
4. **Asset handling** - Consider using a CDN or better asset management
5. **Monitoring** - Set up proper logging and monitoring
