# Jotlin Technical Architecture

**Version:** 2.0 (Competitive Intelligence Platform - Multi-Agent System)
**Last Updated:** 2025-01-13
**Tech Stack:** Next.js 15, React 19, TypeScript, Prisma, **Mastra.ai**, Gemini AI, Tavily

---

## 🎯 Multi-Agent Architecture Overview

Jotlin采用**多Agent协作架构**,基于[Mastra.ai](https://mastra.ai)框架实现:

- **5个专业Agent** - 每个专注特定领域(发现、分析、市场、策略、综合)
- **工具增强** - 集成Tavily Web Search、Product Hunt、Crunchbase API
- **并行执行** - 独立任务并发处理,速度提升3-4x
- **流式响应** - 通过Vercel AI SDK实时更新进度

**详细文档**: 请参阅 [MULTI_AGENT_ARCHITECTURE.md](./MULTI_AGENT_ARCHITECTURE.md)

---

## System Overview

Jotlin is built as a conversational AI-driven competitive intelligence platform with multi-agent collaboration:

```
┌─────────────────────────────────────────────────────────────┐
│                  User Interface Layer                        │
│   (Next.js App Router, React Server Components, shadcn/ui)   │
│   + Vercel AI SDK (useChat, streaming)                       │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              Next.js API Routes Layer                        │
│   POST /api/analysis → Mastra Workflow                       │
│   GET  /api/competitors → Prisma                             │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│             ⚡ Mastra.ai Multi-Agent Layer ⚡               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Discovery Agent + Tavily Tool                       │   │
│  │  ↓                                                   │   │
│  │  Feature Analysis Agent (parallel × N competitors)   │   │
│  │  ↓                                                   │   │
│  │  Market Research Agent + Strategy Agent (parallel)   │   │
│  │  ↓                                                   │   │
│  │  Synthesis Agent → Final Report                      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────┬───────────────┬───────────────┬─────────────────────┘
      │               │               │
┌─────▼──────┐  ┌────▼────────┐  ┌───▼────────────────────────┐
│  Database  │  │  AI Models  │  │  External Tools            │
│  (Prisma)  │  │  (Gemini)   │  │  • Tavily (Web Search)     │
│            │  │             │  │  • Product Hunt API        │
│            │  │             │  │  • Crunchbase API          │
└────────────┘  └─────────────┘  └────────────────────────────┘
```

---

## Architecture Layers

### 1. Frontend Layer

#### Technology Stack
- **Framework:** Next.js 15.5.2 with App Router
- **React:** v19.1.0 (Server Components + Client Components)
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **State Management:**
  - Server state: React Query (@tanstack/react-query)
  - Client state: Zustand
- **Real-time:** Vercel AI SDK (streaming responses)

#### Key Components

```
app/
├── (app)/                          # Authenticated routes
│   ├── analysis/[chatId]/         # Main analysis workspace
│   │   ├── discovery/             # Phase 1: Competitor discovery
│   │   ├── features/              # Phase 2: Feature benchmarking
│   │   ├── positioning/           # Phase 3: Market positioning
│   │   └── recommendations/       # Phase 4: Strategic recommendations
│   │
│   ├── competitors/               # Competitor data management
│   │   ├── page.tsx              # List view (all competitors)
│   │   ├── [id]/page.tsx         # Detail view (single competitor)
│   │   └── compare/page.tsx      # Side-by-side comparison
│   │
│   ├── reports/                   # Generated analysis reports
│   │   ├── page.tsx              # Report list
│   │   └── [id]/page.tsx         # Report viewer
│   │
│   └── settings/                  # User settings & API config
│
├── api/                            # API routes (see Backend Layer)
├── layout.tsx                      # Root layout
└── page.tsx                        # Landing page
```

#### Component Architecture

**Core UI Components:**
```
components/
├── ui/                            # shadcn/ui primitives
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── table.tsx
│   └── ...
│
├── analysis/                      # Analysis-specific components
│   ├── competitor-card.tsx       # Competitor display card
│   ├── feature-matrix.tsx        # Feature comparison table
│   ├── positioning-map.tsx       # 2x2 positioning chart
│   ├── swot-matrix.tsx           # SWOT visualization
│   └── pricing-comparison.tsx    # Pricing tier comparison
│
├── chat/                          # Conversational interface
│   ├── message-list.tsx          # Chat history
│   ├── assistant-message.tsx     # AI response renderer
│   ├── user-message.tsx          # User input display
│   └── chat-input.tsx            # Message input box
│
├── competitors/                   # Competitor management
│   ├── competitor-list.tsx       # Grid/list view
│   ├── competitor-form.tsx       # Add/edit form
│   └── competitor-filter.tsx     # Search & filter
│
└── providers/                     # Context providers
    ├── query-provider.tsx        # React Query setup
    └── theme-provider.tsx        # Dark mode
```

---

### 2. Backend Layer (API Routes)

#### API Structure

```
app/api/
├── auth/                          # Authentication
│   ├── login/route.ts
│   ├── register/route.ts
│   └── logout/route.ts
│
├── chats/                         # Analysis sessions
│   ├── route.ts                  # GET (list), POST (create)
│   ├── [id]/route.ts             # GET, PATCH, DELETE
│   └── [id]/messages/route.ts    # POST (send message, stream AI)
│
├── competitors/                   # Competitor CRUD
│   ├── route.ts                  # GET (list), POST (create)
│   ├── [id]/route.ts             # GET, PATCH, DELETE
│   ├── [id]/features/route.ts    # Manage competitor features
│   └── enrich/route.ts           # Trigger external data enrichment
│
├── analyses/                      # Analysis results
│   ├── [chatId]/route.ts         # GET analysis summary
│   └── [chatId]/export/route.ts  # POST (generate PDF/Excel)
│
└── external/                      # External API proxies
    ├── producthunt/route.ts      # Product Hunt API
    └── crunchbase/route.ts       # Crunchbase API
```

#### Key API Endpoints

**Chat & AI Interaction:**
```typescript
POST /api/chats/[id]/messages
// Handles streaming AI responses
// Request: { text: string, phase: ChatPhase }
// Response: Streaming text with XML tags
```

**Competitor Enrichment:**
```typescript
POST /api/competitors/enrich
// Request: { name: string, website: string }
// Response: { id, name, description, logo, funding, ... }
// Process:
//   1. Query Product Hunt API
//   2. Query Crunchbase API
//   3. Merge data
//   4. Save to database
```

**Report Export:**
```typescript
POST /api/analyses/[chatId]/export
// Request: { format: "pdf" | "markdown" | "excel" }
// Response: Binary file download
```

---

### 3. AI Service Layer

#### AI Architecture

```
libs/ai/
├── model-config.ts               # AI model selection
├── prompt.ts                     # Phase-specific prompts
├── xml-parser.ts                 # Parse AI XML responses
└── stream-handler.ts             # Handle streaming responses
```

#### AI Models

```typescript
export const AI_MODELS = {
  discovery: 'gemini-2.5-pro',           // Competitor identification
  featureBenchmark: 'gemini-2.5-pro',    // Feature analysis
  marketPositioning: 'gemini-2.5-pro',   // Market analysis
  recommendations: 'gemini-2.5-pro',     // Strategic insights
}
```

#### Prompt System

**Phase 1: Competitor Discovery**
```typescript
const competitorDiscoveryPrompt = `
You are an expert market researcher specializing in competitive intelligence.

## Your Mission
Identify ALL relevant competitors for the user's product idea:
1. Direct competitors (same solution, same audience)
2. Indirect competitors (different solution, same problem)
3. Adjacent competitors (different problem, overlapping audience)

## Output Format
<competitors>
  <competitor>
    <name>Notion</name>
    <website>https://notion.so</website>
    <type>direct</type>
    <description>...</description>
    <marketPosition>leader</marketPosition>
  </competitor>
</competitors>

<question>Would you like to add any competitors I might have missed?</question>
<options type="multiple">
  <option value="notion">Notion</option>
  <option value="coda">Coda</option>
  ...
</options>
`
```

**Phase 2: Feature Benchmarking**
```typescript
const featureBenchmarkPrompt = `
You are a product analyst specializing in feature comparison.

## Your Mission
For EACH confirmed competitor, analyze:
1. Core feature list (10-15 key features)
2. Feature categorization (table stakes / differentiators / innovations)
3. Implementation quality (excellent / good / basic / poor)

## Output Format
<feature-analysis competitor="Notion">
  <features>
    <feature>
      <name>Block-based editor</name>
      <category>differentiator</category>
      <quality>excellent</quality>
      <description>...</description>
    </feature>
  </features>
  <strengths>...</strengths>
  <weaknesses>...</weaknesses>
</feature-analysis>

<comparison-matrix>
  <feature name="Real-time collaboration">
    <competitor name="Notion" support="yes" quality="excellent"/>
    <competitor name="Coda" support="yes" quality="good"/>
  </feature>
</comparison-matrix>
`
```

**Phase 3: Market Positioning**
```typescript
const marketPositioningPrompt = `
You are a market strategist specializing in competitive positioning.

## Your Mission
Analyze the competitive landscape:
1. Target audience analysis
2. Pricing strategy comparison
3. Market share estimation
4. Brand positioning
5. SWOT analysis

## Output Format
<positioning-analysis>
  <pricing>...</pricing>
  <audience>...</audience>
  <positioning-map>
    <competitor name="Notion" x="0.7" y="0.6"/>
    <competitor name="Coda" x="0.8" y="0.5"/>
  </positioning-map>
  <swot>...</swot>
</positioning-analysis>
`
```

**Phase 4: Recommendations**
```typescript
const recommendationPrompt = `
You are a product strategist synthesizing competitive intelligence.

## Your Mission
Based on ALL previous analysis, provide:
1. MVP feature recommendations (prioritized)
2. Differentiation strategy
3. Go-to-market recommendations
4. Competitive risks & mitigation

## Output Format
<recommendations>
  <mvp-features>
    <priority level="P0">
      <feature>User authentication</feature>
      <reasoning>Table stakes - all competitors have this</reasoning>
    </priority>
  </mvp-features>
  <differentiation>...</differentiation>
  <gtm-strategy>...</gtm-strategy>
  <risks>...</risks>
</recommendations>
`
```

#### XML Response Parsing

```typescript
// libs/ai/xml-parser.ts
export interface ParsedResponse {
  prose?: string[]              // AI explanation text
  question?: string             // Question to user
  options: { value: string; text: string }[]
  optionType?: 'single' | 'multiple'
  competitors?: CompetitorData[]
  featureAnalysis?: FeatureAnalysisData
  positioning?: PositioningData
  recommendations?: RecommendationData
  rawText: string
}

export function parseAIResponse(content: string): ParsedResponse {
  // Extract XML tags using regex
  // Parse structured data
  // Return typed object
}
```

---

### 4. Database Layer

#### Schema Design

```prisma
// prisma/schema.prisma

// User authentication
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String   // Hashed
  chats     Chat[]
  createdAt DateTime @default(now())
}

// Analysis session (replaces old "project")
model Chat {
  id          String     @id @default(cuid())
  userId      String
  user        User       @relation(fields: [userId], references: [id])

  title       String?
  productIdea String     // User's initial product description
  phase       ChatPhase? // Current workflow phase

  messages    Message[]
  analyses    CompetitorAnalysis[]
  documents   Document[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum ChatPhase {
  DISCOVERY           // Phase 1: Identify competitors
  FEATURE_BENCHMARK   // Phase 2: Analyze features
  MARKET_POSITIONING  // Phase 3: Market analysis
  RECOMMENDATION      // Phase 4: Strategic insights
}

// Chat messages (user + AI)
model Message {
  id       String   @id @default(cuid())
  chatId   String
  chat     Chat     @relation(fields: [chatId], references: [id])

  role     String   // "user" | "assistant"
  parts    Json     // Message content (text, XML)
  metadata Json?    // User selections, options chosen

  createdAt DateTime @default(now())
}

// Competitor entities
model Competitor {
  id          String   @id @default(cuid())
  name        String
  website     String?
  description String?
  logo        String?
  category    String?

  // Market data
  foundedYear Int?
  funding     String?   // e.g., "Series B"
  teamSize    String?   // e.g., "51-200"
  pricing     Json?     // Pricing tiers structure

  // Relations
  features    CompetitorFeature[]
  analyses    CompetitorAnalysis[] @relation("AnalysisCompetitors")

  // Metadata
  source      String?   // "AI" | "PRODUCT_HUNT" | "CRUNCHBASE" | "MANUAL"
  externalId  String?   // External platform ID

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([name])
}

// Competitor features
model CompetitorFeature {
  id            String     @id @default(cuid())
  competitorId  String
  competitor    Competitor @relation(fields: [competitorId], references: [id])

  name          String
  category      String     // "table_stakes" | "differentiator" | "innovation"
  description   String?
  implementation String?   // How it's implemented
  quality       String?    // "excellent" | "good" | "basic" | "poor"

  isCore        Boolean @default(false)
  isDifferentiator Boolean @default(false)

  createdAt DateTime @default(now())

  @@index([competitorId])
}

// Analysis results
model CompetitorAnalysis {
  id           String   @id @default(cuid())
  chatId       String
  chat         Chat     @relation(fields: [chatId], references: [id])

  competitors  Competitor[] @relation("AnalysisCompetitors")

  // Analysis outputs
  marketInsights  Json?  // Target audience, market size
  swotAnalysis    Json?  // Strengths, weaknesses, opportunities, threats
  positioningMap  Json?  // 2x2 matrix coordinates
  recommendations Json?  // MVP features, GTM strategy

  status       AnalysisStatus @default(IN_PROGRESS)

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

enum AnalysisStatus {
  IN_PROGRESS
  COMPLETED
  ARCHIVED
}

// Final reports/documents
model Document {
  id      String      @id @default(cuid())
  chatId  String
  chat    Chat        @relation(fields: [chatId], references: [id])

  phase   ChatPhase   // Which phase this doc is from
  content String      // Markdown content
  status  DocumentStatus

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum DocumentStatus {
  DRAFT
  COMPLETED
  ARCHIVED
}
```

#### Database Relationships

```
User (1) ─┬─ (N) Chat
          │
Chat (1) ─┼─ (N) Message
          ├─ (N) CompetitorAnalysis
          └─ (N) Document

CompetitorAnalysis (N) ─── (N) Competitor

Competitor (1) ─── (N) CompetitorFeature
```

---

### 5. External Data Integration

#### Architecture

```
┌────────────────────────────────────────────────────┐
│              External Data Pipeline                │
└────────────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────▼─────┐    ┌────▼─────┐    ┌────▼─────┐
   │ Product  │    │ Crunch-  │    │ Manual   │
   │  Hunt    │    │  base    │    │  Input   │
   │   API    │    │   API    │    │          │
   └────┬─────┘    └────┬─────┘    └────┬─────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
                  ┌──────▼──────┐
                  │   Merge &   │
                  │  Validate   │
                  └──────┬──────┘
                         │
                  ┌──────▼──────┐
                  │  Competitor │
                  │   Database  │
                  └─────────────┘
```

#### Product Hunt Integration

```typescript
// libs/external/product-hunt.ts
export async function fetchProductHuntData(productName: string) {
  const query = `
    query {
      posts(search: "${productName}") {
        nodes {
          name
          tagline
          description
          website
          thumbnail { url }
          votesCount
          commentsCount
          createdAt
          topics { nodes { name } }
        }
      }
    }
  `

  const response = await fetch('https://api.producthunt.com/v2/api/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PRODUCT_HUNT_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  })

  const data = await response.json()
  return data.data.posts.nodes[0]
}
```

#### Crunchbase Integration

```typescript
// libs/external/crunchbase.ts
export async function fetchCrunchbaseData(companyName: string) {
  const response = await fetch(
    `https://api.crunchbase.com/api/v4/entities/organizations/${companyName}`,
    {
      headers: {
        'X-cb-user-key': process.env.CRUNCHBASE_API_KEY,
      },
    }
  )

  const data = await response.json()

  return {
    name: data.properties.name,
    description: data.properties.short_description,
    foundedYear: data.properties.founded_on?.year,
    funding: data.properties.last_funding_type,
    teamSize: data.properties.num_employees_enum,
    totalFunding: data.properties.funding_total?.value_usd,
  }
}
```

#### Data Enrichment Flow

```typescript
// app/api/competitors/enrich/route.ts
export async function POST(req: Request) {
  const { name, website } = await req.json()

  try {
    // 1. Fetch from Product Hunt
    const phData = await fetchProductHuntData(name)

    // 2. Fetch from Crunchbase
    const cbData = await fetchCrunchbaseData(name)

    // 3. Merge data with priority
    const enrichedData = {
      name,
      website: website || phData?.website || cbData?.website,
      description: phData?.tagline || cbData?.description,
      logo: phData?.thumbnail?.url,
      category: phData?.topics?.[0]?.name,
      foundedYear: cbData?.foundedYear,
      funding: cbData?.funding,
      teamSize: cbData?.teamSize,
      source: 'PRODUCT_HUNT,CRUNCHBASE',
      externalId: phData?.id,
    }

    // 4. Save to database
    const competitor = await prisma.competitor.upsert({
      where: { name },
      update: enrichedData,
      create: enrichedData,
    })

    return NextResponse.json(competitor)
  } catch (error) {
    // Fallback: save with manual data only
    const competitor = await prisma.competitor.create({
      data: { name, website, source: 'MANUAL' },
    })
    return NextResponse.json(competitor)
  }
}
```

---

### 6. Data Flow Architecture

#### Complete Analysis Flow

```
┌─────────────┐
│ User Input  │
│ "Build a    │
│  note app"  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  Phase 1: DISCOVERY                         │
│  ┌──────────┐      ┌────────────┐          │
│  │ AI Model │─────▶│ Competitor │          │
│  │ Gemini   │      │   List     │          │
│  └──────────┘      └─────┬──────┘          │
│                          │                  │
│                          ▼                  │
│               ┌─────────────────┐           │
│               │ External API    │           │
│               │ Enrichment      │           │
│               └────────┬────────┘           │
│                        │                    │
│                        ▼                    │
│               ┌─────────────────┐           │
│               │ Save to DB      │           │
│               │ (Competitor)    │           │
│               └─────────────────┘           │
└─────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  Phase 2: FEATURE_BENCHMARK                 │
│  ┌──────────┐      ┌────────────┐          │
│  │ AI Model │─────▶│  Feature   │          │
│  │ (per     │      │  Analysis  │          │
│  │ competitor)      └─────┬──────┘          │
│  └──────────┘            │                  │
│                          ▼                  │
│               ┌─────────────────┐           │
│               │ Save Features   │           │
│               │ to DB           │           │
│               └────────┬────────┘           │
│                        │                    │
│                        ▼                    │
│               ┌─────────────────┐           │
│               │ Generate Matrix │           │
│               └─────────────────┘           │
└─────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  Phase 3: MARKET_POSITIONING                │
│  ┌──────────┐      ┌────────────┐          │
│  │ AI Model │─────▶│ Positioning│          │
│  │          │      │ Data       │          │
│  └──────────┘      └─────┬──────┘          │
│                          │                  │
│                          ▼                  │
│               ┌─────────────────┐           │
│               │ Save Analysis   │           │
│               │ (SWOT, pricing) │           │
│               └─────────────────┘           │
└─────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  Phase 4: RECOMMENDATION                    │
│  ┌──────────┐      ┌────────────┐          │
│  │ AI Model │─────▶│ Strategic  │          │
│  │ (synthesis)     │ Insights   │          │
│  └──────────┘      └─────┬──────┘          │
│                          │                  │
│                          ▼                  │
│               ┌─────────────────┐           │
│               │ Generate Report │           │
│               │ (Document)      │           │
│               └─────────────────┘           │
└─────────────────────────────────────────────┘
       │
       ▼
┌─────────────┐
│ Final       │
│ Deliverable │
│ • PDF       │
│ • Excel     │
│ • Markdown  │
└─────────────┘
```

---

## Security Architecture

### Authentication
- JWT tokens stored in HTTP-only cookies
- Password hashing with bcrypt (10 rounds)
- Session expiration: 7 days

### Authorization
- Row-level security: Users can only access their own chats/analyses
- Middleware checks on all API routes

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')

  if (!token && request.nextUrl.pathname.startsWith('/app')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Verify JWT and attach user to request
  // ...
}
```

### API Key Management
- External API keys stored in environment variables
- Never exposed to client
- Rate limiting on API routes (10 req/min per user)

---

## Performance Optimizations

### Frontend
- **React Server Components** for initial page loads
- **Streaming UI** for AI responses (progressive rendering)
- **Image optimization** with next/image
- **Code splitting** by route (automatic with App Router)
- **Prefetching** of likely next pages

### Backend
- **Database connection pooling** (Prisma default)
- **Query optimization** with indexes
- **Caching** of competitor data (7 days TTL)
- **Debounced API calls** to external services

### AI
- **Streaming responses** to reduce perceived latency
- **Prompt caching** for repeated queries
- **Model selection** by task complexity

---

## Deployment Architecture

### Infrastructure

```
┌─────────────────────────────────────────┐
│           Vercel Edge Network           │
│  (CDN, SSL, DDoS protection)            │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│        Next.js Application              │
│  (Serverless functions)                 │
│  • API routes                           │
│  • Server Components                    │
│  • Edge middleware                      │
└────────┬────────────────┬───────────────┘
         │                │
    ┌────▼─────┐    ┌────▼──────┐
    │ Postgres │    │  Google   │
    │ Database │    │  Gemini   │
    │ (Supabase│    │    API    │
    │  or Neon)│    └───────────┘
    └──────────┘
```

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://..."

# Authentication
JWT_SECRET="..."

# AI
GOOGLE_AI_API_KEY="..."

# External APIs
PRODUCT_HUNT_API_KEY="..."
CRUNCHBASE_API_KEY="..."

# App
NEXT_PUBLIC_APP_URL="https://jotlin.app"
```

### Deployment Pipeline

```
GitHub push
    │
    ▼
┌────────────────┐
│ GitHub Actions │
│ • Run tests    │
│ • Type check   │
│ • Lint         │
└───────┬────────┘
        │
        ▼ (on main branch)
┌────────────────┐
│ Vercel Deploy  │
│ • Build        │
│ • Deploy       │
│ • Run migrate  │
└────────────────┘
```

---

## Monitoring & Observability

### Logging
- **Vercel Logs** for serverless function execution
- **Structured logging** with Winston
- **Error tracking** with Sentry

### Metrics
- Response times (P50, P95, P99)
- AI token usage
- External API success rates
- Database query performance

### Alerts
- 5xx error rate > 1%
- AI API downtime
- Database connection pool exhaustion

---

## Scalability Considerations

### Current Limits (MVP)
- 1000 concurrent users
- 100,000 competitors in database
- 50,000 analyses per month

### Scaling Strategy

**Database:**
- Horizontal read replicas (if needed)
- Archive old analyses (>6 months) to cold storage

**AI:**
- Rate limiting per user (10 messages/min)
- Queue system for batch analyses (if needed)

**Frontend:**
- Static asset caching (1 year)
- API response caching (5 minutes)

---

## Technology Decisions

### Why Next.js?
- ✅ React Server Components reduce bundle size
- ✅ App Router simplifies routing
- ✅ Built-in API routes (no separate backend needed)
- ✅ Vercel deployment is seamless
- ✅ Great DX with hot reload

### Why Gemini (not OpenAI)?
- ✅ Longer context window (2M tokens)
- ✅ Better at structured output (XML parsing)
- ✅ More cost-effective for high-volume
- ✅ Google has better web search integration (future feature)

### Why Prisma?
- ✅ Type-safe database access
- ✅ Automatic migration generation
- ✅ Great DX with Prisma Studio
- ✅ Compatible with all major databases

### Why shadcn/ui?
- ✅ Copy-paste components (no NPM bloat)
- ✅ Full customization
- ✅ Tailwind-native
- ✅ Accessible by default (Radix UI)

---

## Migration Path (v1 → v2)

### Database Migration

```sql
-- Add new columns to Chat table
ALTER TABLE "Chat" ADD COLUMN "productIdea" TEXT;

-- Change ChatPhase enum
ALTER TYPE "ChatPhase" RENAME TO "ChatPhase_old";
CREATE TYPE "ChatPhase" AS ENUM ('DISCOVERY', 'FEATURE_BENCHMARK', 'MARKET_POSITIONING', 'RECOMMENDATION');
ALTER TABLE "Chat" ALTER COLUMN "phase" TYPE "ChatPhase" USING
  CASE
    WHEN "phase"::text = 'REQUIREMENT' THEN 'DISCOVERY'::ChatPhase
    WHEN "phase"::text = 'ARCHITECTURE' THEN 'FEATURE_BENCHMARK'::ChatPhase
    WHEN "phase"::text = 'DEVELOPMENT' THEN 'RECOMMENDATION'::ChatPhase
  END;
DROP TYPE "ChatPhase_old";

-- Create new tables
CREATE TABLE "Competitor" (...);
CREATE TABLE "CompetitorFeature" (...);
CREATE TABLE "CompetitorAnalysis" (...);
```

### Data Migration Script

```typescript
// scripts/migrate-v1-to-v2.ts
async function migrateChats() {
  const oldChats = await prisma.chat.findMany({
    where: { phase: 'REQUIREMENT' }
  })

  for (const chat of oldChats) {
    // Extract competitor mentions from messages
    const competitors = extractCompetitorsFromMessages(chat.messages)

    // Create Competitor records
    await Promise.all(
      competitors.map(c =>
        prisma.competitor.create({ data: c })
      )
    )

    // Update chat phase
    await prisma.chat.update({
      where: { id: chat.id },
      data: { phase: 'DISCOVERY' }
    })
  }
}
```

---

## Appendix

### Tech Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | Next.js | 15.5.2 |
| | React | 19.1.0 |
| | TypeScript | 5.x |
| | Tailwind CSS | 4.x |
| | shadcn/ui | Latest |
| **Backend** | Next.js API Routes | 15.5.2 |
| | Prisma | 6.16.0 |
| **Database** | PostgreSQL | 15+ |
| **AI** | Google Gemini | 2.5 Pro |
| **Deployment** | Vercel | Latest |
| **External** | Product Hunt API | v2 |
| | Crunchbase API | v4 |

### Directory Structure

```
jotlin/
├── app/                    # Next.js App Router
├── components/             # React components
├── libs/                   # Utilities
│   ├── ai/                # AI service
│   ├── external/          # External APIs
│   └── utils/             # Helpers
├── prisma/                # Database schema
├── public/                # Static assets
├── schema/                # Validation schemas
├── store/                 # Zustand stores
├── ARCHITECTURE.md        # This file
├── PRODUCT_VISION.md      # Product strategy
├── WORKFLOW.md            # User workflows
└── CLAUDE.md              # AI assistant guide
```

---

**Document Owner:** Engineering Team
**Next Review:** After Phase 1 implementation
**Questions:** engineering@jotlin.com
