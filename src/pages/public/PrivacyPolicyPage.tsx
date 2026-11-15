const sections = [
  {
    title: '1. What we collect',
    body: 'We collect only what is necessary to operate the platform: an email address if you register (optional for guests), content you choose to publish, and technical data such as device and session information needed for security and functionality.',
  },
  {
    title: '2. Anonymous identity separation',
    body: 'Your authentication identity (email, account credentials) is stored separately from your public anonymous profile. Your real name, email, or phone number is never displayed publicly.',
  },
  {
    title: '3. Guest publishing',
    body: 'Guests can publish without creating a permanent account. We store only a cryptographic hash of your guest management token, never the token itself. If you lose your token, we cannot recover access to that guest-published content on your behalf.',
  },
  {
    title: '4. How we use your data',
    body: 'We use your data to operate core features (stories, messaging, calls, recovery tools), maintain safety and moderation, and improve the platform. We do not use private journal entries for AI training without your explicit, informed consent.',
  },
  {
    title: '5. What we never do',
    body: 'We do not sell your personal information. We do not publicly index private content. We do not expose your private messages, call signaling data, or journal entries to other users or to the public.',
  },
  {
    title: '6. Data retention and deletion',
    body: 'You can request account and data deletion at any time from your privacy settings. Retention periods for different data types are documented in our Data Retention Policy, and exactly what is removed versus kept is documented in our Account Deletion Policy.',
  },
  {
    title: '7. Security',
    body: 'We use Row Level Security, encrypted password storage, and restricted access controls to protect your data. No system is perfectly secure, and we encourage you not to share information in your story or profile that you are not comfortable having seen.',
  },
  {
    title: '8. Your rights',
    body: 'Depending on your region, you may have rights to access, correct, export, or delete your personal data. Contact us through the Contact Us page to exercise these rights.',
  },
]

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-text-primary sm:text-4xl">Privacy Policy</h1>
      <p className="mt-4 text-sm text-text-muted">
        Draft for review — this page summarizes planned data practices for the MVP and is not yet
        final legal copy. Legal review against applicable regional laws is a Milestone 4
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
