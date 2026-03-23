# Design System Strategy: Construction Intelligence & Operational Elegance

## 1. Overview & Creative North Star: "The Architectural Ledger"
The construction industry is built on precision, raw materials, and the weight of physical reality. This design system moves away from the "airy" tropes of generic SaaS to embrace **The Architectural Ledger**. This North Star defines a UI that feels as stable as a steel beam but as sophisticated as a modern blueprint. 

We break the "template" look through **Intentional Asymmetry**—placing heavy display typography against expansive, quiet negative space. By utilizing high-contrast typography scales and overlapping "glass" layers, we create a sense of depth that mimics a stack of architectural plans on a light table. It is professional, authoritative, and unapologetically industrial.

---

## 2. Colors: Tonal Precision
Our palette avoids the "candy-coated" look of consumer tech. We use deep, mineral-inspired teals and high-visibility safety oranges to ground the experience in the field.

### Color Tokens
*   **Primary Core:** `primary` (#00342b) for high-level authority; `secondary` (#046b5e) for operational actions.
*   **Safety Accents:** `tertiary` (#5b1300) and `tertiary_container` (#821f00) are used sparingly for critical status changes and "Burned Orange" alerts.
*   **Neutral Foundation:** We utilize a "Cool Slate" spectrum—`surface` (#f3faff) through `surface_container_highest` (#cfe6f2)—to mimic the clean, professional look of a galvanized steel or concrete finish.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to section content. To define boundaries, use background color shifts. A `surface_container_low` card must sit on a `surface` background. If you need more definition, use a `surface_container_high` background. Structure is defined by mass and tone, not by lines.

### Signature Textures & Glass
*   **Glassmorphism:** For hero sections and floating navigation, use `surface_variant` with a 60% opacity and a `24px` backdrop blur. This creates a "frosted glass" effect that feels premium and modern.
*   **The Gradient Polish:** Avoid flat primary buttons. Use a subtle linear gradient from `primary` (#00342b) to `primary_container` (#004d40) at a 135° angle to give CTAs a "machined" metallic depth.

---

## 3. Typography: Editorial Authority
We pair the structural strength of **Epilogue** (Display/Headlines) with the technical clarity of **Inter** (Body/Labels).

*   **Display (Epilogue):** Large, bold, and geometric. Used for high-level dashboard summaries and hero messaging. It conveys the "Modern Industrial" vibe.
*   **Headline & Title (Epilogue/Inter):** Headlines use Epilogue for a "stamped" feel, while Titles switch to Inter to maintain high readability in dense data environments.
*   **Body & Labels (Inter):** Clean, high-legibility sans-serif. Use `label-md` and `label-sm` for technical data points like change order IDs and timestamps.

**Editorial Hierarchy:** Use extreme scale differences. A `display-lg` headline should often sit near `body-md` metadata to create a sophisticated, magazine-style layout that feels curated, not automated.

---

## 4. Elevation & Depth: Tonal Layering
In this system, depth is a product of light and material stacking, not drop shadows.

*   **The Layering Principle:** Stack surfaces from light to dark (or vice versa) to create hierarchy. Place a `surface_container_lowest` (#ffffff) card inside a `surface_container` (#dbf1fe) wrapper. This creates a natural "lift."
*   **Ambient Shadows:** If an element must float (e.g., a modal or a floating action button), use an ultra-diffused shadow. 
    *   *Shadow Color:* 8% opacity of `on_surface` (#071e27).
    *   *Blur:* 32px to 64px.
*   **The "Ghost Border" Fallback:** If a boundary is legally or functionally required for accessibility, use `outline_variant` at **15% opacity**. It should be felt, not seen.

---

## 5. Components: Industrial Primitive

### Buttons
*   **Primary:** Gradient of `primary` to `primary_container`. Corner radius: `lg` (1rem). High-contrast `on_primary` text.
*   **Secondary:** `surface_container_highest` background with `on_surface` text. No border.
*   **Tertiary:** Ghost style. No background; `primary` text. Use for low-priority actions like "Cancel" or "Export."

### Tables & Change Orders (Critical Component)
*   **The "Roomy Row" Rule:** Forbid 1px dividers. Use a `3.5` (1.2rem) vertical padding for rows.
*   **Zebra Toning:** Distinguish rows using a subtle shift between `surface` and `surface_container_low`. 
*   **Data Density:** Use `title-sm` for primary figures (e.g., "$45,000.00") and `label-sm` for secondary metadata (e.g., "PO #9921").

### Cards
*   **Radius:** Always use `xl` (1.5rem) for main containers to soften the industrial "heaviness."
*   **Separation:** Use vertical white space (`spacing.8` or `spacing.10`) instead of lines to separate card sections.

### Status Chips
*   **Draft:** `surface_variant` with `on_surface_variant`.
*   **Pending:** `tertiary_fixed` (#ffdbd1) with `on_tertiary_fixed_variant` (#872000).
*   **Approved:** `secondary_container` (#9defde) with `on_secondary_container` (#0f6f62).

---

## 6. Do’s and Don’ts

### Do
*   **Use Asymmetry:** Place a large headline on the left and a small technical stat on the far right to create a "Blueprint" aesthetic.
*   **Embrace Negative Space:** Let the industrial elements "breathe." Construction is messy; the software should feel like the organized solution.
*   **Use the Surface Tiers:** Always check the `surface_container` tokens before reaching for a shadow or a line.

### Don’t
*   **No Purple/Neon:** Strictly avoid any "cyberpunk" or "consumer app" colors. Stay within the mineral teals and safety oranges.
*   **No Cramped Layouts:** If a table feels tight, double the vertical padding. Construction data requires "high clarity," not "high density."
*   **No 100% Black Shadows:** Never use `#000000` for shadows. Use the tinted `on_surface` color for a natural, architectural look.