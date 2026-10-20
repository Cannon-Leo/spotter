# Spotter

> **Member-facing web application for gym member independence.**

Spotter is an official member portal built for a 400-member gym. It gives members immediate self-service access to check in, review private attendance and ledger balance records, get grounded answers from verified gym documentation, and pay subscription fees with automated activation—all with zero ads, zero clutter, and zero staff bottlenecks.

---

## 🎯 Core Features

Spotter centers around five foundational features designed strictly for member self-reliance:

1. **Check In**
   - Single-use daily check-in code generated in-app and entered on the facility keypad during operating hours for instant access confirmation.
2. **My Records**
   - Private attendance history and real-time ledger balance strictly scoped to the authenticated member session ID.
3. **Ask About The Gym**
   - Retrieval-augmented Q&A grounded only in the gym's approved shared knowledge cards. Outdated or missing answers are never guessed; if no record exists, Spotter states so in one sentence and hands off to staff.
4. **Pay & Renew**
   - Seamless subscription renewal and arrears payment via payment gateway webhooks. Confirmed payments instantly extend membership without manual front desk reconciliation.
5. **Ask The Desk**
   - Clean fail-safe handoff: when a question is outside approved records or on the refusal list, Spotter identifies the on-duty front desk officer and opens WhatsApp with the member's query pre-typed.

---

## 👥 Personas & Access Boundaries

- **Member**: The only user who accesses the member portal. Signs in or activates an account, generates check-in codes, reviews personal records, asks grounded questions, and pays fees.
- **Staff (Front Desk Officers)**: Use an internal administrative interface. Draft content cards for approval, set the daily check-in code, issue 8-character activation codes, and handle manual walk-in check-ins.
- **Owner**: Maintains the member list, approves content cards, reviews cash/transfer reconciliations, and conducts weekly answer audits and reported response reviews.

---

## 🛠️ Tech Stack & Architecture

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Components & Client Component boundaries)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict typing, `tsc --noEmit` validation)
- **Styling & Tokens**: Custom Design System defined in `design-tokens.tokens.json` compiled to CSS Custom Properties (`styles/tokens.css`, `styles/globals.css`).
- **Theme & Accessibility**: System-wide dark/light mode engine with WCAG AAA contrast, pure white light mode (`#ffffff`), and full `prefers-reduced-motion` compliance.
- **UI & Motion**: Sticky navigation with frosted glass backdrop blur (`top: 0px`) and an abstract, non-intrusive animated geometric striped canvas.
- **Legal & Compliance**: Nigeria Data Protection Act 2023 (NDPA) and NDPR-compliant privacy notice and member terms integrated as instant in-page conditional views.
- **Database & ORM**: PostgreSQL with `pgvector` for semantic card chunk embeddings via [Prisma ORM](https://www.prisma.io/).
- **AI & Grounding**: Google Gemini API for semantic retrieval, answers, and strict grounding verification against approved source records.
- **Authentication**: Secure HttpOnly session cookies (`src/server/auth/session.ts`) isolating all private record queries by session member ID.

---

## 📁 Repository Structure

```text
spotter/
├── app/                       # Next.js App Router
│   ├── api/auth/              # Authentication routes (login, activate, logout, session)
│   ├── create-account/        # Dedicated member activation & onboarding page
│   ├── login/                 # Dedicated member sign-in page
│   ├── reset-password/        # Member PIN reset instructions & desk handoff
│   ├── favicon.ico/           # Dynamic favicon endpoint
│   ├── footer.tsx             # Global accessible footer component with legal links
│   ├── footer.module.css      # Scoped footer styling and layout
│   ├── home-view.tsx          # Client view for member marketing, portal home, and legal views
│   ├── layout.tsx             # Root application layout with fonts, metadata, and theme script
│   ├── legal.module.css       # Scoped styling for NDPA privacy and terms views
│   ├── page.tsx               # Server-rendered marketing page with dynamic SEO
│   ├── page.module.css        # Scoped styling for member views and sticky navigation
│   ├── privacy-view.tsx       # In-page NDPA 2023 compliant privacy notice view
│   ├── spotter-logo.tsx       # Brand logo component
│   ├── striped-background.tsx # Multi-layer animated geometric background
│   ├── striped-background.module.css # Background animation keyframes and responsive tracks
│   ├── terms-view.tsx         # In-page member terms of service view
│   ├── theme-toggle.tsx       # Accessible light/dark theme switch
│   └── auth.module.css        # Scoped styling for authentication forms
├── public/                    # Static assets
├── scripts/                   # Utility scripts (e.g. design token compiler)
├── styles/                    # Global styling & token definitions
│   ├── globals.css            # Base resets, overflow clipping, and element defaults
│   └── tokens.css             # Compiled design system tokens (light and dark mode roles)
├── design-tokens.tokens.json  # Single source of truth for design tokens
├── package.json               # Dependencies and build scripts
└── tsconfig.json              # TypeScript compiler configuration
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.17.0 or higher recommended)
- [npm](https://www.npmjs.com/) (v9 or higher)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Cannon-Leo/spotter.git
   cd spotter
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Compile design tokens** (optional if tokens are modified):
   ```bash
   npm run build-tokens
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## 🧪 Quality & Verification

Run static analysis and build verification:

```bash
# Type-check TypeScript code
npm run type-check

# Run ESLint validation
npm run lint

# Compile production build
npm run build
```

---

## 🔒 Security & Privacy Principles

1. **Strict Session Isolation**: Every member query and private read is authorized solely from the secure session cookie. Member IDs are never trusted from client request bodies.
2. **Deterministic Grounding**: Unapproved content, speculative advice, or off-limits topics (medical advice, door override status, discounts/waivers) are rejected deterministically before retrieval.
3. **No Phantom Records**: Balances and payments require verified server-side proofs or webhooks; browser redirects are never treated as confirmation.

---

## 📄 License

Private and proprietary. All rights reserved.
