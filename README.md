# Creativity - AI-Powered Ad Creative Optimization Platform

An AI-powered platform that helps small business advertisers generate, score, and test ad creatives for Meta Ads using advanced AI models for text and image generation.

## Features

- **AI-Powered Creative Generation**: Generate ad headlines, body text, and CTAs using Claude 3.5 Sonnet
- **Image Generation**: Automatic ad image creation using DALL-E 3
- **Performance Scoring**: AI-based scoring system to evaluate creative quality
- **Meta Ads Integration**: Push creatives directly to Meta Ads and run A/B tests
- **Dashboard & Analytics**: Track performance metrics and creative scores
- **Subscription Management**: Stripe-powered billing system

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Supabase Auth** - Authentication
- **Axios** - API client

### Backend
- **Express.js** - API server
- **TypeScript** - Type safety
- **Prisma** - ORM for database
- **PostgreSQL** - Database (via Supabase)
- **Supabase** - Authentication & database
- **OpenAI API** - DALL-E 3 for image generation
- **Anthropic Claude** - Text generation and scoring
- **Meta Marketing API** - Ad campaign management
- **Stripe** - Payment processing
- **AWS S3** - Image storage

## Project Structure

```
creativity/
├── frontend/           # Next.js frontend application
│   ├── app/           # Next.js app router pages
│   ├── components/    # React components
│   └── lib/          # Utilities and API clients
├── backend/           # Express.js backend API
│   ├── src/
│   │   ├── routes/   # API route handlers
│   │   ├── services/ # Business logic
│   │   ├── middleware/ # Auth & other middleware
│   │   └── lib/      # Utilities
│   └── prisma/       # Database schema
└── Plan.md           # Project specification
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or Supabase account)
- Supabase project
- OpenAI API key
- Anthropic API key
- Meta Developer account and app
- Stripe account
- AWS account (for S3)

### 1. Clone and Install

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

### 2. Setup Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from Project Settings > API
3. Get your service role key (used for backend)

### 3. Setup Database

```bash
cd backend

# Copy environment file
cp .env.example .env

# Update .env with your Supabase database URL
# DATABASE_URL="postgresql://..."

# Run Prisma migrations
npx prisma migrate dev
npx prisma generate
```

### 4. Configure Environment Variables

#### Backend (.env)

```env
PORT=3001
NODE_ENV=development

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...

# Meta
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_REDIRECT_URI=http://localhost:3001/api/meta/callback

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=creativity-assets
```

#### Frontend (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_META_APP_ID=your_meta_app_id
```

### 5. Setup Meta App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app
3. Add "Facebook Login" and "Marketing API" products
4. Configure OAuth redirect URIs:
   - `http://localhost:3001/api/meta/callback`
5. Get your App ID and App Secret

### 6. Setup Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Get your API keys from Developers > API keys
3. Create pricing plans:
   ```bash
   # Pro Plan
   stripe prices create --product=prod_xxx --unit-amount=4900 --currency=usd --recurring[interval]=month

   # Business Plan
   stripe prices create --product=prod_xxx --unit-amount=9900 --currency=usd --recurring[interval]=month
   ```
4. Update backend .env with price IDs:
   ```env
   STRIPE_PRO_PRICE_ID=price_...
   STRIPE_BUSINESS_PRICE_ID=price_...
   ```

### 7. Setup AWS S3

1. Create an S3 bucket for storing generated images
2. Configure bucket policy for public read access
3. Create IAM user with S3 access and get credentials

## Running the Application

### Development Mode

Run both frontend and backend concurrently:

```bash
# From root directory
npm run dev
```

Or run separately:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Production Build

```bash
# Build both
npm run build

# Start both
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Creative Generation
- `POST /api/generate` - Generate ad creatives
- `POST /api/score` - Re-score a creative
- `GET /api/creatives` - Get all creatives
- `GET /api/creatives/:id` - Get single creative

### Meta Ads Integration
- `GET /api/meta/connect` - Start OAuth flow
- `GET /api/meta/callback` - OAuth callback
- `POST /api/meta/abtest` - Create A/B test campaign
- `GET /api/meta/results?campaign_id=xxx` - Get campaign results

### Billing
- `POST /api/billing/create-checkout-session` - Create Stripe checkout
- `POST /api/billing/webhook` - Stripe webhook handler
- `GET /api/billing/info` - Get billing information

### Analytics
- `GET /api/dashboard` - Get dashboard data
- `GET /api/analytics` - Get detailed analytics

## Usage Flow

1. **Sign Up / Login**
   - Users create an account or login
   - Authentication handled by Supabase

2. **Generate Creatives**
   - Navigate to /generate
   - Enter brand info, product description, target audience
   - AI generates 3-5 creative variants with images
   - Each creative gets an AI performance score

3. **View Dashboard**
   - See all generated creatives
   - View scores and performance metrics
   - Track overall statistics

4. **Connect Meta Ads**
   - Click "Connect Meta" in settings
   - Complete OAuth flow
   - Grant necessary permissions

5. **Run A/B Tests**
   - Select 2+ creatives
   - Configure budget and targeting
   - Launch campaign on Meta Ads
   - Track results in dashboard

6. **Upgrade Plan**
   - Navigate to billing
   - Select Pro or Business plan
   - Complete Stripe checkout

## Database Schema

See `backend/prisma/schema.prisma` for the complete schema including:
- `users` - User accounts and subscription info
- `creatives` - Generated ad creatives
- `ab_tests` - A/B test campaigns
- `billing` - Stripe billing records

## Deployment

### Frontend (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel
```

### Backend Options

#### Railway
```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy
cd backend
railway login
railway init
railway up
```

#### AWS Lambda
- Use Serverless Framework or AWS SAM
- Configure API Gateway
- Update CORS settings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/yourusername/creativity/issues)
- Email: support@creativity.app

## Roadmap

- [ ] Video creative generation (Runway Gen-3)
- [ ] Auto-learning scoring model
- [ ] Chat-style creative co-pilot
- [ ] Multi-platform support (Google Ads, TikTok)
- [ ] Team collaboration features
- [ ] Advanced analytics dashboard
