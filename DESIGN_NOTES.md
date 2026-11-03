# IACEC — Design notes

Measured from the live reference site `https://raise-godly-growth.base44.app/` on 3 November 2026.
Sources: rendered DOM (Edge via Playwright at 1440 / 768 / 390 px), the compiled stylesheet
`/assets/index-AE17KfAR.css`, and the compiled application bundle `/assets/index-CdDmGliK.js`
(which contains the original JSX, so class names below are copied, not estimated).

Reference screenshots: `reference-screenshots/{route}/{1440,768,390}.png`.

## Stack of the reference

React SPA, Tailwind CSS v3 (shadcn/ui tokens), framer-motion reveal animations, lucide-react icons,
Radix dropdown/sheet. We reproduce it with Next.js App Router + Tailwind v3 using the **same Tailwind
class names**, so spacing, sizes and colours are identical by construction.

## Fonts

| Role | Family | Weights |
| --- | --- | --- |
| Headings / display (`--font-heading`, `--font-display`) | Montserrat | 400 500 600 700 800 |
| Body (`--font-body`) | Source Sans 3 | 300 400 500 600 700 |

Loaded with `next/font/google` and exposed through the same CSS variables.

## Global base styles (copied from the live stylesheet)

```css
body { background: hsl(var(--background)); font-family: var(--font-body); color: hsl(var(--foreground));
       font-size: 1.0625rem; line-height: 1.65; -webkit-font-smoothing: antialiased; }
h1..h6 { font-family: var(--font-heading); letter-spacing: -.022em; color: #022667; text-wrap: balance; font-weight: 700; }
p { text-wrap: pretty; }
::selection { color: #022667; background: #f1dfb6; }
:focus-visible { outline: 2px solid #ce9428; outline-offset: 3px; }
html { scroll-behavior: smooth; }
```

## Tokens

shadcn HSL tokens exactly as in the brief (`--primary: 219 96% 21%`, `--accent: 39 68% 48%`, `--radius: .875rem`, …) — confirmed identical in the live CSS.

Extra Tailwind colours used by the live site (defined in `tailwind.config.ts`):

| Token | Value | Use |
| --- | --- | --- |
| `navy` | `#022667` | headings, primary buttons, navy bands |
| `navy-800` | `#013B85` | hover on navy buttons and links |
| `gold` | `#CE9428` | gold buttons, icons, timeline |
| `gold-light` | `#DEB155` | footer headings, eyebrows on navy, hover on gold buttons |
| `gold-deep` | `#A9761A` | gold text on white (labels, numbers) |
| `gold-tint` | `#F7EFDD` | icon tiles, category chips, callouts |
| `mist` | `#F5F7FA` | pale section background |
| `ink` | `#1F2430` | body text, used at /35–/80 opacity |

Shadows: `shadow-soft` = `0 18px 45px -28px rgba(2,38,103,.35)`; `shadow-lift` = `0 28px 60px -32px rgba(2,38,103,.45)`.
Header when scrolled: `shadow-[0_10px_30px_-24px_rgba(2,38,103,0.5)]` + `border-navy/[0.09]`.

## Component classes (from the live stylesheet)

- `.container-page` — `max-width:1240px; margin-inline:auto; padding-inline:1.25rem` (2rem ≥640, 2.5rem ≥1024)
- `.eyebrow` — Montserrat 600, `.72rem`, `letter-spacing:.18em`, uppercase, `#B07D1C`, inline-flex gap `.6rem`
- `.eyebrow-line` — `2rem × 1px`, currentColor, opacity .7
- `.field-label` — Montserrat 600 `.78rem`, `letter-spacing:.02em`, navy, `margin-bottom:.4rem`
- `.field-input` — Source Sans `1rem`, `#1F2430` on white, `border:1px solid rgba(2,38,103,.16)`, radius `.75rem`,
  padding `.78rem 1rem`; focus border `#CE9428` + `0 0 0 3px rgba(206,148,40,.18)`; placeholder `#98A1B2`
- `.field-hint` — `.8rem`, `#6B7488`
- `.prose-iacec p` — `#3A4356`, `margin-bottom:1.15rem`

## Buttons (component `SE` in the live bundle)

Base: `inline-flex items-center justify-center gap-2 rounded-full font-heading font-semibold tracking-wide transition-all duration-300`

| Size | Classes |
| --- | --- |
| sm | `px-5 py-2.5 text-[0.8rem]` |
| md | `px-6 py-3.5 text-sm` |
| lg | `px-8 py-4 text-[0.95rem]` |

| Variant | Classes |
| --- | --- |
| primary | `bg-navy text-white hover:bg-navy-800 shadow-soft` |
| gold | `bg-gold text-navy hover:bg-gold-light shadow-soft` |
| outline | `border border-navy/25 text-navy hover:border-navy hover:bg-navy/[0.04]` |
| ghostLight | `border border-white/35 text-white hover:bg-white/10` |
| white | `bg-white text-navy hover:bg-gold-tint` |
| quiet | `text-navy hover:text-gold` |

Small uppercase links ("LEARN MORE", "READ THE STORY"): `font-heading text-[0.73–0.75rem] font-semibold uppercase tracking-[0.12em]`.

## Layout chrome

- Contact bar (≥1024 only): `bg-navy text-white/75`, `py-2 text-[0.76rem]`, gold lucide icons. Order: city, email | +237 phone, +1 phone.
- Header: `sticky top-0 z-40 bg-white/95 backdrop-blur`, logo `py-3` (scales to .96 when scrolled > 12px).
  Nav `gap-8`, `font-heading text-[0.82rem] font-semibold`, `text-ink/70 hover:text-navy`, active `text-navy`.
  "Get Involved" Radix dropdown: `w-64 rounded-2xl border-navy/10 p-2`, items `rounded-xl px-3 py-2.5 font-body text-[0.9rem] text-ink/75`, focus `bg-accent`.
  Buttons: Contact (outline sm, hidden < 640) and Donate (gold sm). Menu button `h-10 w-10 rounded-full border-navy/15` below 1024.
- Mobile sheet: right side, `w-[86%] max-w-sm`, overlay `bg-black/80`; Home/About/Programmes/News & Events/Contact/Mission & Values,
  "Get involved" heading, the seven Get Involved links, Donate (gold) + Contact us (outline) full-width, email/phone/city.
- Footer: navy with 3px gold gradient rule, grid `lg:grid-cols-[1.4fr_1fr_1fr_1fr]`, column headings `text-[0.68rem] tracking-[0.18em] text-gold-light`.
- WhatsApp: `bg-[#0f7a54]`, fixed bottom-right, label "Chat with us" expands on hover.
- The "Made with Base44" badge is intentionally not reproduced.

## Motion

Reveal (framer-motion on the live site): from `opacity:0; translateY(22px)` to rest, `0.6s`, easing `cubic-bezier(.22,1,.36,1)`,
triggered once when 70px inside the viewport, staggered `index × 0.06s` in grids. Re-implemented with IntersectionObserver
+ CSS (no framer-motion) and disabled under `prefers-reduced-motion`.

Decorative rings: three concentric gold circles (`r=298/232/160`, opacity 1/.6/.4) at per-instance opacity
(.14–.28). Scripture arch: two gold arcs.

## Breakpoints

Tailwind defaults: `sm 640`, `md 768`, `lg 1024`, `xl 1280`. Desktop nav appears at `lg`.

## Assumptions and deliberate differences

1. **News dates.** Live articles have no published date (the `<time>` is empty), and the home page and newsroom list the
   same articles in different orders. We store `publishedAt` (used by the home "latest news" block) plus a manual
   `sortOrder` (used by the newsroom), and a `showDate` flag, seeded off, so the output matches the live site.
2. **Newsletter on /news.** The live /news page has a navy CTA band ("Hear about trainings and events first.") with
   Contact/Volunteer buttons, not a sign-up form. We follow the live site; the newsletter form appears in the footer and on /contact.
3. **Contact map.** The live contact page links to Google Maps instead of embedding one. We do the same; a map embed URL can be set in Site settings and is rendered when present.
4. **Get Involved dropdown** contains seven items (copied above); the brief's footer list "and others" resolves to Donate,
   Sponsor a Child, Volunteer With Us, Sponsors & Partnerships, News, Events & Resources.
5. **Images.** The live site serves AI-generated photographs from Base44's CDN. They were downloaded into `public/media/seed/`
   as WebP and are referenced from the Media library, so they can be replaced in the admin.
6. **404 page.** Reproduces the live (Base44-default) "Page Not Found" layout, including the slate palette.
7. **Empty states** (events, resources, team, testimonies) are reproduced from the live bundle and appear automatically when those collections are empty.
8. **/events and /resources** exist on the live site as tabs of the newsroom; they are separate CMS pages here using the same hub section.
   The "Conferences & Seminars" programme's "Register" link points to `/events` (the live site uses `/news?view=events`, which shows the same tab).
9. **Select fields have no arrow.** The live form component sets `appearance-none` and tries to draw a chevron with
   `bg-[url('data:image/svg+xml;utf8,<svg xmlns=…')]`, but that class contains spaces, so Tailwind never generates it
   (it is absent from the compiled CSS). Live drop-downs therefore render without an arrow; this build reproduces that.
   To add an arrow later, edit `SELECT_CLASS` in `src/components/site/DynamicForm.tsx`.
10. **Form behaviour** is copied from the live bundle: client-side validation messages ("This field is required.",
    "Please confirm to continue.", "Please enter a valid email address."), the "Sending…" state, the gold success card with
    "Send another", and the error text "We could not send this just now. Please try again, or email us directly at info@iacecglobal.com."
11. **Hidden-when-empty sections.** The live home page has an "impact figures" block and the About page a "Leadership"
    block that only render when data exists. Here the About page has a Team section and the home page a Testimonies
    section, both hidden until items are published/approved, so the pages look identical today.
