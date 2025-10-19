# Design System Rules for Jotlin

## Quick Reference

### Technology Stack

- **Framework**: Next.js 15 + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 with CSS variables
- **Components**: shadcn/ui (New York style)
- **Icons**: lucide-react
- **State**: Zustand + React Query
- **I18n**: next-intl

### Path Aliases

```typescript
@/components/* → components/*
@/lib/* → lib/*
@/hooks/* → hooks/*
```

---

## Component Creation Rules

### 1. Use shadcn/ui Components First

**ALWAYS** check if a shadcn/ui component exists before creating new UI components:

```bash
npx shadcn@latest add [component-name]
```

Available components in `/components/ui/`:

- button, card, dialog, input, textarea
- dropdown-menu, tooltip, avatar, badge
- scroll-area, separator, sidebar, skeleton
- table, sheet, collapsible

### 2. Component File Pattern

**Structure:**

```tsx
'use client' // Only if needed (useState, useEffect, event handlers)

import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

// 1. Define variants with CVA
const componentVariants = cva(
  'base-classes', // Always include base classes
  {
    variants: {
      variant: {
        default: '...',
        secondary: '...',
      },
      size: {
        default: '...',
        sm: '...',
        lg: '...',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

// 2. Define TypeScript interface
interface ComponentProps extends React.ComponentProps<'div'>, VariantProps<typeof componentVariants> {
  customProp?: string
}

// 3. Export component
export function Component({ variant, size, className, customProp, ...props }: ComponentProps) {
  return <div data-slot="component-name" className={cn(componentVariants({ variant, size, className }))} {...props} />
}

// 4. Export variants for extension
export { componentVariants }
```

### 3. Styling Rules

**Class Utilities:**

```tsx
import { cn } from '@/lib/utils'

// ✅ DO: Use cn() for conditional and merged classes
<div className={cn(
  "base-class",
  condition && "conditional-class",
  className
)} />

// ❌ DON'T: Manually concatenate classes
<div className={`base-class ${condition ? 'conditional-class' : ''}`} />
```

**Color Usage:**

```tsx
// ✅ DO: Use semantic color tokens
<div className="bg-background text-foreground" />
<div className="bg-primary text-primary-foreground" />
<div className="border-border text-muted-foreground" />

// ❌ DON'T: Use arbitrary color values
<div className="bg-[#fafafa] text-[#000000]" />
```

**Spacing & Sizing:**

```tsx
// ✅ DO: Use Tailwind spacing scale
<div className="p-4 gap-2 mt-6" />

// ✅ DO: Use size utilities
<div className="w-full max-w-3xl mx-auto" />

// ❌ DON'T: Use arbitrary values without reason
<div className="p-[13px]" /> // Use p-3 or p-4 instead
```

### 4. Dark Mode Pattern

**Always support dark mode:**

```tsx
<div className="bg-white dark:bg-black" />
<div className="text-gray-900 dark:text-gray-100" />

// Or use semantic tokens (preferred)
<div className="bg-card text-card-foreground" />
```

### 5. Responsive Design

**Mobile-first approach:**

```tsx
<div className="// Mobile // Tablet // Desktop w-full md:w-1/2 lg:w-1/3">
  <p className="text-sm md:text-base lg:text-lg">Text</p>
</div>
```

---

## Icon Usage Rules

### Import Pattern

```tsx
import { Icon1, Icon2 } from 'lucide-react'

// ✅ DO: Destructure multiple icons
import { ArrowUp, Square, X } from 'lucide-react'

// ❌ DON'T: Import entire library
import * as Icons from 'lucide-react'
```

### Size Standards

```tsx
// Small (12px)
<Icon className="h-3 w-3" />

// Default (16px)
<Icon className="h-4 w-4" />

// Medium (20px)
<Icon className="h-5 w-5" />

// Large (24px)
<Icon className="h-6 w-6" />
```

### Icon in Buttons

```tsx
// Icon-only button
<Button variant="ghost" size="icon">
  <Trash className="h-4 w-4" />
</Button>

// Button with icon and text
<Button>
  <Plus className="h-4 w-4" />
  Add Item
</Button>
```

---

## State Management Rules

### 1. Client State (Zustand)

**When to use:** Global UI state, user preferences

```tsx
// store/example-store.ts
import { create } from 'zustand'

interface ExampleState {
  value: string
  setValue: (value: string) => void
}

export const useExampleStore = create<ExampleState>((set) => ({
  value: '',
  setValue: (value) => set({ value }),
}))

// Usage in component
;('use client')
import { useExampleStore } from '@/store/example-store'

export function Component() {
  const { value, setValue } = useExampleStore()
  // ...
}
```

### 2. Server State (React Query)

**When to use:** API data, server-side data fetching

```tsx
// hooks/use-example.ts
'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useExample() {
  return useQuery({
    queryKey: ['example'],
    queryFn: async () => {
      const res = await fetch('/api/example')
      return res.json()
    },
  })
}

export function useUpdateExample() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Example) => {
      const res = await fetch('/api/example', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['example'] })
    },
  })
}
```

### 3. Local State (useState)

**When to use:** Component-specific state

```tsx
'use client'
import { useState } from 'react'

export function Component() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')

  return <input value={input} onChange={(e) => setInput(e.target.value)} />
}
```

---

## Internationalization Rules

### 1. Translation Keys

**File structure:**

```json
// messages/en.json
{
  "component": {
    "action": "Click here",
    "description": "This is a description"
  }
}
```

### 2. Component Usage

```tsx
'use client'
import { useTranslations } from 'next-intl'

export function Component() {
  const t = useTranslations('component')

  return (
    <div>
      <button>{t('action')}</button>
      <p>{t('description')}</p>
    </div>
  )
}
```

### 3. Translation Rules

- ✅ DO: Keep translations in feature namespaces
- ✅ DO: Use descriptive keys
- ❌ DON'T: Hardcode text in components
- ❌ DON'T: Use generic keys like `label1`, `text2`

---

## Form Handling Rules

### 1. Controlled Components

```tsx
'use client'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function Form() {
  const [value, setValue] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle submission
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Enter text..." />
      <Button type="submit">Submit</Button>
    </form>
  )
}
```

### 2. Form Validation

**Use Zod for schema validation:**

```tsx
import { z } from 'zod'

const formSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
})

type FormData = z.infer<typeof formSchema>

// Validate before submission
const handleSubmit = (data: FormData) => {
  const result = formSchema.safeParse(data)
  if (!result.success) {
    // Handle errors
    return
  }
  // Proceed with validated data
}
```

---

## Accessibility Rules

### 1. Keyboard Navigation

```tsx
// ✅ DO: Support keyboard events
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
>
  Clickable
</div>

// ✅ BETTER: Use semantic HTML
<button onClick={handleClick}>Clickable</button>
```

### 2. ARIA Labels

```tsx
// Icon-only buttons MUST have aria-label
<Button size="icon" aria-label="Delete item">
  <Trash className="h-4 w-4" />
</Button>

// Form inputs should have labels
<label htmlFor="email">Email</label>
<Input id="email" type="email" />
```

### 3. Focus Management

```tsx
// ✅ DO: Manage focus in dialogs
'use client'
import { useEffect, useRef } from 'react'
import { Dialog } from '@/components/ui/dialog'

export function MyDialog({ isOpen }: { isOpen: boolean }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus()
    }
  }, [isOpen])

  return <Dialog>...</Dialog>
}
```

---

## Performance Rules

### 1. Server vs Client Components

```tsx
// ✅ DO: Use Server Components by default
// app/page.tsx
export default async function Page() {
  const data = await fetchData()
  return <div>{data}</div>
}

// ✅ DO: Use 'use client' only when needed
// components/interactive.tsx
;('use client')
import { useState } from 'react'

export function Interactive() {
  const [state, setState] = useState(false)
  return <button onClick={() => setState(!state)}>Toggle</button>
}
```

### 2. Memoization

```tsx
'use client'
import { useMemo, useCallback } from 'react'

export function Component({ data }: { data: Item[] }) {
  // ✅ DO: Memoize expensive computations
  const sortedData = useMemo(() => {
    return data.sort((a, b) => a.value - b.value)
  }, [data])

  // ✅ DO: Memoize callbacks passed to children
  const handleClick = useCallback(() => {
    console.log('clicked')
  }, [])

  return <div onClick={handleClick}>...</div>
}
```

### 3. Dynamic Imports

```tsx
// ✅ DO: Lazy load heavy components
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('@/components/heavy'), {
  loading: () => <Skeleton />,
  ssr: false, // Client-only if needed
})
```

### 4. Image Optimization

```tsx
import Image from 'next/image'

// ✅ DO: Use Next.js Image component
<Image
  src="/logo.svg"
  alt="Logo"
  width={100}
  height={100}
  priority // For above-the-fold images
/>

// ❌ DON'T: Use <img> for local images
<img src="/logo.svg" alt="Logo" />
```

---

## API Route Rules

### 1. Route Handler Pattern

```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const data = await fetchData()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await createData(body)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 })
  }
}
```

### 2. Error Handling

```typescript
// ✅ DO: Return proper HTTP status codes
if (!authorized) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

if (!found) {
  return NextResponse.json({ error: 'Not Found' }, { status: 404 })
}

// ✅ DO: Validate input
const schema = z.object({
  name: z.string(),
})

const validation = schema.safeParse(body)
if (!validation.success) {
  return NextResponse.json({ error: validation.error }, { status: 400 })
}
```

---

## TypeScript Rules

### 1. Component Props

```typescript
// ✅ DO: Define explicit interfaces
interface ButtonProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  children: React.ReactNode
  onClick?: () => void
}

export function Button({ variant = 'default', ...props }: ButtonProps) {
  // ...
}

// ✅ DO: Extend HTML element types
interface InputProps extends React.ComponentProps<'input'> {
  label?: string
}
```

### 2. Type Inference

```typescript
// ✅ DO: Use type inference from Zod
const schema = z.object({
  name: z.string(),
  age: z.number(),
})

type User = z.infer<typeof schema>

// ✅ DO: Use ReturnType for derived types
async function fetchUser() {
  return { id: 1, name: 'John' }
}

type User = Awaited<ReturnType<typeof fetchUser>>
```

### 3. Avoid Any

```typescript
// ❌ DON'T: Use any
function process(data: any) {}

// ✅ DO: Use proper types or unknown
function process(data: unknown) {
  if (typeof data === 'string') {
    // TypeScript knows data is string here
  }
}
```

---

## File Organization Rules

### 1. Component Files

```
components/
  feature/
    feature-component.tsx    # Main component
    feature-list.tsx         # Related component
    feature-item.tsx         # Sub-component
    index.ts                 # Barrel export
```

### 2. Barrel Exports

```typescript
// components/chat/index.ts
export { ChatInput } from './chat-input'
export { ChatList } from './chat-list'
export { MessageList } from './message-list'

// Usage
import { ChatInput, ChatList } from '@/components/chat'
```

### 3. Hook Files

```
hooks/
  use-auth.ts              # Authentication hook
  use-chat.ts              # Chat functionality
  use-mobile.ts            # Responsive detection
```

---

## Testing Checklist

When creating/modifying components, verify:

- [ ] Component renders correctly
- [ ] Dark mode works
- [ ] Responsive on mobile, tablet, desktop
- [ ] Keyboard navigation works
- [ ] Screen reader accessible (ARIA labels)
- [ ] Loading states handled
- [ ] Error states handled
- [ ] TypeScript types are correct
- [ ] No console errors/warnings
- [ ] Translations added (if text present)
- [ ] Performance optimized (memoization if needed)

---

## Common Patterns

### Modal/Dialog

```tsx
'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function MyDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Title</DialogTitle>
        </DialogHeader>
        <div>Content</div>
      </DialogContent>
    </Dialog>
  )
}
```

### Dropdown Menu

```tsx
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

;<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost">Open</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={handleAction1}>Action 1</DropdownMenuItem>
    <DropdownMenuItem onClick={handleAction2}>Action 2</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Loading State

```tsx
import { Skeleton } from '@/components/ui/skeleton'

export function Component({ isLoading, data }: Props) {
  if (isLoading) {
    return <Skeleton className="h-40 w-full" />
  }

  return <div>{data}</div>
}
```

---

**Quick Command Reference:**

```bash
# Add shadcn component
npx shadcn@latest add [component]

# Run dev server
npm run dev

# Build
npm run build

# Lint
npm run lint

# Format
npm run prettier

# Database
npx prisma migrate dev
npx prisma generate
npx prisma studio
```

---

**Last Updated:** 2025-01-19
