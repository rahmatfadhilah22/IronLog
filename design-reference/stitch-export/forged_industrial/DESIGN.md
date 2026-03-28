```markdown
# Design System Documentation

## 1. Overview & Creative North Star: "The Kinetic Engine"
This design system is built for the uncompromising athlete. It rejects the soft, airy trends of modern SaaS in favor of **Kinetic Brutalism**. The "Creative North Star" is a high-end, precision-engineered piece of gym machinery: heavy, indestructible, and perfectly functional.

The experience moves away from standard "card-based" layouts toward a sophisticated, industrial editorial style. We achieve a premium feel through extreme typographic contrast, intentional asymmetry, and a monochromatic foundation punctuated by a singular, high-visibility "Electric Lime" accent. This is a tool for discipline, not a social toy.

---

## 2. Color Philosophy
Our palette is rooted in the "Industrial Dark" spectrum. It uses deep charcoal and steel tones to create a focused environment where the content—your progress—is the only thing that shines.

### The Palette (Material Design Convention)
- **Background/Surface:** `#131313` (The void)
- **Surface Container (Lowest to Highest):** `#0E0E0E` to `#353534` (Machined steel layers)
- **Primary:** `#CCFF00` (Electric Lime / Kinetic Energy)
- **On-Surface (Text):** `#E5E2E1` (Off-white/Cold Steel)

### The "No-Line" Rule
To maintain a high-end, bespoke aesthetic, **1px solid borders are strictly prohibited for sectioning.** Boundaries must be defined solely through background color shifts. For example, a workout log entry should be a `surface-container-low` block sitting directly on a `surface` background. This creates a seamless, "milled" look rather than a flimsy, bordered one.

### Surface Hierarchy & Nesting
Treat the UI as a series of solid, physical plates. 
- Use `surface-container-lowest` for the deepest background elements.
- Use `surface-container-high` for interactive elements that need to feel "closer" to the user.
- **Nesting:** When placing a container within a container, use at least two steps of tonal difference (e.g., a `surface-container-highest` plate sitting on a `surface-container-low` section) to ensure visual separation without the need for lines.

### Signature Textures
While we avoid playful gradients, a subtle linear gradient from `primary` (`#CCFF00`) to `primary-fixed-dim` (`#ABD600`) is permitted for primary CTAs to give them a "machined metal" sheen and weight.

---

## 3. Typography & Technicality
The typography is the backbone of the brand's "Athletic Technicality." We use two typefaces to create a hierarchy of power and precision.

- **Space Grotesk (Display/Headline):** Used for PRs, weights, and headers. Its technical, almost mono-spaced quirks suggest a scientific approach to lifting.
- **Inter (Title/Body/Label):** Used for utility, descriptions, and high-readability lists. 

### Typographic Intent
- **Display-LG (3.5rem):** Use for "Big Numbers" (e.g., your 1RM). It should feel massive and immovable.
- **Label-SM (0.6875rem):** Use for technical data points (e.g., "TEMPO", "RPE"). This should always be uppercase with slight letter-spacing to mimic industrial stamping.

---

## 4. Elevation & Depth
In this design system, "elevation" is not about light and shadow; it is about **Mass and Material.**

### The Layering Principle
Depth is achieved by "stacking" the surface-container tiers. Since we are avoiding glassmorphism to stay true to the industrial aesthetic, we use **Hard Layering**. A "floating" action button should not look like it’s hovering in the air, but like a raised button on a control panel.

### Ambient Shadows
Shadows are used sparingly. When a floating effect is required (e.g., a bottom sheet), use an extra-diffused shadow:
- **Blur:** 24px - 32px
- **Opacity:** 8%
- **Color:** `#000000`
This creates a subtle "weight" rather than a distracting "glow."

### The "Ghost Border" Fallback
If a visual divider is absolutely required for accessibility in a dense chart, use a "Ghost Border": the `outline-variant` token at **15% opacity**. It should be felt, not seen.

---

## 5. Component Architecture

### Buttons: High-Friction Utility
- **Primary:** Background `primary` (#CCFF00), Text `on-primary` (#283500). Square corners (Radius: `sm` or `none`) to maintain the industrial look.
- **Secondary:** Surface-container-highest. For less critical actions.
- **Sizing:** All touch targets must be a minimum of 48dp, but primary "Start Workout" buttons should be 64dp+ to accommodate shaky, post-set hands.

### Input Fields: The Control Deck
- Fields should use `surface-container-low` with a `primary` indicator on focus. 
- Labels should use `label-md` and be positioned above the field, never as placeholder text, to ensure the user never loses context of their metrics.

### Cards & Lists: No-Divider Principle
- **Forbid dividers.** To separate sets or exercises, use the **Spacing Scale** (e.g., `8` (1.75rem) gap) or a tonal shift (`surface-container-lowest` vs `surface-container-low`).
- **Density:** Layouts should be dense but organized. Use the `0.2rem` and `0.4rem` spacing tokens to group related metrics (e.g., weight and reps) tightly.

### Analytical Charts
- **The "Pulse" Line:** Charts should use the `primary` color for the data line.
- **Grid Lines:** Only horizontal lines are allowed, using the "Ghost Border" rule.
- **Area Fills:** A subtle vertical gradient from `primary` at 10% opacity to 0% opacity at the baseline.

---

## 6. Do's and Don'ts

### Do
- **Do** use uppercase for labels and small metadata to enhance the industrial feel.
- **Do** prioritize Android-first ergonomics: place primary actions within reach of the thumb (bottom 1/3 of the screen).
- **Do** use the `primary` (Electric Lime) color to signify "Action" or "Success" only. Do not over-saturate the screen with it.
- **Do** lean into intentional asymmetry. A right-aligned "Big Number" against a left-aligned label creates a high-end editorial tension.

### Don't
- **Don't** use purple, pink, or soft pastels. This system is built on charcoal and lime.
- **Don't** use rounded corners above `lg` (0.5rem). Avoid "pill" shapes for buttons; keep them architectural.
- **Don't** use glassmorphism or blurs. We are building with steel, not glass.
- **Don't** use generic social icons. Use thick-stroke, geometric iconography that matches the weight of the typography.

---

## 7. Spacing & Rhythm
This system uses a **Power-of-2 derived scale** but expressed in custom rem units for an unconventional feel.
- **Micro-rhythm:** Use `2` (0.4rem) for internal component padding.
- **Macro-rhythm:** Use `10` (2.25rem) or `12` (2.75rem) for section breathing room. 

*Director's Note: Every pixel must feel like it was placed with a torque wrench. If an element doesn't have a functional purpose, strip it away.*```