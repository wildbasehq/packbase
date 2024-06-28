/**
 * Forgive me, this is fucking horrible.
 */

import { ArrowUpOnSquareIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'
import UserAvatar from '@/components/shared/user/avatar'
import { UserProfileBasic } from '@/lib/defs/user'
import Card from '@/components/shared/card'
import UserInfoCol from '@/components/shared/user/info-col'
import moment from 'moment'
import { useState } from 'react'
import { LoadingCircle } from '@/components/shared/icons'
import { FetchHandler } from '@/lib/api'
import { toast } from '@/lib/toast'
import { useUserAccountStore } from '@/lib/states'
import XMarkIcon from '@/components/shared/icons/dazzle/xmark'
import Markdown from '@/components/shared/markdown'
import { HandThumbUpIcon } from '@heroicons/react/20/solid'

export declare interface FeedPostDataType {
    id: string
    user: UserProfileBasic
    body: string
    created_at: string
    pack?: any
    howling: 'echo' | 'alongside'
    actor: UserProfileBasic
    reactions?: {
        [x: string]: string[]
    }
}

export declare interface FeedPostType {
    post: FeedPostDataType
}

export default function FeedPost({ post }: FeedPostType) {
    const { id, user, body, created_at, pack, howling, actor } = post

    return (
        <>
            <Card className="!px-0 !py-0">
                <div className="relative">
                    <div className="px-4 pt-5 sm:px-6">
                        {/* "___ Rehowled" */}
                        {howling && (
                            <div className="mb-6 flex items-center text-sm">
                                <ArrowUpOnSquareIcon className="mr-2 h-4 w-4" />
                                <Link href={`/@${actor?.username}/`} className="text-default-alt flex items-center">
                                    <UserAvatar size="xs" image={actor?.images?.avatar || ''} className="mr-2" />
                                    {actor?.username} rehowled
                                </Link>
                            </div>
                        )}
                        {pack && (
                            <div className="mb-6 flex items-center text-sm">
                                {/* <UserGroupIcon className="mr-2 h-4 w-4" /> */}
                                <Link href={`/pack/@${pack?.domain}/`} className="text-alt flex items-center justify-center !no-underline hover:text-inherit">
                                    <UserAvatar size="xs" icon={pack?.avatar || ''} className="mr-2 rounded-sm" />
                                    <span>{pack?.display_name}</span>
                                </Link>
                            </div>
                        )}
                        <div className="flex space-x-3">
                            <UserInfoCol user={user} tag={<time dateTime={created_at}>about {moment(created_at).fromNow()}</time>} />
                            <div className="flex flex-shrink-0 space-x-2 self-center"></div>
                        </div>
                    </div>
                    <div className="min-h-fit w-full cursor-pointer px-4 py-4 sm:px-6">
                        <div className="space-y-4 text-sm text-neutral-700 dark:text-neutral-50">
                            <Markdown>{body}</Markdown>
                        </div>

                        {/* Post Objects (Images) */}
                        {/*{postContent?.objects && postContent.objects.length > 0 && (*/}
                        {/*    <MediaGrid objects={postContent.objects} selectState={[selectedMedia, setSelectedMedia]}*/}
                        {/*               post={postContent} truncate/>*/}
                        {/*)}*/}
                    </div>
                    {/* <div className="bg-box-alt absolute bottom-0 left-0 ml-4 rounded-tl-xl rounded-tr-xl border-x border-b-0 border-t border-solid border-neutral-300 dark:border-neutral-700 sm:ml-6">
                        <div className="flex items-center space-x-2 px-4 py-2">
                            <div className="flex-shrink-0"> 
                                <img
                                    className="h-4 w-4 rounded-full"
                                    src={user.images?.avatar || `/img/avatar/default-avatar.png`}
                                    alt=""
                                />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-default cursor-pointer text-sm font-medium hover:underline">
                                    {user.username} is typing...
                                </p>
                            </div>
                        </div>
                    </div> */}
                </div>

                {/* Footer - Like & Share on left, rest of space taken up by a reply textbox with send icon on right */}
                <div className="flex justify-between space-x-8 border-t px-4 py-4 sm:px-6">
                    <div className="flex">{user && <React post={post} />}</div>
                </div>
            </Card>
        </>
    )
}

function React({ post }: FeedPostType) {
    const { user } = useUserAccountStore()
    const [submitting, setSubmitting] = useState(false)

    const hasCurrentUser = post.reactions?.['0']?.includes(user.id)

    const react = () => {
        if (submitting) return
        setSubmitting(true)

        const FetchAction = hasCurrentUser ? FetchHandler.delete : FetchHandler.post
        FetchAction('/xrpc/app.packbase.howl.react', {
            body: JSON.stringify({
                id: post.id,
                ...(!hasCurrentUser ? { slot: 0 } : {}),
            }),
        }).then(({ data }) => {
            setSubmitting(false)
            if (data?.message) {
                return toast.error(data.message ? `${data.at}: ${data.message}` : 'Something went wrong')
            } else {
                if (!post.reactions)
                    post.reactions = {
                        '0': [],
                    }

                if (hasCurrentUser) {
                    post.reactions['0'] = post.reactions['0'].filter((id) => id !== user.id)
                    return toast.error('Removed reaction.')
                }

                post.reactions['0'].push(user.id)
                return toast.error('Liked!')
            }
        })
    }

    return (
        // <HoverCard.Root>
        //     <HoverCard.Trigger>
        <span className="inline-flex cursor-pointer items-center text-sm hover:underline" onClick={react}>
            {!submitting ? (
                hasCurrentUser ? (
                    <XMarkIcon className="text-alt h-5 w-5 hover:text-accent-1" />
                ) : (
                    <HandThumbUpIcon className="text-alt h-5 w-5 hover:text-inherit" />
                )
            ) : (
                <LoadingCircle className="h-5 w-5" />
            )}
        </span>
        //     </HoverCard.Trigger>
        //     <HoverCard.Portal>
        //         <HoverCard.Content side="top">
        //             <Picker
        //                 data={data}
        //                 onEmojiSelect={console.log}
        //                 icons="solid"
        //                 noCountryFlags
        //                 skinTonePosition="none"
        //                 categories={['frequent', 'custom', 'people', 'symbols']}
        //             />
        //         </HoverCard.Content>
        //     </HoverCard.Portal>
        // </HoverCard.Root>
    )
}

function MediaGrid({ ...props }: any) {
    const { objects, truncate } = props
    const [, setSelectedMedia] = props.selectState

    // IMPORTANT!
    /*
     *      (()__(()
     *      /       \
     *     ( /    \  \
     *      \ o o    /
     *      (_()_)__/ \
     *     / _,==.____ \
     *    (   |--|      )
     *    /\_.|__|'-.__/\_
     *   / (        /     \
     *   \  \      (      /
     *    )  '._____)    /
     * (((____.--(((____/mrf
     *
     * sincerely,
     * the bear
     */

    return (
        <div className="mt-4">
            <div className={objects.length > 1 ? 'flex flex-col' : ''}>
                <div className="aspect-w-10 aspect-h-7 rounded-default block w-full overflow-hidden">
                    {/* @todo: CLEANNNN */}
                    {objects[0]?.id?.split(':')[1].substring(2, 4) === 'C1' && <img src={objects[0].url} alt="" className="aspect-w-10 aspect-h-7 w-full object-cover" />}

                    {objects[0]?.id?.split(':')[1].substring(2, 4) === 'C2' && <video src={objects[0].url} className="aspect-w-10 aspect-h-7 object-cover" controls />}
                </div>

                {objects.length >= 2 && (
                    <div className={`mt-2 grid ${objects.length >= 2 ? 'grid-cols-3' : ''} gap-2`}>
                        {objects.slice(1).map(
                            (
                                object: {
                                    url: string | undefined
                                    id: string
                                },
                                objectIndex: number,
                            ) => {
                                if (truncate && objectIndex === 2)
                                    return (
                                        <div key={objectIndex} className="rounded-default w-full overflow-hidden">
                                            <div className="relative aspect-square">
                                                <img
                                                    src={object.url}
                                                    alt=""
                                                    className="aspect-square h-full w-full object-cover"
                                                    onClick={/* @ts-ignore */ () => setSelectedMedia(object)}
                                                />

                                                {/* @ts-ignore - postContent.objects is very obviously defined :| */}
                                                {objects.length > 4 && (
                                                    <div className="absolute right-0 top-0 mr-2 mt-2 flex items-center justify-center">
                                                        <div className="bg-box rounded-default p-2">
                                                            {/* @ts-ignore - for fuck sake. */}
                                                            <span className="text-defualt-alt text-sm">+{objects.length - 4}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )

                                if (truncate && objectIndex >= 3) return null
                                // Check E2 for object variant
                                switch (object.id.split(':')[1].substring(2, 4)) {
                                    case 'C1':
                                        return (
                                            <div key={objectIndex} className={`rounded-default aspect-square w-full overflow-hidden`}>
                                                <img
                                                    src={object.url}
                                                    alt=""
                                                    className="aspect-square h-full w-full object-cover"
                                                    onClick={/* @ts-ignore */ () => setSelectedMedia(object)}
                                                />
                                            </div>
                                        )
                                }
                            },
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
