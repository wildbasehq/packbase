import { SearchResult } from '@/pages/search/types'
import { Avatar } from '@/components/shared/avatar'
import Link from '@/components/shared/link.tsx'

interface ProfileCardProps {
    profile: SearchResult['user']
}

export const ProfileCard = ({ profile }: ProfileCardProps) => {
    return (
        <Link
            href={profile ? `/@${profile.username}` : '#'}
            className="block h-full ring-1 rounded ring-default hover:ring-2 transition-shadow"
        >
            <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12">
                        <Avatar square src={profile?.images?.avatar} className="w-full h-full" initials={profile?.username?.slice(0, 2)} />
                    </div>
                    <div>
                        <h2 className="text-lg font-medium text-foreground group-hover:text-primary transition-colors">
                            {profile?.display_name || profile?.username}
                        </h2>
                        <p className="text-sm text-muted-foreground">@{profile?.username || 'username'}</p>
                    </div>
                </div>
                <p className="text-muted-foreground mb-3 line-clamp-2">{profile?.about?.bio}</p>
            </div>
        </Link>
    )
}
