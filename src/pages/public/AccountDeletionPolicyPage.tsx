const sections = [
  {
    title: '1. How to delete your account',
    body: 'From Settings → Privacy, select "Delete My Account" and confirm. There is no separate support request needed — deletion happens immediately when you confirm.',
  },
  {
    title: '2. What is deleted immediately',
    body: 'Your anonymous profile and display name, every story you authored (published, draft, or pending), your comments, reactions, and bookmarks, your private journal entries, mood logs, and recovery goals, your conversations and messages, your group memberships, your notification preferences, and your blocks list — all removed in the same action, with no retention window.',
  },
  {
    title: '3. What is kept, and why',
    body: "Moderation actions and audit log entries that reference your account stay on record for platform accountability — for example, if content you posted was previously removed, that removal stays logged. The record is anonymized: the field that would identify you as the account involved is cleared, so the entry no longer points to a real account. We do this because the Non-negotiable requirement that journals, messages, and other private content have no moderator bypass applies to your content, not to the fact that a moderation action once occurred — those are different things, and keeping the latter is what lets us show, if ever asked, that moderation decisions were made consistently.",
  },
  {
    title: '4. Guest-published content you never claimed',
    body: "If you published a story as a guest and never created a full account to claim it, there is no account of yours to delete — the story exists independently, tied only to a hashed recovery token, not to you personally. If you did register and then claim a guest story's authorship, deleting your account deletes that story along with everything else.",
  },
  {
    title: '5. This cannot be undone',
    body: 'Once you confirm deletion, we cannot restore your account, your stories, or your private data. If you want a copy of anything before deleting, use "Export My Data" first — see our Data Retention Policy for exactly what that export includes.',
  },
  {
    title: '6. Deletion is self-service only',
    body: 'Account deletion only ever deletes your own account — there is no account deletion path, for anyone, that targets another person\'s account. Even platform administrators cannot delete your account on your behalf through this mechanism.',
  },
]

export default function AccountDeletionPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-text-primary sm:text-4xl">Account Deletion Policy</h1>
      <p className="mt-4 text-sm text-text-muted">
        Draft for review — full legal review against applicable regional laws is a Milestone 4
        deliverable before production launch. This page documents the actual deletion mechanism
        as implemented.
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
