import { Heart, ShieldCheck, Sparkles, Users } from 'lucide-react'

const principles = [
  'Anonymous-first experience',
  'Privacy by design',
  'Empathy and respect',
  'Safe communication',
  'Non-judgmental community',
  'Personal recovery and growth',
  'Accessible support resources',
  'Transparent moderation',
  'No popularity competition',
  'No selling personal information',
]

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-text-primary sm:text-4xl">About Restart Yourself</h1>
      <p className="mt-4 text-lg text-text-secondary">
        Restart Yourself is a global, anonymous-first emotional support and personal recovery
        platform for people navigating difficult life moments — relationship breakdowns, divorce,
        job loss, financial hardship, academic pressure, loneliness, and more.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-card border border-surface-muted p-6">
          <Heart className="size-6 text-primary-500" />
          <h3 className="mt-3 font-semibold text-text-primary">Our Mission</h3>
          <p className="mt-1 text-sm text-text-secondary">
            Help people feel heard, understood, supported, and encouraged to move forward.
          </p>
        </div>
        <div className="rounded-card border border-surface-muted p-6">
          <Users className="size-6 text-primary-500" />
          <h3 className="mt-3 font-semibold text-text-primary">Our Community</h3>
          <p className="mt-1 text-sm text-text-secondary">
            People sharing real experiences, and people who have overcome similar situations
            offering support.
          </p>
        </div>
        <div className="rounded-card border border-surface-muted p-6">
          <ShieldCheck className="size-6 text-primary-500" />
          <h3 className="mt-3 font-semibold text-text-primary">Our Promise</h3>
          <p className="mt-1 text-sm text-text-secondary">
            Privacy by design, transparent moderation, and no selling of personal information.
          </p>
        </div>
      </div>

      <h2 className="mt-14 flex items-center gap-2 text-2xl font-bold text-text-primary">
        <Sparkles className="size-5 text-primary-500" /> Core Principles
      </h2>
      <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {principles.map((principle) => (
          <li
            key={principle}
            className="rounded-lg bg-surface px-4 py-3 text-sm font-medium text-text-primary"
          >
            {principle}
          </li>
        ))}
      </ul>

      <div className="mt-14 rounded-card border border-warning-500/30 bg-warning-50 p-6">
        <h3 className="font-semibold text-text-primary">What we are not</h3>
        <p className="mt-2 text-sm text-text-secondary">
          Restart Yourself is not a dating platform, a conventional social network, an emergency
          service, or a replacement for professional mental healthcare. If you are in immediate
          danger, please contact your local emergency services.
        </p>
      </div>
    </div>
  )
}
