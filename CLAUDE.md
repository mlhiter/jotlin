# Jotlin Design System Rules

This document outlines the design system structure, patterns, and conventions used in the Jotlin codebase for AI assistants and developers integrating Figma designs.

## Project Overview

**Jotlin** is focused on AI-powered requirement document generation. The application helps users create professional requirement analysis documents through conversational AI.

### Core Features

- ✅ **Requirement Analysis Phase**: Generate comprehensive requirement documents through AI conversation
- ✅ **Competitor Research**: Analyze competitors and market positioning
- ✅ **Document Version Management**: Track and rollback document versions
- ✅ **Multi-language Support**: i18n support for global users
- ✅ **User Authentication**: Secure JWT-based authentication

### Removed Features (as of 2025-01-26)

- ❌ Architecture Phase (Technical Architecture Design)
- ❌ Development Phase (Development Planning)
- ❌ MVP Code Generation
- ❌ Phase Progression System

## AI Assistant Guidelines

### Development Server Management

- **DO NOT** run `npm run dev` or any development server commands in background tasks
- The user will manage the development server themselves
- Only check the status of already running servers if necessary, but do not start new ones
- If you need to test changes, inform the user to restart the development server

## Table of Contents

- [AI Assistant Guidelines](#ai-assistant-guidelines)
- [Technology Stack](#technology-stack)
- [Design Tokens](#design-tokens)
- [Component Architecture](#component-architecture)
- [Styling System](#styling-system)
- [Icon System](#icon-system)
- [Asset Management](#asset-management)
- [Project Structure](#project-structure)
- [Best Practices](#best-practices)

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

---

## Design Tokens

### Location

Design tokens are defined in `/app/globals.css` using CSS custom properties.

### Token Structure

#### Color System

Colors use the **OKLCH color space** for better perceptual uniformity.

**Light Mode:**

```css
:root {
  --background: #fafafa;
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: #e5e5e5;
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
}
```

**Dark Mode:**

```css
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --primary: oklch(0.922 0 0);
  --muted: oklch(0.269 0 0);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  /* ... */
}
```

**Sidebar Colors:**

```css
--sidebar: oklch(0.985 0 0);
--sidebar-foreground: oklch(0.145 0 0);
--sidebar-primary: oklch(0.205 0 0);
--sidebar-accent: oklch(0.97 0 0);
--sidebar-border: oklch(0.922 0 0);
```

**Chart Colors:**

```css
--chart-1: oklch(0.646 0.222 41.116);
--chart-2: oklch(0.6 0.118 184.704);
--chart-3: oklch(0.398 0.07 227.392);
--chart-4: oklch(0.828 0.189 84.429);
--chart-5: oklch(0.769 0.188 70.08);
```

#### Border Radius

```css
--radius: 0.625rem; /* 10px base */
--radius-sm: calc(var(--radius) - 4px); /* 6px */
--radius-md: calc(var(--radius) - 2px); /* 8px */
--radius-lg: var(--radius); /* 10px */
--radius-xl: calc(var(--radius) + 4px); /* 14px */
```

#### Typography

**Font Families:**

```css
--font-sans: var(--font-geist-sans);
--font-mono: var(--font-geist-mono);
```

**Font Loading (Next.js):**

```typescript
import { Geist, Geist_Mono } from 'next/font/google'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})
```

**Font Features:**

```css
body {
  font-family:
    var(--font-geist-sans),
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    sans-serif;
  font-feature-settings:
    'rlig' 1,
    'calt' 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

### Accessing Tokens in Tailwind

Tokens are mapped to Tailwind utilities in `globals.css`:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-border: var(--border);
  /* ... */
}
```

Usage in components:

```tsx
<div className="bg-background text-foreground border-border" />
<button className="bg-primary text-primary-foreground" />
```

---

## Component Architecture

### Component Library Structure

```
components/
├── ui/                    # Primitive UI components (shadcn/ui)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   ├── textarea.tsx
│   └── ...
├── chat/                  # Feature-specific components
│   ├── chat-input.tsx
│   ├── chat-list.tsx
│   ├── message-list.tsx
│   └── ...
├── auth/                  # Authentication components
│   ├── auth-guard.tsx
│   └── login-form.tsx
├── dialog/                # Dialog components
│   └── feedback-dialog.tsx
├── providers/             # Context providers
│   └── query-provider.tsx
├── app-sidebar.tsx        # Layout components
├── nav-*.tsx             # Navigation components
└── ...
```

### UI Component Pattern (shadcn/ui)

All UI components follow the **shadcn/ui** pattern:

**1. Component Variants (using CVA):**

```typescript
// components/ui/button.tsx
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/libs/utils/utils'

const buttonVariants = cva(
  'focus-visible:border-ring focus-visible:ring-ring/50 inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
        destructive: 'bg-destructive shadow-xs hover:bg-destructive/90 text-white',
        outline: 'bg-background shadow-xs hover:bg-accent border',
        secondary: 'bg-secondary text-secondary-foreground shadow-xs',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 gap-1.5 rounded-md px-3',
        lg: 'h-10 rounded-md px-6',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)
```

**2. Component Implementation:**

```typescript
function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
```

**3. Usage Example:**

```tsx
import { Button } from '@/components/ui/button'

<Button variant="default" size="lg">Click me</Button>
<Button variant="ghost" size="sm">Ghost button</Button>
<Button variant="destructive" size="icon">
  <Trash className="h-4 w-4" />
</Button>
```

### Compound Component Pattern

For complex components like Card:

```typescript
// components/ui/card.tsx
function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card"
      className={cn('flex flex-col gap-6 rounded-xl border bg-card text-card-foreground shadow-sm', className)}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-header" className={cn('...', className)} {...props} />
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-title" className={cn('leading-none font-semibold', className)} {...props} />
}

export { Card, CardHeader, CardTitle, CardContent, CardFooter }
```

**Usage:**

```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>Content here</CardContent>
  <CardFooter>Footer actions</CardFooter>
</Card>
```

### Data Slot Pattern

Components use `data-slot` attributes for styling specificity:

```tsx
<div data-slot="card">
  <div data-slot="card-header">...</div>
  <div data-slot="card-content">...</div>
</div>
```

This allows parent selectors to target specific slots:

```css
[.border-b]: pb-6; /* Add padding-bottom if parent has border-b */
```

---

## Styling System

### CSS Methodology

**Tailwind CSS v4** with utility-first approach and CSS variables.

### Configuration

**PostCSS Config (`postcss.config.mjs`):**

```javascript
const config = {
  plugins: ['@tailwindcss/postcss'],
}
```

**shadcn/ui Config (`components.json`):**

```json
{
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide"
}
```

### Global Styles

Located in `/app/[locale]/globals.css`:

**1. Tailwind Imports:**

```css
@import 'tailwindcss';
@import 'tw-animate-css';
@plugin '@tailwindcss/typography';
```

**2. Dark Mode Variant:**

```css
@custom-variant dark (&:is(.dark *));
```

**3. Base Layer:**

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

**4. Custom Animations:**

```css
@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
  50% {
    transform: translateY(-25%);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
}

.animate-bounce {
  animation: bounce 1s infinite;
}
```

### Theme Provider

Dark mode is managed via `next-themes`:

```tsx
// app/[locale]/layout.tsx
import { ThemeProvider } from 'next-themes'
;<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
  {children}
</ThemeProvider>
```

### Utility Function: `cn()`

**Location:** `/lib/utils.ts`

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Purpose:**

- Merge conditional classes with `clsx`
- Resolve Tailwind class conflicts with `tailwind-merge`

**Usage:**

```tsx
<div className={cn('base-classes', condition && 'conditional-class', className)} />
```

### Responsive Design

Use Tailwind's responsive prefixes:

```tsx
<div className="w-full md:w-1/2 lg:w-1/3">
  <p className="text-sm md:text-base lg:text-lg">Responsive text</p>
</div>
```

Container queries (using `@container`):

```tsx
<div className="@container/card-header">
  <div className="@sm/card-header:grid-cols-2">...</div>
</div>
```

### Focus & Accessibility Styles

**Global Focus Styles:**

```css
*:focus-visible {
  outline: 2px solid rgb(107 114 128);
  outline-offset: 2px;
}
```

**Component Focus:**

```css
focus-visible:border-ring
focus-visible:ring-[3px]
focus-visible:ring-ring/50
```

### Selection Styling

```css
::selection {
  background: rgb(107 114 128 / 0.2);
}

[data-selection-container] ::selection {
  background: hsl(var(--accent) / 0.3);
  color: hsl(var(--accent-foreground));
}
```

---

## Icon System

### Icon Library

**Primary Library:** Lucide React v0.543.0

**Import Pattern:**

```tsx
import { ArrowUp, Square, X, TextAlignStart } from 'lucide-react'
```

### Icon Usage Guidelines

**1. In Buttons:**

```tsx
<Button variant="default" size="icon">
  <Trash className="h-4 w-4" />
</Button>
```

**2. Inline with Text:**

```tsx
<div className="flex items-center gap-2">
  <CheckIcon className="h-4 w-4" />
  <span>Completed</span>
</div>
```

**3. Size Standards:**

- Default icons: `h-4 w-4` (16px)
- Small icons: `h-3 w-3` (12px)
- Large icons: `h-5 w-5` or `h-6 w-6`

**4. Icon Color:**

```tsx
<Icon className="text-muted-foreground" />
<Icon className="text-accent-foreground/70" />
```

### Icon Component Pattern

Components automatically size icons with the `[&_svg]` selector:

```tsx
// In button.tsx
const buttonVariants = cva(
  "[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0"
  // ...
)
```

This means icons in buttons automatically get sized to 16px unless explicitly set.

---

## Asset Management

### Asset Location

```
public/
├── logo.svg              # Primary logo
├── logo-white.svg        # White variant
├── logo-with-text.svg    # Logo with text
└── favicon.ico           # Favicon
```

### Asset Import Patterns

**1. Static Assets in `public/`:**

```tsx
<Image src="/logo.svg" alt="Logo" width={32} height={32} />
```

**2. Next.js Image Component:**

```tsx
import Image from 'next/image'
;<Image
  src="/logo.svg"
  alt="Logo"
  width={32}
  height={32}
  priority // For above-the-fold images
/>
```

### Asset Optimization

- **Next.js automatically optimizes images** imported via `next/image`
- SVG assets are served as-is from `/public`
- No CDN configuration currently in use

---

## Project Structure

### Directory Organization

```
jotlin/
├── app/                          # Next.js App Router
│   ├── (app)/                   # Authenticated app routes
│   │   ├── admin/
│   │   ├── chat/[chatId]/
│   │   └── layout.tsx           # App layout with sidebar
│   ├── preview/                 # Public preview pages
│   ├── api/                     # API routes
│   │   ├── auth/
│   │   ├── chats/
│   │   └── feedback/
│   ├── layout.tsx               # Root layout
│   ├── globals.css              # Global styles
│   ├── page.tsx                 # Landing page
│   └── favicon.ico
│
├── components/                   # React components
│   ├── ui/                      # Primitive components (shadcn/ui)
│   ├── chat/                    # Feature components
│   ├── auth/                    # Auth components
│   ├── dialog/                  # Dialog components
│   ├── providers/               # Context providers
│   └── ...
│
├── hooks/                        # Custom React hooks
│   ├── use-auth.ts
│   ├── use-chat.ts
│   └── ...
│
├── lib/                          # Utility libraries
│   ├── utils.ts                 # cn() utility
│   ├── auth.ts
│   ├── prisma.ts
│   └── ...
│
├── prisma/                       # Database schema
│   ├── schema.prisma
│   └── migrations/
│
├── store/                        # Zustand stores
│   └── auth-store.ts
│
├── schema/                       # Validation schemas
│   ├── chat.ts
│   └── session.ts
│
├── public/                       # Static assets
│   └── logo.svg
│
├── components.json               # shadcn/ui config
├── package.json
├── tsconfig.json
└── next.config.ts
```

### Route Groups

**1. `(app)` - Authenticated Routes:**

```
app/(app)/
├── chat/[chatId]/page.tsx
├── admin/feedback/page.tsx
└── layout.tsx               # Includes sidebar, auth guard
```

**2. Public Routes:**

```
app/
├── preview/[chatId]/page.tsx
└── page.tsx                 # Landing
```

### Path Aliases

Defined in `tsconfig.json`:

```json
{
  "paths": {
    "@/*": ["./*"]
  }
}
```

**Usage:**

```tsx
import { Button } from '@/components/ui/button'
import { cn } from '@/libs/utils/utils'
import { useAuth } from '@/hooks/use-auth'
```

### File Naming Conventions

- **Components**: PascalCase (e.g., `ChatInput.tsx`) or kebab-case (e.g., `chat-input.tsx`)
- **Utilities**: kebab-case (e.g., `use-auth.ts`)
- **API Routes**: `route.ts`
- **Pages**: `page.tsx`
- **Layouts**: `layout.tsx`

---

## Best Practices

### 1. Component Creation

**Always use shadcn/ui components as a foundation:**

```bash
npx shadcn@latest add button
npx shadcn@latest add card
```

**Extend with custom variants:**

```tsx
const customButtonVariants = cva(buttonVariants.toString(), {
  variants: {
    // Add custom variants
    custom: '...',
  },
})
```

### 2. State Management

**Client-side global state (Zustand):**

```tsx
// store/auth-store.ts
import { create } from 'zustand'

interface AuthState {
  user: User | null
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}))
```

**Server state (React Query):**

```tsx
'use client'

import { useQuery } from '@tanstack/react-query'

export function useChats() {
  return useQuery({
    queryKey: ['chats'],
    queryFn: async () => {
      const response = await fetch('/api/chats')
      return response.json()
    },
  })
}
```

### 3. Form Handling

**Use controlled components:**

```tsx
const [input, setInput] = useState('')

<Textarea
  value={input}
  onChange={(e) => setInput(e.target.value)}
  placeholder={t('placeholder')}
/>
```

### 4. Accessibility

**Always include:**

- `aria-label` for icon-only buttons
- `disabled` state handling
- `aria-invalid` for form errors
- Keyboard navigation support

```tsx
<Button variant="ghost" size="icon" aria-label="Delete item" disabled={isLoading}>
  <Trash className="h-4 w-4" />
</Button>
```

### 5. Client vs Server Components

**Server Components (default):**

```tsx
// app/page.tsx
export default async function Page() {
  const data = await fetchData()
  return <div>{data}</div>
}
```

**Client Components (add 'use client'):**

```tsx
'use client'

import { useState } from 'react'

export function InteractiveComponent() {
  const [state, setState] = useState(false)
  // ...
}
```

### 6. Loading States

**Use Suspense boundaries:**

```tsx
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
;<Suspense fallback={<Skeleton className="h-40 w-full" />}>
  <AsyncComponent />
</Suspense>
```

### 7. Error Handling

**Use error boundaries:**

```tsx
// app/error.tsx
'use client'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

### 8. Performance Optimization

**Memoize expensive computations:**

```tsx
import { useMemo } from 'react'

const sortedData = useMemo(() => {
  return data.sort((a, b) => a.value - b.value)
}, [data])
```

**Use React.memo for expensive renders:**

```tsx
const ExpensiveComponent = React.memo(({ data }) => {
  // Complex rendering
})
```

### 9. Type Safety

**Always type component props:**

```tsx
interface ChatInputProps {
  onSendMessage: (message: { text: string }) => void
  onStop: () => void
  status: ChatStatus
  disabled?: boolean
}

export function ChatInput({ onSendMessage, onStop, status, disabled = false }: ChatInputProps) {
  // ...
}
```

### 10. Code Organization

**One component per file:**

```
components/
  chat/
    chat-input.tsx        # ChatInput component
    chat-list.tsx         # ChatList component
    message-list.tsx      # MessageList component
```

**Group related functionality:**

```
hooks/
  use-auth.ts
  use-chat.ts
  use-locale.ts
```

---

## Additional Notes

### Database Schema

Located in `/prisma/schema.prisma`. Always run migrations after schema changes:

```bash
npx prisma migrate dev
npx prisma generate
```

### Environment Variables

Create `.env` file with required variables:

```env
DATABASE_URL="..."
NEXTAUTH_SECRET="..."
# Add other required variables
```

### Development Workflow

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Format code
npm run prettier
```

---

## Design Integration Checklist

When integrating Figma designs, ensure:

- [ ] Use existing color tokens from `globals.css`
- [ ] Follow component variant patterns (CVA)
- [ ] Use lucide-react icons
- [ ] Apply proper responsive classes
- [ ] Include dark mode variants
- [ ] Use `cn()` for conditional classes
- [ ] Add proper TypeScript types
- [ ] Include internationalization keys
- [ ] Test accessibility (keyboard nav, screen readers)
- [ ] Optimize for performance (lazy load, memoize)
- [ ] Add proper loading and error states
- [ ] Follow file naming conventions
- [ ] Document component props and usage

---

**Last Updated:** 2025-01-19
**Version:** 1.0.0
