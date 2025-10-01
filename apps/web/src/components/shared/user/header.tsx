/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {Heading} from '@/components/shared/text'
import Markdown from '@/components/shared/markdown'
import UserAvatar from '@/components/shared/user/avatar'
import {vg} from '@/lib/api'
import {toast} from 'sonner'
import {Button} from '@/components/shared'
import {useUserAccountStore} from '@/lib/state'
import {useState} from 'react'
import {ChatBubbleLeftEllipsisIcon} from '@heroicons/react/16/solid'

// @TODO: Unify user and pack headers.
export default function ProfileHeader({...props}: any) {
    const profile = props.user

    const {user} = useUserAccountStore()

    return (
        <div className="relative" id="profile-header">
            <div id="profile-banner-container">
                <img
                    id="profile-banner-image"
                    height={1080}
                    width={1920}
                    className="pointer-events-none aspect-banner w-full rounded-bl rounded-br object-cover"
                    src={(profile.images?.header || '/img/background/generic-generated.png') + `?v=${new Date().getTime()}`}
                    alt="Profile cover"
                />
            </div>
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8" id="profile-content-container">
                <div className="-mt-12 sm:flex sm:items-end sm:space-x-5" id="profile-content-top-container">
                    <div className="flex" id="profile-content-avatar-container">
                        <UserAvatar
                            size={96}
                            user={profile}
                            className="bg-default ring-default pointer-events-none h-24 w-24 rounded-lg ring-1 sm:h-32 sm:w-32"
                            id="profile-content-avatar"
                        />
                    </div>
                    <div
                        className="mt-6 sm:flex sm:min-w-0 sm:flex-1 sm:items-center sm:justify-end sm:space-x-6 sm:pb-1"
                        id="profile-content-info-container"
                    >
                        <div className="mt-6 min-w-0 flex-1 sm:hidden md:block"
                             id="profile-content-info-desktop-container">
                            <Heading
                                id="profile-content-info-desktop-display-name">{profile.display_name || profile.username}</Heading>
                            {/* Small @username */}
                            <div className="flex items-center" id="profile-content-info-desktop-username-container">
                                <p className="text-muted-foreground truncate text-sm font-medium"
                                   id="profile-content-info-desktop-username">
                                    @{profile.username}
                                </p>
                            </div>
                        </div>
                    </div>
                    {user && (
                        <>
                            <div className="mt-6 flex items-center sm:mt-0 sm:flex-shrink-0"
                                 id="profile-content-follow-button-container">
                                <UserFollowButton user={profile}/>
                            </div>

                            <div className="mt-6 flex items-center sm:mt-0 sm:flex-shrink-0">
                                <Button outline href={`/c/sw:${profile.id}`}>
                                    <ChatBubbleLeftEllipsisIcon data-slot="icon"/> DM
                                </Button>
                            </div>
                        </>
                    )}
                </div>
                <div className="mt-6 hidden min-w-0 flex-1 sm:block md:hidden"
                     id="profile-content-info-mobile-container">
                    <Heading
                        id="profile-content-info-mobile-display-name">{profile.display_name || profile.username}</Heading>
                </div>
                <div className="text-default block min-w-0 flex-1" id="profile-content-info-bio-container">
                    <div className="mt-6 whitespace-pre-line text-sm" id="profile-content-info-bio">
                        <Markdown>{profile.about?.bio}</Markdown>
                    </div>
                </div>
            </div>
        </div>
    )
}

function UserFollowButton({user}: { user: any }) {
    const [following, setFollowing] = useState(user.following)
    const [submitting, setSubmitting] = useState(false)
    const follow = () => {
        setSubmitting(true)
        vg.user({username: user.username})
            .follow.post()
            .then(({error}) => {
                setSubmitting(false)
                if (error) toast.error(error.value ? `${error.status}: ${error.value.summary}` : 'Something went wrong')
                else setFollowing(true)
            })
    }

    const unfollow = () => {
        setSubmitting(true)
        vg.user({username: user.username})
            .follow.delete()
            .then(({error}) => {
                setSubmitting(false)
                if (error) toast.error(error.value ? `${error.status}: ${error.value.summary}` : 'Something went wrong')
                else setFollowing(false)
            })
    }

    return (
        <Button onClick={following ? unfollow : follow} color={(following ? 'red' : 'indigo') as 'red' | 'indigo'}
                disabled={submitting}>
            {following ? 'Unfollow' : 'Follow'}
        </Button>
    )
}
