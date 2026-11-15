import { ExternalLink, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AnonymousAvatar } from '@/components/common/AnonymousAvatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { makeAuthor, professionals as mockProfessionals, resources as mockResources } from '@/lib/mockData'

interface ProfessionalRow {
  id: string
  name: string
  title: string
  bio: string
  specializations: string[]
  verificationStatus: 'verified' | 'pending' | 'unverified'
}

interface ResourceRow {
  id: string
  title: string
  description: string
  url: string
}

const verificationLabel: Record<ProfessionalRow['verificationStatus'], string> = {
  verified: 'Verified Professional',
  pending: 'Verification Pending',
  unverified: 'Unverified',
}

export default function SupportResourcesPage() {
  const [query, setQuery] = useState('')
  const [professionals, setProfessionals] = useState<ProfessionalRow[]>(
    isSupabaseConfigured
      ? []
      : mockProfessionals.map((p) => ({
          id: p.id,
          name: p.name,
          title: p.title,
          bio: p.bio,
          specializations: p.specializations,
          verificationStatus: p.verificationStatus,
        })),
  )
  const [resources, setResources] = useState<ResourceRow[]>(
    isSupabaseConfigured ? [] : mockResources.map((r) => ({ id: r.id, title: r.title, description: r.description, url: r.url })),
  )

  useEffect(() => {
    if (!isSupabaseConfigured) return
    void (async () => {
      const { professionalsService } = await import('@/services/professionals.service')
      const [pros, res] = await Promise.all([professionalsService.list(), professionalsService.listResources()])
      setProfessionals(
        pros.map((p) => ({
          id: p.id,
          name: p.name,
          title: p.title,
          bio: p.bio ?? '',
          specializations: p.specializations,
          verificationStatus: p.verification_status,
        })),
      )
      setResources(res.map((r) => ({ id: r.id, title: r.title, description: r.description ?? '', url: r.url })))
    })()
  }, [])

  const filteredProfessionals = professionals.filter((p) =>
    `${p.name} ${p.specializations.join(' ')}`.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">Support Resources</h1>
      <p className="mt-2 max-w-2xl text-text-secondary">
        A directory of licensed professionals and community supporters. Peer supporters provide
        companionship, not therapy — only professionals marked "Verified" have completed our
        verification process.
      </p>

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or specialization…"
        className="mt-6 max-w-md"
      />

      <h2 className="mt-10 text-lg font-semibold text-text-primary">Professionals</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {filteredProfessionals.map((pro) => (
          <Card key={pro.id}>
            <CardContent className="flex flex-col gap-2 pt-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-text-primary">{pro.name}</h3>
                {pro.verificationStatus === 'verified' && (
                  <ShieldCheck className="size-4 text-primary-500" />
                )}
              </div>
              <p className="text-sm text-text-secondary">{pro.title}</p>
              <div className="flex flex-wrap gap-1.5">
                {pro.specializations.map((spec) => (
                  <Badge key={spec} variant="secondary">
                    {spec}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-text-secondary">{pro.bio}</p>
              <Badge variant={pro.verificationStatus === 'verified' ? 'success' : 'warning'} className="w-fit">
                {verificationLabel[pro.verificationStatus]}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="mt-10 text-lg font-semibold text-text-primary">Community Supporters</h2>
      <p className="mt-1 text-sm text-text-muted">
        Peer members who have opted in to help others going through similar experiences.
      </p>
      <div className="mt-4 flex flex-wrap gap-4">
        {[401, 402, 403, 404].map((seed) => (
          <div key={seed} className="rounded-full border border-surface-muted px-3 py-2">
            <AnonymousAvatar author={makeAuthor(seed)} size="sm" />
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-lg font-semibold text-text-primary">External Resources</h2>
      <div className="mt-4 flex flex-col gap-3">
        {resources.map((resource) => (
          <Card key={resource.id}>
            <CardContent className="flex items-center justify-between gap-4 pt-6">
              <div>
                <p className="font-medium text-text-primary">{resource.title}</p>
                <p className="text-sm text-text-secondary">{resource.description}</p>
              </div>
              <a
                href={resource.url}
                target="_blank"
                rel="noreferrer"
                className="focus-ring inline-flex shrink-0 items-center gap-1 rounded-full border border-surface-muted px-3 py-1.5 text-xs font-medium hover:bg-surface"
              >
                Visit <ExternalLink className="size-3.5" />
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
