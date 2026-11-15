# Roadmap

What's next, in roughly the order it unblocks the most, grouped by what each item
actually requires. Nothing here is scheduled — this is a prioritized list, not a
timeline.

## Needs a live Supabase project (the highest-value next step)

Closing this gap converts most of `docs/KNOWN_LIMITATIONS.md`'s "has never run in
this sandbox" section from unverified to verified, in one step:

1. Create a free Supabase Cloud project (`docs/SUPABASE_SETUP.md`, Option B) and
   `supabase db push` the real 21 migrations.
2. Run `tests/db/run.mjs`'s equivalent scenarios — or `supabase/tests/rls_privacy.sql`
   via `supabase test db` — against it, confirming the same 41 assertions hold through
   real GoTrue and real PostgREST, not the PGlite stand-in.
3. Place one real voice call and one real video call between two actual devices on
   different networks, confirming STUN is sufficient or TURN is actually needed (see
   `docs/REALTIME_AND_CALLING.md`'s documented STUN-only limitation).
4. Add a Supabase Auth Hook that rejects a suspended account's session server-side,
   closing the one real gap in account suspension enforcement.
5. Point `.github/workflows/ci.yml`'s `deploy` job at this project's URL/anon key via
   repository variables, and complete the Cloudflare Pages setup in
   `docs/DEPLOYMENT.md` to actually go live.

## Needs a small amount of new scope, no new infrastructure

6. Build an avatar/story-image upload UI, exercising the storage bucket limits that
   already exist but have never been used by a real upload flow.
7. Add moderation-outcome notifications (story rejected, report resolved) as their
   own notification trigger, alongside the message/comment/reaction triggers that
   already exist.
8. Wire the 4 remaining mock-only admin pages (Community Management, Professional
   Management, Resource Management, Platform Settings) the same way the other 8
   admin pages were wired this milestone.
9. Build the Discussions/forum frontend against the schema that's existed since
   Milestone 2 (`discussions`/`discussion_comments`), if this feature is still wanted
   — it was never in the spec's original page list, so confirm it's actually in scope
   before building it.
10. Extend English/Bangla translation page-by-page beyond navigation and the login
    form — the mechanism is proven; this is pure volume.

## Needs a new piece of infrastructure/tooling

11. A service-role Edge Function that lets an admin see a user's real email, scoped
    tightly (e.g. only for active support tickets), if that capability turns out to
    be genuinely needed rather than a nice-to-have — don't build it speculatively.
12. Image-processing tooling (e.g. `sharp`) to re-encode the landing page's JPEGs to
    WebP/AVIF.
13. A TURN server (Twilio, Cloudflare Calls, or Xirsys all have pay-as-you-go tiers)
    if real-world call-connection rates through STUN alone turn out to be
    insufficient once real users are behind symmetric NATs/corporate firewalls.

## Needs deliberate process, not code

14. External adversarial security review (XSS/SQLi/CSRF fuzzing, session-handling
    attacks) — spec section 4.4's scope that a single development session
    legitimately cannot substitute for. The concrete, basic checks already done are
    in `docs/SECURITY_CHECKLIST.md`; this item is about going further than that.
15. Full legal review of the Privacy Policy, Terms, Data Retention, Account
    Deletion, and Cookie Policy pages against the specific regions the platform
    actually launches in — every one of those pages says "draft for review" for
    exactly this reason.
16. Load/performance testing against real traffic, to validate (or retune) the rate
    limiting thresholds that were picked as reasonable defaults, not measured ones.
