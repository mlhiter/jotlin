# Dependencies Update for Multi-Agent System

## New Dependencies to Install

Run the following commands to add Mastra.ai and related packages:

```bash
# Core Mastra packages
npm install @mastra/core @mastra/ai-sdk

# Tavily search tool
npm install @tavily/core

# Additional utilities (if not already installed)
npm install p-limit zod
```

## Updated package.json Dependencies Section

Add these to your `package.json`:

```json
{
  "dependencies": {
    // ... existing dependencies

    // Mastra.ai Multi-Agent Framework
    "@mastra/core": "^0.1.0",
    "@mastra/ai-sdk": "^0.1.0",

    // External Tools
    "@tavily/core": "^1.0.0",

    // Utilities
    "p-limit": "^5.0.0"
  }
}
```

## Environment Variables

Add these to your `.env` file:

```env
# Mastra Configuration
MASTRA_PORT=4111

# Tavily API (required)
TAVILY_API_KEY=your_tavily_api_key_here

# Product Hunt API (optional, for data enrichment)
PRODUCT_HUNT_API_KEY=your_ph_api_key_here

# Crunchbase API (optional, for funding data)
CRUNCHBASE_API_KEY=your_cb_api_key_here
```

## Getting API Keys

### Tavily API Key (Required)
1. Go to https://tavily.com
2. Sign up for an account
3. Navigate to API Keys section
4. Copy your API key
5. Free tier: 1,000 searches/month

### Product Hunt API Key (Optional)
1. Go to https://api.producthunt.com/v2/docs
2. Create a Product Hunt account
3. Register an application
4. Get your API token
5. Free tier: 500 requests/hour

### Crunchbase API Key (Optional)
1. Go to https://data.crunchbase.com/docs
2. Sign up for API access ($$$)
3. Get your API key
4. Note: This is a paid service

## Verification

After installation, verify the setup:

```bash
# Check Mastra installation
npm list @mastra/core @mastra/ai-sdk

# Check environment variables
node -e "console.log(process.env.TAVILY_API_KEY ? '✓ Tavily key set' : '✗ Tavily key missing')"
```

## TypeScript Configuration

Ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    // ... existing options
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve"
  }
}
```

## Next Steps

1. Install dependencies: `npm install`
2. Set environment variables in `.env`
3. Run the Mastra example: `npm run dev`
4. Test the Discovery Agent: Navigate to `/api/analysis`

## Development Workflow

```bash
# Start Next.js dev server
npm run dev

# Start Mastra server (if running separately)
npx mastra dev

# Or run both together (recommended)
npm run dev
```

## Troubleshooting

### Issue: Module not found '@mastra/core'
**Solution**: Run `npm install` again, check npm version (need npm 8+)

### Issue: Tavily API returns 401
**Solution**: Check your API key in `.env`, ensure it's not expired

### Issue: Mastra port conflict
**Solution**: Change `MASTRA_PORT` in `.env` to a different port (e.g., 4112)

---

**Last Updated:** 2025-01-13
