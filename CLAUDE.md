# CLAUDE.md

## Project Memory

## Stack
- Next.js app router
- React
- TypeScript
- Tailwind CSS
- ESLint
- Playwright
- Vitest or Jest

## Plugins
- Use the Superpowers plugin to brainstorm, plan, and execute coding tasks.
- Use it to break down large tasks into smaller steps before making changes.
- Use it to explore implementation options, compare approaches, and choose the safest path.
- Use it to create a short execution plan before touching multiple files or making architectural changes.
- Prefer structured planning first, then implementation, then verification.

## Goals
- Keep code simple, typed, and production-ready.
- Prefer small focused edits over broad rewrites.
- Preserve existing architecture unless there is a clear reason to refactor.
- Optimize for readability, maintainability, and predictable performance.

## Code Style
- Use TypeScript strictly; avoid `any` unless unavoidable.
- Prefer server components by default; use client components only when needed.
- Keep components small and composable.
- Extract repeated UI into reusable components.
- Avoid deeply nested conditionals in JSX.
- Prefer clear names over abbreviations.
- Add comments only when they explain intent, not obvious code.

## Next.js Rules
- Keep route logic inside `app/`.
- Put shared UI in `components/`.
- Put utilities in `lib/`.
- Put server actions close to the feature that uses them.
- Validate user input at boundaries.
- Do not introduce new global state unless clearly needed.
- Prefer built-in Next.js patterns before third-party abstractions.

## Performance Rules
- Minimize unnecessary client components.
- Avoid passing unstable inline objects/functions deep into trees.
- Use dynamic import for heavy client-only modules.
- Memoize only when profiling or repeated renders justify it.
- Watch bundle size for large UI/chart/editor libraries.
- Prefer pagination, virtualization, or incremental rendering for large lists.

## Testing Rules
- For UI changes, add or update Playwright coverage for critical paths.
- For utility logic, add unit tests.
- Do not claim code works unless lint, typecheck, and relevant tests pass.

## Safe Change Process
1. Read the relevant files first.
2. Make the smallest correct change.
3. Run targeted checks first, then broader checks if needed.
4. Summarize what changed, risks, and follow-up work.

## Commands
- dev: `npm run dev`
- lint: `npm run lint`
- typecheck: `npm run typecheck`
- test: `npm run test`
- e2e: `npm run test:e2e`

## Naming
- camelCase for variables and functions
- PascalCase for components, classes, and types
- UPPER_SNAKE_CASE for constants
- Booleans should read like questions: `isLoading`, `hasError`, `canSubmit`

## Function Rules
- One job per function.
- Handle errors explicitly — no silent failures.
- No magic numbers; use named constants.
- Write code as if a junior developer will read it in 6 months.

## Error Handling
- Never swallow exceptions silently.
- Log errors with useful context.
- User-facing errors must never expose stack traces.

## Git & PRs
- Keep diffs small and focused — one concern per PR.
- Commit messages should be imperative and under 72 characters.
- Run relevant tests before pushing.

## Avoid
- Editing unrelated files
- Silent breaking changes
- Large refactors without justification
- Reading `.env*` or secrets files unless explicitly requested
- Adding new dependencies for something achievable with the existing stack
- Assuming the user wants a full rewrite when a targeted fix is asked for

## Lessons Learned
<!-- Add rules here when Claude makes a mistake. One line per lesson. -->
<!-- Example: Always check for null before accessing .data on API responses -->