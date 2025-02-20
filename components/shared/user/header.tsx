'use client'
import {Heading} from '@/components/shared/text'
import Markdown from '@/components/shared/markdown'
import UserAvatar from '@/components/shared/user/avatar'
import {vg} from '@/lib/api'
import {toast} from 'sonner'
import {Button} from '@/components/shared/button'
import {useUserAccountStore} from '@/lib/states'
import {useState} from 'react'

// @TODO: Unify user and pack headers.
export default function ProfileHeader({...props}: any) {
    const profile = props.user

    const {user} = useUserAccountStore()

    return (
        <div className="relative">
            <div>
                <img
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
                        <UserAvatar size={96} user={profile} className="bg-default ring-default pointer-events-none h-24 w-24 rounded-lg ring-1 sm:h-32 sm:w-32"/>
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
                    {(user && !user.anonUser && user.id !== profile.id) && <div className="mt-6 flex items-center sm:mt-0 sm:flex-shrink-0">
                        <UserFollowButton user={profile}/>
                    </div>}
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

function UserFollowButton({user}: { user: any }) {
    const [following, setFollowing] = useState(user.following)
    const [submitting, setSubmitting] = useState(false)
    const follow = () => {
        setSubmitting(true)
        vg.user({username: user.username}).follow.post().then(({error}) => {
            setSubmitting(false)
            if (error) return toast.error(error.value ? `${error.status}: ${error.value.summary}` : 'Something went wrong')
            setFollowing(true)
        })
    }

    const unfollow = () => {
        setSubmitting(true)
        vg.user({username: user.username}).follow.delete().then(({error}) => {
            setSubmitting(false)
            if (error) return toast.error(error.value ? `${error.status}: ${error.value.summary}` : 'Something went wrong')
            setFollowing(false)
        })
    }

    return (
        <Button onClick={following ? unfollow : follow} variant={following ? 'destructive' : 'primary'} disabled={submitting}>
            {following ? 'Unfollow' : 'Follow'}
        </Button>
    )
}