<div align="center">
  <img src="public/logo.svg" alt="Jotlin" width="120" height="120" />
  <h1>Jotlin</h1>
  <p><strong>The missing layer between idea and code</strong></p>

  <p>
    <a href="#features">Features</a> •
    <a href="#quick-start">Quick Start</a> •
    <a href="#documentation">Documentation</a> •
    <a href="#contributing">Contributing</a>
  </p>

  <!-- Add badges here when ready -->
  <!-- ![License](https://img.shields.io/badge/license-MIT-blue.svg) -->
  <!-- ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue) -->
</div>

---

## What is Jotlin?

Jotlin is an AI-powered specification assistant that transforms rough ideas into production-ready documentation through intelligent conversation. Instead of staring at a blank document, you simply describe your project idea, and Jotlin guides you through a structured interview to generate comprehensive PRDs, user stories, and technical specifications.

**Stop writing specs from scratch. Start having conversations that generate them.**

### Why Jotlin?

- **Natural Interaction**: Chat naturally about your ideas instead of filling out templates
- **Intelligent Guidance**: AI asks the right questions to uncover requirements you might miss
- **Structured Output**: Generate professional documentation that your team can use immediately
- **Iterative Refinement**: Continuously improve specs through ongoing conversations
- **Context Preservation**: All conversations and artifacts are preserved for future reference

## Features

### Core Capabilities

- **🎯 AI-Powered Interviews** - Intelligent questioning system that guides you from vague ideas to concrete specifications
- **📝 Multi-Format Artifacts** - Generate PRDs, user stories, flow diagrams, risk assessments, and technical docs
- **💬 Conversational UI** - Modern chat interface with real-time streaming responses
- **📊 Artifact Management** - View, edit, and iterate on generated specifications
- **🔍 Context-Aware** - Maintains conversation context across sessions

### Technical Highlights

- **⚡ Real-time Streaming** - Powered by Vercel AI SDK for instant feedback
- **🎨 Modern UI** - Built with Next.js 15, React 19, and shadcn/ui components
- **🔐 Secure Authentication** - GitHub OAuth with Better Auth
- **💾 Persistent Storage** - PostgreSQL with Prisma ORM
- **📱 Responsive Design** - Works seamlessly across desktop and mobile
- **🌐 Internationalization Ready** - Built-in i18n support

## Quick Start

### Prerequisites

Ensure you have the following installed:

- **Node.js** 18.x or higher
- **PostgreSQL** 14.x or higher
- **npm** or **pnpm**

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/jotlin.git
cd jotlin
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/jotlin"

# Base URL
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"
OPENAI_API_BASE_URL="https://api.openai.com/v1"

# GitHub OAuth (see setup guide below)
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# JWT Secrets
SEALOS_JWT_SECRET="your-sealos-jwt-secret"  # Optional: for Sealos integration
JWT_SECRET="your-jwt-secret"

# Claude Agent SDK (for AI code generation features)
ANTHROPIC_BASE_URL="https://api.anthropic.com"
ANTHROPIC_AUTH_TOKEN="your-anthropic-api-key"
ANTHROPIC_MODEL="claude-sonnet-4-5-20250929"  # Optional: defaults to this model
```

4. **Initialize the database**

```bash
npx prisma migrate dev
npx prisma generate
```

5. **Start the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### GitHub OAuth Setup

1. Navigate to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App with:
   - **Application name**: `Jotlin`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
3. Copy the Client ID and Client Secret to your `.env` file

## Documentation

### Project Structure

```
jotlin/
├── app/                    # Next.js App Router
│   ├── (app)/             # Authenticated routes
│   ├── api/               # API endpoints
│   └── preview/           # Public preview pages
├── components/            # React components
│   ├── ui/               # Base UI components (shadcn/ui)
│   ├── chat/             # Chat-specific components
│   └── auth/             # Authentication components
├── hooks/                 # Custom React hooks
├── libs/                  # Utility libraries
├── prisma/               # Database schema & migrations
├── public/               # Static assets
└── store/                # State management (Zustand)
```

### Architecture

Jotlin follows a modern full-stack architecture:

- **Frontend**: Next.js 15 with React Server Components
- **Backend**: Next.js API Routes with type-safe endpoints
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth with GitHub OAuth
- **AI Integration**: Vercel AI SDK with streaming support
- **State Management**: Zustand for client-side state

For detailed architecture documentation, see [CLAUDE.md](./CLAUDE.md).

## Tech Stack

<table>
  <tr>
    <td><strong>Framework</strong></td>
    <td>Next.js 15.5, React 19</td>
  </tr>
  <tr>
    <td><strong>Language</strong></td>
    <td>TypeScript 5</td>
  </tr>
  <tr>
    <td><strong>Styling</strong></td>
    <td>Tailwind CSS 4, shadcn/ui</td>
  </tr>
  <tr>
    <td><strong>Database</strong></td>
    <td>PostgreSQL, Prisma</td>
  </tr>
  <tr>
    <td><strong>Authentication</strong></td>
    <td>Better Auth</td>
  </tr>
  <tr>
    <td><strong>AI SDK</strong></td>
    <td>Vercel AI SDK, Anthropic Claude</td>
  </tr>
  <tr>
    <td><strong>State Management</strong></td>
    <td>Zustand, React Query</td>
  </tr>
</table>

## Deployment

### Docker

Build the Docker image:

```bash
docker build -t jotlin:latest . --platform=linux/amd64
```

Run the container:

```bash
docker run -p 3000:3000 --env-file .env jotlin:latest
```

### Vercel

The easiest way to deploy Jotlin is using the [Vercel Platform](https://vercel.com):

1. Push your code to GitHub
2. Import the repository in Vercel
3. Configure environment variables
4. Deploy

See [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Contributing

We welcome contributions from the community! Whether it's:

- 🐛 Bug reports and fixes
- ✨ New feature suggestions
- 📝 Documentation improvements
- 🎨 UI/UX enhancements

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please read our [Contributing Guide](CONTRIBUTING.md) for more details.

## Roadmap

- [ ] Multi-language support (Chinese, Japanese, etc.)
- [ ] Export to multiple formats (Markdown, PDF, Notion)
- [ ] Team collaboration features
- [ ] Integration with project management tools
- [ ] Custom prompt templates
- [ ] Version control for specifications

## Acknowledgments

Built with amazing open-source technologies:

- [Next.js](https://nextjs.org/) - The React Framework
- [shadcn/ui](https://ui.shadcn.com/) - Beautifully designed components
- [Vercel AI SDK](https://sdk.vercel.ai/) - The AI Toolkit for TypeScript
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [Better Auth](https://better-auth.com/) - Authentication for Next.js

---

<div align="center">
  <p>Made with ❤️ by the Jotlin team</p>
  <p>
    <a href="https://github.com/yourusername/jotlin">GitHub</a> •
    <a href="https://twitter.com/jotlin">Twitter</a> •
    <a href="https://discord.gg/jotlin">Discord</a>
  </p>
</div>
