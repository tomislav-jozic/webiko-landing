Single source of truth for AI coding agents (Cursor, Claude Code, and similar). Stable rules live here in prose. Exact imports, hook signatures, and file structure change over time—open neighboring files in this app and match those patterns instead of inventing new ones.

Philosophy
Less code is better. Prefer simplicity over cleverness; one clear responsibility per module.
Do not duplicate logic—extract shared helpers into lib/ instead of copy-pasting between components.
Be skeptical of assumptions: read the codebase (call sites, types, existing modules) before changing behavior.
Do not run build, typecheck, or lint unless the user explicitly asks. Prefer careful implementation over burning cycles in the agent loop.
Do not add test scripts or new documentation files unless the user approves.
No emoji in code or user-facing strings you add.
This project tracks recent, fast-moving Next.js releases with real breaking changes—check the installed version's own docs/types before assuming an API from training data, especially around App Router conventions.

TypeScript
Everything must be properly typed or clearly inferred. No shortcuts.

Do not use

any to "make it compile."
Unsafe casts (as SomeType) to silence the checker. as const is allowed when it narrows, not when it lies about types.
Non-null assertions (!) to pretend a value exists.
Do use

Runtime checks, guards, and early throw (or controlled error returns) so control flow narrows types.
Named type guards when validating unknown or external data (API bodies, form input).
Enums or const maps for fixed domain sets; avoid scattering the same magic strings for one concept across the codebase. String unions are fine when they stay localized and intentional.

Product copy
No inline product copy—user-facing strings live in lib/copy.ts, not raw literals scattered across JSX. Import them where needed.

Server components and data loading
Prefer server components for anything that doesn't need interactivity; reach for a client component only when you need state, effects, or browser APIs.
When multiple server requests do not depend on each other, run them in parallel rather than sequentially.
Early returns—if required data is missing or invalid, return notFound(), null, or an explicit empty/error UI immediately instead of nesting the happy path deeply.

Client components and React behavior
Presentation vs. orchestration—split "dumb" pieces (no assumptions about page layout, no reach-through into siblings' state) from the component that owns state and composes them. See components/WebikoStage.tsx (orchestrator) versus components/Hero.tsx, NavMenu.tsx, etc. (presentational, each with its own self-contained animation where one exists).
Rendering rules

Render is pure—while rendering, do not update React state, do not call parent callbacks that set parent state, and do not trigger network or imperative side effects.
Registering callbacks with parents, syncing to non-React systems, or subscribing belongs in useEffect (or event handlers), not in the render path.
Effects

Minimize useEffect. Prefer values derived during render and logic in event handlers. Use effects for true external synchronization: subscriptions, timers tied to the DOM, bridging to imperative APIs (GSAP), keeping a ref in sync with the latest prop/state for a stable-deps effect closure to read.
Do not use an effect merely to recompute something you can derive from props/state.
Pure helpers

Functions that do not close over component instance state should live outside the component, at module scope (or in lib/ if more than one component needs them—see lib/hooks.ts).
API shape

No boolean "mode" parameters that flip unrelated behavior inside one function. Prefer two named functions or explicit variants so call sites stay readable.
When several booleans represent phases of one process (open / opening / closing), prefer one explicit state (enum or discriminated union) so impossible combinations do not exist.

Component props
Always type Props (not interface) for a component's props.
Do not export a separate MyComponentProps alias; consumers should use ComponentProps<typeof MyComponent> when they need the type.

Styling and layout
Prefer flex/grid gap for spacing between siblings instead of stacking margins on each child.
CSS Modules per component (Component.module.css), colocated with the component that uses it—no shared catch-all stylesheet. Inline style={} is reserved for values that are genuinely dynamic per frame or per state (see the letter-weight/position values in components/Hero.tsx), not a substitute for the module.

Naming conventions
Components: PascalCase.
Booleans: is*, has*, should*.

Logging
Add meaningful logs for operations that explain system behavior (failure to recover, unexpected branches)—use console.info, console.warn, or console.error as appropriate.

App source layout
app/—App Router routes and layouts.
components/—one component per file, each with its colocated Component.module.css.
lib/—shared constants (site.ts), copy (copy.ts), and hooks (hooks.ts).

Collocated docs and repo metadata
If a directory or parent path contains a docs/ folder, read the relevant markdown before large or architectural edits.
When you change how the app is structured, update this file and any README that still describes the old layout.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
