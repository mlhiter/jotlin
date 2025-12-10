# Jotlin Design System

> Modern minimalist design system inspired by v0.dev and Vercel

**Design Philosophy**: Less is more, details define quality

---

## Core Design Principles

### 1. Minimalism
- Remove all unnecessary decorative elements
- Every element has a clear functional purpose
- Avoid over-design and visual noise

### 2. Refinement
- Use delicate borders (40% opacity)
- Subtle backgrounds (20% opacity)
- Precise sizing and spacing system

### 3. Clear Hierarchy
- Establish visual hierarchy through size, color, and spacing
- Emphasize important elements, restrain secondary ones
- Avoid equal emphasis on everything

### 4. Smooth Transitions
- Fast transitions of 150-200ms
- Avoid lengthy animations (>300ms)
- Use ease-in-out easing function

---

## Color System

### Borders
```css
/* Primary border - 40% opacity, more delicate */
border-border/40

/* Standard border - for clear separation */
border-border
```

### Backgrounds
```css
/* Subtle background - 20% opacity */
bg-muted/20

/* Secondary background - 40% opacity */
bg-muted/40

/* Card background */
bg-card

/* Accent background - 80% opacity */
bg-accent/80

/* Hover background - 40% opacity */
hover:bg-accent/40
```

### Text Colors
```css
/* Primary text */
text-foreground

/* Secondary text - 70% opacity */
text-muted-foreground/70

/* Placeholder text - 60% opacity */
text-muted-foreground/60
```

### Status Colors
```css
/* Success/Ready - green */
bg-green-500/80
text-green-700 dark:text-green-400

/* Warning/In-progress - amber */
bg-amber-400/80
```

---

## Typography System

### Font Sizes
```css
/* Tiny - labels, auxiliary info */
text-[10px]      /* 10px - uppercase labels */

/* Small - buttons, menu items */
text-xs          /* 12px */

/* Standard - list items, inputs */
text-[13px]      /* 13px - preferred for list items */
text-sm          /* 14px */

/* Medium - headings */
text-base        /* 16px */
```

### Font Weights
```css
/* Medium - most text */
font-medium      /* 500 */

/* Semi-bold - emphasized text */
font-semibold    /* 600 */
```

### Icon Stroke Width
```tsx
/* All icons use unified stroke width */
<Icon strokeWidth={1.5} />
```

---

## Spacing System

### Padding
```css
/* Compact - small widgets */
px-2 py-2        /* 8px */
px-2 py-2.5      /* 8px 10px */

/* Standard - most components */
px-4 py-2        /* 16px 8px */
px-5 py-2.5      /* 20px 10px */

/* Relaxed - content areas */
px-6 py-3        /* 24px 12px */
px-6 py-8        /* 24px 32px - document content */
```

### Gaps
```css
/* Compact */
gap-0.5          /* 2px - menu items */
gap-1            /* 4px - button groups */

/* Standard */
gap-1.5          /* 6px - icon and text */
gap-2            /* 8px */
gap-2.5          /* 10px - element spacing */

/* Relaxed */
gap-3            /* 12px */
```

### Vertical Spacing
```css
/* List item spacing */
space-y-0.5      /* 2px - compact list */
space-y-1        /* 4px - standard list */
```

---

## Size System

### Button Sizes
```css
/* Small button - toolbar */
h-7 w-7          /* 28px - icon button */
h-8              /* 32px - text button */

/* Standard button */
h-9              /* 36px */

/* Large button */
h-10             /* 40px */
```

### Icon Sizes
```css
/* Small icon - with h-7 button */
h-3.5 w-3.5      /* 14px */

/* Standard icon */
h-4 w-4          /* 16px */

/* Medium icon */
h-5 w-5          /* 20px */
```

### Border Radius
```css
/* Small - button inner elements */
rounded-sm       /* 4px */

/* Standard - buttons, card elements */
rounded-md       /* 6px */

/* Large - cards, panels */
rounded-lg       /* 8px */

/* Full - status dots, avatars */
rounded-full
```

---

## Component Specifications

### Navigation Item

**Size Specs:**
```tsx
<button className="
  h-auto          // Auto height
  px-2 py-2       // 8px padding
  gap-2.5         // 10px icon-text gap
  text-[13px]     // 13px font
  font-medium     // 500 weight
">
  <Icon className="h-4 w-4" strokeWidth={1.5} />
  <span>Item Label</span>
</button>
```

**State Styles:**
```tsx
// Default state
className="text-muted-foreground hover:bg-accent/40 hover:text-foreground"

// Active state
className="bg-accent/80 text-foreground"

// Active indicator
<div className="absolute left-0 top-0 h-full w-0.5 rounded-r-full bg-foreground" />
```

**Complete Example:**
```tsx
<button
  className={`
    group relative flex w-full items-center rounded-md
    gap-2.5 px-2 py-2 text-left
    text-[13px] font-medium
    transition-all duration-150
    ${
      isActive
        ? 'bg-accent/80 text-foreground'
        : 'text-muted-foreground hover:bg-accent/40 hover:text-foreground'
    }
  `}>
  <Icon className="h-4 w-4" strokeWidth={1.5} />
  <span className="truncate">{label}</span>
  <StatusDot />
  {isActive && (
    <div className="absolute left-0 top-0 h-full w-0.5 rounded-r-full bg-foreground" />
  )}
</button>
```

### Tabs

**TabsList Container:**
```tsx
<TabsList className="
  h-8                    // 32px height
  gap-1                  // 4px gap
  rounded-md             // 6px radius
  bg-muted/40            // 40% background
  p-0.5                  // 2px padding
">
```

**TabsTrigger:**
```tsx
<TabsTrigger className="
  h-7                    // 28px height
  gap-1.5                // 6px icon-text gap
  rounded-sm             // 4px radius
  px-2.5                 // 10px horizontal padding
  text-xs                // 12px font
  font-medium            // 500 weight
  data-[state=active]:bg-background
  data-[state=active]:shadow-sm
">
  <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
  Tab Label
</TabsTrigger>
```

### Toolbar Button

**Small Button Group:**
```tsx
<div className="flex items-center gap-1">
  <Button
    size="icon"
    variant="ghost"
    className="h-7 w-7"
    title="Action">
    <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
  </Button>
</div>
```

### Status Indicator

**Dot Style:**
```tsx
// Ready state - green
<div className="h-1 w-1 shrink-0 rounded-full bg-green-500/80" />

// In-progress - amber + pulse
<div className="h-1 w-1 shrink-0 rounded-full bg-amber-400/80 animate-pulse" />
```

**Badge Style:**
```tsx
<div className="flex items-center gap-1 rounded-full bg-green-500/10 px-1.5 py-0.5">
  <div className="h-1 w-1 rounded-full bg-green-500" />
  <span className="text-[10px] font-medium text-green-700 dark:text-green-400">
    Ready
  </span>
</div>
```

### Collapse Button

**Small Collapse Button:**
```tsx
<button className="
  flex h-5 w-5 items-center justify-center
  rounded-md
  border border-border/60
  bg-background/95
  shadow-sm backdrop-blur-sm
  transition-all
  hover:border-border
  hover:bg-accent
  hover:shadow
">
  <ChevronsLeft className="h-3 w-3 text-muted-foreground/70" />
</button>
```

### Floating Toolbar

**Hover-Revealed Toolbar:**
```tsx
<div className="group relative">
  {/* Toolbar - hidden by default, shown on hover */}
  <div className="
    absolute right-2 top-2 z-10
    flex gap-0.5
    opacity-0 group-hover:opacity-100
    transition-opacity duration-200
  ">
    <Button className="
      h-7 w-7 rounded-md
      border border-border/40
      bg-background/80 backdrop-blur-sm
      hover:bg-accent
    ">
      <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
    </Button>
  </div>

  {/* Content area */}
  <div className="...">
    Content
  </div>
</div>
```

### Content Container

**Document/Chart Container:**
```tsx
<div className="
  min-h-[500px]
  overflow-auto
  rounded-lg
  border border-border/40
  bg-muted/20
  p-8
  transition-all duration-200
">
  {content}
</div>
```

---

## Animation & Transitions

### Transition Duration
```css
/* Fast - buttons, hover states */
duration-150     /* 150ms - recommended for most interactions */

/* Standard - content switching */
duration-200     /* 200ms */

/* Smooth - layout changes */
duration-300     /* 300ms - collapse/expand */
```

### Easing Functions
```css
/* Standard - default use */
transition-all   /* implicit ease-in-out */

/* Linear - special cases */
transition-opacity /* opacity changes */
```

### Fade-in Animation
```tsx
<div className="
  animate-in fade-in
  slide-in-from-bottom-2
  duration-300
">
```

### Animation Delay
```tsx
{items.map((item, index) => (
  <div
    key={item.id}
    style={{ animationDelay: `${index * 30}ms` }}
  >
    {item.content}
  </div>
))}
```

---

## Layout Patterns

### Two-Column Layout

**Sidebar + Content:**
```tsx
<div className="flex h-full overflow-hidden">
  {/* Sidebar */}
  <div className={`
    relative flex shrink-0 flex-col
    border-r border-border/40
    transition-all duration-300
    ${isCollapsed ? 'w-14' : 'w-48'}
  `}>
    {/* Sidebar content */}
  </div>

  {/* Content area */}
  <div className="flex flex-1 flex-col overflow-hidden">
    {/* Header */}
    <div className="flex items-center justify-between border-b border-border/40 px-5 py-2.5">
      {/* Header content */}
    </div>

    {/* Scrollable content */}
    <div className="relative flex-1 overflow-hidden bg-background">
      <ScrollArea className="h-full">
        <div className="px-6 py-8">
          {/* Main content */}
        </div>
      </ScrollArea>
    </div>
  </div>
</div>
```

### Header Toolbar

```tsx
<div className="flex items-center justify-between border-b border-border/40 px-4 py-2">
  {/* Left - main controls */}
  <div className="flex items-center gap-2">
    <TabsList>...</TabsList>
  </div>

  {/* Right - action buttons */}
  <div className="flex items-center gap-1">
    <Button size="icon" variant="ghost" className="h-7 w-7">
      <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
    </Button>
  </div>
</div>
```

---

## Best Practices

### ✅ DO - Recommended

1. **Use unified sizing system**
   ```tsx
   // ✅ Good - use design system defined sizes
   <Button className="h-7 w-7">
     <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
   </Button>
   ```

2. **Borders with 40% opacity**
   ```tsx
   // ✅ Good - delicate borders
   className="border border-border/40"
   ```

3. **Backgrounds with 20-40% opacity**
   ```tsx
   // ✅ Good - subtle backgrounds
   className="bg-muted/20"
   className="bg-accent/40"
   ```

4. **Icons with unified strokeWidth**
   ```tsx
   // ✅ Good - consistent stroke width
   <Icon strokeWidth={1.5} />
   ```

5. **Fast transitions (150-200ms)**
   ```tsx
   // ✅ Good - fast response
   className="transition-all duration-150"
   ```

6. **Precise font sizes**
   ```tsx
   // ✅ Good - use precise values
   className="text-[13px]"  // list items
   className="text-[10px]"  // labels
   ```

### ❌ DON'T - Avoid

1. **Avoid over-decoration**
   ```tsx
   // ❌ Bad - too many shadows and glows
   className="shadow-lg ring-2 ring-primary/50 shadow-[0_0_20px_rgba(var(--primary),0.5)]"

   // ✅ Good - clean
   className="border border-border/40"
   ```

2. **Avoid large icon backgrounds**
   ```tsx
   // ❌ Bad - large icon block
   <div className="h-9 w-9 rounded-lg bg-primary/10 ring-1 ring-primary/20">
     <Icon className="h-5 w-5" />
   </div>

   // ✅ Good - simple icon
   <Icon className="h-4 w-4" strokeWidth={1.5} />
   ```

3. **Avoid complex gradients**
   ```tsx
   // ❌ Bad - complex gradient
   className="bg-gradient-to-br from-card via-card/95 to-muted/30"

   // ✅ Good - simple background
   className="bg-muted/20"
   ```

4. **Avoid lengthy animations**
   ```tsx
   // ❌ Bad - too slow
   className="transition-all duration-500"

   // ✅ Good - fast response
   className="transition-all duration-150"
   ```

5. **Avoid inconsistent border radius**
   ```tsx
   // ❌ Bad - random radius
   className="rounded-[12px]"

   // ✅ Good - system radius
   className="rounded-lg"  // 8px
   className="rounded-md"  // 6px
   ```

6. **Avoid excessive spacing**
   ```tsx
   // ❌ Bad - wastes space
   className="px-8 py-6"

   // ✅ Good - compact and efficient
   className="px-4 py-2"
   ```

---

## Code Review Checklist

When implementing new components, check:

- [ ] Borders use `border-border/40` (40% opacity)
- [ ] Backgrounds use `bg-muted/20` or `bg-muted/40` (20-40% opacity)
- [ ] Button sizes are `h-7 w-7` (toolbar) or `h-8` (standard)
- [ ] Icon sizes are `h-3.5 w-3.5` (small) or `h-4 w-4` (standard)
- [ ] Icon strokeWidth is `1.5`
- [ ] Transition duration is `duration-150` or `duration-200`
- [ ] Border radius uses `rounded-sm/md/lg`
- [ ] Spacing uses `gap-1` / `gap-1.5` / `gap-2.5`
- [ ] Font sizes use `text-[13px]` / `text-xs` / `text-sm`
- [ ] Removed unnecessary shadows, glows, gradient effects

---

## Reference Cases

### Draft Panel

Complete implementation: `/components/chat/draft-panel.tsx`

**Design Highlights:**
- Minimalist sidebar navigation (w-48 expanded, w-14 collapsed)
- Refined Tabs (h-8 TabsList, h-7 TabsTrigger)
- Clean header toolbar (h-7 tool buttons)
- Delicate borders (border-border/40)
- Unified icon sizes (3.5x3.5 + strokeWidth 1.5)

### Mermaid Chart

Complete implementation: `/components/chat/mermaid-chart.tsx`

**Design Highlights:**
- Hover-revealed floating toolbar
- Simple container style (border-border/40 + bg-muted/20)
- Unified button sizes (h-7 w-7)

---

## Design Tools

### Figma Plugins
- **Tailwind CSS Inspector** - Inspect Tailwind classes
- **Design Lint** - Check design consistency

### Chrome Extensions
- **PerfectPixel** - Pixel-perfect comparison
- **Dimensions** - Measure dimensions

### Online Tools
- [v0.dev](https://v0.dev) - AI-generated UI
- [Tailwind Play](https://play.tailwindcss.com) - Online debugging

---

## Version History

- **v1.0.0** (2025-01-26) - Initial version based on draft-panel redesign experience

---

**Maintainers**: Jotlin Team
**Last Updated**: 2025-01-26

---

> "The details are not the details. They make the design." - Charles Eames
