import { Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { groups } from '@/lib/mockData'

export default function CommunityManagementPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Community Management</h1>
        <Button size="sm">
          <Plus className="size-4" /> New Group
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {groups.map((group) => (
          <Card key={group.id}>
            <CardContent className="flex items-center justify-between gap-4 pt-6">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-text-primary">{group.name}</h3>
                  <Badge variant="secondary">{group.memberCount} members</Badge>
                </div>
                <p className="mt-1 text-sm text-text-secondary">{group.description}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" size="sm">
                  Edit Guidelines
                </Button>
                <Button variant="outline" size="sm">
                  Manage Moderators
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
