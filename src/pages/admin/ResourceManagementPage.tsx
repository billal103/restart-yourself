import { Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { resources } from '@/lib/mockData'

export default function ResourceManagementPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Resource Management</h1>
        <Button size="sm">
          <Plus className="size-4" /> New Resource
        </Button>
      </div>
      <p className="text-text-secondary">
        Manage the crisis and support resource directory shown on the public Safety page. Verify
        accuracy and regional availability before publishing any resource.
      </p>

      <div className="flex flex-col gap-3">
        {resources.map((resource) => (
          <Card key={resource.id}>
            <CardContent className="flex items-center justify-between gap-4 pt-6">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-text-primary">{resource.title}</h3>
                  <Badge variant="secondary">{resource.region}</Badge>
                  <Badge variant="default">{resource.category}</Badge>
                </div>
                <p className="mt-1 text-sm text-text-secondary">{resource.description}</p>
              </div>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
