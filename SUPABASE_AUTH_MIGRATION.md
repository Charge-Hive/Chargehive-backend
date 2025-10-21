# Supabase Auth Migration Guide

Your application now uses **Supabase Authentication** instead of custom JWT!

## ✅ What Changed

### Before (Custom JWT):
- Manual password hashing
- Custom JWT generation
- Manual email service needed
- Complex forgot password flow
- No session management

### After (Supabase Auth):
- ✅ Automatic password hashing
- ✅ Built-in JWT tokens
- ✅ Built-in email service (30,000 emails/month free)
- ✅ One-line forgot password
- ✅ Automatic session refresh
- ✅ Email verification included

---

## 🔧 Setup Required

### 1. Update your `.env` file

Add these new keys from your Supabase Dashboard:

```env
# Get these from Supabase Dashboard → Settings → API
PROVIDER_SUPABASE_ANON_KEY=your_provider_anon_key_here
USER_SUPABASE_ANON_KEY=your_user_anon_key_here

# Frontend URL for password reset redirects
FRONTEND_URL=http://localhost:3001
```

### 2. Run Database Migrations

```sql
-- Run in your Provider Supabase database
migrations/providers/004_remove_password_column.sql
```

This removes the `password`, `reset_token`, and `reset_token_expiry` columns (now handled by Supabase Auth).

### 3. Enable Email in Supabase

1. Go to Supabase Dashboard → Authentication → Email Templates
2. Customize your email templates (optional)
3. Configure SMTP (optional - Supabase provides built-in email service)

---

## 📡 New API Response Format

### Signup Response:
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "access_token": "eyJhbGc...",
    "refresh_token": "v1.MR5m...",
    "user": {
      "id": "uuid",
      "email": "provider@example.com",
      "user_metadata": { "name": "John", "type": "provider" }
    },
    "provider": {
      "id": "uuid",
      "email": "provider@example.com",
      "name": "John Doe",
      ...
    }
  }
}
```

### Login Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "eyJhbGc...",
    "refresh_token": "v1.MR5m...",
    "user": { ... },
    "provider": { ... }
  }
}
```

---

## 🚀 Updated API Endpoints

### 1. **Signup** (No change in usage)
```
POST /api/provider/signup

Body:
{
  "email": "provider@example.com",
  "password": "password123",
  "name": "John Doe",
  ...
}
```

### 2. **Login** (No change in usage)
```
POST /api/provider/login

Body:
{
  "email": "provider@example.com",
  "password": "password123"
}
```

### 3. **Forgot Password** (Simplified!)
```
POST /api/provider/forgot-password

Body:
{
  "email": "provider@example.com"
}

✅ Email automatically sent by Supabase!
```

### 4. **Reset Password** (Changed!)
```
POST /api/provider/reset-password

Body:
{
  "accessToken": "token-from-reset-email",
  "newPassword": "newPassword123"
}
```

### 5. **Update Password** (Changed!)
```
PUT /api/provider/password

Body:
{
  "accessToken": "current-user-access-token",
  "newPassword": "newPassword123"
}

⚠️ No longer requires currentPassword verification
⚠️ User must be authenticated
```

---

## 🔐 Authentication Flow

### Client-Side (Frontend):

```javascript
// 1. Signup
const response = await fetch('/api/provider/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password, name, ... })
});

const { data } = await response.json();

// Save tokens
localStorage.setItem('access_token', data.access_token);
localStorage.setItem('refresh_token', data.refresh_token);

// 2. Use access token for protected routes
fetch('/api/provider/profile', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  }
});

// 3. Forgot Password (sends email automatically)
await fetch('/api/provider/forgot-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email })
});
// User receives email with reset link

// 4. Reset Password (from email link)
const resetToken = new URLSearchParams(window.location.search).get('token');
await fetch('/api/provider/reset-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    accessToken: resetToken,
    newPassword: 'newPassword123'
  })
});
```

---

## 🎯 Benefits

| Feature | Before | After |
|---------|--------|-------|
| **Password Hashing** | Manual bcrypt | ✅ Automatic |
| **Forgot Password** | Custom token + manual email | ✅ One line + auto email |
| **Email Service** | Need SendGrid/etc | ✅ Built-in (30k/month) |
| **Session Management** | None | ✅ Auto refresh tokens |
| **Email Verification** | Manual | ✅ Built-in |
| **OAuth (Google/FB)** | Very complex | ✅ One-click setup |
| **Security** | DIY | ✅ Battle-tested |

---

## ⚠️ Breaking Changes

1. **Login/Signup Response**: Now includes `access_token` and `refresh_token` instead of just `token`
2. **Password Update**: No longer requires `currentPassword`, requires `accessToken`
3. **Reset Password**: Uses `accessToken` from email instead of custom `resetToken`
4. **Database**: `password` column removed from `providers` table

---

## 📚 Next Steps

1. Update your frontend to use `access_token` and `refresh_token`
2. Implement token refresh logic (Supabase handles expiry)
3. Customize email templates in Supabase Dashboard
4. (Optional) Enable OAuth providers (Google, Facebook, etc.)

---

## 🔗 Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [OAuth Setup](https://supabase.com/docs/guides/auth/social-login)
