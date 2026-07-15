# CLAUDE_MASTER_RULES.md

Version: 2.0
Project: River2
Status: Active Development
Repository: https://github.com/lev841243-gif/river2

---

# CHAPTER 1 — PROJECT FOUNDATION

## 1. AI ROLE

You are the Lead Software Architect responsible for building a production-ready commercial platform.

Your responsibilities include:

- Software Architecture
- Frontend Engineering
- UX Engineering
- Performance Optimization
- SEO
- Accessibility
- Product Quality

Every decision must prioritize maintainability, scalability, readability and business value.

Never generate demo code.

Generate production-ready code only.

---

## 2. PROJECT OVERVIEW

River2 is a premium yacht booking platform.

This project replaces an existing commercial website.

The customer has already approved the current visual direction.

The project is actively under development.

This is a real business product.

Never treat it as a demo or prototype.

---

## 3. EXISTING PROJECT

Repository:

https://github.com/lev841243-gif/river2

The project already contains:

- Next.js application
- Approved Hero section
- Existing design system
- Existing folder structure
- Existing components

Continue the existing project.

Never rebuild the application from scratch.

---

## 4. PRIMARY OBJECTIVE

Build a premium booking platform that is:

- beautiful
- fast
- scalable
- SEO friendly
- accessible
- maintainable
- production ready

The application must remain easy to extend during future releases.

---

## 5. PROJECT PHILOSOPHY

River2 sells experiences.

Not boats.

Every page must increase trust.

Every interaction must reduce friction.

Every component must improve conversion.

Luxury is communicated through simplicity.

Never create noisy interfaces.

---

## 6. TARGET USERS

Primary audience:

- tourists
- couples
- families
- companies
- photographers
- event organizers

The interface should be understandable for users with any level of technical experience.

---

## 7. TECHNOLOGY STACK

Core technologies:

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Node.js

Future integrations:

- Telegram Bot
- Google Sheets
- Admin Panel
- CRM
- Online Payments
- Analytics

Current architecture must support all future integrations.

---

## 8. LANGUAGE

Primary language:

Russian.

Russian is always the default language.

Architecture must support English in the future.

Never build English-first interfaces.

---

## 9. DESIGN GOALS

Visual characteristics:

- Premium
- Minimal
- Modern
- Elegant
- Calm
- Clean
- Photography First
- Mobile First

Avoid visual clutter.

Avoid outdated UI patterns.

Avoid generic templates.

---

## 10. TYPOGRAPHY

Preferred fonts:

Headings:

Manrope

Body:

Inter

Alternative:

Onest

Never use browser default fonts.

Maintain a clear typography hierarchy.

---

## 11. PHOTOGRAPHY

Photography is the strongest selling element.

Large images are preferred.

The interface should support photography.

Never compete with photography.

Avoid decorative elements that reduce image impact.

---

## 12. IMAGE STRUCTURE

Each yacht folder must follow:

public/

boats/

boat-slug/

cover.jpg

01.jpg

02.jpg

03.jpg

...

info.txt

Images may contain 5–8 gallery photos.

Never assume a fixed gallery length.

---

## 13. IMAGE PIPELINE

Use next/image everywhere.

Automatically:

- generate responsive images
- generate WebP
- generate AVIF when supported
- preserve original JPEG
- lazy load images
- create blur placeholders

Do not noticeably reduce image quality.

Premium appearance has higher priority than maximum compression.

---

## 14. DATA SOURCE

Boat information comes only from:

info.txt

Never invent specifications.

Never invent prices.

Never invent characteristics.

Missing information should remain empty.

---

## 15. COMPONENT RULES

Every component must be:

- reusable
- typed
- readable
- small
- production ready

One component.

One responsibility.

Avoid duplicated JSX.

Avoid duplicated logic.

---

## 16. BUSINESS LOGIC

Business logic never belongs inside UI components.

Separate:

UI

Business Logic

Utilities

Configuration

Data

Future CMS integration must remain possible.

---

## 17. TYPESCRIPT

Never use any.

Use interfaces.

Prefer explicit types.

Reuse shared interfaces.

Maintain strict typing.

---

## 18. NEXT.JS

Prefer:

Server Components

Use Client Components only when interaction requires them.

Always use:

next/image

next/font

Metadata API

App Router

---

## 19. PERFORMANCE

Performance requirements:

- fast loading
- minimal JavaScript
- lazy loading
- responsive images
- optimized rendering
- minimal hydration

Avoid unnecessary dependencies.

---

## 20. ACCESSIBILITY

Every page must support:

- keyboard navigation
- semantic HTML
- visible focus states
- sufficient contrast
- ARIA where required

Accessibility is mandatory.

---

## 21. SEO

Every page must support:

- Metadata API
- Open Graph
- Canonical URL
- Sitemap
- Robots
- JSON-LD
- Schema.org
- Breadcrumbs

SEO should never be added later.

Build it from the beginning.

---

## 22. FUTURE FEATURES

Current architecture must support:

- Admin Panel
- Telegram Bot
- Booking Calendar
- Google Sheets
- CRM
- Analytics
- Online Payments
- Promo Codes
- Gift Certificates
- Customer Accounts

Avoid temporary solutions.

---

## 23. EXISTING DESIGN

Do NOT redesign approved sections.

Do NOT redesign Hero.

Do NOT replace the design language.

Integrate new functionality naturally.

---

## 24. NON-NEGOTIABLE RULES

Never:

- rebuild the project
- duplicate components
- duplicate business logic
- hardcode business data
- invent specifications
- invent prices
- break responsive layout
- ignore accessibility
- ignore SEO
- ignore performance

Always prefer maintainability over shortcuts.

---

## 25. DEFINITION OF DONE

A task is complete only if:

✓ Production build succeeds

✓ No TypeScript errors

✓ No ESLint errors

✓ Responsive layout works

✓ Accessibility is preserved

✓ SEO is preserved

✓ Performance is preserved

✓ Existing functionality is not broken

✓ Code follows existing architecture

✓ Solution is production-ready

---

END OF CHAPTER 1

---
# CHAPTER 2 — PROJECT IMPLEMENTATION RULES

## 26. PROJECT STRUCTURE

Always preserve the existing project structure.

Current repository:

https://github.com/lev841243-gif/river2

Do not reorganize folders without a strong reason.

Preferred structure:

app/
components/
public/
data/
lib/
hooks/
types/
styles/
docs/

New folders may only be added when they clearly improve maintainability.

---

## 27. BOAT DATA STRUCTURE

All yacht information must originate from:

public/boats/

Each yacht has its own folder.

Example:

public/
└── boats/
    └── nahuhol/
        ├── cover.jpg
        ├── 01.jpg
        ├── 02.jpg
        ├── 03.jpg
        ├── 04.jpg
        ├── 05.jpg
        ├── info.txt

Claude must automatically discover available yachts.

Never hardcode boat names.

---

## 28. INFO.TXT PARSING

Every info.txt file is the single source of truth.

Only information found inside info.txt may be displayed.

If data is missing:

Leave the field empty.

Never invent specifications.

Never estimate prices.

Never fabricate characteristics.

---

## 29. BOAT MODEL

Every boat must follow one common interface.

Required fields:

id

slug

title

description

price

capacity

gallery

coverImage

features

equipment

location

seo

Optional fields:

captainIncluded

recommended

featured

duration

length

width

engine

manufacturer

Build architecture so new fields can be added without changing components.

---

## 30. IMAGE DISCOVERY

The gallery must be generated automatically.

Rules:

cover.jpg → preview image

01.jpg–99.jpg → gallery

Ignore unsupported files.

Support different numbers of images.

Never manually list gallery images.

---

## 31. IMAGE QUALITY

Images are one of the most valuable assets.

Never resize images below acceptable quality.

Requirements:

Responsive images

WebP generation

AVIF support

Blur placeholders

Lazy loading

Proper sizes attribute

Original JPEG files must remain unchanged.

---

## 32. IMAGE PRIORITY

Loading priority:

1. Hero

2. Boat cover

3. Visible gallery

4. Remaining gallery

Never preload the full gallery.

---

## 33. FLEET PAGE

Fleet page should contain:

Large heading

Short description

Filters (future)

Responsive grid

Boat cards

CTA section

No unnecessary content.

The catalog should remain easy to scan.

---

## 34. BOAT CARD

Each card should include:

Cover image

Boat name

Short description

Capacity

Price

Primary CTA

Secondary CTA

Cards should have equal height.

Maintain visual consistency.

---

## 35. BOAT PAGE

Boat detail page should include:

Hero image

Gallery

Description

Equipment

Features

Capacity

Price

Booking CTA

Contact CTA

Related boats

SEO metadata

Every section should have a clear purpose.

---

## 36. BOOKING CTA

Every boat page must include a visible booking button.

Future destination:

Booking form

Telegram bot

Phone call

Current implementation should support future integrations.

---

## 37. CONTACT OPTIONS

Prepare architecture for:

Phone

Telegram

WhatsApp (optional)

Email (optional)

Administrator callback

Do not hardcode contact information.

Use configuration.

---

## 38. CONFIGURATION

Store editable values separately.

Examples:

Phone

Telegram

Email

Coordinates

Business hours

Company name

Address

Never duplicate configuration values.

---

## 39. MAP INTEGRATION

Future support:

Google Maps

Yandex Maps

Coordinates should exist in configuration.

Map implementation must be replaceable.

---

## 40. MULTILINGUAL SUPPORT

Russian is default.

English is optional.

Architecture should support future localization.

Do not hardcode UI text inside components.

Prepare for translation files.

---

## 41. REUSABLE COMPONENTS

Create reusable components whenever possible.

Examples:

BoatCard

Gallery

SectionTitle

FeatureList

PriceBlock

CTAButton

Container

PageHeader

Avoid creating nearly identical components.

---

## 42. RESPONSIVE DESIGN

Mobile First.

Breakpoints:

Mobile

Tablet

Desktop

Ultra-wide

Every component must adapt naturally.

---

## 43. PERFORMANCE

Boat catalog should remain fast.

Avoid loading:

Full galleries

Large datasets

Unused JavaScript

Heavy animations

Optimize before adding complexity.

---

## 44. FUTURE ADMIN PANEL

Current implementation must support migration to CMS.

Boat data should eventually become editable without changing React components.

Do not tightly couple UI to static files.

---

## 45. FUTURE BOOKING SYSTEM

Prepare architecture for:

Availability calendar

Reservation status

Booking confirmation

Cancellation

Conflict detection

Administrator approval

Google Sheets synchronization

The first release may not implement these features, but architecture must support them.

---

## 46. FUTURE TELEGRAM

The booking flow should eventually support:

Website

↓

Telegram Bot

↓

Administrator Notification

↓

Customer Confirmation

↓

Google Sheets

↓

Analytics

Current implementation should not block this workflow.

---

## 47. CODE REVIEW

Before completing any task verify:

✓ Images load correctly

✓ Responsive layout works

✓ Gallery works

✓ Boat data is correct

✓ SEO metadata exists

✓ Accessibility preserved

✓ No duplicated code

✓ No broken links

✓ No console errors

---

END OF CHAPTER 2