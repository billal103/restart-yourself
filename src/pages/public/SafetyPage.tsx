import { AlertTriangle, ExternalLink, Flag, HeartHandshake, ShieldAlert } from 'lucide-react'
import { resources } from '@/lib/mockData'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export default function SafetyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-text-primary sm:text-4xl">Safety &amp; Crisis Support</h1>

      <div className="mt-6 flex items-start gap-3 rounded-card border border-error-500/30 bg-error-50 p-5">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-error-500" />
        <div>
          <h2 className="font-semibold text-text-primary">If you are in immediate danger</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Restart Yourself is a peer support community, not an emergency service. We do not
            monitor the platform 24/7 and cannot contact emergency services on your behalf. If you
            or someone else is in immediate danger, please contact your local emergency services
            or a trusted person near you right now.
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-card border border-surface-muted bg-surface/60 p-5">
        <HeartHandshake className="mt-0.5 size-5 shrink-0 text-primary-500" />
        <div>
          <h2 className="font-semibold text-text-primary">You are not alone</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Whatever you are going through, reaching out is a sign of strength, not weakness.
            Peer support here is meant to complement, not replace, professional care. We encourage
            you to also speak with a licensed professional — see our{' '}
            <a href="/resources" className="text-primary-600 underline">
              Support Resources
            </a>{' '}
            directory.
          </p>
        </div>
      </div>

      <h2 className="mt-12 flex items-center gap-2 text-xl font-bold text-text-primary">
        <ShieldAlert className="size-5 text-primary-500" /> Crisis Resources
      </h2>
      <p className="mt-2 text-sm text-text-muted">
        These are example resources for this demo build and must be verified for accuracy and
        local availability before production launch. Availability varies by region and may change.
      </p>
      <div className="mt-6 flex flex-col gap-4">
        {resources
          .filter((resource) => resource.category === 'Crisis Support' || resource.category === 'Safety')
          .map((resource) => (
            <Card key={resource.id}>
              <CardContent className="flex items-start justify-between gap-4 pt-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-text-primary">{resource.title}</h3>
                    <Badge variant="secondary">{resource.region}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-text-secondary">{resource.description}</p>
                </div>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="focus-ring inline-flex shrink-0 items-center gap-1 rounded-full border border-surface-muted px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface"
                >
                  Visit <ExternalLink className="size-3.5" />
                </a>
              </CardContent>
            </Card>
          ))}
      </div>

      <div className="mt-12 flex items-start gap-3 rounded-card border border-surface-muted bg-surface/60 p-5">
        <Flag className="mt-0.5 size-5 shrink-0 text-text-secondary" />
        <div>
          <h2 className="font-semibold text-text-primary">If you see content that concerns you</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Use the report option on any story, comment, or message to flag it for our moderation
            team. AI-assisted moderation may help surface urgent reports faster, but every safety
            report is reviewed by a human moderator according to our actual moderation coverage —
            we will never claim otherwise.
          </p>
        </div>
      </div>
    </div>
  )
}
