# Jotlin Agent - Intelligent Chat Assistant

A modern AI-powered chat interface built with Next.js, Better Auth, and Vercel AI SDK.

## Features

- 🔐 GitHub OAuth authentication with Better Auth
- 💬 AI-powered chat interface
- 🎨 Modern UI with shadcn/ui components
- 📱 Responsive design with sidebar navigation
- 🔄 Real-time streaming responses
- 🛡️ Server-side authentication with middleware protection
- 🚀 Optimized for production deployment

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- GitHub OAuth App (for authentication)
- OpenAI API key

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/jotlin"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"

# GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"
OPENAI_API_BASE_URL="https://api.openai.com/v1"
```

### GitHub OAuth Setup

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App with:
   - Application name: `Jotlin Agent`
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
3. Copy the Client ID and Client Secret to your `.env.local` file

### Database Setup

1. Run Prisma migrations:

```bash
npx prisma migrate dev
```

2. Generate Prisma client:

```bash
npx prisma generate
```

### Installation

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Application Structure

### Routes

- `/` - Redirects authenticated users to `/dashboard`
- `/login` - GitHub OAuth login page
- `/dashboard` - Main dashboard with overview and analytics
- `/chat` - AI chat interface with sidebar navigation
- `/api/auth/[...all]` - Better Auth API endpoints
- `/api/chat` - AI chat API endpoint

### Key Features

- **Unified Sidebar Navigation**: Consistent navigation across all pages
- **Chat Interface**: Full-featured AI chat with requirements panel
- **Authentication Flow**: Secure GitHub OAuth with session management
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Authentication Architecture

This project uses a secure authentication architecture following Better Auth best practices:

### Middleware Layer

- Uses `getSessionCookie()` for efficient cookie-based session checking
- Provides fast redirects without database calls
- Handles public route exceptions (`/login`, `/api/auth/*`)

### Server-Side Validation

- Each protected page performs server-side session validation using `auth.api.getSession()`
- Ensures security by validating sessions with the database
- Handles proper redirects for unauthenticated users

### Client-Side State

- `useAuth()` hook provides reactive authentication state for UI components
- Handles user information display and logout functionality
- Works seamlessly with server-side authentication

This multi-layered approach ensures both performance and security while maintaining a smooth user experience.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Deploy to docker

```bash
docker build -t jotlin:version . --platform=linux/amd64
```
