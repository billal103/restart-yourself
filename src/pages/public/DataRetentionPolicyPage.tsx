const sections = [
  {
    title: '1. Why this page exists',
    body: 'Our Privacy Policy promises to document exactly how long each type of data is kept. This page is that documentation — specific, not aspirational, and it names the real database tables and mechanisms involved so it stays accurate as the platform evolves.',
  },
  {
    title: '2. While your account is active',
    body: 'Your anonymous profile, preferences, stories, comments, messages, group memberships, and recovery tools are kept for as long as your account exists, so the features that depend on them keep working.',
  },
  {
    title: '3. Private journals, mood logs, and recovery goals',
    body: 'These are retained only for as long as you keep your account, are never shown to moderators or admins under any circumstance (not even to investigate a report), and are permanently deleted the moment your account is deleted — see our Account Deletion Policy.',
  },
  {
    title: '4. Guest-published stories and recovery tokens',
    body: 'A guest-published story is kept even if the guest session that created it ends. We store only a one-way cryptographic hash of the recovery token used to reclaim authorship later, never the token itself — if it is lost, we cannot recover it on your behalf, by design.',
  },
  {
    title: '5. Call signaling data',
    body: 'The offer/answer/ICE-candidate rows used to connect a voice or video call exist only for the few seconds a call takes to connect, and are automatically purged on a 10-minute cleanup cycle regardless of whether the call succeeded. We never record call audio or video, so there is nothing else to retain or delete.',
  },
  {
    title: '6. Moderation actions and audit logs',
    body: "When content is removed, a report is resolved, or an account's role or status changes, that action is recorded permanently in our audit log for accountability — even after the content itself or the account involved is deleted. These records keep what happened and when, but the identifying link to a deleted account is removed (the actor/reporter field becomes anonymous); the record no longer points to a real person.",
  },
  {
    title: '7. When you delete your account',
    body: 'Deletion is immediate and cascades through every table where your content lives — profile, stories, comments, messages, journal entries, mood logs, recovery goals, group memberships, and more. See our Account Deletion Policy for the complete list of what is removed versus what is kept anonymized.',
  },
  {
    title: '8. Backups',
    body: 'Database backups taken before a deletion may still contain the deleted data until that backup itself is rotated out, on whatever backup retention window the hosting database provider uses. We do not control or extend that window independently.',
  },
]

export default function DataRetentionPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-text-primary sm:text-4xl">Data Retention Policy</h1>
      <p className="mt-4 text-sm text-text-muted">
        Draft for review — full legal review against applicable regional laws is a Milestone 4
        deliverable before production launch. This page documents the technical retention
        mechanisms as actually implemented in the platform today.
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
