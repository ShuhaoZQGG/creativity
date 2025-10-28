🧩 PROJECT SPECIFICATION — “Creativity” MVP
AI-Powered Ad Creative Optimization Platform
1️⃣ OVERVIEW

Goal:
Creativity helps small business advertisers generate, score, and test ad creatives for Meta Ads using AI-powered text and image generation, and optionally short videos.

Core MVP Outcome:
Users can:

Upload product/brand info or URL

Generate 3–5 ad creatives (headline + primary text + CTA + image)

View AI-based performance scores

Push creatives to Meta Ads and run A/B tests

Track results in dashboard

Manage account and billing

2️⃣ SYSTEM ARCHITECTURE
          ┌─────────────────────────────┐
          │        FRONTEND (Next.js)   │
          │  UI: Input → Generate → AB  │
          │  Auth, Dashboard, Billing   │
          └──────────────┬──────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│                    BACKEND API LAYER                     │
│  Framework: Express.js (Node)        │
│                                                          │
│  Services:                                                │
│  1. Auth Service (Supabase)                      │
│  2. Creative Service (AI text/image generation)           │
│  3. Scoring Service (AI + heuristic models)               │
│  4. Meta Integration Service (OAuth + campaign mgmt)      │
│  5. Billing Service (Stripe)                              │
│  6. Analytics Service (dashboard data aggregation)        │
│                                                          │
└──────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────┐
│    DATABASE & STORAGE LAYER                 │
│ PostgreSQL (Prisma ORM) + AWS S3/Supabase   │
└─────────────────────────────────────────────┘

3️⃣ AI MODEL USAGE
Function	Model	Purpose
Text Generation	GPT-4 or Claude 3.5	Generate ad headline, body, and CTA variants
Text Scoring	GPT-4 / Claude 3.5	Evaluate ad copy quality and engagement
Image Generation	Stability AI SDXL / DALL·E 3 / Midjourney	Create ad visual variants
Video Generation (optional)	Runway Gen-3 / Pika Labs	Generate short ad videos
Predictive Scoring	Local ML (XGBoost or small NN)	Predict CTR / conversion probability
4️⃣ TECH STACK
Layer	Tech	Description
Frontend	Next.js + TypeScript + Tailwind + shadcn/ui	SPA dashboard
Backend	FastAPI or Express.js	RESTful API
Database	PostgreSQL via Prisma ORM	Persistent data
Auth	Supabase Auth or Clerk	Secure user sessions
File Storage	AWS S3 or Supabase Storage	Media assets
Billing	Stripe API	Subscription plans
Integration	Meta Marketing API	Ad management & analytics
Hosting	Vercel (frontend) + AWS Lambda / Railway (backend)	Scalable deployment
5️⃣ DATA MODEL (PostgreSQL Supabase)
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  name TEXT,
  subscription_tier TEXT DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Creatives (text + image + video)
CREATE TABLE creatives (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  input_context JSONB,          -- user input: brand info, target audience, etc.
  text_variant JSONB,           -- headline, body, cta
  image_urls TEXT[],            -- S3 paths
  video_urls TEXT[],            -- optional
  score JSONB,                  -- AI scoring breakdown
  created_at TIMESTAMP DEFAULT NOW()
);

-- AB Tests
CREATE TABLE ab_tests (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  creative_ids UUID[],          -- variants being tested
  meta_campaign_id TEXT,
  results JSONB,                -- metrics fetched from Meta Ads
  created_at TIMESTAMP DEFAULT NOW()
);

-- Billing / Stripe
CREATE TABLE billing (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT,
  status TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

6️⃣ API ENDPOINTS
Auth Service
Endpoint	Method	Description
/api/auth/signup	POST	Register new user
/api/auth/login	POST	Log in and return JWT
/api/auth/me	GET	Get user profile
/api/auth/logout	POST	Log out current session
Creative Service
/api/generate

Method: POST
Description: Generate ad creative variants (text + image)

Request Body:

{
  "brand_name": "EcoBrew Coffee",
  "product_description": "Organic coffee pods compatible with Nespresso machines.",
  "target_audience": "environment-conscious coffee lovers",
  "tone": "friendly",
  "num_variants": 3,
  "input_image_url": "https://example.com/logo.png",
  "website_url": "https://ecobrew.com"
}


Response:

{
  "status": "success",
  "creatives": [
    {
      "id": "uuid",
      "headline": "Brew Green. Feel Great.",
      "body": "Savor every sip with 100% compostable coffee pods.",
      "cta": "Shop Now",
      "image_url": "https://s3.aws.com/Creativity/creative1.png",
      "score": {
        "overall": 0.88,
        "clarity": 0.92,
        "engagement": 0.85
      }
    }
  ]
}

/api/score

Method: POST
Description: Re-score existing creatives based on updated AI model

Request Body:

{ "creative_id": "uuid" }


Response:

{
  "creative_id": "uuid",
  "new_score": { "overall": 0.91, "cta": 0.9, "visual": 0.88 }
}

Meta Integration Service
/api/meta/connect

Method: GET
Description: Start OAuth flow for Meta Ad Account connection.

Response:

{ "auth_url": "https://www.facebook.com/v18.0/dialog/oauth?..." }

/api/meta/callback

Method: GET
Description: Handle Meta OAuth callback.

Response:

{ "status": "connected", "ad_account_id": "act_12345" }

/api/meta/abtest

Method: POST
Description: Create A/B test on Meta Ads

Request Body:

{
  "creative_ids": ["uuid1", "uuid2"],
  "budget": 100,
  "objective": "LINK_CLICKS",
  "audience": { "location": "US", "age_range": [25,45] },
  "duration_days": 5
}


Response:

{
  "status": "created",
  "meta_campaign_id": "123456789",
  "variants": [
    { "creative_id": "uuid1", "ad_id": "meta_ad_1" },
    { "creative_id": "uuid2", "ad_id": "meta_ad_2" }
  ]
}

/api/meta/results

Method: GET
Description: Fetch test results from Meta

Query:
/api/meta/results?campaign_id=123456789

Response:

{
  "campaign_id": "123456789",
  "results": [
    {
      "creative_id": "uuid1",
      "ctr": 0.054,
      "cpc": 1.25,
      "spend": 50.2
    },
    {
      "creative_id": "uuid2",
      "ctr": 0.071,
      "cpc": 0.98,
      "spend": 49.8
    }
  ]
}

Billing Service
/api/billing/create-checkout-session

Method: POST
Description: Create Stripe checkout session.

Request Body:

{ "plan": "pro" }


Response:

{ "checkout_url": "https://checkout.stripe.com/session/..." }

Analytics Service
/api/dashboard

Method: GET
Description: Fetch creatives, scores, and metrics for user dashboard.

Response:

{
  "creatives": [
    {
      "headline": "Brew Green. Feel Great.",
      "score": 0.88,
      "ctr": 0.07,
      "spend": 50
    }
  ],
  "summary": {
    "avg_ctr": 0.065,
    "top_creative_id": "uuid2"
  }
}

7️⃣ INFRASTRUCTURE & DEPLOYMENT
Component	Platform	Notes
Frontend	Vercel	auto-deploy via Git
Backend	AWS Lambda (via API Gateway) or Railway	scalable functions
Database	Supabase / Neon.tech (PostgreSQL)	managed instance
File Storage	AWS S3 / Supabase Storage	image/video hosting
Monitoring	PostHog + Sentry	user analytics + error tracking
CI/CD	GitHub Actions	test → build → deploy
8️⃣ SECURITY & COMPLIANCE

JWT-based authentication

All secrets managed in environment variables (AWS Secrets Manager / Vercel env)

GDPR-compliant user data handling

Image uploads scanned via AWS Rekognition or similar

Stripe + Meta tokens encrypted at rest

9️⃣ MVP ACCEPTANCE CRITERIA

✅ User can:

Sign up and log in.

Input brand info or URL.

Generate ≥3 ad creatives (text + image).

See AI-based scoring for each variant.

Connect Meta Ads and push creatives for A/B testing.

View results (CTR, CPC) in dashboard.

Upgrade via Stripe billing.

All services deployed, functional, and secured.

🔟 OPTIONAL PHASE 1.5+ ENHANCEMENTS

Video creative generation (Runway or Pika)

Auto-learn scoring from user engagement history

Chat-style creative co-pilot UX

Multi-platform support (Google Ads, TikTok Ads)

Team collaboration & versioning