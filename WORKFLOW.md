# Jotlin User Workflow

**Version:** 2.0 (Competitive Intelligence Platform)
**Last Updated:** 2025-01-13
**Audience:** Product Team, Designers, Engineers

---

## Overview

This document describes the complete user journey through Jotlin's competitive intelligence analysis workflow. The system guides users through four distinct phases to transform a product idea into actionable competitive insights.

---

## Core Workflow Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                  User Journey Overview                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Phase 1: DISCOVERY (15-20 min)                             │
│  └─ Identify direct, indirect, and adjacent competitors     │
│                                                              │
│  Phase 2: FEATURE_BENCHMARK (30-45 min)                     │
│  └─ Deep dive into features, strengths, weaknesses          │
│                                                              │
│  Phase 3: MARKET_POSITIONING (20-30 min)                    │
│  └─ Pricing, audience, positioning, SWOT analysis           │
│                                                              │
│  Phase 4: RECOMMENDATION (10-15 min)                        │
│  └─ Strategic insights, MVP features, GTM strategy          │
│                                                              │
│  Total Time: 75-110 minutes (avg: 90 min)                   │
└──────────────────────────────────────────────────────────────┘
```

---

## Pre-Workflow: Onboarding

### 1.1 User Registration/Login

**Entry Points:**
- Landing page CTA: "Start Analyzing Competitors"
- Direct URL: `/login` or `/register`

**User Actions:**
```
┌─────────────┐
│ Visit       │
│ jotlin.app  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│ New user?               │
│ ○ Sign up with email    │
│ ○ Continue with Google  │
│ ○ Continue with GitHub  │
│                         │
│ Returning user?         │
│ ○ Log in               │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Dashboard               │
│ • Recent analyses       │
│ • Start new analysis    │
│ • Competitor library    │
└─────────────────────────┘
```

**Implementation Notes:**
- JWT-based authentication
- Sessions expire after 7 days
- OAuth integration for social login (future)

---

## Phase 1: Competitor Discovery

**Goal:** Identify all relevant competitors based on the user's product idea.

**Duration:** 15-20 minutes

**Chat Phase:** `DISCOVERY`

### 1.1 Analysis Initiation

**User Action:** Click "Start New Analysis" from dashboard

**System Prompt:**
```
┌────────────────────────────────────────────────────────────┐
│  🎯 Let's discover your competitors!                       │
│                                                            │
│  Tell me about your product idea in 1-2 sentences:        │
│  ┌────────────────────────────────────────────────────┐   │
│  │ [Text input box]                                   │   │
│  │ e.g., "A note-taking app for developers with      │   │
│  │ Git integration and Markdown support"              │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  [Start Analysis]                                          │
└────────────────────────────────────────────────────────────┘
```

**Backend Processing:**
```typescript
POST /api/chats
{
  productIdea: "A note-taking app for developers...",
  phase: "DISCOVERY"
}

// Creates Chat record, returns chatId
```

---

### 1.2 Deep Understanding Questions

**AI Response 1:** Clarifying questions to understand the product

**UI Display:**
```
┌────────────────────────────────────────────────────────────┐
│  🤖 Assistant                                              │
│                                                            │
│  Great! To identify the most relevant competitors, I need │
│  to understand your product better. Let me ask a few      │
│  questions:                                                │
│                                                            │
│  1️⃣ Who are your primary target users?                   │
│  ○ Individual developers                                   │
│  ○ Development teams (2-10 people)                        │
│  ○ Enterprise engineering orgs (50+ people)               │
│  ○ Students/learners                                       │
│  ○ Other: __________                                      │
│                                                            │
│  [Continue]                                                │
└────────────────────────────────────────────────────────────┘
```

**User Action:** Select option(s) and click Continue

**AI Response 2:**
```
┌────────────────────────────────────────────────────────────┐
│  2️⃣ What's the main problem you're solving?              │
│  ○ Note-taking and knowledge management                    │
│  ○ Documentation and technical writing                     │
│  ○ Project planning and task tracking                      │
│  ○ Code snippets and API documentation                     │
│  ○ Team collaboration on technical content                 │
│  ○ Other: __________                                      │
│                                                            │
│  [Continue]                                                │
└────────────────────────────────────────────────────────────┘
```

**AI Response 3:**
```
┌────────────────────────────────────────────────────────────┐
│  3️⃣ What's your geographic market?                       │
│  ○ Global                                                  │
│  ○ North America                                           │
│  ○ Europe                                                  │
│  ○ Asia-Pacific                                            │
│  ○ Specific country: __________                           │
│                                                            │
│  [Start Discovery]                                         │
└────────────────────────────────────────────────────────────┘
```

---

### 1.3 AI Competitor Identification

**System Action:** AI analyzes input and generates competitor list

**Backend Processing:**
```typescript
POST /api/chats/{chatId}/messages
{
  text: "Global market, individual developers, note-taking",
  phase: "DISCOVERY"
}

// AI model processes with competitorDiscoveryPrompt
// Returns streaming XML response
```

**UI Display (streaming):**
```
┌────────────────────────────────────────────────────────────┐
│  🔍 Analyzing market landscape...                          │
│                                                            │
│  ✅ Searched product databases                            │
│  ✅ Analyzed 50+ potential competitors                    │
│  ✅ Categorized by competitive threat                     │
│  ✅ Enriching data from external sources...               │
│                                                            │
│  [Progress bar: ████████░░ 80%]                           │
└────────────────────────────────────────────────────────────┘
```

---

### 1.4 Competitor List Presentation

**AI Response:** Structured list of discovered competitors

**UI Display:**
```
┌────────────────────────────────────────────────────────────┐
│  🎉 I've identified 12 relevant competitors!               │
│                                                            │
│  ━━━ DIRECT COMPETITORS (Same solution, same audience) ━━━│
│                                                            │
│  ☑ Notion                                    [Leader]     │
│    All-in-one workspace with note-taking and databases    │
│    📊 30M+ users • 💰 Series C ($10B valuation)          │
│                                                            │
│  ☑ Obsidian                                  [Challenger] │
│    Local-first Markdown note-taking with bidirectional    │
│    📊 1M+ users • 💰 Bootstrapped                        │
│                                                            │
│  ☑ Roam Research                             [Niche]      │
│    Network-based note-taking for researchers              │
│    📊 100K+ users • 💰 Seed ($9M)                        │
│                                                            │
│  ━━━ INDIRECT COMPETITORS (Different approach) ━━━━━━━━━━│
│                                                            │
│  ☑ Coda                                      [Challenger] │
│    Document-database hybrid for teams                     │
│    📊 5M+ users • 💰 Series D ($140M)                    │
│                                                            │
│  ☑ Airtable                                  [Leader]     │
│    Spreadsheet-database hybrid                            │
│    📊 10M+ users • 💰 Series F ($11B)                    │
│                                                            │
│  ━━━ ADJACENT COMPETITORS (Overlapping features) ━━━━━━━━│
│                                                            │
│  ☑ VS Code + Extensions                     [Incumbent]   │
│    Code editor with note-taking extensions                │
│    📊 50M+ users • 💰 Microsoft                          │
│                                                            │
│  ☐ Linear                                    [Challenger] │
│    Issue tracker (not primary competitor but overlaps)    │
│                                                            │
│  ☐ Confluence                                [Leader]     │
│    Enterprise wiki (different segment)                    │
│                                                            │
│  [Select all] [Deselect all] [Add manually]               │
│  [Confirm Selection (8 selected)]                         │
└────────────────────────────────────────────────────────────┘
```

**Interaction Features:**
- ✅ Checkbox to include/exclude competitors
- 🔍 Hover to see more details
- ➕ "Add manually" to input competitors AI missed
- 🏷️ Tags show market position (Leader/Challenger/Niche)

---

### 1.5 Manual Competitor Addition (Optional)

**User Action:** Click "Add manually"

**Modal Display:**
```
┌────────────────────────────────────────────┐
│  ➕ Add Competitor Manually                │
├────────────────────────────────────────────┤
│  Name: [___________________________]       │
│  Website: [___________________________]    │
│  Brief description (optional):             │
│  [________________________________]        │
│                                            │
│  Type:                                     │
│  ○ Direct competitor                       │
│  ○ Indirect competitor                     │
│  ○ Adjacent competitor                     │
│                                            │
│  [Cancel]  [Add Competitor]               │
└────────────────────────────────────────────┘
```

**Backend Processing:**
```typescript
POST /api/competitors
{
  name: "Custom Tool",
  website: "https://customtool.com",
  type: "direct",
  source: "MANUAL"
}

// Optionally triggers enrichment
POST /api/competitors/enrich
{ name: "Custom Tool", website: "..." }
```

---

### 1.6 Data Enrichment

**System Action (async):** Fetch data from external APIs

**Backend Processing:**
```typescript
// For each selected competitor:
1. Query Product Hunt API
   └─ Get: tagline, logo, votes, launch date, topics
2. Query Crunchbase API
   └─ Get: funding, team size, founded year
3. Merge and save to database

await Promise.all(
  selectedCompetitors.map(c =>
    enrichCompetitorData(c.name, c.website)
  )
)
```

**UI Display (non-blocking):**
```
┌────────────────────────────────────────────┐
│  ⏳ Enriching competitor data...           │
│  ✅ Notion (complete)                      │
│  ✅ Obsidian (complete)                    │
│  ⏳ Roam Research (in progress)            │
│  ⏳ Coda (queued)                          │
└────────────────────────────────────────────┘
```

---

### 1.7 Phase Transition

**AI Response:** Summary and transition to next phase

**UI Display:**
```
┌────────────────────────────────────────────────────────────┐
│  ✅ Discovery Complete!                                    │
│                                                            │
│  You've selected 8 competitors to analyze:                 │
│  • 4 direct competitors                                    │
│  • 3 indirect competitors                                  │
│  • 1 adjacent competitor                                   │
│                                                            │
│  Next, I'll analyze the features and capabilities of each  │
│  competitor in detail. This will take about 30-45 minutes. │
│                                                            │
│  [Continue to Feature Benchmarking]                        │
└────────────────────────────────────────────────────────────┘
```

**Backend Processing:**
```typescript
await prisma.chat.update({
  where: { id: chatId },
  data: { phase: 'FEATURE_BENCHMARK' }
})
```

---

## Phase 2: Feature Benchmarking

**Goal:** Systematically analyze features of each competitor.

**Duration:** 30-45 minutes (depends on number of competitors)

**Chat Phase:** `FEATURE_BENCHMARK`

---

### 2.1 Phase Introduction

**AI Response:**
```
┌────────────────────────────────────────────────────────────┐
│  🔬 Feature Benchmarking Phase                             │
│                                                            │
│  I'll now analyze each competitor's features systematically│
│  This helps identify:                                      │
│  • Table stakes features (everyone has)                    │
│  • Differentiators (only some have)                        │
│  • Innovation opportunities (no one has)                   │
│                                                            │
│  Let's start with Notion (1 of 8)                          │
│                                                            │
│  [Begin Analysis]                                          │
└────────────────────────────────────────────────────────────┘
```

---

### 2.2 Per-Competitor Feature Analysis

**AI Response (for each competitor):**
```
┌────────────────────────────────────────────────────────────┐
│  📊 Analyzing: Notion                             (1 / 8)  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  🏆 CORE FEATURES                                          │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Feature            Category        Quality  Priority  │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ Block-based editor Differentiator  ⭐⭐⭐⭐⭐        │ │
│  │ Database views     Differentiator  ⭐⭐⭐⭐          │ │
│  │ Real-time collab   Table Stakes    ⭐⭐⭐⭐⭐        │ │
│  │ Templates          Innovation      ⭐⭐⭐⭐          │ │
│  │ API/Integrations   Table Stakes    ⭐⭐⭐            │ │
│  │ Mobile apps        Table Stakes    ⭐⭐⭐            │ │
│  │ Permissions        Table Stakes    ⭐⭐⭐⭐          │ │
│  │ Version history    Table Stakes    ⭐⭐⭐            │ │
│  │ AI assistant       Innovation      ⭐⭐⭐⭐          │ │
│  │ Offline support    Table Stakes    ⚠️ Limited       │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ✅ STRENGTHS                                              │
│  • Extremely flexible content organization                 │
│  • Powerful database functionality                         │
│  • Large template marketplace and community                │
│  • Intuitive drag-and-drop interface                       │
│                                                            │
│  ⚠️ WEAKNESSES                                             │
│  • Performance issues with large workspaces (1000+ pages)  │
│  • Offline mode is limited (read-only)                     │
│  • Learning curve for advanced features                    │
│  • Export options are basic (no Git integration)           │
│                                                            │
│  💡 IMPLEMENTATION INSIGHTS                                │
│  • Uses custom CRDT for real-time sync                     │
│  • Block-based architecture enables flexibility            │
│  • Heavy client-side rendering (React)                     │
│                                                            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                            │
│  Which features would you prioritize for your product?    │
│                                                            │
│  Must-Have  Consider  Not Needed                          │
│  ☑ Block editor  ☐      ☐                                │
│  ☐ Databases     ☑      ☐                                │
│  ☑ Real-time     ☐      ☐                                │
│  ☐ Templates     ☑      ☐                                │
│  ☐ API           ☑      ☐                                │
│  ☑ Mobile        ☐      ☐                                │
│  ☑ Permissions   ☐      ☐                                │
│  ☐ Versioning    ☐      ☑                                │
│  ☐ AI assistant  ☑      ☐                                │
│  ☐ Offline       ☑      ☐                                │
│                                                            │
│  [Save Selections]  [Next Competitor]                     │
└────────────────────────────────────────────────────────────┘
```

**Backend Processing:**
```typescript
// Save features to database
await prisma.competitorFeature.createMany({
  data: features.map(f => ({
    competitorId: notionId,
    name: f.name,
    category: f.category, // "table_stakes" | "differentiator" | "innovation"
    quality: f.quality,   // "excellent" | "good" | "basic" | "poor"
    description: f.description,
    isCore: userSelections[f.name] === "must-have",
    isDifferentiator: f.category === "differentiator"
  }))
})

// Save user selections in message metadata
await prisma.message.create({
  data: {
    chatId,
    role: "assistant",
    parts: { features, strengths, weaknesses },
    metadata: { userSelections }
  }
})
```

---

### 2.3 Progress Indicator

**UI (top of page):**
```
┌────────────────────────────────────────────────────────────┐
│  Feature Benchmarking Progress                             │
│  ████████████████░░░░░░░░░░░░░░  50% (4 / 8 completed)   │
│                                                            │
│  ✅ Notion        ✅ Obsidian    ✅ Roam Research          │
│  ✅ Coda          ⏳ Airtable    ⬜ VS Code                │
│  ⬜ Linear        ⬜ Confluence                            │
└────────────────────────────────────────────────────────────┘
```

---

### 2.4 Feature Comparison Matrix

**AI Response (after all competitors analyzed):**
```
┌────────────────────────────────────────────────────────────┐
│  📊 Feature Comparison Matrix                              │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Feature          Notion Obsidian Roam Coda Airtable  │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ Real-time collab   ✅ ⭐5  ❌      ❌    ✅ ⭐5  ✅ ⭐5 │ │
│  │ Block editor       ✅ ⭐5  ❌      ❌    ✅ ⭐4  ❌    │ │
│  │ Markdown support   ⚠️ ⭐3  ✅ ⭐5  ✅ ⭐4 ⚠️ ⭐3  ❌    │ │
│  │ Database views     ✅ ⭐4  ❌      ❌    ✅ ⭐5  ✅ ⭐5 │ │
│  │ Offline mode       ⚠️ ⭐2  ✅ ⭐5  ⚠️ ⭐3 ❌     ❌    │ │
│  │ API access         ✅ ⭐3  ✅ ⭐4  ❌    ✅ ⭐4  ✅ ⭐5 │ │
│  │ Mobile apps        ✅ ⭐3  ✅ ⭐4  ✅ ⭐3 ✅ ⭐3  ✅ ⭐4 │ │
│  │ Version control    ⚠️ ⭐2  ❌      ❌    ⚠️ ⭐2  ⚠️ ⭐2 │ │
│  │ AI features        ✅ ⭐4  ❌      ❌    ✅ ⭐3  ❌    │ │
│  │ Code syntax HL     ⚠️ ⭐2  ✅ ⭐5  ⚠️ ⭐3 ⚠️ ⭐2  ❌    │ │
│  │ Git integration    ❌     ⚠️ ⭐2  ❌    ❌     ❌    │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  Legend:                                                   │
│  ✅ Full support  ⚠️ Partial  ❌ Not available             │
│  ⭐ 1-5 implementation quality                            │
│                                                            │
│  [Export to Excel]  [Export to CSV]                       │
│                                                            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                            │
│  🔍 GAP ANALYSIS                                           │
│                                                            │
│  ✅ Table Stakes (all competitors have):                   │
│     • Real-time collaboration                              │
│     • Mobile applications                                  │
│     • Basic permission management                          │
│                                                            │
│  🎯 Common Differentiators (most have):                    │
│     • Database/structured data views                       │
│     • Block-based or flexible editors                      │
│     • API access for integrations                          │
│                                                            │
│  💎 Rare Features (1-2 competitors only):                  │
│     • True offline-first architecture (Obsidian)           │
│     • Full Markdown support (Obsidian, Roam)               │
│     • Advanced code syntax highlighting                    │
│                                                            │
│  🚀 Innovation Opportunities (no one does well):           │
│     • Git-native version control                           │
│     • Developer-focused workflows                          │
│     • CLI/terminal integration                             │
│     • Local-first + real-time hybrid                       │
│                                                            │
│  [Continue to Market Positioning]                          │
└────────────────────────────────────────────────────────────┘
```

**Backend Processing:**
```typescript
// Generate matrix data
const matrix = await generateFeatureMatrix(chatId)

// Save to CompetitorAnalysis
await prisma.competitorAnalysis.upsert({
  where: { chatId },
  update: {
    featureMatrix: matrix,
    gapAnalysis: {
      tableStakes: [...],
      differentiators: [...],
      rare: [...],
      opportunities: [...]
    }
  }
})
```

---

### 2.5 Phase Transition

**Backend Processing:**
```typescript
await prisma.chat.update({
  where: { id: chatId },
  data: { phase: 'MARKET_POSITIONING' }
})
```

---

## Phase 3: Market Positioning

**Goal:** Analyze pricing, audience, market share, and positioning.

**Duration:** 20-30 minutes

**Chat Phase:** `MARKET_POSITIONING`

---

### 3.1 Pricing Analysis

**AI Response:**
```
┌────────────────────────────────────────────────────────────┐
│  💰 Pricing Strategy Comparison                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │         Free    Personal     Team       Enterprise  │   │
│  ├────────────────────────────────────────────────────┤   │
│  │ Notion   $0     $10/mo      $18/mo      Custom     │   │
│  │          Limited 30-day hist  SSO        SAML       │   │
│  │                                                     │   │
│  │ Coda     $0     $12/mo      $36/mo      Custom     │   │
│  │          10 docs Unlimited  Admin tools  Support    │   │
│  │                                                     │   │
│  │ Obsidian $0     $0          $50/mo      N/A        │   │
│  │          All    Commercial   Sync/publish           │   │
│  │                 license                             │   │
│  │                                                     │   │
│  │ Airtable $0     $20/mo      $45/mo      Custom     │   │
│  │          1200   Gantt       Advanced    Enterprise  │   │
│  │          records views      perms       SLA         │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  📊 INSIGHTS                                               │
│  • Average personal tier: ~$14/month                       │
│  • Average team tier: ~$37/month                           │
│  • All offer generous free tiers (freemium model)          │
│  • Notion is most affordable for teams                     │
│  • Obsidian is unique (one-time commercial license)        │
│                                                            │
│  💡 POSITIONING OPPORTUNITIES                              │
│  For your developer-focused tool, consider:                │
│  ○ Undercutting market ($8-10/mo personal)                 │
│  ○ Matching market ($14-16/mo personal)                    │
│  ○ Premium positioning ($25+ with advanced features)       │
│                                                            │
│  Which pricing strategy appeals to you?                    │
│  [Select one to continue]                                  │
└────────────────────────────────────────────────────────────┘
```

---

### 3.2 Target Audience Analysis

**AI Response:**
```
┌────────────────────────────────────────────────────────────┐
│  🎯 Target Audience Breakdown                              │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Notion                                                    │
│  👤 Primary: Knowledge workers, small teams (2-50)         │
│  🏢 Industries: Tech, creative, education, consulting      │
│  💼 Use cases: Personal PKM, team wikis, project tracking  │
│  📊 User overlap with your idea: 80%                       │
│                                                            │
│  Obsidian                                                  │
│  👤 Primary: Writers, researchers, students                │
│  🏢 Industries: Academia, research, creative writing       │
│  💼 Use cases: Zettelkasten, research notes, writing       │
│  📊 User overlap: 60%                                      │
│                                                            │
│  Coda                                                      │
│  👤 Primary: Product managers, operations teams            │
│  🏢 Industries: Tech, operations, consulting               │
│  💼 Use cases: Product roadmaps, OKRs, process docs        │
│  📊 User overlap: 50%                                      │
│                                                            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                            │
│  🎯 YOUR TARGET AUDIENCE REFINEMENT                        │
│                                                            │
│  Based on your "note-taking for developers" positioning:   │
│                                                            │
│  Primary Persona:                                          │
│  👤 Individual developers (freelance, indie hackers)       │
│  💰 Willingness to pay: $10-20/mo                          │
│  🎯 Pain points: Need Markdown, Git, code-first            │
│                                                            │
│  Secondary Persona:                                        │
│  👥 Small dev teams (2-10 people)                          │
│  💰 Willingness to pay: $50-100/mo (team)                  │
│  🎯 Pain points: Technical documentation, API docs         │
│                                                            │
│  Does this match your intended audience?                   │
│  [Yes, continue]  [No, let me refine]                     │
└────────────────────────────────────────────────────────────┘
```

---

### 3.3 Market Positioning Map

**AI Response:**
```
┌────────────────────────────────────────────────────────────┐
│  🗺️ Competitive Positioning Map                           │
├────────────────────────────────────────────────────────────┤
│                                                            │
│        Team Collaboration                                  │
│              ↑                                             │
│              │                                             │
│         Coda │ Monday.com                                  │
│              │                                             │
│              │                                             │
│  Simple ←────┼────────────────→ Powerful                  │
│              │                                             │
│        Trello│      Notion                                 │
│              │   Airtable                                  │
│              │                                             │
│              ↓                                             │
│        Individual Use                                      │
│                                                            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                            │
│  📍 Where does YOUR product fit?                           │
│                                                            │
│  Based on "developer-focused note-taking":                 │
│  • Power user tools (right side)                           │
│  • Individual + small team (middle-lower)                  │
│                                                            │
│  Suggested positioning:                                    │
│  ┌────────────────────────────────────────┐               │
│  │          Obsidian                      │               │
│  │            ↑                           │               │
│  │            │                           │               │
│  │            │  ★ YOUR PRODUCT           │               │
│  │            │    (Developer-focused)    │               │
│  │      Simple ────────→ Powerful         │               │
│  │            │                           │               │
│  │         VS Code Extensions             │               │
│  │            │                           │               │
│  │            ↓                           │               │
│  │        Individual                      │               │
│  └────────────────────────────────────────┘               │
│                                                            │
│  This positions you as:                                    │
│  • More powerful than VS Code extensions                   │
│  • More developer-friendly than Obsidian                   │
│  • Individual-first with team features                     │
│                                                            │
│  [Looks good]  [Adjust positioning]                       │
└────────────────────────────────────────────────────────────┘
```

**Implementation:**
- Uses recharts or similar library for interactive chart
- User can drag their product position if they disagree
- Auto-saves position to database

---

### 3.4 SWOT Analysis

**AI Response:**
```
┌────────────────────────────────────────────────────────────┐
│  📊 SWOT Analysis (Your Product vs. Competitors)           │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ STRENGTHS (Internal advantages)                      │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ ✅ Developer-native design (Markdown, Git, CLI)       │ │
│  │ ✅ Offline-first architecture (better than Notion)    │ │
│  │ ✅ Code-friendly (syntax highlight, embeds)           │ │
│  │ ✅ Lower price point (accessible to individuals)      │ │
│  │ ✅ Privacy-focused (local storage option)             │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ WEAKNESSES (Internal disadvantages)                  │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ ⚠️ No brand recognition (vs. Notion's 30M users)     │ │
│  │ ⚠️ Limited integrations initially                     │ │
│  │ ⚠️ Smaller template library                           │ │
│  │ ⚠️ No mobile app at launch (MVP constraint)          │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ OPPORTUNITIES (External advantages)                   │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ 🚀 Growing dev tools market                           │ │
│  │ 🚀 Notion lacks Git integration (market gap)          │ │
│  │ 🚀 Developers willing to pay for specialized tools    │ │
│  │ 🚀 Open-source community potential                    │ │
│  │ 🚀 GitHub/GitLab integration ecosystem                │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ THREATS (External risks)                              │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ 🔴 Notion could add Git integration (6-12 months)     │ │
│  │ 🟡 Obsidian could improve team collaboration          │ │
│  │ 🟡 VS Code extensions ecosystem improving             │ │
│  │ 🟢 Economic downturn → reduced SaaS spending          │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  [Continue to Recommendations]                             │
└────────────────────────────────────────────────────────────┘
```

---

### 3.5 Phase Transition

**Backend Processing:**
```typescript
await prisma.competitorAnalysis.update({
  where: { chatId },
  data: {
    swotAnalysis: { strengths, weaknesses, opportunities, threats },
    positioningMap: { x: 0.7, y: 0.4 },
    marketInsights: { pricing, audience, ... }
  }
})

await prisma.chat.update({
  where: { id: chatId },
  data: { phase: 'RECOMMENDATION' }
})
```

---

## Phase 4: Strategic Recommendations

**Goal:** Synthesize all insights into actionable recommendations.

**Duration:** 10-15 minutes

**Chat Phase:** `RECOMMENDATION`

---

### 4.1 MVP Feature Prioritization

**AI Response:**
```
┌────────────────────────────────────────────────────────────┐
│  🎯 MVP Feature Recommendations                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Based on competitive analysis of 8 competitors...         │
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │ PRIORITY 0: MUST-HAVE (Launch blockers)           │   │
│  ├────────────────────────────────────────────────────┤   │
│  │ ☑ User authentication & permissions               │   │
│  │   Reason: All competitors have, users expect it    │   │
│  │                                                    │   │
│  │ ☑ Markdown editing with live preview              │   │
│  │   Reason: Core to developer audience               │   │
│  │                                                    │   │
│  │ ☑ Code syntax highlighting                        │   │
│  │   Reason: 80% of competitors have, table stakes    │   │
│  │                                                    │   │
│  │ ☑ Local storage / offline capability              │   │
│  │   Reason: Key differentiator vs. Notion            │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │ PRIORITY 1: DIFFERENTIATORS (Why choose you)      │   │
│  ├────────────────────────────────────────────────────┤   │
│  │ ☑ Git integration (commit notes, sync repos)      │   │
│  │   Reason: No competitor does this well (GAP!)      │   │
│  │                                                    │   │
│  │ ☑ CLI tool for note management                    │   │
│  │   Reason: Developer-first feature, unique          │   │
│  │                                                    │   │
│  │ ☑ API documentation templates                     │   │
│  │   Reason: Targets use case competitors miss        │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │ PRIORITY 2: NICE-TO-HAVE (Post-MVP)               │   │
│  ├────────────────────────────────────────────────────┤   │
│  │ ☐ Real-time collaboration                         │   │
│  │   Reason: Important but complex, defer to v2       │   │
│  │                                                    │   │
│  │ ☐ Mobile app                                      │   │
│  │   Reason: 100% have it, but desktop-first OK       │   │
│  │                                                    │   │
│  │ ☐ AI-powered suggestions                          │   │
│  │   Reason: Trendy but not core value prop          │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  [Continue]                                                │
└────────────────────────────────────────────────────────────┘
```

---

### 4.2 Differentiation Strategy

**AI Response:**
```
┌────────────────────────────────────────────────────────────┐
│  🎯 Your Differentiation Strategy                          │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  "The Git-native note-taking tool for developers"          │
│                                                            │
│  ━━━ WHY THIS POSITIONING WINS ━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                            │
│  1️⃣ MARKET GAP                                            │
│  • No competitor has deep Git integration                  │
│  • Developers already use Git daily (familiar workflow)    │
│  • Enables version control for notes (unique capability)   │
│                                                            │
│  2️⃣ DEFENSIBLE MOAT                                       │
│  • Technical complexity deters copycats                    │
│  • Network effects from Git ecosystem                      │
│  • Developer community can contribute (open-source core?)  │
│                                                            │
│  3️⃣ HIGH-VALUE AUDIENCE                                   │
│  • Developers have high willingness to pay                 │
│  • Low acquisition cost (dev communities, GitHub)          │
│  • Word-of-mouth driven market                             │
│                                                            │
│  ━━━ KEY MESSAGES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                            │
│  Primary: "Your notes, version controlled like code"       │
│  Secondary: "Notion's flexibility + Git's power"           │
│  Elevator pitch: "If Obsidian and GitHub had a baby"       │
│                                                            │
│  ━━━ COMPETITIVE ADVANTAGES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                            │
│  vs. Notion:   We have Git, offline-first, dev-friendly    │
│  vs. Obsidian: We have real-time collab (planned), Git     │
│  vs. VS Code:  Purpose-built for notes, better UX          │
│                                                            │
│  [Continue]                                                │
└────────────────────────────────────────────────────────────┘
```

---

### 4.3 Go-to-Market Strategy

**AI Response:**
```
┌────────────────────────────────────────────────────────────┐
│  🚀 Go-to-Market Recommendations                           │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  PHASE 1: EARLY ADOPTERS (Month 1-2)                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  Target: Indie hackers, open-source developers             │
│  Channels:                                                 │
│  • Product Hunt launch                                     │
│  • Hacker News Show HN                                     │
│  • r/webdev, r/programming                                 │
│  • Dev.to, Hashnode blog posts                             │
│                                                            │
│  Messaging: "Finally, note-taking for developers who       │
│             think in Git"                                  │
│  Pricing: Free beta, collect feedback                      │
│  Goal: 100 users, 10 testimonials                          │
│                                                            │
│  PHASE 2: PRODUCT COMMUNITY (Month 3-4)                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  Target: Dev teams (2-10 people), technical PMs            │
│  Channels:                                                 │
│  • Content marketing (comparison posts, guides)            │
│  • YouTube demo videos                                     │
│  • GitHub Discussions, sponsor program                     │
│  • Conference talks (local meetups)                        │
│                                                            │
│  Messaging: "The only note-taking tool that syncs with     │
│             your Git workflow"                             │
│  Pricing: Launch $10/mo personal, $50/mo team              │
│  Goal: 500 users, $2k MRR                                  │
│                                                            │
│  PHASE 3: SCALE (Month 5-6)                                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  Target: Enterprise dev teams, technical organizations     │
│  Channels:                                                 │
│  • Case studies from beta users                            │
│  • Paid ads (Google, LinkedIn for "developer tools")       │
│  • Partnerships (GitHub, GitLab integrations)              │
│  • Sales outreach (50+ person teams)                       │
│                                                            │
│  Pricing: Add $200/mo enterprise tier                      │
│  Goal: 2000 users, $15k MRR                                │
│                                                            │
│  [Continue]                                                │
└────────────────────────────────────────────────────────────┘
```

---

### 4.4 Competitive Risks & Mitigation

**AI Response:**
```
┌────────────────────────────────────────────────────────────┐
│  ⚠️ Competitive Risks & Mitigation Strategies              │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  🔴 HIGH RISK                                              │
│  ┌────────────────────────────────────────────────────┐   │
│  │ Risk: Notion adds Git integration in 6-12 months    │   │
│  │                                                     │   │
│  │ Impact: Erodes primary differentiator               │   │
│  │                                                     │   │
│  │ Mitigation:                                         │   │
│  │ • Build community early (lock-in via ecosystem)     │   │
│  │ • Go deeper on Git features (they'll do basic)      │   │
│  │ • Add second differentiator (CLI, offline)          │   │
│  │ • Target developer niche (they won't specialize)    │   │
│  │                                                     │   │
│  │ Timeline: Execute in next 6 months                  │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  🟡 MEDIUM RISK                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │ Risk: Obsidian improves team collaboration          │   │
│  │                                                     │   │
│  │ Impact: Competes on both Git and collaboration      │   │
│  │                                                     │   │
│  │ Mitigation:                                         │   │
│  │ • Obsidian is local-first (hard to add real-time)   │   │
│  │ • We can match their features + add ours            │   │
│  │ • Different positioning (teams vs. individuals)     │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  🟢 LOW RISK                                               │
│  ┌────────────────────────────────────────────────────┐   │
│  │ Risk: New competitor launches similar product       │   │
│  │                                                     │   │
│  │ Impact: Share small market                          │   │
│  │                                                     │   │
│  │ Mitigation:                                         │   │
│  │ • First-mover advantage (build community now)       │   │
│  │ • Network effects from integrations                 │   │
│  │ • Developer market big enough for multiple players  │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  [Generate Final Report]                                   │
└────────────────────────────────────────────────────────────┘
```

---

### 4.5 Final Report Generation

**User Action:** Click "Generate Final Report"

**System Processing:**
```typescript
// Generate comprehensive report
const report = await generateCompetitiveAnalysisReport({
  chatId,
  competitors: selectedCompetitors,
  featureMatrix,
  swotAnalysis,
  recommendations,
  ...
})

// Save as Document
await prisma.document.create({
  data: {
    chatId,
    phase: 'RECOMMENDATION',
    content: report.markdown,
    status: 'COMPLETED'
  }
})

// Update analysis status
await prisma.competitorAnalysis.update({
  where: { chatId },
  data: { status: 'COMPLETED' }
})
```

**UI Display:**
```
┌────────────────────────────────────────────────────────────┐
│  ✅ Competitive Analysis Complete!                         │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  📄 Your comprehensive report includes:                    │
│  • Executive summary                                       │
│  • 8 competitor profiles                                   │
│  • Feature comparison matrix                               │
│  • Market positioning analysis                             │
│  • SWOT analysis                                           │
│  • MVP feature recommendations                             │
│  • Differentiation strategy                                │
│  • Go-to-market roadmap                                    │
│  • Competitive risks & mitigation                          │
│                                                            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                            │
│  [📥 Download Report]  [📊 View Dashboard]                │
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │ Export Options:                                    │   │
│  │ • PDF (executive report)                           │   │
│  │ • Markdown (for GitHub/docs)                       │   │
│  │ • Excel (feature matrix + pricing)                 │   │
│  │ • PNG (positioning map, SWOT diagram)              │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  [Start New Analysis]  [View Competitor Database]         │
└────────────────────────────────────────────────────────────┘
```

---

## Post-Workflow: Report Management

### 5.1 Report Viewer

**Page:** `/reports/[id]`

```
┌────────────────────────────────────────────────────────────┐
│  📄 Competitive Analysis Report                            │
│  SaaS Note-Taking Tool • Created Jan 13, 2025              │
├────────────────────────────────────────────────────────────┤
│  [📥 Download]  [📤 Share]  [✏️ Edit]  [🗑️ Archive]      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  [Table of Contents - collapsible left sidebar]            │
│                                                            │
│  [Main content area with Markdown rendering]               │
│  • Syntax highlighting for code blocks                     │
│  • Interactive charts (positioning map, SWOT)              │
│  • Collapsible competitor sections                         │
│                                                            │
│  [Comments/annotations - future feature]                   │
└────────────────────────────────────────────────────────────┘
```

---

### 5.2 Competitor Database

**Page:** `/competitors`

```
┌────────────────────────────────────────────────────────────┐
│  🏢 Competitor Database                                    │
├────────────────────────────────────────────────────────────┤
│  [🔍 Search]  [🏷️ Filter by category]  [➕ Add Manually]  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │ 🖼️ Notion             💰 Series C     ⭐ Leader    │   │
│  │ All-in-one workspace... 📊 Used in 5 analyses      │   │
│  │ [View Details]  [Compare]  [Edit]                 │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │ 🖼️ Obsidian           💰 Bootstrapped  ⭐ Niche    │   │
│  │ Local-first note... 📊 Used in 3 analyses          │   │
│  │ [View Details]  [Compare]  [Edit]                 │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  [... more competitors]                                    │
│                                                            │
│  Pagination: [1] 2 3 ... 10                                │
└────────────────────────────────────────────────────────────┘
```

---

### 5.3 Analysis History

**Page:** `/analyses` or Dashboard

```
┌────────────────────────────────────────────────────────────┐
│  📊 My Analyses                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │ SaaS Note-Taking Tool                              │   │
│  │ ✅ Completed • 8 competitors • Jan 13, 2025        │   │
│  │ [View Report]  [Re-run Analysis]  [Export]        │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │ E-commerce Platform                                │   │
│  │ ⏳ In Progress (Phase 2/4) • Jan 12, 2025          │   │
│  │ [Continue]  [Delete Draft]                        │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │ Mobile Fitness App                                 │   │
│  │ ✅ Completed • 12 competitors • Jan 10, 2025       │   │
│  │ [View Report]  [Re-run Analysis]  [Export]        │   │
│  └────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

---

## Error Handling & Edge Cases

### Scenario 1: AI Fails to Identify Competitors

**Fallback:**
```
┌────────────────────────────────────────────┐
│  ⚠️ Limited competitors found              │
│                                            │
│  I only found 2 competitors based on your  │
│  description. This might mean:             │
│  • Your idea is very niche (good!)         │
│  • Your description needs more detail      │
│  • I need more context                     │
│                                            │
│  Would you like to:                        │
│  ○ Add competitors manually                │
│  ○ Provide more product details            │
│  ○ Continue with limited data              │
└────────────────────────────────────────────┘
```

---

### Scenario 2: External API Rate Limit

**Graceful Degradation:**
```
┌────────────────────────────────────────────┐
│  ⏳ Data enrichment delayed                │
│                                            │
│  External APIs are temporarily unavailable.│
│  You can:                                  │
│  • Continue without enriched data          │
│  • Wait 5 minutes and retry                │
│  • Add data manually later                 │
│                                            │
│  Analysis will continue normally.          │
└────────────────────────────────────────────┘
```

---

### Scenario 3: User Abandons Mid-Analysis

**Auto-save:**
- All progress auto-saved after each phase
- User can return anytime via "Continue" button
- Draft analyses visible in dashboard

---

## Performance Considerations

### Loading States
- Skeleton loaders for competitor cards
- Progressive rendering for AI responses
- Optimistic UI updates for user selections

### Response Times
- Phase 1 (Discovery): 30-60 seconds
- Phase 2 (per competitor): 20-30 seconds
- Phase 3 (Positioning): 40-60 seconds
- Phase 4 (Recommendations): 30-45 seconds

### Caching
- Competitor data cached for 7 days
- External API responses cached for 24 hours
- Feature matrix recomputed only when data changes

---

## Appendix

### Keyboard Shortcuts
- `Cmd+Enter` - Send message / Continue
- `Cmd+K` - Focus search
- `Cmd+N` - New analysis
- `Esc` - Close modal

### Accessibility
- WCAG 2.1 AA compliant
- Keyboard navigation throughout
- Screen reader optimized
- High contrast mode support

### Mobile Considerations
- Responsive design (works on tablets)
- Phone layout simplified (1 column)
- Touch-friendly UI elements
- Swipe gestures for phase navigation

---

**Document Owner:** Product Team
**Next Review:** After user testing (Week 10)
**Feedback:** product@jotlin.com
