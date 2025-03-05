// src/components/feed/FeedAnnouncement.tsx
import {MegaphoneIcon} from '@heroicons/react/20/solid'
import Card from '@/components/shared/card'
import {Heading, Text} from '@/components/shared/text'
import UserAvatar from '@/components/shared/user/avatar'

interface FeedAnnouncementProps {
    variant?: 'default' | 'important' | 'celebration';
}

/**
 * Displays an announcement card at the top of the feed
 */
export default function FeedAnnouncement({variant = 'default'}: FeedAnnouncementProps) {
    // You can customize the style based on the variant
    const getBgClass = () => {
        switch (variant) {
            case 'important':
                return 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/40'
            case 'celebration':
                return 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/40'
            default:
                return ''
        }
    }

    return (
        <Card className={`border ${getBgClass()}`}>
            <Heading size="xs" className="mb-2 flex items-center text-neutral-800 dark:text-neutral-200">
                <MegaphoneIcon className="mr-2 h-4 w-4 text-neutral-600 dark:text-neutral-400"/>
                <span>ANNOUNCEMENT</span>
            </Heading>

            <Text size="sm" className="text-neutral-700 dark:text-neutral-300">
                The invite code generation requirement is temporarily disabled! You can generate and invite
                as many people as you'd like.
            </Text>

            <div className="mt-3 flex items-center justify-end">
                <UserAvatar
                    user={{
                        username: 'rek',
                        images: {
                            avatar: 'https://udxdytccktvaedirxooa.supabase.co/storage/v1/object/public/profiles/3e133370-0ec2-4825-b546-77de3804c8b1/0/avatar.png',
                        },
                    }}
                    size="sm"
                    className="mr-1.5"
                />
                <Text size="sm" className="font-medium text-neutral-700 dark:text-neutral-300">
                    Rek
                </Text>
            </div>
        </Card>
    )
}