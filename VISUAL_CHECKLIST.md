# Visual Checklist - Login & Signup Pages

Use this checklist to verify all visual improvements have been properly applied.

---

## Login Page Visual Elements

### [ ] Page Layout
- [ ] Left side gradient visible on desktop (indigo-purple blend)
- [ ] Left side hidden on mobile/tablet
- [ ] Right side takes full width on mobile
- [ ] Right side takes 50% width on desktop
- [ ] White background on right side
- [ ] Language switcher in top-right corner

### [ ] Title & Subtitle
- [ ] Title: "Welcome Back !" visible
- [ ] Title: Bold, ~28px font size
- [ ] Subtitle: "Sign in to continue to Enterprise" visible
- [ ] Subtitle: Lighter gray color (~slate-500)
- [ ] Proper spacing between title and form

### [ ] Email Field
- [ ] Label: "EMAIL" visible, bold (font-semibold)
- [ ] Mail icon appears on left side of field
- [ ] Input field has rounded corners (rounded-lg)
- [ ] Border color is light gray (slate-200)
- [ ] Placeholder text: "nomitech.ai01@gmail.com"
- [ ] Focus ring appears in indigo (ring-indigo-500)
- [ ] Hover state shows subtle shadow

### [ ] Password Field
- [ ] Label: "PASSWORD" visible, bold (font-semibold)
- [ ] Lock icon appears on left side
- [ ] Eye icon appears on right side (for show/hide)
- [ ] Input has rounded corners (rounded-lg)
- [ ] Border color is light gray (slate-200)
- [ ] Password is masked by default (••••••••)
- [ ] Clicking eye toggle shows/hides password
- [ ] "Forgot password?" link in top-right (indigo-600)
- [ ] Focus ring appears in indigo

### [ ] Remember Me
- [ ] Checkbox appears with label
- [ ] Label: "REMEMBER ME" visible
- [ ] Checkbox has proper styling (accent-indigo-600)
- [ ] Label text is smaller, gray color

### [ ] Submit Button
- [ ] Button text: "Log In"
- [ ] Button has indigo gradient background
- [ ] Button is full width
- [ ] Button height: 44px (h-11)
- [ ] Button has rounded corners (rounded-lg)
- [ ] Button text is white, bold
- [ ] Button has shadow (shadow-lg)
- [ ] On hover: Slight scale increase (1.01x)
- [ ] On click: Slight scale decrease (0.99x)
- [ ] When loading: Spinner appears, button disabled

### [ ] Divider
- [ ] Horizontal line appears
- [ ] "OR" text centered in white background
- [ ] Divider is light gray (border-slate-200)

### [ ] Google Sign-In
- [ ] Google button appears below divider
- [ ] Google logo visible on button
- [ ] Button text: "Sign in with Google"
- [ ] Button is properly styled and clickable

### [ ] Sign Up Link
- [ ] Text: "Don't have an account?"
- [ ] "Register" link in indigo (text-indigo-600)
- [ ] Link underlines on hover
- [ ] Link is clickable and navigates to signup

### [ ] Error Handling
- [ ] Error message appears in red card (bg-red-50)
- [ ] Error border is red (border-red-200)
- [ ] Error text is darker red (text-red-700)
- [ ] Error message appears below title, above form
- [ ] Error animates in smoothly

---

## Signup Page Visual Elements

### [ ] Page Layout
- [ ] Same split-panel layout as login page
- [ ] Left side gradient on desktop
- [ ] White form area on right
- [ ] Full-width on mobile

### [ ] Title & Subtitle
- [ ] Title: "Create an account" visible
- [ ] Subtitle: "Get started with your free enterprise account today"
- [ ] Proper spacing and styling

### [ ] Name Fields
- [ ] Two fields side-by-side on desktop, stacked on mobile
- [ ] First Name field:
  - [ ] Label: "FIRST NAME"
  - [ ] User icon on left side
  - [ ] Rounded corners (rounded-lg)
  - [ ] Proper styling
- [ ] Last Name field:
  - [ ] Label: "LAST NAME"
  - [ ] User icon on left side
  - [ ] Same styling as First Name
- [ ] Gap between fields on desktop (gap-4)

### [ ] Company Name Field
- [ ] Label: "COMPANY NAME" visible
- [ ] Building2 icon on left side
- [ ] Full width
- [ ] Rounded corners and shadow
- [ ] Placeholder text visible

### [ ] Studio URL Field
- [ ] Label: "COMPANY URL" visible
- [ ] Input field with placeholder
- [ ] ".fotoshareai.com" suffix visible on right side
- [ ] Suffix has gray background (bg-slate-50)
- [ ] Proper border and styling
- [ ] Auto-populates based on company name

### [ ] Country & Phone Fields
- [ ] Side-by-side on desktop, stacked on mobile
- [ ] Country field:
  - [ ] Label: "COUNTRY"
  - [ ] Dropdown menu (select element)
  - [ ] Chevron icon on right side
  - [ ] Default country selected
- [ ] Phone field:
  - [ ] Label: "PHONE NUMBER"
  - [ ] Country dial code prefix visible (+93, +1, etc.)
  - [ ] Dial code has gray background
  - [ ] Phone input accepts numbers
  - [ ] Placeholder: "555-0123"

### [ ] Email Field
- [ ] Label: "EMAIL" visible
- [ ] Mail icon on left side
- [ ] Full width
- [ ] Type: email (validates email format)
- [ ] Placeholder visible

### [ ] Password Fields
- [ ] Two fields side-by-side on desktop, stacked on mobile
- [ ] Password field:
  - [ ] Label: "PASSWORD"
  - [ ] Lock icon on left side
  - [ ] Eye toggle on right side
  - [ ] Input masked by default
- [ ] Confirm Password field:
  - [ ] Label: "CONFIRM PASSWORD"
  - [ ] Lock icon on left side
  - [ ] Eye toggle on right side
  - [ ] Input masked by default

### [ ] Submit Button
- [ ] Button text: "Create an account"
- [ ] Same indigo gradient styling as login
- [ ] Full width
- [ ] Loading state with spinner
- [ ] Hover/click animations

### [ ] Sign In Link
- [ ] Text: "Already have an account?"
- [ ] "Sign in" link in indigo
- [ ] Proper styling and hover effect

### [ ] Form Animations
- [ ] Fields appear one by one (cascade effect)
- [ ] ~70ms delay between each field
- [ ] Smooth easing (easeOut)
- [ ] Total animation ~350ms per field

---

## Color Consistency Check

### [ ] Indigo Theme
- [ ] Primary indigo: #6366f1 (indigo-600)
- [ ] Dark indigo: #4f46e5 (indigo-700)
- [ ] Used for: Buttons, links, focus rings, gradients
- [ ] All primary buttons have gradient

### [ ] Gray Neutrals
- [ ] Text: #0f172a (slate-900) for headings
- [ ] Text: #475569 (slate-700) for labels
- [ ] Text: #64748b (slate-500) for secondary text
- [ ] Borders: #e2e8f0 (slate-200)
- [ ] Background: #ffffff (white)
- [ ] Secondary bg: #f1f5f9 (slate-100)

### [ ] Error Colors
- [ ] Error text: #ef4444 (red-500) or #b91c1c (red-700)
- [ ] Error border: #fecaca (red-200)
- [ ] Error background: #fef2f2 (red-50)

---

## Interactive Element Check

### [ ] Hover States
- [ ] Form fields: Shadow increases on hover
- [ ] Buttons: Scale up slightly on hover (1.01x)
- [ ] Links: Color darkens and underline appears
- [ ] Checkboxes: Visual feedback on hover

### [ ] Focus States
- [ ] Form fields: Indigo ring appears (ring-indigo-500)
- [ ] Ring is 2px thick
- [ ] No default outline (removed with focus:outline-none)
- [ ] Focus visible on keyboard navigation

### [ ] Active/Click States
- [ ] Buttons: Scale down slightly on click (0.99x)
- [ ] Inputs: Border might change slightly
- [ ] Transitions: All smooth, no jarring changes

### [ ] Disabled States
- [ ] Loading button: Spinner appears, button disabled
- [ ] Disabled inputs: Opacity reduced
- [ ] No pointer events on disabled elements

---

## Icons Check

### [ ] Icon Presence
- [ ] Mail icon: Email fields (both pages)
- [ ] Lock icon: Password fields (both pages)
- [ ] User icon: Name fields (signup only)
- [ ] Building2 icon: Company name field (signup)
- [ ] Globe icon: (ready for URL field if added)
- [ ] Phone icon: (ready for phone field if added)
- [ ] Eye/EyeOff: Password visibility toggle

### [ ] Icon Styling
- [ ] Size: 18px for all form field icons
- [ ] Color: slate-400 (neutral gray)
- [ ] Hover: May change to slate-600
- [ ] Positioned correctly (left or right)
- [ ] No pointer events (not clickable unless toggle)

---

## Spacing & Layout Check

### [ ] Form Field Spacing
- [ ] Between fields: 16px (space-y-4)
- [ ] Between sections: 24px (space-y-6)
- [ ] Label to field: 6px (space-y-1.5)
- [ ] Error message to field: 6px (mt-1.5)

### [ ] Input Dimensions
- [ ] Height: 44px (h-11)
- [ ] Padding: 12px horizontal (px-3)
- [ ] Padding: 8px vertical (py-2)
- [ ] With icon: 40px left padding (pl-10)
- [ ] With icon: 40px right padding (pr-10)

### [ ] Border Radius
- [ ] Form fields: 8px radius (rounded-lg)
- [ ] Buttons: 8px radius (rounded-lg)
- [ ] Error messages: 8px radius (rounded-lg)

---

## Typography Check

### [ ] Font Weights
- [ ] Headings: Bold (font-bold or font-900)
- [ ] Form labels: Semibold (font-semibold)
- [ ] Body text: Normal (font-normal)
- [ ] Button text: Semibold (font-semibold)

### [ ] Font Sizes
- [ ] Page title: 28px (text-2xl) or larger
- [ ] Form label: 14px (text-sm), semibold
- [ ] Input text: 14px (text-sm)
- [ ] Placeholder: 14px (text-sm), gray
- [ ] Error message: 14px (text-sm), semibold
- [ ] Caption text: 12px (text-xs)

### [ ] Line Heights
- [ ] Body text: 1.5rem (leading-6)
- [ ] Heading: 1.25rem (leading-tight)

---

## Mobile Responsiveness Check

### [ ] Mobile (< 640px)
- [ ] Left side gradient: Hidden
- [ ] Right side: Full width
- [ ] Padding: 24px (p-6)
- [ ] Title: 24px (text-2xl)
- [ ] Form fields: Full width, single column
- [ ] Buttons: Full width

### [ ] Tablet (640px - 1024px)
- [ ] Left side: Still hidden
- [ ] Right side: Full width
- [ ] Padding: 48px (p-12)
- [ ] Title: 28px (text-3xl)
- [ ] Name fields: 2 columns (grid-cols-2)
- [ ] Country/Phone: 2 columns (grid-cols-2)
- [ ] Password fields: 2 columns (grid-cols-2)

### [ ] Desktop (> 1024px)
- [ ] Left side: 50% width, visible
- [ ] Right side: 50% width
- [ ] Padding: 64px (p-16)
- [ ] Title: 28px (text-3xl)
- [ ] All 2-column layouts active
- [ ] Max-width wrapper: 440px on form

---

## Animation Check

### [ ] Page Load Animations
- [ ] Form fields cascade in (1 by 1)
- [ ] Email field appears first (no delay)
- [ ] Each field ~70ms after previous
- [ ] Smooth easing (easeOut)
- [ ] Total animation: ~350ms per field

### [ ] Interaction Animations
- [ ] Button hover: Scale up smoothly
- [ ] Button click: Scale down for press feel
- [ ] Field focus: Ring appears instantly or smoothly
- [ ] Error message: Fades/slides in

### [ ] Timing
- [ ] All animations feel responsive (not too slow)
- [ ] Cascade effect is noticeable but not annoying
- [ ] Micro-interactions are subtle (not overdone)

---

## Accessibility Check

### [ ] Form Labels
- [ ] Every input has associated label
- [ ] Label `htmlFor` matches input `id`
- [ ] Labels are visually prominent (semibold)
- [ ] Labels are readable (good contrast)

### [ ] Focus Indicators
- [ ] Focus ring is clearly visible
- [ ] Focus ring has good contrast (indigo)
- [ ] Focus indicator can't be missed
- [ ] Works with keyboard navigation

### [ ] Color Contrast
- [ ] Dark text on white: Good contrast
- [ ] Error text on red: Sufficient contrast
- [ ] Links on white: Sufficient contrast
- [ ] Hover colors maintain contrast

### [ ] Icon Accessibility
- [ ] Icons have alt text or ARIA labels where needed
- [ ] Decorative icons don't interfere with content
- [ ] Icon meanings are clear or labeled

### [ ] Error Handling
- [ ] Error messages are visible and clear
- [ ] Error messages identify the problem
- [ ] Error messages suggest solution (if possible)
- [ ] Screen readers announce errors

---

## Browser/Device Testing

### [ ] Desktop Browsers
- [ ] Chrome: All elements render correctly
- [ ] Firefox: All elements render correctly
- [ ] Safari: All elements render correctly
- [ ] Edge: All elements render correctly

### [ ] Mobile Browsers
- [ ] iPhone Safari: Responsive layout works
- [ ] Chrome Mobile: Touch targets are appropriate
- [ ] Samsung Internet: Icons render correctly

### [ ] Devices
- [ ] 320px width (small mobile): Readable
- [ ] 375px width (standard mobile): Usable
- [ ] 768px width (tablet): Proper 2-column layout
- [ ] 1024px width (desktop): Full experience
- [ ] 1440px+ (large desktop): No overflow issues

---

## Performance Check

### [ ] Loading
- [ ] Page loads quickly (no lag)
- [ ] Icons load with page (no delay)
- [ ] Animations start smoothly
- [ ] No jank or stuttering

### [ ] Interactions
- [ ] Button clicks respond immediately
- [ ] Input focus is instant
- [ ] Hover effects are smooth
- [ ] Animations run at 60fps

### [ ] File Size
- [ ] No unnecessary CSS
- [ ] Icons are lightweight (Lucide SVGs)
- [ ] Animations don't impact performance
- [ ] No unused classes in production

---

## Final Verification

### Before Launch
- [ ] All checkboxes above are checked
- [ ] No visual bugs or issues
- [ ] All animations working smoothly
- [ ] Responsive across devices
- [ ] Accessibility standards met
- [ ] Performance is optimal
- [ ] Error handling works properly
- [ ] Form submission works correctly
- [ ] Navigation between pages works
- [ ] All links are functional

### After Launch
- [ ] Monitor for any visual issues
- [ ] Check user feedback for UI/UX
- [ ] Performance metrics are good
- [ ] No console errors on any page
- [ ] Mobile users report good experience

---

## Notes for Dashboard

When applying this design to the dashboard, ensure:

- [ ] Use same indigo color for active states
- [ ] Apply rounded-lg and shadows to cards
- [ ] Use same font weights and sizes
- [ ] Maintain consistent spacing (space-y-4, space-y-6)
- [ ] Add hover effects to interactive elements
- [ ] Use same icons from lucide-react
- [ ] Test responsive behavior
- [ ] Verify animations on dashboard elements
- [ ] Check accessibility of dashboard components
- [ ] Monitor performance with larger datasets

---

**Design System Version:** 1.0 (March 2025)
**Last Updated:** Implementation Complete
**Status:** ✅ Ready for Production
