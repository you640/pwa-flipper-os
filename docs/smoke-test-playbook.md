# Smoke Test Playbook

This playbook is intended for terminal-driven smoke testing against the currently configured Supabase project.

## 1. Bootstrap Variables

Run these commands from the repository root:

```bash
cd /Users/erikbabcan/Projects/02_Products/pwa-flipper-os

export PROJECT_REF=$(sed -n 's/^project_id = "\(.*\)"$/\1/p' supabase/config.toml)
export SUPABASE_URL=$(sed -n 's/^VITE_SUPABASE_URL="\(.*\)"$/\1/p' .env)
export SUPABASE_ANON_KEY=$(sed -n 's/^VITE_SUPABASE_PUBLISHABLE_KEY="\(.*\)"$/\1/p' .env)

export TEST_ORIGIN="http://localhost:8080"
export TEST_USER_JWT="paste-access-token-for-a-test-user-here"
export TEST_USER_ID="paste-test-user-uuid-here"
export TEST_LEAD_ID="paste-crm-lead-uuid-here"
export TEST_PORTFOLIO_ID="paste-portfolio-uuid-here"
export TEST_REPO_URL="https://github.com/owner/repo"
```

Quick sanity check:

```bash
printf 'PROJECT_REF=%s\nSUPABASE_URL=%s\n' "$PROJECT_REF" "$SUPABASE_URL"
```

## 2. Verify Deployment Surface

List deployed edge functions:

```bash
npx supabase functions list --project-ref "$PROJECT_REF"
```

List secret names present in the project:

```bash
npx supabase secrets list --project-ref "$PROJECT_REF"
```

Expected functions:

- `valuate-pwa`
- `draft-outreach`
- `create-checkout`
- `customer-portal`
- `stripe-webhook`
- `delete-account`

Expected project secrets:

- `LOVABLE_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_PRO_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET`
- optional `GITHUB_TOKEN`

## 3. Anonymous Valuation Smoke Test

```bash
curl -sS "$SUPABASE_URL/functions/v1/valuate-pwa" \
  -H "Content-Type: application/json" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -d "{\
    \"name\":\"Smoke Test App\",\
    \"url\":\"https://example.com\",\
    \"github_url\":\"$TEST_REPO_URL\",\
    \"mrr\":1500,\
    \"expenses\":300,\
    \"niche\":\"Developer tools\",\
    \"tech_stack\":\"React, TypeScript, Supabase\",\
    \"notes\":\"Anonymous smoke test\",\
    \"anonymous\":true\
  }"
```

Expected result: JSON valuation response or a controlled `anon_limit` or `rate_limit` error. No HTML, no 401, no generic 500.

## 4. Authenticated Valuation Smoke Test

```bash
curl -sS "$SUPABASE_URL/functions/v1/valuate-pwa" \
  -H "Content-Type: application/json" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $TEST_USER_JWT" \
  -d "{\
    \"name\":\"Signed In Smoke Test App\",\
    \"url\":\"https://example.com\",\
    \"github_url\":\"$TEST_REPO_URL\",\
    \"mrr\":2200,\
    \"expenses\":450,\
    \"niche\":\"B2B SaaS\",\
    \"tech_stack\":\"Vite, React, Supabase\",\
    \"notes\":\"Authenticated smoke test\"\
  }"
```

Expected result: JSON valuation report, not `Unauthorized`.

## 5. Outreach Draft Smoke Test

```bash
curl -sS "$SUPABASE_URL/functions/v1/draft-outreach" \
  -H "Content-Type: application/json" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $TEST_USER_JWT" \
  -d "{\
    \"lead_id\":\"$TEST_LEAD_ID\",\
    \"portfolio_id\":\"$TEST_PORTFOLIO_ID\"\
  }"
```

Expected result: JSON with `draft.subject` and `draft.body_markdown`.

## 6. Checkout Session Smoke Test

```bash
curl -sS "$SUPABASE_URL/functions/v1/create-checkout" \
  -H "Content-Type: application/json" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $TEST_USER_JWT" \
  -d "{\
    \"origin\":\"$TEST_ORIGIN\"\
  }"
```

Expected result: JSON containing a Stripe Checkout `url` or `alreadyActive: true` for a user that is already on Pro.

## 7. Customer Portal Smoke Test

```bash
curl -sS "$SUPABASE_URL/functions/v1/customer-portal" \
  -H "Content-Type: application/json" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $TEST_USER_JWT" \
  -d "{\
    \"origin\":\"$TEST_ORIGIN\"\
  }"
```

Expected result: JSON containing a Stripe Billing Portal `url`. A `No billing account found` error means the test user has no linked Stripe customer yet.

## 8. Stripe Webhook Smoke Test

If the deployed Stripe webhook endpoint is already configured in Stripe test mode for this project, trigger test events from Stripe CLI:

```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
```

Expected result: the configured webhook endpoint for `$SUPABASE_URL/functions/v1/stripe-webhook` receives the events and updates the `subscriptions` table. If these commands do nothing useful, the Stripe account is likely not pointing at the deployed endpoint for this Supabase project.

## 9. Delete Account Smoke Test

Use a disposable test user only:

```bash
curl -sS "$SUPABASE_URL/functions/v1/delete-account" \
  -H "Content-Type: application/json" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $TEST_USER_JWT"
```

Expected result: `{"ok":true}`.

## 10. Frontend Validation

```bash
bun run lint
bun run test
bun run build
```

Expected result: lint clean, tests passing, and build success. The `caniuse-lite` warning is non-fatal.

## 11. Fast Failure Checks

If a command fails, these are the fastest likely causes:

- `Unauthorized`: invalid or expired `TEST_USER_JWT`
- `Missing env var`: missing project secret in Supabase
- `No billing account found`: test user has no Stripe customer yet
- `ai_error` or GitHub fetch failure: `LOVABLE_API_KEY` or `GITHUB_TOKEN` issue
- deploy/list/secrets CLI failure: wrong project access or wrong logged-in Supabase profile
