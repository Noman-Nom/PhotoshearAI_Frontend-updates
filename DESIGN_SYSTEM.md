# PhotoshearAI Design System Guide

## Overview
This guide documents the premium, enterprise-grade design system used across PhotoshearAI's frontend. The system emphasizes visual hierarchy, accessibility, and a sophisticated aesthetic inspired by modern SaaS applications.

---

## Color Palette

### Primary Colors
- **Indigo (Primary Brand)**: `#6366f1` (indigo-600), `#4f46e5` (indigo-700)
  - Used for: CTAs, links, focus states, gradients
  - Hover: `#4f46e5` (darker indigo)

- **Gradient**: Linear gradient from `#6366f1` → `#4f46e5` (135deg)
  - Applied to primary buttons for depth

### Neutral Colors
- **Dark**: `#0F172A` (slate-900/dark blue)
  - Used for: Main text, headings
- **Light Gray**: `#f1f5f9` (slate-100)
  - Used for: Form backgrounds, secondary elements
- **Medium Gray**: `#94a3b8` (slate-400)
  - Used for: Secondary text, placeholders
- **Slate-200**: `#e2e8f0` (slate-200)
  - Used for: Borders, subtle dividers

### Semantic Colors
- **Error**: `#ef4444` (red-500)
  - Used for: Error messages, validation failures
- **Success**: `#10b981` (emerald-500)
  - Used for: Success states, confirmations
- **Warning**: `#f59e0b` (amber-500)
  - Used for: Warnings, cautions

---

## Typography

### Font Family
- **Heading Font**: Sans-serif (system default or Geist)
- **Body Font**: Sans-serif (system default or Inter)
- **Monospace**: For URLs and technical content

### Font Weights & Sizes

#### Headings
- **Page Title**: 32px (2xl), font-bold, tracking-tight
- **Section Title**: 24px (xl), font-bold
- **Subsection**: 20px (lg), font-semibold
- **Card Title**: 18px (base), font-semibold

#### Body Text
- **Regular Body**: 14px (sm), font-normal, leading-6
- **Label/Caption**: 12px (xs), font-medium, leading-4
- **Form Label**: 14px (sm), font-semibold, text-slate-700

#### Line Height
- Body text: `leading-6` (1.5rem)
- Headings: `leading-tight` (1.25rem)

---

## Components

### Form Fields

#### Input Component
```tsx
<Input
  label="Email"
  type="email"
  placeholder="Enter your email"
  error={errors.email?.message}
  leftIcon={<Mail size={18} />}
  {...register('email')}
/>
```

**Styling**:
- Border: `border-slate-200`, rounded-lg (0.5rem)
- Background: `bg-white`
- Height: `h-11` (44px)
- Focus: `ring-2 ring-indigo-500` (no border outline)
- Hover: `hover:shadow-md hover:border-slate-300`
- Padding: `px-3 py-2`
- Icon padding: `ps-10` (if icon present)
- Error: `border-red-400 focus:ring-red-500`

#### Password Input
```tsx
<PasswordInput
  label="Password"
  placeholder="••••••••"
  error={errors.password?.message}
  {...register('password')}
/>
```

**Features**:
- Built-in lock icon (`<Lock>`)
- Show/hide toggle with Eye icon
- Same styling as Input component

#### Select Component
```tsx
<Select
  label="Country"
  options={countryOptions}
  error={errors.country?.message}
  {...register('country')}
/>
```

**Features**:
- Custom chevron icon (right-aligned)
- Consistent Input styling
- Native `<select>` behavior with custom appearance

### Buttons

#### Primary Button
```tsx
<Button
  type="submit"
  className="w-full bg-indigo-600 hover:bg-indigo-700"
  isLoading={isSubmitting}
>
  {label}
</Button>
```

**Styling**:
- Background: Indigo gradient (`linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)`)
- Color: White text
- Padding: `py-2.5 h-11` (44px height)
- Rounded: `rounded-lg`
- Shadow: `shadow-lg shadow-indigo-100` (soft indigo shadow)
- Hover: Scale up slightly with `whileHover={{ scale: 1.01 }}`
- Active: Scale down with `whileTap={{ scale: 0.99 }}`

#### Secondary Button (Link)
```tsx
<Link className="text-indigo-600 hover:text-indigo-700 hover:underline">
  {label}
</Link>
```

---

## Forms & Layouts

### Form Spacing
- Between fields: `space-y-4` (1rem gap)
- Error text margin: `mt-1.5`
- Label margin: `mb-1` or built into component spacing

### Form Sections
- Wrapper: `space-y-6` for major sections
- Sub-sections: `space-y-4` for field groups
- Grid layouts: `grid grid-cols-1 sm:grid-cols-2 gap-4`

### Error Handling
```tsx
{formError && (
  <motion.div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
    {formError}
  </motion.div>
)}
```

**Styling**:
- Background: `bg-red-50`
- Border: `border border-red-200`
- Text: `text-red-700` (darker red)
- Padding: `p-4`
- Rounded: `rounded-lg`
- Icon: Optional error icon on the left

---

## Animations & Transitions

### Form Field Animations
Fields animate in with staggered delay for premium feel:

```tsx
const fieldVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: 'easeOut' },
  }),
};
```

**Usage**:
- First field: No delay
- Each subsequent: +70ms delay
- Creates smooth cascade effect

### Button Animations
- Hover: `whileHover={{ scale: 1.01 }}` (1% scale up)
- Click: `whileTap={{ scale: 0.99 }}` (1% scale down)
- Provides haptic-like feedback

### Transition Defaults
- Duration: `0.35s` for field animations
- Duration: `0.2s` for micro-interactions
- Easing: `easeOut` for entrance, `ease` for hover states

---

## Auth Pages Styling

### Layout Structure
**Left Side (Desktop only)**:
- 50% width on large screens, hidden on mobile
- Gradient background: `linear-gradient(135deg, #eef2ff 0%, #e0e7ff 40%, #ddd6fe 100%)`
- Centered illustration with orbiting icons
- Feature badges below illustration

**Right Side**:
- Full width on mobile, 50% on desktop
- White background
- Centered form with max-width: 440px
- 16px padding on desktop, 24px on tablet, 6px on mobile

### Form Card
- Max-width: 440px
- Title: 28px, bold, dark gray
- Subtitle: 14px, slate-500
- Spacing between title and form: 32px

---

## Icons

### Icon Usage
- **Size**: 18px for form fields, 20px for buttons, 24px for major elements
- **Color**: `text-slate-400` (default), `text-slate-600` (hover)
- **Source**: Lucide React (`lucide-react`)

### Common Icons by Field
| Field | Icon | Import |
|-------|------|--------|
| Email | `Mail` | `lucide-react` |
| Password | `Lock` | `lucide-react` |
| User/Name | `User` | `lucide-react` |
| Company | `Building2` | `lucide-react` |
| URL | `Globe` | `lucide-react` |
| Phone | `Phone` | `lucide-react` |
| Toggle Password | `Eye` / `EyeOff` | `lucide-react` |
| Submit | `ArrowRight` | `lucide-react` |

---

## Accessibility Guidelines

### Contrast Ratios
- Text on white: `text-slate-900` (AAA compliant)
- Labels: `text-slate-700` (bold, AAA compliant)
- Placeholder text: `text-slate-400` (AA compliant)

### Focus States
- All interactive elements: `focus:outline-none focus:ring-2 focus:ring-indigo-500`
- Consistent, visible focus indicator

### ARIA Labels
- Form labels: Semantic `<label htmlFor>` associations
- Error messages: Related to inputs via aria-describedby (recommended)
- Buttons: Clear, descriptive text

### Keyboard Navigation
- Tab order: Natural HTML order (no tabindex necessary)
- Forms: Can be submitted with Enter key
- Links: Underlined on hover for clarity

---

## Responsive Design

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Responsive Utilities
- Form grids: `grid-cols-1 sm:grid-cols-2`
- Text sizes: `sm:text-base md:text-lg`
- Padding: `p-6 sm:p-12 md:p-16`
- Auth layout: `hidden lg:flex` (left side)

### Mobile-First Approach
- Default: Mobile layout (full-width, single column)
- `sm:` prefix: Tablet enhancements
- `lg:` prefix: Desktop enhancements

---

## Best Practices When Building New Pages

### 1. Color Consistency
- Use indigo-600 for primary actions
- Use slate grays for text and borders
- Avoid introducing new colors without design approval

### 2. Form Fields
- Always use icons for enhanced UX
- Maintain consistent spacing with `space-y-4` between fields
- Use proper labels with `font-semibold`

### 3. Error States
- Always validate before submit
- Use `border-red-400` for borders, `text-red-700` for text
- Include error message below field with `mt-1.5`

### 4. Buttons
- Primary: Indigo gradient with shadow
- Secondary: Text links with hover underline
- Always include loading state indicator

### 5. Animations
- Use Framer Motion for entrance animations
- Stagger multiple elements: `delay: i * 0.07`
- Keep transitions fast: 200-350ms

### 6. Spacing
- 16px gaps between related sections (`gap-4`)
- 24px between major sections (`space-y-6`)
- Consistent padding inside cards: `p-4` or `p-6`

### 7. Typography
- Use `leading-6` for body text readability
- Use `tracking-tight` for headings
- Maintain font weight hierarchy: bold > semibold > normal

---

## Example: Complete Form Field

```tsx
import { Input } from '../components/ui/Input';
import { Mail } from 'lucide-react';
import { motion } from 'framer-motion';

const fieldVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: 'easeOut' },
  }),
};

export function MyForm() {
  return (
    <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible">
      <Input
        label="Email Address"
        type="email"
        placeholder="your.email@company.com"
        error={errors.email?.message}
        leftIcon={<Mail size={18} />}
        {...register('email')}
        className="bg-white border-slate-200 focus:ring-indigo-400 focus:border-indigo-300 rounded-xl shadow-sm transition-shadow hover:shadow-md"
      />
    </motion.div>
  );
}
```

---

## Troubleshooting Common Issues

### Form fields don't have rounded corners
- Ensure `rounded-lg` or `rounded-xl` is in className
- Check that custom classes aren't overriding

### Icons not showing
- Verify icon is imported from `lucide-react`
- Check icon size matches context (18px for forms)
- Ensure `leftIcon` prop is passed correctly

### Focus ring color is wrong
- Update `focus:ring-indigo-500` to match primary color
- Remove any conflicting `focus:ring-*` classes

### Buttons don't have gradient
- Use inline `style` prop with linear-gradient
- Ensure gradient angles and colors match design spec

---

## Version History

- **v1.0** (March 2025): Initial design system
  - Color palette definition
  - Component styling guide
  - Animation standards
  - Accessibility guidelines

---

For questions or updates to this design system, please contact the design team.
