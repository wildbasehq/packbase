import { SearchResult } from '@/pages/search/types'
import { Users } from 'lucide-react'
import Link from '@/components/shared/link.tsx'

interface PackCardProps {
    pack: SearchResult
}

export const PackCard = ({ pack }: PackCardProps) => {
    let formattedDate = pack.created_at

    try {
        if (pack.created_at) {
            formattedDate = new Date(pack.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            })
        }
    } catch (error) {
        console.error('Error formatting date:', error)
        // Keep the original timestamp if date parsing fails
    }

    return (
        <Link href={pack.url || `/p/${pack.slug}`} className="block h-full ring-1 rounded ring-default hover:ring-2 transition-shadow">
            <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        {/* Pack icon */}
                        <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                            <Users className="h-5 w-5" />
                        </div>
                        <h2 className="text-lg font-medium text-foreground group-hover:text-primary transition-colors">
                            {pack.display_name}
                        </h2>
                    </div>
                </div>
                <p className="text-muted-foreground mb-3 line-clamp-2">{pack.description}</p>
                {formattedDate && (
                    <div className="flex items-center text-xs text-muted-foreground">
                        <span>Created {formattedDate}</span>
                    </div>
                )}
            </div>
        </Link>
    )
}
