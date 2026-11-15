import { BookHeart, MessageCircle, ShieldCheck, Target, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const steps = [
  {
    icon: BookHeart,
    title: '1. Share your story anonymously',
    description:
      'Write about what you are going through. You can publish under a generated anonymous name, with no real identity attached, even as a guest.',
  },
  {
    icon: Users,
    title: '2. Connect with your community',
    description:
      'Browse stories by category, join topic-based support groups, and receive supportive reactions and comments from people who understand.',
  },
  {
    icon: MessageCircle,
    title: '3. Talk privately, when you are ready',
    description:
      'Send a message request to someone whose story resonated with you. Conversations only begin once the request is accepted, and you can request a voice or video call that the other person must explicitly accept.',
  },
  {
    icon: Target,
    title: '4. Track your own recovery',
    description:
      'Use the private journal, mood tracker, and recovery goals to track your progress over time — visible only to you.',
  },
  {
    icon: ShieldCheck,
    title: '5. Stay safe, always',
    description:
      'Report anything that feels unsafe, block anyone at any time, and reach our Safety & Crisis Support resources whenever you need them.',
  },
]

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-text-primary sm:text-4xl">How It Works</h1>
      <p className="mt-4 text-lg text-text-secondary">
        Restart Yourself is built around five simple steps, each designed to put your privacy and
        safety first.
      </p>

      <div className="mt-10 flex flex-col gap-5">
        {steps.map((step) => (
          <Card key={step.title}>
            <CardContent className="flex items-start gap-4 pt-6">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-50">
                <step.icon className="size-5 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">{step.title}</h3>
                <p className="mt-1 text-sm text-text-secondary">{step.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link to="/dashboard/stories/new">Share Your Story</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to="/guidelines">Read Community Guidelines</Link>
        </Button>
      </div>
    </div>
  )
}
