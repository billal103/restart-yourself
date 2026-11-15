const sections = [
  {
    title: '1. Acceptance of terms',
    body: 'By using Restart Yourself, you agree to these Terms and Conditions, the Community Guidelines, and the Privacy Policy. You must be at least 18 years old to use the platform.',
  },
  {
    title: '2. Not a medical or emergency service',
    body: 'Restart Yourself is a peer support community. It does not provide medical advice, therapy, or emergency response. If you are experiencing a medical or safety emergency, contact your local emergency services immediately.',
  },
  {
    title: '3. Your content',
    body: 'You retain ownership of the stories, comments, and messages you create. By publishing content, you grant us a license to display it on the platform in line with your chosen privacy and anonymity settings.',
  },
  {
    title: '4. Acceptable use',
    body: 'You agree to follow the Community Guidelines, not to misuse guest publishing tokens, not to attempt unauthorized access to other accounts or private data, and not to use the platform for harassment, solicitation, or illegal activity.',
  },
  {
    title: '5. Moderation and enforcement',
    body: 'We reserve the right to remove content, restrict features, or suspend accounts that violate these terms, at our reasonable discretion, with an audit trail maintained for moderation actions.',
  },
  {
    title: '6. Service availability',
    body: 'Restart Yourself is currently operated on free-tier infrastructure. We do not guarantee uninterrupted availability and will communicate known limitations transparently.',
  },
  {
    title: '7. Limitation of liability',
    body: 'The platform is provided "as is." To the fullest extent permitted by law, we are not liable for damages arising from your use of the platform, including reliance on peer support content in place of professional care.',
  },
  {
    title: '8. Changes to these terms',
    body: 'We may update these terms as the platform evolves. Material changes will be communicated before they take effect.',
  },
]

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-text-primary sm:text-4xl">Terms and Conditions</h1>
      <p className="mt-4 text-sm text-text-muted">
        Draft for review — full legal review against applicable laws in each launch region is a
        Milestone 4 deliverable.
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
