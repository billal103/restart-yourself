import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { professionals as initialProfessionals } from '@/lib/mockData'
import { toast } from '@/stores/toastStore'

const statusVariant = {
  verified: 'success',
  pending: 'warning',
  unverified: 'secondary',
} as const

export default function ProfessionalManagementPage() {
  const [professionals, setProfessionals] = useState(initialProfessionals)

  function verify(id: string) {
    setProfessionals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, verificationStatus: 'verified' as const } : p)),
    )
    toast({ title: 'Professional verified', variant: 'success' })
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-text-primary">Professional Management</h1>
      <p className="text-text-secondary">
        Review verification documents and approve professional profiles before they appear as
        "Verified" in the Support Resources directory.
      </p>

      <div className="flex flex-col gap-3">
        {professionals.map((pro) => (
          <Card key={pro.id}>
            <CardContent className="flex items-center justify-between gap-4 pt-6">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-text-primary">{pro.name}</h3>
                  <Badge variant={statusVariant[pro.verificationStatus]}>
                    {pro.verificationStatus}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-text-secondary">{pro.title}</p>
              </div>
              {pro.verificationStatus === 'pending' && (
                <Button size="sm" onClick={() => verify(pro.id)}>
                  Approve Verification
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
