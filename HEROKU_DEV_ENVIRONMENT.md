# ChargeHive Backend - Heroku Dev Environment Setup

This guide will help you set up a **separate development environment** on Heroku, so you can test changes before deploying to production.

---

## Why Separate Dev Environment?

- **Safe Testing**: Test new features without affecting production
- **Different Database**: Use separate Supabase project for dev data
- **Team Collaboration**: Multiple developers can test on the same dev instance
- **CI/CD Pipeline**: Can be integrated with GitHub for auto-deployments

---

## Architecture

You'll have **two Heroku apps**:

1. **Production**: `chargehive-backend` → `https://chargehive-backend.herokuapp.com`
2. **Development**: `chargehive-backend-dev` → `https://chargehive-backend-dev.herokuapp.com`

---

## Step 1: Create Dev Heroku App

```bash
# Create a new Heroku app for development
heroku create chargehive-backend-dev

# Verify both apps
heroku apps
```

You should see:
- `chargehive-backend` (production)
- `chargehive-backend-dev` (development)

---

## Step 2: Add Git Remotes

By default, you have one Heroku remote. Let's add a second one for dev:

```bash
# View current remotes
git remote -v

# Add dev remote
heroku git:remote -a chargehive-backend-dev -r heroku-dev

# Add production remote (if not already added)
heroku git:remote -a chargehive-backend -r heroku-prod

# Verify remotes
git remote -v
```

You should now see:
```
heroku-dev   https://git.heroku.com/chargehive-backend-dev.git
heroku-prod  https://git.heroku.com/chargehive-backend.git
origin       https://github.com/your-repo.git (if using GitHub)
```

---

## Step 3: Set Dev Environment Variables

Set environment variables for your **dev instance** with dev/test credentials:

```bash
# Supabase Configuration (use your DEV Supabase project)
heroku config:set CHARGEHIVE_SUPABASE_URL=https://your-dev-project.supabase.co -a chargehive-backend-dev
heroku config:set CHARGEHIVE_SUPABASE_ANON_KEY=your-dev-anon-key -a chargehive-backend-dev
heroku config:set CHARGEHIVE_SUPABASE_SERVICE_ROLE_KEY=your-dev-service-key -a chargehive-backend-dev

# JWT Secret (different from production!)
heroku config:set JWT_SECRET=dev-jwt-secret-$(openssl rand -hex 32) -a chargehive-backend-dev

# Flow Blockchain Configuration (use testnet)
heroku config:set FLOW_NETWORK=testnet -a chargehive-backend-dev
heroku config:set FLOW_ADMIN_ADDRESS=your-dev-flow-address -a chargehive-backend-dev
heroku config:set FLOW_ADMIN_PRIVATE_KEY=your-dev-flow-key -a chargehive-backend-dev

# Node Environment
heroku config:set NODE_ENV=development -a chargehive-backend-dev

# Port
heroku config:set PORT=3000 -a chargehive-backend-dev
```

### View Dev Config:
```bash
heroku config -a chargehive-backend-dev
```

---

## Step 4: Deploy to Dev Environment

### Deploy current branch to dev:
```bash
git push heroku-dev main
```

### Or deploy a specific branch (e.g., feature branch):
```bash
git push heroku-dev feature-branch:main
```

### Deploy to production:
```bash
git push heroku-prod main
```

---

## Step 5: Set Up Dev Database

### Option A: Separate Supabase Project (Recommended)

1. Create a new Supabase project for development
2. Go to [https://app.supabase.com](https://app.supabase.com)
3. Click "New Project"
4. Name it: `chargehive-dev`
5. Run all migrations in the SQL Editor
6. Use these credentials in your dev Heroku config

### Option B: Same Supabase, Different Schema (Advanced)

If you want to use the same Supabase instance but separate data:
- Create a separate schema in your database
- Configure your app to use different schema based on environment
- Not recommended for beginners

---

## Step 6: Verify Dev Deployment

### Check dev logs:
```bash
heroku logs --tail -a chargehive-backend-dev
```

### Open dev app:
```bash
heroku open -a chargehive-backend-dev
```

### Test dev API:
```bash
curl https://chargehive-backend-dev.herokuapp.com/api
```

### Test dev Swagger:
Visit: `https://chargehive-backend-dev.herokuapp.com/api/docs`

---

## Development Workflow

### 1. Work on Feature Locally
```bash
# Create feature branch
git checkout -b feature/new-booking-system

# Make changes
# ...

# Test locally
npm run start:dev

# Commit changes
git add .
git commit -m "Add new booking system"
```

### 2. Deploy to Dev for Testing
```bash
# Push to dev environment
git push heroku-dev feature/new-booking-system:main

# Monitor logs
heroku logs --tail -a chargehive-backend-dev

# Test on dev environment
curl https://chargehive-backend-dev.herokuapp.com/api/sessions/book
```

### 3. Merge and Deploy to Production
```bash
# Switch to main branch
git checkout main

# Merge feature branch
git merge feature/new-booking-system

# Push to production
git push heroku-prod main

# Monitor production logs
heroku logs --tail -a chargehive-backend-prod
```

---

## Managing Multiple Environments

### View all apps:
```bash
heroku apps
```

### Switch between apps:
```bash
# Work with dev app
heroku logs --tail -a chargehive-backend-dev
heroku config -a chargehive-backend-dev
heroku restart -a chargehive-backend-dev

# Work with prod app
heroku logs --tail -a chargehive-backend
heroku config -a chargehive-backend
heroku restart -a chargehive-backend
```

### Set default app (optional):
```bash
# Set default to dev for convenience
heroku git:remote -a chargehive-backend-dev
```

---

## Running Dev Environment with Watch Mode (Advanced)

If you want your dev environment to restart on file changes (like `npm run start:dev` locally), you can modify the start script, but **this is NOT recommended on Heroku** as it will consume more resources.

**Instead:** Deploy changes frequently to test them.

---

## Environment-Specific Code

You can use `NODE_ENV` to run different code in dev vs production:

```typescript
// Example in main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable detailed logging in development
  if (process.env.NODE_ENV === 'development') {
    app.useLogger(['log', 'error', 'warn', 'debug', 'verbose']);
  }

  // Disable Swagger in production
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('ChargeHive API - DEV')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(process.env.PORT || 3000);
}
```

---

## Environment Variables Comparison

### Development (`chargehive-backend-dev`):
```bash
CHARGEHIVE_SUPABASE_URL=https://dev-project.supabase.co
CHARGEHIVE_SUPABASE_ANON_KEY=dev-anon-key
JWT_SECRET=dev-secret-xyz123
FLOW_NETWORK=testnet
NODE_ENV=development
```

### Production (`chargehive-backend`):
```bash
CHARGEHIVE_SUPABASE_URL=https://prod-project.supabase.co
CHARGEHIVE_SUPABASE_ANON_KEY=prod-anon-key
JWT_SECRET=super-secure-prod-secret
FLOW_NETWORK=mainnet
NODE_ENV=production
```

---

## Copy Config from Prod to Dev

If you want to copy all config variables from production to dev (and then modify them):

```bash
# Get prod config as JSON
heroku config -a chargehive-backend --json > prod-config.json

# Manually set them to dev with different values
# (There's no automated way to do this safely)
```

**Note:** Never copy production secrets to dev! Always use separate credentials.

---

## Automated Deployments (Optional)

### GitHub Integration

Connect your Heroku dev app to GitHub for automatic deployments:

1. Go to [https://dashboard.heroku.com/apps/chargehive-backend-dev/deploy/github](https://dashboard.heroku.com/apps/chargehive-backend-dev/deploy/github)
2. Connect to your GitHub repository
3. Enable "Automatic Deploys" from the `develop` branch
4. Every push to `develop` branch will auto-deploy to dev environment

### Manual Promotion

After testing in dev, promote to production:

```bash
# Create a pipeline (one-time setup)
heroku pipelines:create chargehive-pipeline -a chargehive-backend-dev

# Add apps to pipeline
heroku pipelines:add chargehive-pipeline -a chargehive-backend-dev --stage development
heroku pipelines:add chargehive-pipeline -a chargehive-backend --stage production

# Promote dev to production
heroku pipelines:promote -a chargehive-backend-dev
```

---

## Testing on Dev Environment

### Create Test Data:
```bash
# Register test provider
curl -X POST https://chargehive-backend-dev.herokuapp.com/api/provider/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-provider@dev.com",
    "password": "Test123!",
    "name": "Test Provider DEV",
    "phone": "+1111111111",
    "businessName": "Dev Test Business"
  }'

# Register test user
curl -X POST https://chargehive-backend-dev.herokuapp.com/api/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-user@dev.com",
    "password": "Test123!",
    "name": "Test User DEV",
    "phone": "+2222222222"
  }'
```

### Test Session Booking:
```bash
# 1. Login and get token
TOKEN=$(curl -X POST https://chargehive-backend-dev.herokuapp.com/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test-user@dev.com","password":"Test123!"}' \
  | jq -r '.data.accessToken')

# 2. Book a session
curl -X POST https://chargehive-backend-dev.herokuapp.com/api/sessions/book \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "serviceId": "your-service-uuid",
    "fromDatetime": "2025-10-22T10:00:00Z",
    "toDatetime": "2025-10-22T12:00:00Z"
  }'
```

---

## Monitoring Both Environments

### View logs side by side:
```bash
# Terminal 1 - Dev logs
heroku logs --tail -a chargehive-backend-dev

# Terminal 2 - Prod logs
heroku logs --tail -a chargehive-backend
```

### Compare dyno status:
```bash
# Dev
heroku ps -a chargehive-backend-dev

# Prod
heroku ps -a chargehive-backend
```

### Compare config:
```bash
# Dev
heroku config -a chargehive-backend-dev

# Prod
heroku config -a chargehive-backend
```

---

## Cost Management

### Free Tier Strategy:
- **Dev**: Use free dyno (sleeps after 30 min)
- **Prod**: Upgrade to Hobby ($7/month, never sleeps)

### Upgrade dev to hobby (optional):
```bash
heroku ps:type hobby -a chargehive-backend-dev
```

### Downgrade back to free:
```bash
heroku ps:type free -a chargehive-backend-dev
```

---

## Quick Reference

### Deploy Commands:
```bash
# Deploy to dev
git push heroku-dev main

# Deploy to prod
git push heroku-prod main

# Deploy feature branch to dev
git push heroku-dev feature-branch:main
```

### Log Commands:
```bash
# Dev logs
heroku logs --tail -a chargehive-backend-dev

# Prod logs
heroku logs --tail -a chargehive-backend
```

### Config Commands:
```bash
# View dev config
heroku config -a chargehive-backend-dev

# Set dev config
heroku config:set KEY=VALUE -a chargehive-backend-dev

# View prod config
heroku config -a chargehive-backend
```

### Restart Commands:
```bash
# Restart dev
heroku restart -a chargehive-backend-dev

# Restart prod
heroku restart -a chargehive-backend
```

---

## Your Dev URLs

After deployment, your dev API will be available at:

- **Base API**: `https://chargehive-backend-dev.herokuapp.com/api`
- **Swagger Docs**: `https://chargehive-backend-dev.herokuapp.com/api/docs`
- **Provider Signup**: `https://chargehive-backend-dev.herokuapp.com/api/provider/signup`
- **User Register**: `https://chargehive-backend-dev.herokuapp.com/api/user/register`
- **Book Session**: `https://chargehive-backend-dev.herokuapp.com/api/sessions/book`

Share these URLs with your team for testing!

---

## Best Practices

1. **Always test on dev first** before deploying to production
2. **Use separate databases** for dev and prod
3. **Use different JWT secrets** for dev and prod
4. **Never use production data in dev** environment
5. **Document breaking changes** before promoting to production
6. **Keep dev environment updated** with latest code
7. **Clean up test data regularly** in dev database

---

## Troubleshooting

### Issue: Wrong app deployed to

**Check which remote you're pushing to:**
```bash
git remote -v
```

**Solution:** Always specify the remote:
```bash
git push heroku-dev main  # Dev
git push heroku-prod main # Prod
```

### Issue: Config variables mixed up

**Solution:** Always use `-a` flag to specify app:
```bash
heroku config:set KEY=VALUE -a chargehive-backend-dev
```

---

**Last Updated:** October 21, 2025
