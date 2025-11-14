# Jotlin AI Assistant Guide

**Version:** 2.0 (Competitive Intelligence Platform - Multi-Agent System)
**Last Updated:** 2025-01-13
**Purpose:** Instructions for AI assistants working on the Jotlin codebase

---

## Product Overview

**Jotlin** is an AI-powered competitive intelligence platform that uses **multi-agent collaboration** to help product managers, entrepreneurs, and founders deeply understand their market landscape and identify winning differentiation strategies.

**Core Value Proposition:**
Transform weeks of manual competitive research into hours of AI-guided insights, backed by real-time market data.

**Technical Differentiator:**
Multi-agent architecture powered by [Mastra.ai](https://mastra.ai) with specialized agents for discovery, analysis, market research, strategy, and synthesis.

For detailed product strategy, see [PRODUCT_VISION.md](./PRODUCT_VISION.md).

---

## Key Documents

- **[PRODUCT_VISION.md](./PRODUCT_VISION.md)** - Product positioning, market strategy, roadmap
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical architecture, data flow, system design
- **[MULTI_AGENT_ARCHITECTURE.md](./MULTI_AGENT_ARCHITECTURE.md)** - 🆕 Multi-agent system detailed design
- **[WORKFLOW.md](./WORKFLOW.md)** - Detailed user workflows for all 4 phases
- **[DEPENDENCIES_UPDATE.md](./DEPENDENCIES_UPDATE.md)** - 🆕 Mastra.ai installation guide
- **[CLAUDE.md](./CLAUDE.md)** - This file (AI assistant guidelines)

---

## AI Assistant Guidelines

### Development Server Management

- **DO NOT** run `npm run dev` or any development server commands in background tasks
- The user will manage the development server themselves
- Only check the status of already running servers if necessary, but do not start new ones
- If you need to test changes, inform the user to restart the development server

---

## Product Context

### What Jotlin Does (v2.0)

Jotlin guides users through a **4-phase conversational workflow** to analyze competitors:

1. **Phase 1: DISCOVERY** - AI identifies direct, indirect, and adjacent competitors
2. **Phase 2: FEATURE_BENCHMARK** - Deep dive into competitor features and capabilities
3. **Phase 3: MARKET_POSITIONING** - Pricing, audience, positioning, SWOT analysis
4. **Phase 4: RECOMMENDATION** - Strategic insights, MVP features, GTM strategy

### What Changed from v1.0

**Before (v1.0):**
- AI-driven requirements → technical architecture → development plan generator
- Workflow: REQUIREMENT → ARCHITECTURE → DEVELOPMENT
- Focus: Generate technical documentation for building products

**After (v2.0):**
- AI-driven competitive intelligence and market research platform
- Workflow: DISCOVERY → FEATURE_BENCHMARK → MARKET_POSITIONING → RECOMMENDATION
- Focus: Understand competition and find market positioning

---

## Technology Stack

### Core Framework

- **Framework**: Next.js 15.5.2 with App Router (React Server Components)
- **React**: v19.1.0
- **TypeScript**: v5
- **Node Target**: ES2017

### Build System

- **Bundler**: Next.js with Turbopack enabled
- **PostCSS**: @tailwindcss/postcss v4
- **Compiler**: TypeScript with strict mode enabled

### UI Framework

- **Component Library**: shadcn/ui (New York style)
- **UI Primitives**: Radix UI
- **Styling**: Tailwind CSS v4 with CSS variables
- **Class Utilities**:
  - `clsx` - for conditional classes
  - `tailwind-merge` - for merging Tailwind classes
  - `class-variance-authority` (CVA) - for component variants

### State Management & Data Fetching

- **React Query**: @tanstack/react-query v5.87.4
- **State**: Zustand v5.0.8
- **AI SDK**: Vercel AI SDK v5.0.39

### Database & Auth

- **ORM**: Prisma v6.16.0
- **Auth**: JWT (jsonwebtoken v9.0.2)
- **Database**: PostgreSQL (via Prisma)

### AI & External APIs

- **Multi-Agent Framework**: Mastra.ai (@mastra/core, @mastra/ai-sdk)
- **AI Model**: Google Gemini 2.5 Pro (via Mastra + Vercel AI SDK)
- **Web Search**: Tavily AI Search API (@tavily/core)
- **External APIs**:
  - Product Hunt API (competitor data)
  - Crunchbase API (funding, market data)

---

## Project Structure

```
jotlin/
├── app/                          # Next.js App Router
│   ├── (app)/                   # Authenticated routes
│   │   ├── analysis/[chatId]/   # Main analysis workspace
│   │   │   ├── discovery/       # Phase 1 UI
│   │   │   ├── features/        # Phase 2 UI
│   │   │   ├── positioning/     # Phase 3 UI
│   │   │   └── recommendations/ # Phase 4 UI
│   │   ├── competitors/         # Competitor management
│   │   ├── reports/             # Generated reports
│   │   └── settings/            # User settings
│   ├── api/                     # API routes
│   │   ├── auth/
│   │   ├── chats/               # Analysis sessions
│   │   ├── competitors/         # Competitor CRUD
│   │   └── external/            # External API proxies
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Landing page
│
├── components/                   # React components
│   ├── ui/                      # shadcn/ui primitives
│   ├── analysis/                # Analysis-specific components
│   │   ├── competitor-card.tsx
│   │   ├── feature-matrix.tsx
│   │   ├── positioning-map.tsx
│   │   └── swot-matrix.tsx
│   ├── chat/                    # Conversational interface
│   ├── competitors/             # Competitor management
│   └── providers/               # Context providers
│
├── src/
│   └── mastra/                   # 🆕 Mastra.ai Multi-Agent System
│       ├── index.ts              # Main Mastra instance
│       ├── agents/               # Specialized agents
│       │   ├── discovery-agent.ts
│       │   ├── feature-analysis-agent.ts
│       │   ├── market-research-agent.ts
│       │   ├── strategy-agent.ts
│       │   └── synthesis-agent.ts
│       ├── tools/                # Mastra tools
│       │   ├── tavily-tool.ts    # Web search
│       │   ├── product-hunt-tool.ts
│       │   └── crunchbase-tool.ts
│       └── workflows/            # Agent orchestration
│           └── competitive-analysis-workflow.ts
│
├── libs/                         # Utilities
│   ├── ai/                      # AI service layer (legacy)
│   │   ├── model-config.ts      # AI model selection
│   │   ├── prompt.ts            # Phase-specific prompts (deprecated)
│   │   ├── xml-parser.ts        # Parse AI responses
│   │   └── stream-handler.ts    # Streaming logic
│   └── utils/                   # Helper functions
│
├── prisma/                       # Database
│   ├── schema.prisma            # Schema definitions
│   └── migrations/
│
├── PRODUCT_VISION.md            # Product strategy
├── ARCHITECTURE.md              # Technical docs
├── WORKFLOW.md                  # User workflows
└── CLAUDE.md                    # This file
```

---

## Database Schema (Key Models)

### Core Entities

```prisma
// Analysis session
model Chat {
  id          String     @id @default(cuid())
  userId      String
  title       String?
  productIdea String     // User's product description
  phase       ChatPhase? // DISCOVERY | FEATURE_BENCHMARK | MARKET_POSITIONING | RECOMMENDATION

  messages    Message[]
  analyses    CompetitorAnalysis[]
  documents   Document[]
}

// Competitor entity
model Competitor {
  id          String   @id
  name        String
  website     String?
  description String?
  logo        String?

  // Market data
  foundedYear Int?
  funding     String?
  teamSize    String?
  pricing     Json?

  features    CompetitorFeature[]
  source      String?  // "AI" | "PRODUCT_HUNT" | "CRUNCHBASE" | "MANUAL"
}

// Competitor features
model CompetitorFeature {
  id            String     @id
  competitorId  String

  name          String
  category      String     // "table_stakes" | "differentiator" | "innovation"
  quality       String?    // "excellent" | "good" | "basic" | "poor"
  description   String?

  isCore        Boolean @default(false)
  isDifferentiator Boolean @default(false)
}

// Analysis results
model CompetitorAnalysis {
  id           String   @id
  chatId       String

  competitors  Competitor[]

  // Analysis outputs
  marketInsights  Json?
  swotAnalysis    Json?
  positioningMap  Json?
  recommendations Json?

  status       AnalysisStatus // IN_PROGRESS | COMPLETED | ARCHIVED
}
```

---

## AI Prompt System

### Prompt Architecture

Each phase has a dedicated system prompt:

1. **`competitorDiscoveryPrompt`** - Identifies competitors (Phase 1)
2. **`featureBenchmarkPrompt`** - Analyzes features (Phase 2)
3. **`marketPositioningPrompt`** - Market analysis (Phase 3)
4. **`recommendationPrompt`** - Strategic insights (Phase 4)

**Location:** `/libs/ai/prompt.ts`

### Prompt Structure

All prompts follow this pattern:

```typescript
export const phasePrompt = `
You are an expert [role] specializing in [domain].

## Your Mission
[Clear objective for this phase]

## Interaction Pattern
[How to ask questions and present findings]

## Output Format
[XML structure for structured data]
<tag>
  <nested-tag>...</nested-tag>
</tag>

## Critical Rules
- Rule 1
- Rule 2
- Rule 3
`
```

### XML Response Parsing

AI responses are parsed using `/libs/ai/xml-parser.ts`:

```typescript
export interface ParsedResponse {
  prose?: string[]              // AI explanation text
  question?: string             // Question to user
  options: Array<{value: string; text: string}>
  optionType?: 'single' | 'multiple'
  competitors?: CompetitorData[]
  featureAnalysis?: FeatureAnalysisData
  positioning?: PositioningData
  recommendations?: RecommendationData
}
```

---

## Component Architecture

### Design System

Jotlin uses **shadcn/ui** (New York style) with Tailwind CSS v4.

**Key Conventions:**
- Use `cn()` utility for conditional classes
- Follow CVA (Class Variance Authority) for variants
- Use `data-slot` attributes for component specificity
- Always use lucide-react icons

### Example Component

```tsx
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/libs/utils/utils'

const cardVariants = cva(
  'rounded-xl border bg-card text-card-foreground shadow-sm',
  {
    variants: {
      size: {
        default: 'p-6',
        compact: 'p-4',
        large: 'p-8',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
)

export function CompetitorCard({
  className,
  size,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof cardVariants>) {
  return (
    <div
      data-slot="competitor-card"
      className={cn(cardVariants({ size, className }))}
      {...props}
    />
  )
}
```

### Key Components to Create

For the v2.0 competitive analysis platform, you'll need:

**Analysis Phase Components:**
- `CompetitorCard` - Display competitor info
- `FeatureComparisonTable` - Feature matrix
- `PositioningMap` - 2x2 positioning chart (recharts)
- `SWOTMatrix` - SWOT visualization
- `PricingComparison` - Pricing tier comparison

**Competitor Management:**
- `CompetitorList` - Grid/list view
- `CompetitorForm` - Add/edit form
- `CompetitorFilter` - Search & filter

**Chat Interface:**
- `AssistantMessage` - AI response renderer (already exists, may need updates)
- `ChatInput` - Message input (already exists)
- `MessageList` - Chat history (already exists)

---

## Styling System

### Design Tokens

**Location:** `/app/globals.css`

Colors use **OKLCH color space** for better perceptual uniformity.

**Key CSS Variables:**
```css
--background
--foreground
--primary
--secondary
--muted
--accent
--border
--destructive
--chart-1 through --chart-5
```

### Responsive Design

Use Tailwind responsive prefixes:
```tsx
<div className="w-full md:w-1/2 lg:w-1/3">
  <p className="text-sm md:text-base lg:text-lg">Responsive text</p>
</div>
```

### Dark Mode

Managed via `next-themes`:
```tsx
<ThemeProvider attribute="class" defaultTheme="system">
  {children}
</ThemeProvider>
```

---

## API Routes

### Key Endpoints

**Chat & AI Interaction:**
```typescript
POST /api/chats/{id}/messages
// Handles streaming AI responses
// Request: { text: string, phase: ChatPhase }
// Response: Streaming text with XML tags
```

**Competitor Management:**
```typescript
GET    /api/competitors           // List all
POST   /api/competitors           // Create
GET    /api/competitors/{id}      // Get one
PATCH  /api/competitors/{id}      // Update
DELETE /api/competitors/{id}      // Delete

POST   /api/competitors/enrich    // Trigger external data enrichment
```

**Analysis Export:**
```typescript
POST /api/analyses/{chatId}/export
// Request: { format: "pdf" | "markdown" | "excel" }
// Response: Binary file download
```

---

## Development Workflow

### Setup

```bash
# Install dependencies
npm install

# Setup database
npx prisma generate
npx prisma migrate dev

# Start development server
npm run dev
```

### Code Quality

```bash
# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Format
npm run prettier
```

### Database Migrations

```bash
# Create migration
npx prisma migrate dev --name add_competitor_table

# Reset database (caution!)
npx prisma migrate reset
```

---

## Implementation Guidelines

### When Implementing Features

1. **Check existing components first** - Reuse shadcn/ui components
2. **Follow the design system** - Use design tokens, not hardcoded values
3. **Type everything** - No `any` types, use proper interfaces
4. **Consider responsive design** - Mobile, tablet, desktop
5. **Add loading states** - Skeleton loaders for async content
6. **Handle errors gracefully** - User-friendly error messages
7. **Test accessibility** - Keyboard navigation, screen readers
8. **Document complex logic** - Comments for non-obvious code

### When Working with AI Prompts

1. **Read existing prompts first** - Understand the pattern
2. **Use XML for structured data** - Easier to parse than JSON in text
3. **Provide clear examples** - AI needs concrete examples
4. **Test with edge cases** - What if AI returns unexpected data?
5. **Handle parsing errors** - AI might not follow format perfectly

### When Integrating External APIs

1. **Use environment variables** - Never hardcode API keys
2. **Implement rate limiting** - Respect API limits
3. **Cache responses** - Reduce API calls, save costs
4. **Graceful degradation** - System should work if API is down
5. **Error handling** - Log errors, show user-friendly messages

---

## Common Tasks

### Adding a New Analysis Phase

1. Add phase to `ChatPhase` enum in `schema.prisma`
2. Create prompt in `/libs/ai/prompt.ts`
3. Update AI route in `/app/api/chats/[id]/route.ts`
4. Add XML parsing logic in `/libs/ai/xml-parser.ts`
5. Create UI components in `/components/analysis/`
6. Create page in `/app/(app)/analysis/[chatId]/[phase]/`

### Adding a New Competitor Data Source

1. Create API client in `/libs/external/[source].ts`
2. Add enrichment logic in `/app/api/competitors/enrich/route.ts`
3. Update `Competitor` model if new fields needed
4. Add source to `source` enum in schema
5. Update UI to show data source badge

### Creating a New Visualization

1. Install recharts if needed: `npm install recharts`
2. Create component in `/components/analysis/`
3. Use design tokens for colors (e.g., `var(--chart-1)`)
4. Make it responsive (mobile-friendly)
5. Add to report export functionality

---

## Testing Strategy

### Unit Tests

```bash
# Run tests
npm test

# Watch mode
npm test -- --watch
```

### Manual Testing Checklist

**For each feature:**
- [ ] Works on desktop (Chrome, Safari, Firefox)
- [ ] Works on tablet (iPad)
- [ ] Works on mobile (iPhone)
- [ ] Dark mode works correctly
- [ ] Loading states display properly
- [ ] Errors are handled gracefully
- [ ] Keyboard navigation works
- [ ] Screen reader announces correctly

---

## Deployment

### Environment Variables

Required environment variables:

```env
# Database
DATABASE_URL="postgresql://..."

# Authentication
JWT_SECRET="..."

# AI
GOOGLE_AI_API_KEY="..."

# External APIs (optional)
PRODUCT_HUNT_API_KEY="..."
CRUNCHBASE_API_KEY="..."

# App
NEXT_PUBLIC_APP_URL="https://jotlin.app"
```

### Deployment Steps

1. Push to GitHub (main branch)
2. Vercel automatically deploys
3. Run migrations: `npx prisma migrate deploy`
4. Verify deployment in production

---

## Troubleshooting

### Common Issues

**Issue: Prisma client out of sync**
```bash
npx prisma generate
```

**Issue: Type errors after schema change**
```bash
npx prisma generate
npm run build
```

**Issue: AI not responding**
- Check API key is set
- Check API rate limits
- Check network connectivity
- Look at error logs

**Issue: External API failing**
- Check API key validity
- Check rate limits
- Implement fallback to manual input

---

## Performance Considerations

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

## Security

### Authentication

- JWT tokens in HTTP-only cookies
- bcrypt password hashing (10 rounds)
- Session expiration: 7 days

### Authorization

- Row-level security (users only see their own data)
- Middleware checks on all authenticated routes

### API Keys

- External API keys in environment variables
- Never exposed to client
- Rate limiting on API routes (10 req/min per user)

---

## Best Practices Summary

### Code Style

- Use TypeScript strict mode
- Prefer functional components
- Use React Server Components by default
- Add `'use client'` only when needed
- One component per file
- Organize imports: React → Third-party → Local

### Component Design

- Always use shadcn/ui as foundation
- Follow CVA pattern for variants
- Use `cn()` for conditional classes
- Add proper TypeScript types
- Include aria labels for accessibility

### State Management

- Server state → React Query
- Client state → Zustand
- Form state → useState
- URL state → Next.js search params

### Error Handling

- Use error boundaries for React errors
- Show user-friendly error messages
- Log errors to console (or Sentry in production)
- Always have fallback UI

---

## Additional Resources

### Internal Documentation

- [PRODUCT_VISION.md](./PRODUCT_VISION.md) - Product strategy and roadmap
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture deep dive
- [WORKFLOW.md](./WORKFLOW.md) - Detailed user workflows with UI mockups

### External Resources

- [Next.js Docs](https://nextjs.org/docs)
- [shadcn/ui Docs](https://ui.shadcn.com)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)

---

## Questions?

If you encounter ambiguity while working on a feature:

1. Check this document and linked docs first
2. Review existing code for similar patterns
3. Ask the user for clarification
4. Make reasonable assumptions and document them

---

**Document Owner:** Product & Engineering Team
**Last Review:** 2025-01-13
**Next Review:** After Phase 1 implementation
