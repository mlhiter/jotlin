# Cursor Rules Documentation

This directory contains comprehensive design system documentation and rules for AI-assisted development in the Jotlin project.

## 📚 Documentation Structure

### 1. [`design_system.md`](./design_system.md)

**Purpose**: Comprehensive design system rules and patterns
**For**: Detailed implementation guidance, best practices, and coding standards

**Contents:**

- Component creation patterns
- Styling rules with Tailwind CSS
- State management (Zustand, React Query)
- Internationalization (i18n)
- Form handling and validation
- Accessibility guidelines
- Performance optimization
- API route patterns
- TypeScript conventions

**When to use**: When implementing features, creating new components, or need detailed technical guidance.

---

### 2. [`figma_integration.md`](./figma_integration.md)

**Purpose**: Guide for translating Figma designs into code
**For**: Converting designs to implementation following the design system

**Contents:**

- Design token mapping (colors, typography, spacing)
- Component identification strategies
- Layout translation (Auto Layout → Flexbox/Grid)
- Interactive states implementation
- Asset and icon extraction
- Accessibility from designs
- Animation implementation
- Common pattern examples
- Quality checklist

**When to use**: When converting Figma designs to code, integrating new UI designs, or ensuring design-code consistency.

---

### 3. [`quick_reference.md`](./quick_reference.md)

**Purpose**: Fast lookup for common patterns and commands
**For**: Quick access to frequently used utilities and patterns

**Contents:**

- Color tokens cheat sheet
- Spacing scale
- Typography scale
- Component variants
- Responsive breakpoints
- Icon sizes
- Common layouts
- Useful commands
- Quick checklist

**When to use**: During active development for quick lookups without context switching.

---

### 4. [`../CLAUDE.md`](../CLAUDE.md)

**Purpose**: Complete design system reference documentation
**For**: Deep dive into the entire system architecture and conventions

**Contents:**

- Technology stack overview
- Design tokens (colors, typography, spacing, radius)
- Component architecture and patterns
- Styling system (Tailwind CSS v4, CVA)
- Icon system (Lucide React)
- Asset management
- Project structure
- Internationalization setup
- Best practices

**When to use**: For comprehensive understanding, onboarding new developers, or architectural decisions.

---

## 🎯 Quick Navigation Guide

**I need to...**

| Task                            | Go to                                                               |
| ------------------------------- | ------------------------------------------------------------------- |
| Create a new component          | [`design_system.md`](./design_system.md#component-creation-rules)   |
| Convert Figma to code           | [`figma_integration.md`](./figma_integration.md)                    |
| Find color tokens               | [`quick_reference.md`](./quick_reference.md#-color-tokens)          |
| Understand project architecture | [`../CLAUDE.md`](../CLAUDE.md#project-structure)                    |
| Check spacing values            | [`quick_reference.md`](./quick_reference.md#-spacing-scale)         |
| Learn state management          | [`design_system.md`](./design_system.md#state-management-rules)     |
| Map Figma typography            | [`figma_integration.md`](./figma_integration.md#typography-mapping) |
| See component examples          | [`design_system.md`](./design_system.md#common-patterns)            |
| Check accessibility rules       | [`design_system.md`](./design_system.md#accessibility-rules)        |
| Quick command lookup            | [`quick_reference.md`](./quick_reference.md#-commands)              |

---

## 🚀 Getting Started

### For New Developers

1. **Start with**: [`../CLAUDE.md`](../CLAUDE.md) - Understand the full system
2. **Reference**: [`design_system.md`](./design_system.md) - Learn patterns and rules
3. **Keep handy**: [`quick_reference.md`](./quick_reference.md) - For day-to-day coding

### For AI Assistants

1. **Primary reference**: [`design_system.md`](./design_system.md) - All coding rules and patterns
2. **Design integration**: [`figma_integration.md`](./figma_integration.md) - When working with designs
3. **Quick lookups**: [`quick_reference.md`](./quick_reference.md) - Common patterns and values
4. **System overview**: [`../CLAUDE.md`](../CLAUDE.md) - Full context when needed

### For Design-to-Code Tasks

1. **Start with**: [`figma_integration.md`](./figma_integration.md) - Follow the workflow
2. **Reference**: [`design_system.md`](./design_system.md) - For implementation details
3. **Verify**: Use quality checklists in both documents

---

## 📖 Documentation Philosophy

### Design Principles

1. **Consistency First**: Follow existing patterns over creating new ones
2. **Accessibility Always**: Every component must be keyboard accessible
3. **Mobile-First**: Design and implement for mobile, scale up
4. **Type Safety**: TypeScript strict mode, no `any` types
5. **Composability**: Build complex components from simple primitives
6. **Performance**: Server components by default, client only when needed

### Coding Conventions

- **Components**: Use shadcn/ui as foundation, compose, extend
- **Styling**: Tailwind utility-first with semantic color tokens
- **State**: Zustand for global UI, React Query for server data
- **i18n**: All user-facing text must be internationalized
- **Files**: Feature-based organization, clear naming

---

## 🔄 Keeping Documentation Updated

### When to Update

- [ ] New component patterns emerge
- [ ] Design tokens change
- [ ] New technology is adopted
- [ ] Common issues are discovered
- [ ] Best practices evolve

### Update Process

1. Update the relevant document(s)
2. Update the version date at the bottom
3. Cross-reference between documents if needed
4. Test examples to ensure they work

---

## 🛠 Tools & Resources

### Essential Tools

- **shadcn/ui**: https://ui.shadcn.com
- **Tailwind CSS**: https://tailwindcss.com
- **Lucide Icons**: https://lucide.dev
- **Next.js**: https://nextjs.org
- **Radix UI**: https://radix-ui.com

### Useful Commands

```bash
# Add shadcn component
npx shadcn@latest add [component-name]

# Development
npm run dev

# Build
npm run build

# Database
npx prisma studio

# Formatting
npm run prettier
```

---

## 📝 Contributing to Documentation

When adding new patterns or components:

1. **Document in appropriate file**:
   - New component pattern → `design_system.md`
   - Design-code mapping → `figma_integration.md`
   - Common utility → `quick_reference.md`
   - Architecture change → `../CLAUDE.md`

2. **Include**:
   - Clear explanation
   - Code example
   - When to use / not use
   - TypeScript types

3. **Format**:
   - Use markdown
   - Code blocks with language tags
   - Clear headings
   - Cross-references

---

## 📊 Document Metadata

| Document               | Last Updated | Version | Focus                |
| ---------------------- | ------------ | ------- | -------------------- |
| `CLAUDE.md`            | 2025-01-19   | 1.0.0   | System Reference     |
| `design_system.md`     | 2025-01-19   | 1.0.0   | Implementation Rules |
| `figma_integration.md` | 2025-01-19   | 1.0.0   | Design-to-Code       |
| `quick_reference.md`   | 2025-01-19   | 1.0.0   | Quick Lookup         |

---

## 💡 Tips for AI Assistants

1. **Start Broad**: Check `CLAUDE.md` for system context
2. **Get Specific**: Use `design_system.md` for implementation rules
3. **Design Work**: Follow `figma_integration.md` workflow
4. **Quick Checks**: Reference `quick_reference.md` for common patterns
5. **Always Verify**: Check existing codebase for similar patterns
6. **Ask Questions**: If unclear, search the docs before guessing
7. **Follow Patterns**: Consistency is more important than novelty

---

**Questions or issues with documentation?**
Open an issue or update the docs directly following the contribution guidelines.
