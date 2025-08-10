/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import { SearchResult } from '@/pages/search/types'
import Link from '@/components/shared/link.tsx'
import { Avatar } from '@/src/components'
import { UserGroupIcon } from '@heroicons/react/20/solid'

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
        <Link href={`/p/${pack.slug}`} className="block h-full ring-1 rounded ring-default hover:ring-2 transition-shadow">
            <div className="p-4">
                <div className="mb-3 flex items-center text-xs text-muted-foreground">
                    <UserGroupIcon className="mr-2 h-3.5 w-3.5 sm:h-3 sm:w-3" />
                    <span>Pack</span>
                </div>
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        {/* Pack icon */}
                        <div className="w-12 h-12">
                            <Avatar
                                square
                                src={pack?.images?.avatar}
                                className="w-full h-full"
                                initials={pack?.display_name?.slice(0, 2)}
                            />
                        </div>
                        <h2 className="text-lg font-medium text-foreground group-hover:text-primary transition-colors">
                            {pack.display_name}
                        </h2>
                    </div>
                </div>
                <p className="text-muted-foreground mb-3 line-clamp-2">{pack.about?.bio}</p>
                {formattedDate && (
                    <div className="flex items-center text-xs text-muted-foreground">
                        <span>Created {formattedDate}</span>
                    </div>
                )}
            </div>
        </Link>
    )
}
