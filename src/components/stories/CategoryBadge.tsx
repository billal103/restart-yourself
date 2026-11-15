import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import type { Category } from '@/types/domain'

export function CategoryBadge({ category }: { category: Category }) {
  return (
    <Link to={`/categories/${category.slug}`}>
      <Badge variant="default">{category.name}</Badge>
    </Link>
  )
}
