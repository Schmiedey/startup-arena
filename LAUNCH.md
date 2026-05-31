# Likelyr Launch Runbook

## Final Production Checks

1. Sign in with the owner account and open `/admin`.
2. Open `/admin/analytics` and confirm page views are being recorded.
3. Submit a test idea and confirm the event appears in analytics.
4. Vote in a battle and confirm Elo changes and the vote appears in analytics.
5. Run a Stripe test-mode purchase:
   - Launch Pass should set the user plan to `launch`.
   - Founder Pro should set the user plan to `pro`.
   - Canceling Founder Pro should remove `pro` after the webhook runs.
6. Check Stripe webhook deliveries for `200` responses.
7. Check Vercel runtime logs after the purchase flow.
8. Confirm `$pageview`, `page_view`, `session_started`, `ui_clicked`, `user_signed_up`, `idea_submitted`, `vote_created`, and `checkout_completed` arrive in the [Likelyr Growth Command Center](https://us.posthog.com/project/446290/dashboard/1646417).
9. Confirm PostHog authorized URLs include `https://likelyr.com`, `https://www.likelyr.com`, and the production Vercel domain.

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
