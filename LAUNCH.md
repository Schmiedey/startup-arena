# Likelyr Launch Runbook

## Final Production Checks

1. Sign in with the owner account and open `/admin`.
2. Open `/admin/analytics` and confirm page views are being recorded.
3. Submit a test idea and confirm the event appears in analytics.
4. Vote in a battle and confirm idea Elo changes, predictor Elo feedback appears, and the vote appears in analytics.
5. Open `/leaderboard`, switch to `Predictors`, and confirm the empty state or ranked users load without API errors.
6. Confirm weak matchups show provisional predictor feedback and do not change predictor Elo.
7. Confirm strong/prior-signal matchups change predictor Elo and update dashboard predictor stats.
8. Confirm duplicate votes return a friendly duplicate-vote message.
9. Confirm a user cannot vote on their own idea.
10. Run a Stripe test-mode purchase:
   - Launch Pass should set the user plan to `launch`.
   - Founder Pro should set the user plan to `pro`.
   - Canceling Founder Pro should remove `pro` after the webhook runs.
11. Check Stripe webhook deliveries for `200` responses.
12. Check Vercel runtime logs after the purchase flow.
13. Confirm `$pageview`, `page_view`, `session_started`, `ui_clicked`, `user_signed_up`, `idea_submitted`, `vote_created`, and `checkout_completed` arrive in the [Likelyr Growth Command Center](https://us.posthog.com/project/446290/dashboard/1646417).
14. Confirm PostHog authorized URLs include `https://likelyr.com`, `https://www.likelyr.com`, and the production Vercel domain.

## Beta Liquidity Gate

Do not do a broad public launch until the app feels alive:

- At least 75 public ideas.
- At least 300 total votes.
- At least 10 ranked predictor profiles.
- At least 20 completed battles where both ideas have prior vote history.
- No empty-state predictor leaderboard after the first invite wave.

Current launch seed can be applied with:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/seed-growth.sql
```

`seed-growth.sql` skips existing idea names, so it is safe to re-run.

## First Invite Wave

Invite 10-20 people manually. Ask each person to:

1. Sign in.
2. Vote through 20 battles.
3. Submit one idea if they have one.
4. Screenshot or describe anything confusing.

Watch for:

- People misunderstanding predictor Elo as objective startup truth.
- People gaming by choosing obvious winners.
- Battle cards with too little information to make a choice.
- Any drop-off before five votes.

## Live Stripe Cutover

The app is currently wired for Stripe test mode. Before taking real money:

1. Create live Stripe products/prices or keep inline prices if the launch prices are final.
2. Replace Vercel Production values for:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
3. Create a live Stripe webhook endpoint for:
   - `https://likelyr.com/api/webhooks/stripe`
4. Subscribe the live webhook to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Redeploy production.
6. Run one live low-dollar purchase and refund it from Stripe.

## Launch-Day Monitoring

Watch these during the first 24 hours:

- [PostHog live events, activation funnel, session replay/error tracking health](https://us.posthog.com/project/446290/dashboard/1646417)
- Stripe webhook failures
- Vercel function errors
- `/admin/analytics` checkout started vs checkout completed
- Idea submission 402 upgrade rate
- Vote volume and duplicate-vote errors
- Comment spam and flag volume

## Rollback

If payments fail, pause paid CTAs by hiding `/pricing` links or temporarily returning maintenance copy from `/api/checkout`. Do not delete Stripe customers or subscriptions during rollback; fix entitlement sync first.
