# ChargeHive Backend - Heroku Deployment Guide

This guide will help you deploy your ChargeHive backend application to Heroku.

---

## Prerequisites

1. **Heroku Account**: Create one at [https://signup.heroku.com](https://signup.heroku.com)
2. **Heroku CLI**: Install from [https://devcenter.heroku.com/articles/heroku-cli](https://devcenter.heroku.com/articles/heroku-cli)
3. **Git**: Ensure Git is installed on your machine

---

## Step 1: Install Heroku CLI

### macOS:
```bash
brew tap heroku/brew && brew install heroku
```

### Windows:
Download and install from [Heroku CLI installer](https://devcenter.heroku.com/articles/heroku-cli)

### Verify Installation:
```bash
heroku --version
```

---

## Step 2: Login to Heroku

```bash
heroku login
```

This will open your browser to complete the login process.

---

## Step 3: Initialize Git Repository (if not already done)

```bash
# Check if git is initialized
git status

# If not initialized, run:
git init
git add .
git commit -m "Initial commit"
```

---

## Step 4: Create Heroku App

```bash
# Create a new Heroku app
heroku create chargehive-backend

# Or let Heroku generate a random name:
heroku create
```

This will create your app and add a Heroku remote to your git repository.

**Your app URL will be:** `https://chargehive-backend.herokuapp.com`

---

## Step 5: Set Environment Variables

You need to set all your environment variables on Heroku. Replace the values with your actual credentials.

```bash
# Supabase Configuration
heroku config:set CHARGEHIVE_SUPABASE_URL=https://your-project.supabase.co
heroku config:set CHARGEHIVE_SUPABASE_ANON_KEY=your-anon-key
heroku config:set CHARGEHIVE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT Secret (generate a strong random string)
heroku config:set JWT_SECRET=your-very-secure-random-string-here

# Flow Blockchain Configuration
heroku config:set FLOW_NETWORK=testnet
heroku config:set FLOW_ADMIN_ADDRESS=your-flow-admin-address
heroku config:set FLOW_ADMIN_PRIVATE_KEY=your-flow-private-key

# Port (Heroku sets this automatically, but you can specify)
heroku config:set PORT=3000
```

### To Generate JWT Secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### View All Config Variables:
```bash
heroku config
```

### Remove a Config Variable:
```bash
heroku config:unset VARIABLE_NAME
```

---

## Step 6: Deploy to Heroku

```bash
# Deploy your code
git push heroku main

# Or if your branch is named 'master':
git push heroku master
```

Heroku will:
1. Detect it's a Node.js app
2. Install dependencies (`npm install`)
3. Build the application (`npm run build`)
4. Start the server using the Procfile

---

## Step 7: Verify Deployment

### Check if the app is running:
```bash
heroku logs --tail
```

### Open your app in the browser:
```bash
heroku open
```

### Test the API:
```bash
curl https://chargehive-backend.herokuapp.com/api
```

### Test Swagger Documentation:
Visit: `https://chargehive-backend.herokuapp.com/api/docs`

---

## Step 8: Run Database Migrations

If you need to run migrations on Supabase:

1. Go to your Supabase dashboard: [https://app.supabase.com](https://app.supabase.com)
2. Navigate to **SQL Editor**
3. Run your migration files one by one:
   - `001_create_providers_table.sql`
   - `002_create_services_table.sql`
   - `003_create_users_table.sql`
   - `004_create_wallet_details_table.sql`
   - `005_create_sessions_table.sql`

---

## Common Heroku Commands

### View Logs
```bash
# Tail logs (live)
heroku logs --tail

# View last 100 lines
heroku logs -n 100

# Filter by source
heroku logs --source app --tail
```

### Restart App
```bash
heroku restart
```

### Open App
```bash
heroku open
```

### Run Commands on Heroku
```bash
# Open bash shell
heroku run bash

# Run npm command
heroku run npm --version
```

### Scale Dynos
```bash
# Scale to 1 web dyno
heroku ps:scale web=1

# View dyno status
heroku ps
```

### View App Info
```bash
heroku info
```

---

## Troubleshooting

### Issue 1: Application Error

**Check logs:**
```bash
heroku logs --tail
```

**Common causes:**
- Missing environment variables
- Build failed
- Database connection issues

**Solution:** Check that all environment variables are set correctly:
```bash
heroku config
```

---

### Issue 2: H10 App Crashed

**Check logs:**
```bash
heroku logs --tail
```

**Common causes:**
- Application failed to start
- Port binding issue
- Dependency installation failed

**Solution:** Ensure your app listens on the PORT environment variable:
```typescript
const port = process.env.PORT || 3000;
```

---

### Issue 3: R10 Boot Timeout

**Symptom:** App takes too long to start

**Solution:**
- Optimize your application startup
- Reduce unnecessary imports
- Check database connection timeouts

---

### Issue 4: Build Failed

**Check build output:**
```bash
git push heroku main
```

**Common causes:**
- TypeScript compilation errors
- Missing dependencies

**Solution:**
- Fix TypeScript errors locally first
- Test build locally: `npm run build`
- Ensure all dependencies are in `dependencies`, not `devDependencies`

---

## Environment-Specific Configuration

### Development vs Production

Your `.env` file (local):
```env
CHARGEHIVE_SUPABASE_URL=http://localhost:54321
CHARGEHIVE_SUPABASE_ANON_KEY=local-anon-key
JWT_SECRET=dev-secret
```

Heroku config (production):
```bash
heroku config:set CHARGEHIVE_SUPABASE_URL=https://production.supabase.co
heroku config:set CHARGEHIVE_SUPABASE_ANON_KEY=prod-anon-key
heroku config:set JWT_SECRET=super-secure-prod-secret
```

---

## Updating Your App

Whenever you make changes:

```bash
# 1. Commit your changes
git add .
git commit -m "Your commit message"

# 2. Push to Heroku
git push heroku main

# 3. Check logs
heroku logs --tail
```

---

## Custom Domain (Optional)

### Add Custom Domain:
```bash
heroku domains:add api.chargehive.com
```

### View Domains:
```bash
heroku domains
```

Then update your DNS records with the DNS target provided by Heroku.

---

## Database Backup Strategy

Since you're using Supabase:

1. **Automatic Backups**: Supabase Pro plan includes automatic daily backups
2. **Manual Backup**: Use Supabase dashboard to create backups
3. **Export Data**: Use SQL Editor to export data as needed

---

## Monitoring & Performance

### View Metrics:
```bash
heroku metrics
```

Or visit: `https://dashboard.heroku.com/apps/chargehive-backend/metrics`

### Add-ons (Optional):

**Papertrail (Logging):**
```bash
heroku addons:create papertrail:choklad
```

**New Relic (APM):**
```bash
heroku addons:create newrelic:wayne
```

---

## Cost & Scaling

### Free Tier:
- 550-1000 dyno hours/month
- App sleeps after 30 min of inactivity
- Limited to 512 MB RAM

### Upgrade to Hobby ($7/month):
```bash
heroku ps:type hobby
```

Benefits:
- Never sleeps
- Custom domains with SSL
- Better performance

### Scale Horizontally:
```bash
# Add more web dynos
heroku ps:scale web=2
```

---

## Security Best Practices

1. **Never commit `.env` files** to Git
2. **Use strong JWT secrets** (64+ characters)
3. **Enable HTTPS only** in production
4. **Rotate secrets regularly**
5. **Use Supabase RLS** for additional security
6. **Keep dependencies updated**: `npm audit fix`

---

## Deployment Checklist

- [ ] Heroku app created
- [ ] All environment variables set
- [ ] Database migrations run on Supabase
- [ ] Code pushed to Heroku
- [ ] App starts without errors (`heroku logs`)
- [ ] API endpoints are accessible
- [ ] Swagger docs are working
- [ ] JWT authentication is working
- [ ] Database connections are successful
- [ ] Test all critical endpoints

---

## Support & Resources

- **Heroku DevCenter**: [https://devcenter.heroku.com](https://devcenter.heroku.com)
- **Heroku Status**: [https://status.heroku.com](https://status.heroku.com)
- **NestJS Deployment**: [https://docs.nestjs.com/faq/serverless](https://docs.nestjs.com/faq/serverless)
- **Supabase Docs**: [https://supabase.com/docs](https://supabase.com/docs)

---

## Quick Reference Commands

```bash
# Login
heroku login

# Create app
heroku create chargehive-backend

# Set config
heroku config:set KEY=VALUE

# Deploy
git push heroku main

# View logs
heroku logs --tail

# Restart
heroku restart

# Open app
heroku open

# Scale
heroku ps:scale web=1

# View config
heroku config
```

---

## Your Deployed URLs

After deployment, your API will be available at:

- **Base API**: `https://chargehive-backend.herokuapp.com/api`
- **Swagger Docs**: `https://chargehive-backend.herokuapp.com/api/docs`
- **Provider Signup**: `https://chargehive-backend.herokuapp.com/api/provider/signup`
- **User Register**: `https://chargehive-backend.herokuapp.com/api/user/register`
- **Book Session**: `https://chargehive-backend.herokuapp.com/api/sessions/book`

Share these URLs with your frontend team!

---

**Last Updated:** October 21, 2025
