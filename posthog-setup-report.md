<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of your project. PostHog was already substantially wired up — `posthog-js`, `posthog-node`, `src/lib/posthog-client.ts`, `src/lib/posthog-server.ts`, `src/instrumentation-client.ts`, and the `AnalyticsTracker` component were all in place. The wizard completed the integration by:

1. **Environment variables** — wrote `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` to `.env.local`.
2. **Reverse proxy** — added `/ingest/static/*`, `/ingest/array/*`, and `/ingest/*` rewrites to `next.config.ts` along with `skipTrailingSlashRedirect: true`, so all PostHog traffic routes through your own domain to avoid ad-blockers.
3. **Client init** — updated `src/lib/posthog-client.ts` to use `api_host: "/ingest"` (the reverse proxy) and `ui_host` pointing at the PostHog app, matching the recommended App Router pattern.
4. **New events** — added 5 gap events across 3 files (see table below).

| Event | Description | File |
|---|---|---|
| `idea_shared` | User shares an idea via native share or clipboard copy | `src/app/idea/[id]/page.tsx` |
| `challenge_share_clicked` | User clicks "Share challenge" to spread a challenge link | `src/app/idea/[id]/page.tsx` |
| `idea_deleted` | Owner or admin successfully deletes an idea | `src/app/idea/[id]/page.tsx` |
| `comment_posted` | User successfully posts a comment on an idea | `src/components/comment-section.tsx` |
| `battle_skipped` | User clicks "Skip this matchup" without voting | `src/app/battle/page.tsx` |

These supplement a large set of events already instrumented in the project: `user_signed_up`, `user_signed_in`, `vote_created`, `vote_completed`, `vote_reason_added`, `vote_reason_submitted`, `checkout_cta_clicked`, `checkout_started`, `checkout_completed`, `subscription_updated`, `subscription_deleted`, `idea_submit_completed`, `idea_limit_hit`, `battle_shared`, `checkout_success_landed`, `session_started`, `page_view`, `ui_clicked`, `web_vital`, `client_error`, and `route_change_started`.

User identification is handled by `AnalyticsTracker` → `identifyAnalyticsUser()` → `posthog.identify()` on every session load, with `posthog.reset()` on sign-out. Browser-originated events are captured by `posthog-js` and separately saved to first-party analytics through `/api/events`; server-only events still use `posthog-node` with `userId` as `distinctId` for cross-domain correlation. Pageview payloads include PostHog's expected `$current_url`, `$pathname`, `$host`, `$title`, and `$referrer` fields so product and web analytics dashboards can group traffic correctly. Session recording is explicitly started in the browser after PostHog initialization so launch traffic produces replays.

## Next steps

We've built a professional growth command center plus focused insights for user behavior:

- [Likelyr Growth Command Center](https://us.posthog.com/project/446290/dashboard/1646417)
- [Executive scorecard](https://us.posthog.com/project/446290/insights/sHNcti7O)
- [Growth trend: traffic to conversion](https://us.posthog.com/project/446290/insights/uPEeXLnT)
- [Acquisition channels](https://us.posthog.com/project/446290/insights/I2c9Dodi)
- [Landing pages and conversion](https://us.posthog.com/project/446290/insights/7PQRks5U)
- [Activation funnel: visitor to paid](https://us.posthog.com/project/446290/insights/ZibBz9uJ)
- [Product engagement by action](https://us.posthog.com/project/446290/insights/2ZbEnKca)
- [Revenue funnel](https://us.posthog.com/project/446290/insights/imKgRjPs)
- [Web vitals and UX quality](https://us.posthog.com/project/446290/insights/XwZg0Ybq)
- [Errors and rage signals](https://us.posthog.com/project/446290/insights/9CVlKlsG)
- [Recent user behavior feed](https://us.posthog.com/project/446290/insights/qwBzmv1W)
- [Instrumentation health: event inventory](https://us.posthog.com/project/446290/insights/gSYPL1YL)

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
