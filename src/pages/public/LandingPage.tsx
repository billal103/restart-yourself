import {
  BookHeart,
  Compass,
  Globe2,
  Heart,
  MessageCircle,
  PhoneCall,
  Shield,
  Smile,
  Sparkles,
  Target,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import communityFriendsPhoto from '@/assets/photos/community-friends.jpg'
import heroBannerPhoto from '@/assets/photos/hero-banner.jpg'
import testimonialPhoto1 from '@/assets/photos/testimonial-1.jpg'
import testimonialPhoto2 from '@/assets/photos/testimonial-2.jpg'
import testimonialPhoto3 from '@/assets/photos/testimonial-3.jpg'
import { StoryCard } from '@/components/stories/StoryCard'
import { CategoryBadge } from '@/components/stories/CategoryBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { categories, getPublishedStories } from '@/lib/mockData'

const featuredStories = getPublishedStories().slice(0, 4)

const steps = [
  {
    icon: BookHeart,
    title: 'Share anonymously',
    description: 'Write your story under a generated anonymous name — no real identity required.',
  },
  {
    icon: Users,
    title: 'Find people who understand',
    description: 'Connect with a community that has faced similar struggles, without judgment.',
  },
  {
    icon: Target,
    title: 'Rebuild, one step at a time',
    description: 'Use journaling, mood tracking, and recovery goals to move forward at your pace.',
  },
]

const communityFeatures = [
  { icon: Heart, title: 'Support reactions, not likes', description: 'Respond with empathy — "I understand," "Stay strong" — never a popularity count.' },
  { icon: MessageCircle, title: 'Moderated discussions', description: 'Comments and groups are guided by clear community guidelines and active moderation.' },
  { icon: Shield, title: 'Reporting built in', description: 'Report any content or conversation that feels unsafe, reviewed by real moderators.' },
]

const recoveryFeatures = [
  { icon: Compass, title: 'Private Journal', description: 'A space for your thoughts that stays yours — never public by default.' },
  { icon: Smile, title: 'Mood Tracker', description: 'Track how you are feeling over time and notice patterns.' },
  { icon: Target, title: 'Recovery Goals', description: 'Set milestones and track real progress toward rebuilding your life.' },
]

const communicationFeatures = [
  { icon: MessageCircle, title: 'Private Messaging', description: 'One-to-one conversations that begin only after a message request is accepted.' },
  { icon: PhoneCall, title: 'Voice & Video Calls', description: 'Optional calls that always require explicit acceptance before connecting.' },
  { icon: Users, title: 'Group Chat', description: 'Topic-based groups moderated by community members and staff.' },
]

const stats = [
  { label: 'Stories shared', value: '2,000+' },
  { label: 'Community members', value: '6,000+' },
  { label: 'Support reactions given', value: '48,000+' },
  { label: 'Countries represented', value: '40+' },
]

const testimonials = [
  {
    photo: testimonialPhoto1,
    quote: "Finding a group of people who had also lost their jobs made me feel less alone during the hardest year of my career.",
    name: 'Fictional demo testimonial — SteadyMaple217',
  },
  {
    photo: testimonialPhoto2,
    quote: 'I never thought I would tell anyone about my divorce. Writing it anonymously here was the first step toward actually healing.',
    name: 'Fictional demo testimonial — HopefulHorizon482',
  },
  {
    photo: testimonialPhoto3,
    quote: 'The mood tracker helped me see that I was actually getting better, even on the days it did not feel that way.',
    name: 'Fictional demo testimonial — BraveRiver903',
  },
]

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative isolate flex min-h-[600px] items-center overflow-hidden lg:min-h-[680px]">
        <img
          src={heroBannerPhoto}
          alt="A diverse group of friends lying together outdoors, smiling peacefully in the sun"
          className="absolute inset-0 -z-10 size-full object-cover"
          fetchPriority="high"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-t from-primary-900/90 via-primary-900/50 to-primary-900/10"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-r from-black/60 via-black/10 to-transparent"
        />

        <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <Badge variant="default" className="mb-5 border border-white/20 bg-white/10 text-white backdrop-blur-sm">
              <Sparkles className="mr-1 inline size-3" /> Anonymous-first support community
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Your Story Matters. Your Journey Isn't Over.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/85">
              A safe place to share what you're going through, find people who understand, and
              take your next step forward.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/dashboard/stories/new">Share Your Story</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/60 bg-white/5 text-white backdrop-blur-sm hover:bg-white/15"
              >
                <Link to="/explore">Explore Stories</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-white/70">
              No account required to read. Free to join. Your privacy comes first.
            </p>
          </div>
        </div>

        <div className="absolute bottom-6 right-4 hidden max-w-[15rem] rounded-card border border-white/20 bg-white/10 p-4 text-white shadow-elevated backdrop-blur-md sm:right-6 sm:block lg:right-8">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Shield className="size-4" /> Anonymous &amp; Safe
          </div>
          <p className="mt-1.5 text-xs text-white/75">
            "{featuredStories[0]?.excerpt.slice(0, 70)}…"
          </p>
        </div>
      </section>

      {/* Explanation */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-text-primary sm:text-3xl">
            This is not a dating app, a social feed, or an emergency service
          </h2>
          <p className="mt-4 text-text-secondary">
            Restart Yourself exists for one reason: to give people going through difficult life
            moments a place to be heard, supported, and encouraged to rebuild — anonymously, and
            without judgment.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-surface/60 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-text-primary sm:text-3xl">
            How It Works
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <Card key={step.title} className="p-6">
                <div className="flex size-11 items-center justify-center rounded-full bg-primary-50">
                  <step.icon className="size-5 text-primary-600" />
                </div>
                <h3 className="mt-4 font-semibold text-text-primary">{step.title}</h3>
                <p className="mt-2 text-sm text-text-secondary">{step.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured stories */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-text-primary sm:text-3xl">Featured Stories</h2>
          <Button asChild variant="link">
            <Link to="/explore">View all stories</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {featuredStories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      </section>

      {/* Popular categories */}
      <section className="bg-surface/60 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-text-primary sm:text-3xl">Popular Categories</h2>
          <div className="mt-8 flex flex-wrap gap-3">
            {categories.map((category) => (
              <CategoryBadge key={category.id} category={category} />
            ))}
          </div>
        </div>
      </section>

      {/* Community support */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-2xl font-bold text-text-primary sm:text-3xl">Community Support</h2>
            <div className="mt-8 flex flex-col gap-6">
              {communityFeatures.map((feature) => (
                <div key={feature.title} className="flex gap-4">
                  <feature.icon className="size-6 shrink-0 text-primary-500" />
                  <div>
                    <h3 className="font-semibold text-text-primary">{feature.title}</h3>
                    <p className="mt-1 text-sm text-text-secondary">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-card shadow-soft">
            <img
              src={communityFriendsPhoto}
              alt="Two friends laughing together, representing the warmth of community support"
              className="aspect-[4/3] w-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* Personal recovery tools */}
      <section className="bg-surface/60 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-text-primary sm:text-3xl">Personal Recovery Tools</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {recoveryFeatures.map((feature) => (
              <Card key={feature.title} className="p-6">
                <feature.icon className="size-6 text-primary-500" />
                <h3 className="mt-3 font-semibold text-text-primary">{feature.title}</h3>
                <p className="mt-1 text-sm text-text-secondary">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Communication features */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-text-primary sm:text-3xl">Communication Features</h2>
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {communicationFeatures.map((feature) => (
            <div key={feature.title} className="flex gap-4">
              <feature.icon className="size-6 shrink-0 text-primary-500" />
              <div>
                <h3 className="font-semibold text-text-primary">{feature.title}</h3>
                <p className="mt-1 text-sm text-text-secondary">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Safety and privacy */}
      <section className="bg-primary-900 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Shield className="size-7" />
            <h2 className="text-2xl font-bold sm:text-3xl">Safety and Privacy, By Design</h2>
          </div>
          <p className="mt-4 max-w-2xl text-primary-100">
            Your authentication identity is always separate from your public anonymous profile.
            Private journals, messages, and personal data are protected and never sold. Read our{' '}
            <Link to="/privacy" className="underline">
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link to="/safety" className="underline">
              Safety &amp; Crisis Support
            </Link>{' '}
            resources.
          </p>
        </div>
      </section>

      {/* Platform statistics */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Globe2 className="size-5 text-primary-500" />
          <h2 className="text-2xl font-bold text-text-primary sm:text-3xl">Platform Statistics</h2>
        </div>
        <p className="mt-2 text-sm text-text-muted">Demo figures shown for illustration only.</p>
        <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold text-primary-700">{stat.value}</p>
              <p className="mt-1 text-sm text-text-secondary">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-surface/60 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-text-primary sm:text-3xl">
            What Our Community Says
          </h2>
          <p className="mt-2 text-sm text-text-muted">
            Fictional demo testimonials shown for illustration only.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name} className="overflow-hidden">
                <img
                  src={testimonial.photo}
                  alt="Illustrative photo for a fictional demo testimonial"
                  className="aspect-square w-full object-cover object-[center_20%]"
                  loading="lazy"
                />
                <CardContent className="pt-6">
                  <p className="text-sm italic text-text-secondary">"{testimonial.quote}"</p>
                  <p className="mt-4 text-xs font-medium text-text-muted">{testimonial.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-text-primary">Ready to take your next step?</h2>
        <p className="mt-3 text-text-secondary">
          Whatever you are going through, you do not have to go through it alone.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/dashboard/stories/new">Share Your Story</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/explore">Explore Stories</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
