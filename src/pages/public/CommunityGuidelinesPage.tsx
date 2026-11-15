const sections = [
  {
    title: '1. Lead with empathy',
    body: 'Respond to others the way you would want to be responded to in a difficult moment. Assume good intent, and avoid judgment or criticism of someone else\'s situation or choices.',
  },
  {
    title: '2. Protect anonymity — yours and others\'',
    body: 'Never ask another member for their real name, phone number, address, or other identifying contact information inside stories, comments, or messages. Never share someone else\'s personal information.',
  },
  {
    title: '3. No harassment, hate speech, or harmful content',
    body: 'Content that harasses, threatens, or demeans any person or group will be removed, and accounts may be suspended. This includes discriminatory language based on identity, origin, religion, gender, or orientation.',
  },
  {
    title: '4. No solicitation or self-promotion',
    body: 'Do not use stories, comments, groups, or messages to advertise services, recruit for businesses, or solicit money, except through verified professional profiles reviewed by our team.',
  },
  {
    title: '5. Use content warnings for sensitive topics',
    body: 'If your story discusses self-harm, abuse, or other sensitive subject matter, add a content warning so other members can choose whether to continue reading.',
  },
  {
    title: '6. Peer support is not professional therapy',
    body: 'Members are encouraged to share experiences and encouragement, but should not present themselves as medical or mental health professionals unless verified as such on the platform.',
  },
  {
    title: '7. Report, don\'t retaliate',
    body: 'If you see content or behavior that violates these guidelines, use the report option. Our moderation team reviews reports and takes action — please do not engage in public conflict.',
  },
  {
    title: '8. Consequences for violations',
    body: 'Depending on severity, violations may result in content removal, warnings, temporary restrictions, or permanent suspension. Serious safety concerns may be escalated for human review.',
  },
]

export default function CommunityGuidelinesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-text-primary sm:text-4xl">Community Guidelines</h1>
      <p className="mt-4 text-text-secondary">
        These guidelines exist to keep Restart Yourself a safe, respectful, and genuinely
        supportive place. Everyone who uses the platform — registered members, guests, group
        moderators, and verified professionals — agrees to follow them.
      </p>

      <div className="mt-10 flex flex-col gap-8">
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
