const sections = [
  {
    title: '1. We do not use advertising or tracking cookies',
    body: 'Restart Yourself has no analytics integration, no advertising network, and no third-party tracking scripts of any kind. We have nothing to say no to because none of that exists here — this is a design choice, documented in our Security commitments, not a feature we removed.',
  },
  {
    title: '2. Session storage, not cookies',
    body: "Signing in — whether with an account or as a guest — is handled by Supabase Auth's client library, which keeps your session token in your browser's local storage, not in a cookie. Nothing about your session is sent to us as a cookie header; it's attached explicitly to the requests our own app makes, and only to those.",
  },
  {
    title: '3. What local storage is used for',
    body: "Your active session token (so you stay logged in between visits) and small UI preferences, like which language you last selected. None of this is shared with any other site, and none of it is readable by any site other than this one — browsers isolate local storage per origin.",
  },
  {
    title: '4. Your choices',
    body: "You can clear your session at any time by logging out, or by clearing your browser's site data for this domain. Since we set no tracking cookies, there is nothing else here for a cookie-blocking browser extension to need to block.",
  },
  {
    title: '5. If this changes',
    body: 'If we ever add analytics or any cookie-based feature in the future, we will update this page first and ask for consent where required, rather than silently changing behavior that this page currently describes as not existing.',
  },
]

export default function CookiePolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-text-primary sm:text-4xl">Cookie Policy</h1>
      <p className="mt-4 text-sm text-text-muted">
        Draft for review — full legal review against applicable regional laws is a Milestone 4
        deliverable before production launch.
      </p>

      <div className="mt-8 flex flex-col gap-8">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="text-lg font-semibold text-text-primary">{section.title}</h2>
            <p className="mt-2 text-sm text-text-secondary">{section.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
