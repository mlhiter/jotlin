# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Jotlin is an open-source Notion-like editor with LLM capabilities built on Next.js 14, Prisma, and BlockNote. It features collaborative document editing, real-time updates, and AI chat integration with document context awareness.

## Common Commands

### Development

```bash
npm install        # Install dependencies
npm run dev        # Start development server (port 3000)
npm run lint       # Run Next.js linter
npm run prettier   # Format code with Prettier
```

### Build & Production

```bash
npm run build      # Build for production
npm run start      # Start production server
```

### Database

```bash
npx prisma generate     # Generate Prisma client
npx prisma db push      # Push schema changes to database
npx prisma migrate dev  # Create and apply migrations
npx prisma studio       # Open Prisma Studio GUI
```

### UI Components

```bash
npm run shadcn-ui      # Add new shadcn/ui components
```

## Architecture Overview

### Core Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Editor**: BlockNote (Notion-like block editor)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: better-auth with GitHub OAuth
- **State Management**: Zustand stores, React Query
- **Real-time**: WebSocket integration (y-webrtc, yjs)
- **File Storage**: MinIO for images and documents
- **AI Integration**: LangChain/LangGraph with OpenAI API

### Directory Structure

#### `/app` - Next.js App Router

- `(main)` - Protected routes requiring authentication
  - `documents/[documentId]` - Document editor pages
  - `chats/[chatId]` - AI chat interface pages
  - `components/` - Main app components (navbar, document-list, chat-list, etc.)
- `(marking)` - Marketing/landing pages
- `(public)` - Public routes (preview, error pages)
- `api/` - API route handlers
  - `chats/` - Chat management API
  - `messages/` - Message handling API

#### `/api` - API Service Layer

Abstraction layer for API calls:

- `document.ts` - Document CRUD operations
- `user.ts` - User management
- `invitation.ts` - Collaboration invitations
- `image.ts` - Image upload/delete
- `chat.ts` - Chat and AI conversation management

#### `/components` - Shared Components

- `editor/` - BlockNote editor wrapper and toolbars
- `modals/` - Dialog components (auth, settings, etc.)
- `ui/` - shadcn/ui base components
- `providers/` - React context providers

#### `/stores` - Zustand State Management

Global client state for:

- Authentication state
- Document management
- Chat and message management
- Search functionality
- Modal controls

#### `/libs` - Core Utilities

- `auth.ts` - better-auth configuration
- `prisma.ts` - Prisma client instance
- `minio.ts` - MinIO file storage client
- `axios.ts` - HTTP client configuration
- `ai-agent.ts` - LangChain AI agent for chat
- `ai-streaming.ts` - Streaming AI response handler

### Authentication Flow

1. Uses better-auth with Prisma adapter
2. Supports email/password and GitHub OAuth
3. Session management with JWT tokens
4. Protected routes use middleware.ts

### Document Architecture

1. **Hierarchical Structure**: Documents can have parent-child relationships
2. **Collaboration**: Documents support multiple collaborators via invitations
3. **Real-time Editing**: WebSocket support for collaborative editing
4. **Publishing**: Documents can be published for public viewing
5. **Chat Integration**: Documents can be linked to AI chat conversations for context

### AI Chat Architecture

1. **Chat Sessions**: Independent chat conversations with AI
2. **Document Context**: Chats can reference linked documents for context-aware responses
3. **Message History**: Full conversation history with role-based messages
4. **Intelligent Analysis**: AI analyzes user queries and document content
5. **Streaming Responses**: Real-time AI response streaming

### Key Features Implementation

- **Block Editor**: BlockNote provides Notion-like editing experience
- **AI Chat**: LangChain-powered conversations with document context
- **File Uploads**: Images stored in MinIO, referenced in documents
- **Search**: Command palette (Cmd+K) for document search
- **Trash/Archive**: Soft delete with restoration capability for both documents and chats
- **Dark Mode**: Theme toggle with next-themes

## Development Notes

### Environment Variables

Required in `.env.local`:

```
DATABASE_URL=          # PostgreSQL connection string
GITHUB_ID=             # GitHub OAuth app ID
GITHUB_SECRET=         # GitHub OAuth app secret
MINIO_ENDPOINT=        # MinIO server endpoint
MINIO_PORT=            # MinIO port
MINIO_ACCESS_KEY=      # MinIO access key
MINIO_SECRET_KEY=      # MinIO secret key
MINIO_BUCKET_NAME=     # MinIO bucket name
BETTER_AUTH_SECRET=    # Auth secret key
OPENAI_API_KEY=        # OpenAI API key for AI features
OPENAI_BASE_URL=   # Optional: Custom OpenAI API base URL
```

### Database Schema

Key models in Prisma:

- **User**: Authentication and profile
- **Document**: Core content with hierarchy and chat linking
- **DocumentCollaborator**: Many-to-many collaboration
- **Invitation**: Collaboration invites
- **Chat**: AI conversation sessions
- **Message**: Chat messages with role-based content
- **Session/Account**: Auth management

### API Routes Pattern

All API routes follow RESTful conventions:

- `GET /api/documents/list` - List documents
- `POST /api/documents/create` - Create document
- `PATCH /api/documents/[id]` - Update document
- `DELETE /api/documents/[id]/archive` - Soft delete
- `GET /api/chats/list` - List chat sessions
- `POST /api/chats/create` - Create new chat
- `POST /api/chats/[id]/ai-response` - Get AI response
- `POST /api/chats/[id]/stream` - Stream AI response

### State Management Pattern

1. Zustand stores handle global client state
2. React Query manages server state and caching
3. Components use custom hooks for data fetching
