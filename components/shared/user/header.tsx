import { Heading } from '@/components/shared/text'
import Markdown from '@/components/shared/markdown'
import UserAvatar from '@/components/shared/user/avatar'
import Image from 'next/image'

// @TODO: Unify user and pack headers.
export default function ProfileHeader({ ...props }: any) {
    const profile = props.user

    return (
        <div className="relative">
            <div>
                <Image
                    height={1080}
                    width={1920}
                    className="pointer-events-none aspect-banner w-full rounded-bl rounded-br object-cover"
                    src={(profile.images?.header || '/img/background/generic-generated.png') + `?v=${new Date().getTime()}`}
                    alt="Profile cover"
                />
            </div>
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                <div className="-mt-12 sm:flex sm:items-end sm:space-x-5">
                    <div className="flex">
                        <UserAvatar size={96} user={profile} className="bg-default ring-default pointer-events-none h-24 w-24 rounded-lg ring-1 sm:h-32 sm:w-32" />
                    </div>
                    <div className="mt-6 sm:flex sm:min-w-0 sm:flex-1 sm:items-center sm:justify-end sm:space-x-6 sm:pb-1">
                        <div className="mt-6 min-w-0 flex-1 sm:hidden md:block">
                            <Heading>{profile.display_name || profile.username}</Heading>
                            {/* Small @username */}
                            <div className="flex items-center">
                                <p className="text-alt-2 truncate text-sm font-medium">@{profile.username}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-6 hidden min-w-0 flex-1 sm:block md:hidden">
                    <Heading>{profile.display_name || profile.username}</Heading>
                </div>
                <div className="text-default block min-w-0 flex-1">
                    <div className="mt-6 whitespace-pre-line text-sm">
                        <Markdown>{profile.about?.bio}</Markdown>
                    </div>
                </div>
            </div>
        </div>
    )
}
