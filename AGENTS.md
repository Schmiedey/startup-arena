<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Checks

- `npm run lint`
- `npm test`
- `npm run build`

## Local Conventions

- Use `src/proxy.ts` for request interception; `middleware.ts` is deprecated in this Next.js version.
- Keep vote writes transactional: vote insert, Elo updates, and battle counters must commit or roll back together.
- Validate idea create/update payloads through `src/lib/validation.ts`.
- Use `requireAdmin()` from `src/lib/admin.ts` for admin API routes.
