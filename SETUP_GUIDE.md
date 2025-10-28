# Quick Setup Guide

This guide will help you get the Creativity platform running locally in under 30 minutes.

## Step 1: Install Dependencies (5 minutes)

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

## Step 2: Setup Supabase (5 minutes)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Wait for project to be provisioned (2-3 minutes)
4. Go to Project Settings > API
5. Copy these values:
   - Project URL
   - anon/public key
   - service_role key (click "Reveal" first)

## Step 3: Configure Environment Files (5 minutes)

### Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and add your Supabase credentials:

```env
PORT=3001
NODE_ENV=development

# Supabase (REQUIRED)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Database (REQUIRED - get from Supabase Project Settings > Database)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres

# OpenAI (REQUIRED for image generation)
OPENAI_API_KEY=sk-...

# Anthropic (REQUIRED for text generation)
ANTHROPIC_API_KEY=sk-ant-...

# Meta (Optional - for ad publishing)
META_APP_ID=
META_APP_SECRET=
META_REDIRECT_URI=http://localhost:3001/api/meta/callback

# Stripe (Optional - for billing)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# AWS S3 (REQUIRED for image storage)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=creativity-assets
```

### Frontend Environment

```bash
cd frontend
cp .env.example .env.local
```

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Step 4: Get API Keys (10 minutes)

### Required APIs

#### 1. OpenAI (for DALL-E 3 image generation)
- Go to [platform.openai.com](https://platform.openai.com)
- Sign up and add payment method
- Go to API keys section
- Create new key
- Copy to `OPENAI_API_KEY` in backend/.env

#### 2. Anthropic (for Claude text generation)
- Go to [console.anthropic.com](https://console.anthropic.com)
- Sign up and add payment method
- Go to API keys section
- Create new key
- Copy to `ANTHROPIC_API_KEY` in backend/.env

#### 3. AWS S3 (for image storage)
- Go to [AWS Console](https://console.aws.amazon.com)
- Create S3 bucket named `creativity-assets`
- Create IAM user with S3 access
- Generate access keys
- Copy to backend/.env

### Optional APIs (can skip for now)

#### Meta (for publishing ads)
- Go to [developers.facebook.com](https://developers.facebook.com)
- Create app and add Marketing API
- Get App ID and Secret

#### Stripe (for payments)
- Go to [stripe.com](https://stripe.com)
- Create account
- Get test API keys

## Step 5: Initialize Database (2 minutes)

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init
```

## Step 6: Run the Application (1 minute)

From the root directory:

```bash
npm run dev
```

This will start:
- Frontend on http://localhost:3000
- Backend on http://localhost:3001

## Test the Application

1. Open http://localhost:3000
2. Click "Sign up"
3. Create an account with your email
4. You'll be redirected to the dashboard
5. Click "Generate Creatives"
6. Fill in the form:
   - Brand Name: "EcoBrew Coffee"
   - Product: "Organic coffee pods"
   - Target Audience: "coffee lovers"
   - Click "Generate"
7. Wait 30-60 seconds for AI to generate creatives

## Troubleshooting

### Database Connection Error
- Make sure DATABASE_URL is correct
- Check if Supabase project is active
- Verify password doesn't have special characters (URL encode if needed)

### Prisma Migration Errors
```bash
# Reset database
npx prisma migrate reset

# Regenerate client
npx prisma generate
```

### API Key Errors
- Verify API keys are correct (no extra spaces)
- Check if you have credits/payment method added
- OpenAI and Anthropic require paid accounts for API access

### Frontend Won't Start
```bash
# Clear Next.js cache
cd frontend
rm -rf .next
npm run dev
```

### CORS Errors
- Make sure backend is running on port 3001
- Check NEXT_PUBLIC_API_URL in frontend/.env.local

## Next Steps

Once everything is working:

1. **Setup Meta Integration** (optional)
   - Follow Meta setup in main README
   - Configure OAuth redirect

2. **Setup Stripe** (optional)
   - Add Stripe keys
   - Create pricing plans
   - Test checkout flow

3. **Deploy to Production**
   - Frontend to Vercel
   - Backend to Railway or AWS
   - Update environment variables

## Minimum Required Setup

To test the core functionality, you only need:
- ✅ Supabase account (free)
- ✅ OpenAI API key (paid, ~$5 to start)
- ✅ Anthropic API key (paid, ~$5 to start)
- ✅ AWS S3 bucket (free tier available)

Meta and Stripe can be added later when you're ready to publish ads and accept payments.
