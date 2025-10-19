# Quick Reference - Jotlin Design System

Ultra-fast reference for common patterns and commands.

## 🎨 Color Tokens

```tsx
// Backgrounds
bg - background // Main background
bg - card // Card background
bg - popover // Popover background
bg - muted // Muted background

// Text
text - foreground // Primary text
text - muted - foreground // Secondary text
text - primary // Brand text
text - destructive // Error text

// Borders & Inputs
border - border // Default border
bg - input // Input background
ring - ring // Focus ring
```

## 📐 Spacing Scale

```tsx
gap - 1 // 4px    |  p-1   // 4px
gap - 2 // 8px    |  p-2   // 8px
gap - 3 // 12px   |  p-3   // 12px
gap - 4 // 16px   |  p-4   // 16px ← Common
gap - 6 // 24px   |  p-6   // 24px ← Common
gap - 8 // 32px   |  p-8   // 32px
```

## 📝 Typography

```tsx
text-xs    // 12px
text-sm    // 14px ← Body default
text-base  // 16px
text-lg    // 18px
text-xl    // 20px ← Heading 4
text-2xl   // 24px ← Heading 3
text-3xl   // 30px ← Heading 2
text-4xl   // 36px ← Heading 1

font-normal   // 400
font-medium   // 500
font-semibold // 600 ← Headings
```

## 🎭 Component Variants

### Button

```tsx
<Button variant="default" size="default">
<Button variant="destructive" size="sm">
<Button variant="outline" size="lg">
<Button variant="secondary" size="icon">
<Button variant="ghost">
<Button variant="link">
```

### Common Patterns

```tsx
// Icon Button
<Button variant="ghost" size="icon" aria-label="Delete">
  <Trash className="h-4 w-4" />
</Button>

// Button with Icon
<Button>
  <Plus className="h-4 w-4" />
  Add Item
</Button>

// Loading Button
<Button disabled={isLoading}>
  {isLoading ? 'Loading...' : 'Submit'}
</Button>
```

## 🔧 Utility Functions

```tsx
import { cn } from '@/lib/utils'

// Merge classes
;<div className={cn('base-class', condition && 'conditional-class', className)} />
```

## 📱 Responsive Breakpoints

```tsx
// Mobile-first
className="
  w-full        // All sizes
  md:w-1/2      // ≥768px
  lg:w-1/3      // ≥1024px
  xl:w-1/4      // ≥1280px
  2xl:w-1/5     // ≥1536px
"
```

## 🌓 Dark Mode

```tsx
// Always include dark mode variants
<div className="bg-white dark:bg-black" />
<div className="text-gray-900 dark:text-gray-100" />

// Or use semantic tokens (preferred)
<div className="bg-background text-foreground" />
```

## 🎯 Icon Sizes

```tsx
h-3 w-3  // 12px - Small
h-4 w-4  // 16px - Default
h-5 w-5  // 20px - Medium
h-6 w-6  // 24px - Large
```

## 🔄 State Modifiers

```tsx
hover:bg-accent
focus-visible:ring-2
active:scale-95
disabled:opacity-50
disabled:pointer-events-none
aria-invalid:border-destructive
```

## 📦 Import Paths

```tsx
import { Component } from '@/components/ui/component'
import { useHook } from '@/hooks/use-hook'
import { utility } from '@/lib/utility'
import { useTranslations } from 'next-intl'
```

## 🎬 Animations

```tsx
transition-all duration-200
transition-colors duration-150
transition-opacity duration-300

animate-in fade-in
animate-out fade-out
```

## 📋 Common Layouts

### Flex Row

```tsx
<div className="flex flex-row items-center justify-between gap-4 p-4">
```

### Flex Column

```tsx
<div className="flex flex-col gap-6 p-6">
```

### Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

### Center Content

```tsx
<div className="flex items-center justify-center min-h-screen">
```

### Max Width Container

```tsx
<div className="mx-auto max-w-3xl px-4">
```

## 🎨 Common Component Compositions

### Card

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

;<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

### Dialog

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

;<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    <div>Content</div>
  </DialogContent>
</Dialog>
```

### Form Field

```tsx
<div className="flex flex-col gap-1.5">
  <label htmlFor="field" className="text-sm font-medium">
    Label
  </label>
  <Input id="field" placeholder="Enter..." />
  {error && <p className="text-destructive text-sm">{error}</p>}
</div>
```

## ⌨️ Commands

```bash
# Add component
npx shadcn@latest add button

# Dev
npm run dev

# Build
npm run build

# Database
npx prisma migrate dev
npx prisma generate
npx prisma studio

# Format
npm run prettier
```

## ✅ Quick Checklist

Component Creation:

- [ ] Check shadcn/ui first
- [ ] Use `cn()` for classes
- [ ] Add dark mode support
- [ ] Include TypeScript types
- [ ] Add responsive classes
- [ ] Handle loading/error states
- [ ] Add accessibility attrs
- [ ] Test keyboard nav

---

**Pro Tips:**

1. **Always use semantic color tokens** - `bg-background` not `bg-gray-50`
2. **Mobile-first** - Base styles for mobile, then `md:`, `lg:`, etc.
3. **Compose, don't create** - Use existing components when possible
4. **Type everything** - No `any` types
5. **i18n all text** - Use `useTranslations()` for all user-facing text
6. **Server by default** - Only use `'use client'` when needed
