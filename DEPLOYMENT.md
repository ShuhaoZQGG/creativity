# Deployment Guide

This guide covers deploying the Creativity platform to production.

## Architecture Overview

- **Frontend**: Vercel (Next.js hosting)
- **Backend**: Railway, AWS Lambda, or similar
- **Database**: Supabase PostgreSQL
- **File Storage**: AWS S3
- **CDN**: Vercel Edge Network (frontend), CloudFront (S3)

## Frontend Deployment (Vercel)

### 1. Prepare for Deployment

```bash
cd frontend
npm run build
```

Test the build locally:
```bash
npm start
```

### 2. Deploy to Vercel

#### Option A: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd frontend
vercel

# Follow prompts:
# - Link to existing project or create new
# - Set root directory to "frontend"
# - Override build settings: No
# - Set production: Yes
```

#### Option B: GitHub Integration

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your repository
5. Configure:
   - Root Directory: `frontend`
   - Framework: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

### 3. Configure Environment Variables

In Vercel Dashboard > Settings > Environment Variables, add:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_META_APP_ID=your_meta_app_id
```

### 4. Deploy

Vercel will automatically deploy on every push to main branch.

## Backend Deployment (Railway)

### 1. Prepare for Deployment

```bash
cd backend
npm run build
```

### 2. Deploy to Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Link to project
railway link

# Add environment variables
railway variables set PORT=3001
railway variables set NODE_ENV=production
railway variables set SUPABASE_URL=https://...
railway variables set SUPABASE_SERVICE_ROLE_KEY=...
# ... add all other environment variables

# Deploy
railway up
```

### 3. Configure Environment Variables

In Railway Dashboard > Variables, add all variables from `.env`:

- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `META_APP_ID`
- `META_APP_SECRET`
- `META_REDIRECT_URI` (update with production URL)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_S3_BUCKET`
- `FRONTEND_URL` (your Vercel URL)

### 4. Run Database Migrations

```bash
railway run npx prisma migrate deploy
```

## Alternative Backend Deployment (AWS Lambda)

### Using Serverless Framework

1. Install Serverless:
```bash
npm i -g serverless
```

2. Create `serverless.yml` in backend directory:

```yaml
service: creativity-backend

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    DATABASE_URL: ${env:DATABASE_URL}
    SUPABASE_URL: ${env:SUPABASE_URL}
    # ... other env vars

functions:
  api:
    handler: dist/index.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
```

3. Deploy:
```bash
serverless deploy
```

## Database Migration

### Production Database Setup

1. Supabase is already configured for production
2. Run migrations:

```bash
# From your local machine
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

Or from Railway:
```bash
railway run npx prisma migrate deploy
```

## AWS S3 Configuration

### 1. Create Production Bucket

```bash
aws s3 mb s3://creativity-prod-assets
```

### 2. Configure Bucket Policy

Add this bucket policy (replace BUCKET_NAME):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::BUCKET_NAME/*"
    }
  ]
}
```

### 3. Enable CORS

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["https://your-frontend.vercel.app"],
    "ExposeHeaders": []
  }
]
```

## Meta App Production Setup

1. Go to Meta App Dashboard
2. Switch app to "Live" mode
3. Add production OAuth redirect:
   - `https://your-backend.railway.app/api/meta/callback`
4. Submit for App Review if needed
5. Get production credentials

## Stripe Production Setup

1. Switch to live mode in Stripe Dashboard
2. Get live API keys
3. Create production pricing plans
4. Configure webhook:
   - URL: `https://your-backend.railway.app/api/billing/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.deleted`
5. Get webhook secret

## Domain Configuration

### Frontend Domain (Vercel)

1. Go to Vercel Dashboard > Domains
2. Add your domain (e.g., `creativity.app`)
3. Configure DNS:
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```

### Backend Domain (Railway)

1. Go to Railway Dashboard > Settings
2. Add custom domain
3. Configure DNS:
   ```
   Type: CNAME
   Name: api
   Value: your-project.railway.app
   ```

## Environment Variables Checklist

### Frontend (Vercel)
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `NEXT_PUBLIC_API_URL`
- [ ] `NEXT_PUBLIC_META_APP_ID`

### Backend (Railway)
- [ ] `PORT`
- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `OPENAI_API_KEY`
- [ ] `ANTHROPIC_API_KEY`
- [ ] `META_APP_ID`
- [ ] `META_APP_SECRET`
- [ ] `META_REDIRECT_URI`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `STRIPE_PRO_PRICE_ID`
- [ ] `STRIPE_BUSINESS_PRICE_ID`
- [ ] `AWS_ACCESS_KEY_ID`
- [ ] `AWS_SECRET_ACCESS_KEY`
- [ ] `AWS_REGION`
- [ ] `AWS_S3_BUCKET`
- [ ] `FRONTEND_URL`

## Post-Deployment Testing

### 1. Test Authentication
- Sign up new user
- Login
- Logout

### 2. Test Creative Generation
- Generate creatives
- Verify images are stored in S3
- Check AI scoring

### 3. Test Meta Integration
- Connect Meta account
- Verify OAuth flow
- Test campaign creation (with small budget)

### 4. Test Billing
- Create checkout session
- Complete test payment
- Verify webhook handling

### 5. Monitor Logs

Railway:
```bash
railway logs
```

Vercel:
- Check deployment logs in dashboard
- Monitor function logs

## Monitoring & Alerts

### Setup Application Monitoring

1. **Sentry** (Error Tracking)
   ```bash
   npm install @sentry/node @sentry/nextjs
   ```

2. **PostHog** (Analytics)
   ```bash
   npm install posthog-js posthog-node
   ```

3. **LogTail** or **Datadog** (Logs)

### Health Checks

Add to backend:
```typescript
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
  });
});
```

## Rollback Procedure

### Frontend (Vercel)
1. Go to Deployments
2. Select previous deployment
3. Click "Promote to Production"

### Backend (Railway)
1. Go to Deployments
2. Click on previous deployment
3. Click "Redeploy"

## Security Checklist

- [ ] All API keys in environment variables
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] HTTPS only
- [ ] Secrets rotated regularly
- [ ] Database backups enabled
- [ ] S3 bucket not publicly listable
- [ ] Supabase RLS policies configured
- [ ] Stripe webhook signature verification
- [ ] Meta OAuth tokens encrypted

## Cost Optimization

1. **Vercel**: Free for hobby, ~$20/mo for Pro
2. **Railway**: ~$5-20/mo depending on usage
3. **Supabase**: Free tier, then ~$25/mo
4. **AWS S3**: ~$1-5/mo for storage
5. **OpenAI**: Pay per use (~$0.10 per creative)
6. **Anthropic**: Pay per use (~$0.05 per creative)
7. **Stripe**: 2.9% + $0.30 per transaction

**Estimated monthly cost**: $50-100 for small scale

## Scaling Considerations

### When to scale:
- >1000 creatives per day
- >100 concurrent users
- >10GB images in S3

### How to scale:
1. **Frontend**: Vercel auto-scales
2. **Backend**: Increase Railway instances or switch to AWS ECS
3. **Database**: Upgrade Supabase plan or migrate to managed RDS
4. **S3**: Add CloudFront CDN
5. **Caching**: Add Redis for API responses
