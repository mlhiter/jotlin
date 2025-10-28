# Figma to Code Integration Guide

This guide helps AI assistants and developers translate Figma designs into code following the Jotlin design system.

## Pre-Integration Checklist

Before starting Figma design integration:

- [ ] Review the main design system docs (`CLAUDE.md`)
- [ ] Identify reusable components in `/components/ui/`
- [ ] Check if similar patterns exist in the codebase
- [ ] Verify design tokens match existing system
- [ ] Confirm responsive breakpoints align with Tailwind
- [ ] Review accessibility requirements

---

## Design Token Mapping

### Colors from Figma → CSS Variables

When you see colors in Figma, map them to existing tokens:

| Figma Color Naming | CSS Variable    | Tailwind Class    |
| ------------------ | --------------- | ----------------- |
| Background/Canvas  | `--background`  | `bg-background`   |
| Text/Primary       | `--foreground`  | `text-foreground` |
| Primary/Brand      | `--primary`     | `bg-primary`      |
| Secondary          | `--secondary`   | `bg-secondary`    |
| Muted/Subtle       | `--muted`       | `bg-muted`        |
| Accent/Highlight   | `--accent`      | `bg-accent`       |
| Border/Stroke      | `--border`      | `border-border`   |
| Destructive/Error  | `--destructive` | `bg-destructive`  |
| Input/Field        | `--input`       | `bg-input`        |

**Example Conversion:**

```
Figma: Fill = #FAFAFA (Light) / #252525 (Dark)
  ↓
Code: className="bg-background"
```

### Typography Mapping

| Figma Style | Font       | Size | Weight | Tailwind Classes          |
| ----------- | ---------- | ---- | ------ | ------------------------- |
| Heading 1   | Geist Sans | 36px | 600    | `text-4xl font-semibold`  |
| Heading 2   | Geist Sans | 30px | 600    | `text-3xl font-semibold`  |
| Heading 3   | Geist Sans | 24px | 600    | `text-2xl font-semibold`  |
| Heading 4   | Geist Sans | 20px | 600    | `text-xl font-semibold`   |
| Body Large  | Geist Sans | 16px | 400    | `text-base font-normal`   |
| Body        | Geist Sans | 14px | 400    | `text-sm font-normal`     |
| Body Small  | Geist Sans | 12px | 400    | `text-xs font-normal`     |
| Caption     | Geist Sans | 11px | 400    | `text-[11px] font-normal` |
| Code        | Geist Mono | 14px | 400    | `font-mono text-sm`       |

### Spacing Scale

Figma spacing → Tailwind spacing:

| Figma | Pixels | Tailwind | rem      |
| ----- | ------ | -------- | -------- |
| XXS   | 2px    | `0.5`    | 0.125rem |
| XS    | 4px    | `1`      | 0.25rem  |
| S     | 8px    | `2`      | 0.5rem   |
| M     | 12px   | `3`      | 0.75rem  |
| L     | 16px   | `4`      | 1rem     |
| XL    | 24px   | `6`      | 1.5rem   |
| 2XL   | 32px   | `8`      | 2rem     |
| 3XL   | 48px   | `12`     | 3rem     |
| 4XL   | 64px   | `16`     | 4rem     |

**Usage:**

```tsx
// Padding
<div className="p-4">     // 16px all sides
<div className="px-6 py-4">  // 24px horizontal, 16px vertical

// Gap
<div className="flex gap-2">  // 8px gap
<div className="grid gap-6">  // 24px gap

// Margin
<div className="mt-6 mb-4">  // 24px top, 16px bottom
```

### Border Radius

| Figma Radius | CSS Variable  | Tailwind       | Pixels |
| ------------ | ------------- | -------------- | ------ |
| None         | -             | `rounded-none` | 0px    |
| Small        | `--radius-sm` | `rounded-sm`   | 6px    |
| Medium       | `--radius-md` | `rounded-md`   | 8px    |
| Default      | `--radius-lg` | `rounded-lg`   | 10px   |
| Large        | `--radius-xl` | `rounded-xl`   | 14px   |
| Full         | -             | `rounded-full` | 9999px |

### Shadows

Map Figma shadows to Tailwind utilities:

| Figma Shadow | Tailwind Class |
| ------------ | -------------- |
| Small/Subtle | `shadow-sm`    |
| Default      | `shadow`       |
| Medium       | `shadow-md`    |
| Large        | `shadow-lg`    |
| Extra Large  | `shadow-xl`    |
| 2XL          | `shadow-2xl`   |

**Custom shadows in Figma:**

- If using custom shadows, document them as new CSS variables
- Prefer existing shadow tokens when possible

---

## Component Identification

### Step 1: Identify Component Type

Ask yourself:

1. **Is this a primitive component?**
   - Button, Input, Card, Dialog, etc.
   - ✅ Use existing shadcn/ui components
   - Check `/components/ui/` first

2. **Is this a compound component?**
   - Multiple primitives combined (e.g., SearchBar = Input + Button)
   - ✅ Compose from existing primitives

3. **Is this a feature-specific component?**
   - Unique to a feature (e.g., ChatMessage, FeedbackCard)
   - ✅ Create in `/components/[feature-name]/`

### Step 2: Component Breakdown

Break complex designs into smaller parts:

```
[Figma Frame: User Profile Card]
  ↓
Components:
  - Card (shadcn/ui)
    - CardHeader
      - Avatar (shadcn/ui)
      - CardTitle
      - CardDescription
    - CardContent
      - Custom profile fields
    - CardFooter
      - Button (shadcn/ui) × 2
```

### Step 3: Variants Analysis

Identify all component states/variants in Figma:

**Example: Button variants**

```
States in Figma:
- Default
- Hover
- Active/Pressed
- Disabled
- Loading

Variants in Figma:
- Primary
- Secondary
- Outline
- Ghost
- Destructive

Sizes in Figma:
- Small
- Medium (Default)
- Large
- Icon-only
```

Map to CVA implementation:

```tsx
const buttonVariants = cva('base-classes', {
  variants: {
    variant: {
      default: '...',
      secondary: '...',
      outline: '...',
      ghost: '...',
      destructive: '...',
    },
    size: {
      sm: '...',
      default: '...',
      lg: '...',
      icon: '...',
    },
  },
})
```

---

## Layout Translation

### Auto Layout → Flexbox/Grid

**Figma Auto Layout settings:**

| Figma Property         | CSS Equivalent              |
| ---------------------- | --------------------------- |
| Horizontal             | `flex-row`                  |
| Vertical               | `flex-col`                  |
| Spacing                | `gap-{n}`                   |
| Padding                | `p-{n}`, `px-{n}`, `py-{n}` |
| Align items: Start     | `items-start`               |
| Align items: Center    | `items-center`              |
| Align items: End       | `items-end`                 |
| Justify: Start         | `justify-start`             |
| Justify: Center        | `justify-center`            |
| Justify: End           | `justify-end`               |
| Justify: Space Between | `justify-between`           |
| Fill container         | `flex-1`                    |
| Hug contents           | `w-auto`                    |

**Example Translation:**

```
Figma Auto Layout:
- Direction: Horizontal
- Spacing: 8px
- Padding: 16px
- Align: Center
- Justify: Space Between

↓

<div className="flex flex-row gap-2 p-4 items-center justify-between">
  {/* content */}
</div>
```

### Grid Layout

```
Figma Grid:
- Columns: 12
- Gutter: 24px
- Margin: 16px

↓

<div className="grid grid-cols-12 gap-6 px-4">
  <div className="col-span-12 md:col-span-6 lg:col-span-4">...</div>
</div>
```

### Responsive Behavior

Map Figma breakpoints to Tailwind:

| Device        | Figma Frame    | Tailwind Prefix | Min Width |
| ------------- | -------------- | --------------- | --------- |
| Mobile        | 375px - 767px  | (default)       | -         |
| Tablet        | 768px - 1023px | `md:`           | 768px     |
| Desktop       | 1024px+        | `lg:`           | 1024px    |
| Large Desktop | 1280px+        | `xl:`           | 1280px    |
| X-Large       | 1536px+        | `2xl:`          | 1536px    |

**Example:**

```tsx
<div className="
  flex flex-col        // Mobile: vertical stack
  md:flex-row          // Tablet+: horizontal
  gap-4 md:gap-6       // Mobile: 16px, Tablet+: 24px
  p-4 md:p-6 lg:p-8    // Responsive padding
">
```

---

## Interactive States

### Hover, Focus, Active States

Figma often shows states as separate frames. Implement with Tailwind state modifiers:

```tsx
<Button className="
  bg-primary                    // Default
  hover:bg-primary/90           // Hover
  active:bg-primary/80          // Active/Pressed
  focus-visible:ring-2          // Focus
  focus-visible:ring-ring       // Focus ring color
  disabled:opacity-50           // Disabled
  disabled:pointer-events-none  // Disabled (no clicks)
">
```

### Transitions

```tsx
<div className="
  transition-all        // Smooth all properties
  duration-200          // 200ms (default)
  ease-in-out           // Easing
">
```

Common transitions:

- `transition-colors` - Only colors
- `transition-opacity` - Only opacity
- `transition-transform` - Only transforms
- `transition-all` - All properties

---

## Assets & Icons

### Icon Extraction

1. **Check Lucide React first**: https://lucide.dev/icons
   - Most common icons already available
   - Import: `import { IconName } from 'lucide-react'`

2. **Export from Figma as SVG** (if custom):
   - Optimize SVG using SVGO
   - Create React component or add to `/public/`

3. **Icon sizing reference:**
   ```tsx
   <Icon className="h-3 w-3" />  // 12px - small
   <Icon className="h-4 w-4" />  // 16px - default
   <Icon className="h-5 w-5" />  // 20px - medium
   <Icon className="h-6 w-6" />  // 24px - large
   ```

### Image Assets

1. **Export from Figma:**
   - PNG: Use 2x resolution for retina displays
   - SVG: For logos, icons, illustrations
   - WebP: For photos (better compression)

2. **File placement:**
   - Static images → `/public/`
   - Component-specific → colocate with component

3. **Usage:**

   ```tsx
   import Image from 'next/image'
   ;<Image src="/path/to/image.png" alt="Descriptive text" width={300} height={200} priority={isAboveFold} />
   ```

---

## Accessibility Implementation

### From Figma to A11y Code

| Figma Element      | Accessibility Requirement                 |
| ------------------ | ----------------------------------------- |
| Icon-only button   | Add `aria-label`                          |
| Form input         | Add `<label>` with `htmlFor`              |
| Custom interactive | Add `role`, `tabIndex`, keyboard handlers |
| Modal/Dialog       | Add `aria-modal`, focus trap              |
| List of items      | Use semantic `<ul>/<li>` or `role="list"` |
| Headings           | Use proper `<h1>`-`<h6>` hierarchy        |

**Example:**

```tsx
// Figma: Icon button with tooltip "Delete"
<Button size="icon" variant="ghost" aria-label="Delete item" onClick={handleDelete}>
  <Trash className="h-4 w-4" />
</Button>
```

### Keyboard Navigation

Ensure all interactive elements are keyboard accessible:

```tsx
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }}>
  Interactive element
</div>
```

---

## Animation & Motion

### Identifying Animations in Figma

Common Figma interactions → CSS/Tailwind:

| Figma Interaction | Implementation                      |
| ----------------- | ----------------------------------- |
| Fade In           | `animate-in fade-in`                |
| Fade Out          | `animate-out fade-out`              |
| Slide In          | `animate-in slide-in-from-bottom-4` |
| Scale             | `animate-in zoom-in-95`             |
| Dissolve          | `transition-opacity duration-300`   |

**Using tw-animate-css:**

```tsx
<div className="animate-fadeIn animate-duration-300">Fades in over 300ms</div>
```

**Custom animations:**

```css
@keyframes customAnimation {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.custom-animate {
  animation: customAnimation 200ms ease-out;
}
```

---

## Implementation Workflow

### Step-by-Step Process

**1. Analysis Phase**

```
□ Open Figma design
□ Identify all components and their variants
□ Map colors to existing tokens
□ Note spacing, typography, borders
□ Document responsive behavior
□ List required icons
```

**2. Component Planning**

```
□ Check if shadcn/ui component exists
□ Plan component composition
□ Define TypeScript interfaces
□ Plan variants with CVA
□ Identify state management needs
```

**3. Implementation**

```
□ Create/use base components
□ Apply Tailwind classes following design
□ Add responsive breakpoints
□ Implement dark mode
□ Add interactive states
□ Handle loading/error states
```

**4. Refinement**

```
□ Add TypeScript types
□ Implement accessibility
□ Add i18n translations
□ Optimize performance
□ Test responsive behavior
□ Test dark mode
□ Test keyboard navigation
```

**5. Documentation**

```
□ Add JSDoc comments
□ Document props
□ Add usage examples (if complex)
```

---

## Common Patterns & Examples

### Pattern 1: Card with Actions

**Figma Design:**

```
Card
├─ Header
│  ├─ Icon
│  ├─ Title
│  └─ Subtitle
├─ Content
│  └─ Description
└─ Footer
   ├─ Secondary Button
   └─ Primary Button
```

**Code Implementation:**

```tsx
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icon } from 'lucide-react'

export function ActionCard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-4">
          <Icon className="text-muted-foreground h-5 w-5" />
          <div>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Subtitle text</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">Card description content here.</p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button>Confirm</Button>
      </CardFooter>
    </Card>
  )
}
```

### Pattern 2: Form with Validation

**Figma Design:**

```
Form
├─ Label + Input (Email)
├─ Label + Input (Password)
├─ Error message
└─ Submit Button
```

**Code Implementation:**

```tsx
'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { z } from 'zod'

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const result = formSchema.safeParse({ email, password })
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0].toString()] = issue.message
        }
      })
      setErrors(fieldErrors)
      return
    }

    // Submit form
    setErrors({})
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!errors.email}
          className={errors.email ? 'border-destructive' : ''}
        />
        {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={!!errors.password}
          className={errors.password ? 'border-destructive' : ''}
        />
        {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}
      </div>

      <Button type="submit" className="mt-2">
        Sign In
      </Button>
    </form>
  )
}
```

### Pattern 3: List with Empty State

**Code Implementation:**

```tsx
import { ScrollArea } from '@/components/ui/scroll-area'

interface Item {
  id: string
  title: string
}

export function ItemList({ items }: { items: Item[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <EmptyIcon className="text-muted-foreground mb-4 h-12 w-12" />
        <h3 className="text-lg font-semibold">No items yet</h3>
        <p className="text-muted-foreground mt-1 text-sm">Get started by creating your first item.</p>
        <Button className="mt-4">Create Item</Button>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="flex flex-col gap-2 p-4">
        {items.map((item) => (
          <div key={item.id} className="hover:bg-accent flex items-center justify-between rounded-lg border p-4">
            <span>{item.title}</span>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
```

---

## Troubleshooting

### Common Issues

**1. Colors don't match exactly**

- ✅ Use semantic tokens instead of exact hex values
- ✅ Ensure dark mode variants are considered
- ❌ Don't hardcode hex values from Figma

**2. Spacing feels off**

- ✅ Round to nearest Tailwind spacing value
- ✅ Check if Figma has inconsistent spacing
- ✅ Use optical spacing for visual balance

**3. Fonts look different**

- ✅ Verify Geist fonts are loaded
- ✅ Check font-feature-settings are applied
- ✅ Ensure antialiasing is enabled

**4. Component doesn't exist in shadcn/ui**

- ✅ Compose from existing primitives
- ✅ Create custom component following patterns
- ✅ Consider if it should be added to `/components/ui/`

**5. Animation not smooth**

- ✅ Add `transition-*` classes
- ✅ Use appropriate duration (200ms-300ms default)
- ✅ Consider `will-change` for performance

---

## Quality Checklist

Before marking Figma implementation complete:

### Visual Accuracy

- [ ] Colors match (accounting for light/dark modes)
- [ ] Spacing matches Figma spec
- [ ] Typography matches (font, size, weight)
- [ ] Border radius matches
- [ ] Shadows match

### Responsiveness

- [ ] Mobile layout works (< 768px)
- [ ] Tablet layout works (768px - 1023px)
- [ ] Desktop layout works (>= 1024px)
- [ ] Text wrapping handled properly
- [ ] Images scale appropriately

### Interactivity

- [ ] All hover states implemented
- [ ] Focus states visible
- [ ] Active/pressed states work
- [ ] Loading states handled
- [ ] Error states handled
- [ ] Empty states handled

### Accessibility

- [ ] Keyboard navigation works
- [ ] Screen reader labels present
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible
- [ ] ARIA attributes correct

### Code Quality

- [ ] TypeScript types defined
- [ ] Components properly structured
- [ ] No hardcoded strings (i18n)
- [ ] Follows naming conventions
- [ ] Proper error handling
- [ ] Performance optimized

### Testing

- [ ] Component renders without errors
- [ ] No console warnings
- [ ] Works in light and dark mode
- [ ] Tested on different screen sizes
- [ ] Tested keyboard navigation

---

**Quick Command:**

```bash
# Install shadcn component before starting
npx shadcn@latest add [component-name]
```

**Last Updated:** 2025-01-19
