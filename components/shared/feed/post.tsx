/**
 * Forgive me, this is fucking horrible.
 */

import { ArrowUpOnSquareIcon, TrashIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'
import UserAvatar from '@/components/shared/user/avatar'
import Avatar from '@/components/shared/user/avatar'
import { UserProfileBasic } from '@/lib/defs/user'
import Card from '@/components/shared/card'
import UserInfoCol from '@/components/shared/user/info-col'
import moment from 'moment'
import { Dispatch, useEffect, useRef, useState } from 'react'
import { LoadingCircle } from '@/components/shared/icons'
import { vg } from '@/lib/api'
import { toast } from '@/lib/toast'
import { useUIStore, useUserAccountStore } from '@/lib/states'
import XMarkIcon from '@/components/shared/icons/dazzle/xmark'
import Markdown from '@/components/shared/markdown'
import { EllipsisHorizontalIcon, HandThumbUpIcon, PaperAirplaneIcon } from '@heroicons/react/20/solid'
import { MenuButton } from '@headlessui/react'
import { Dropdown, DropdownItem, DropdownLabel, DropdownMenu } from '@/components/shared/dropdown'
import clsx from 'clsx'
import { Text } from '@/components/shared/text'
import { Button } from '@/components/shared/ui/button'
import { Slideover } from '@/components/modal/slideover'

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
    assets?: {
        type: string
        data: {
            [x: string]: any
        }
    }[]
    forceRender?: boolean
    comments?: FeedPostDataType[]
}

export declare interface FeedPostType {
    post: FeedPostDataType
    postState?: [any, Dispatch<any>]
    onDelete?: () => void
}

export default function FeedPost({ post, onDelete, postState }: FeedPostType) {
    const [postContent, setPostContent] = useState<FeedPostDataType>(post)
    const [slideoverOpen, setSlideoverOpen] = useState(false)
    const [slideoverDecal, setSlideoverDecal] = useState(false)
    const [slideoverMediaOpen, setSlideoverMediaOpen] = useState(false)
    const [selectedMedia, setSelectedMedia] = useState<any>()

    const { user: signedInUser } = useUserAccountStore()
    const bucketRoot = useUIStore((state) => state.bucketRoot)

    const deletePost = () => {
        vg.howl({ id: postContent.id })
            .delete()
            .then(({ data, error }) => {
                if (error) {
                    return toast.error(error.value ? `${error.status}: ${error.value.summary}` : 'Something went wrong')
                } else {
                    onDelete && onDelete()
                    return toast.error('Post deleted.')
                }
            })
    }

    const onComment = (comment: any) => {
        const newPostContent = { ...postContent }
        if (!newPostContent.comments) newPostContent.comments = []
        newPostContent.comments.push(comment)
        setPostContent(newPostContent)
        postState && postState[1](postState[0].map((p: any) => (p.id === postContent.id ? newPostContent : p)))
    }

    const [aspectRatio, setAspectRatio] = useState(1)
    useEffect(() => {
        if (slideoverOpen && postContent.assets && postContent.assets.length > 0) {
            const img = new Image()
            img.src = `${bucketRoot}/profiles/${postContent.assets[0].data.url}`
            img.onload = () => {
                const rounded = Math.round((img.width / img.height) * 100) / 100
                console.log(`[📰 Feed Processor] Aspect ratio calc for natural expand: ${rounded} (${img.width}x${img.height})`)
                setAspectRatio(rounded)
            }
        }

        setSlideoverDecal(slideoverOpen)
    }, [slideoverOpen])

    useEffect(() => {
        if (!slideoverDecal) setTimeout(() => setSlideoverOpen(false), 100)
    }, [slideoverDecal])

    useEffect(() => {
        setSlideoverMediaOpen(!!selectedMedia)
    }, [selectedMedia])

    useEffect(() => {
        if (!slideoverMediaOpen) setTimeout(() => setSelectedMedia(null), 100)
    }, [slideoverMediaOpen])

    let alreadyAnnouncedMore = false

    return (
        <>
            {selectedMedia && (
                <Slideover expandNatural={true} open={[slideoverMediaOpen, setSlideoverMediaOpen]}>
                    <div className="px-4 py-4 sm:px-6">
                        <div className="flex h-auto max-h-full flex-col">
                            <div>
                                <div className="aspect-w-10 aspect-h-7 rounded-default block w-full overflow-hidden">
                                    <img src={`${bucketRoot}/profiles/${selectedMedia?.data.url}`} alt="" className="object-cover" />
                                </div>
                                <div className="mt-4 flex items-start justify-between">
                                    <div>
                                        <h2 className="text-default text-lg font-medium">@{postContent.user.username}'s Image Details</h2>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-default font-medium">Information</h3>
                                <dl className="mt-2 divide-y divide-gray-200 border-b border-t border-gray-200">
                                    <div className="flex justify-between py-3 text-sm font-medium">
                                        <dt className="text-default-alt">Key</dt>
                                        <dd className="text-default">E2User:{selectedMedia?.id}</dd>
                                    </div>

                                    {postContent?.created_at && (
                                        <div className="flex justify-between py-3 text-sm font-medium">
                                            <dt className="text-default-alt">Post Upload Date</dt>
                                            <dd className="text-default">{new Date(postContent.created_at).toLocaleDateString()}</dd>
                                        </div>
                                    )}

                                    <div className="flex justify-between py-3 text-sm font-medium">
                                        <dt className="text-default-alt">Lives On</dt>
                                        <dd className="text-default">
                                            {selectedMedia?.data.url.indexOf('supabase') > -1 ? 'Fenra (High Availability)' : 'Dyre (Long-term)'}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </div>
                </Slideover>
            )}

            {slideoverOpen && (
                <Slideover
                    expandNatural={aspectRatio > 1.2}
                    className={`${
                        slideoverMediaOpen ? '-translate-x-24 transition-transform duration-150 will-change-transform' : ''
                    } transition-transform duration-150 will-change-transform`}
                    open={[slideoverDecal, setSlideoverDecal]}
                >
                    <div className="px-4 py-4 sm:px-6">
                        <div className="sticky top-0 z-50 flex space-x-3 rounded bg-neutral-50 p-4 dark:bg-n-6/50">
                            <UserInfoCol user={postContent.user} tag={<time dateTime={postContent.created_at}>about {moment(postContent.created_at).fromNow()}</time>} />
                        </div>

                        <div className="text-default mt-4 space-y-4 break-words text-sm">
                            <Markdown>{postContent.body}</Markdown>
                        </div>

                        {postContent?.assets && postContent.assets.length > 0 && (
                            <MediaGrid assets={postContent.assets} selectState={[selectedMedia, setSelectedMedia]} />
                        )}
                    </div>

                    <div className="flex flex-col justify-between space-y-8 overflow-hidden rounded bg-neutral-50 px-4 py-4 highlight-white/5 dark:bg-n-6/50 sm:px-6">
                        <div className="flex space-x-6">{signedInUser && !signedInUser.anonUser && <React post={postContent} />}</div>

                        {postContent?.comments && postContent.comments.length > 0 && (
                            <>
                                {signedInUser && !signedInUser.anonUser && <CommentBox className="flex-1" truncate originalPost={postContent} onComment={onComment} />}

                                <div className="flow-root">
                                    <ul role="list" className="-mb-8">
                                        {postContent.comments.map((comment) => (
                                            <RecursiveCommentThread
                                                key={comment.id}
                                                comment={comment}
                                                originalPost={[postContent, setPostContent]}
                                                postState={postState}
                                            />
                                        ))}
                                    </ul>
                                </div>
                            </>
                        )}
                    </div>
                </Slideover>
            )}

            <Card className="!px-0 !py-0">
                <div className="relative">
                    <div className="px-4 pt-5 sm:px-6">
                        {/* "___ Rehowled" */}
                        {postContent.howling && (
                            <div className="mb-6 flex items-center text-sm">
                                <ArrowUpOnSquareIcon className="mr-2 h-4 w-4" />
                                <Link href={`/@${postContent.actor?.username}/`} className="text-alt flex items-center">
                                    <UserAvatar size="xs" icon={postContent.actor?.images?.avatar || ''} className="mr-2" />
                                    {postContent.actor?.username} rehowled
                                </Link>
                            </div>
                        )}
                        {postContent.pack && postContent.pack.slug !== 'universe' && (
                            <div className="mb-6 flex items-center text-sm">
                                {/* <UserGroupIcon className="mr-2 h-4 w-4" /> */}
                                <Link href={`/p/${postContent.pack?.slug}/`} className="text-alt flex items-center justify-center !no-underline hover:text-inherit">
                                    <UserAvatar size="xs" icon={postContent.pack?.images?.avatar || ''} className="mr-2 rounded-sm" />
                                    <span>{postContent.pack?.display_name}</span>
                                </Link>
                            </div>
                        )}
                        <div className="flex space-x-3">
                            <div className="flex-1">
                                <UserInfoCol
                                    user={postContent.user}
                                    tag={<time dateTime={postContent.created_at}>about {moment(postContent.created_at).fromNow()}</time>}
                                />
                            </div>
                            <div className="flex flex-shrink-0 space-x-2 self-center">
                                {postContent.user && postContent.user.id === signedInUser?.id && (
                                    <Dropdown>
                                        <MenuButton>
                                            <EllipsisHorizontalIcon className="w-5" />
                                        </MenuButton>
                                        <DropdownMenu className="mt-4 !w-36 !p-0">
                                            <DropdownItem onClick={deletePost}>
                                                <DropdownLabel className="group inline-flex items-center justify-start gap-3 py-1">
                                                    <div className="h-6 w-6 items-center justify-center p-0.5">
                                                        <TrashIcon className="h-full w-full fill-tertiary transition-colors" />
                                                    </div>
                                                    <span className="text-sm">Delete</span>
                                                </DropdownLabel>
                                            </DropdownItem>
                                        </DropdownMenu>
                                    </Dropdown>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="min-h-fit w-full cursor-pointer px-4 py-4 sm:px-6">
                        <div className="text-default space-y-4 break-words text-sm" onClick={() => setSlideoverOpen(true)}>
                            <Markdown>{postContent.body}</Markdown>
                        </div>

                        {/* Post Objects (Images) */}
                        {postContent.assets && postContent.assets.length > 0 && (
                            <MediaGrid assets={postContent.assets} post={post} selectState={[selectedMedia, setSelectedMedia]} truncate />
                        )}
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
                {signedInUser && !signedInUser.anonUser && (
                    <div className="flex justify-between space-x-8 border-t px-4 py-4 sm:px-6">
                        <div className="flex">
                            <React post={post} />
                        </div>
                        <CommentBox className="flex-1" truncate originalPost={postContent} onComment={onComment} />
                    </div>
                )}

                {post?.comments && post.comments.length > 0 && (
                    <div className="px-4 py-4 sm:px-6">
                        <div className="flow-root">
                            <ul role="list" className="-mb-8">
                                {post.comments.map((comment) => (
                                    <>
                                        <FeedListItem
                                            key={comment.id}
                                            comment={comment}
                                            showLine={comment.comments && comment.comments.length > 0}
                                            originalPost={[postContent, setPostContent]}
                                            postState={postState}
                                            onClick={() => setSlideoverOpen(true)}
                                        />
                                        {comment.comments && comment.comments.length > 0 && (
                                            <>
                                                {/* @ts-ignore - fuck sake. */}
                                                <FeedListItem
                                                    key={comment.comments[comment.comments.length - 1].id}
                                                    comment={comment.comments[comment.comments.length - 1]}
                                                    showLine={comment.comments[comment.comments.length - 1].forceRender}
                                                    originalPost={[postContent, setPostContent]}
                                                    postState={postState}
                                                    onClick={() => setSlideoverOpen(true)}
                                                />

                                                {/* almost there: check if any replies from here have 'forceRender', then, well, force render it */}
                                                {comment.comments[comment.comments.length - 1].comments?.map((replyInsideAgain) => {
                                                    /* @ts-ignore - hey, its right this time! but it's a one-off thing. */
                                                    if (replyInsideAgain.forceRender) {
                                                        return (
                                                            <FeedListItem
                                                                key={replyInsideAgain.id}
                                                                comment={replyInsideAgain}
                                                                showLineReverse
                                                                originalPost={[postContent, setPostContent]}
                                                                postState={postState}
                                                                onClick={() => setSlideoverOpen(true)}
                                                            />
                                                        )
                                                    } else if (!alreadyAnnouncedMore) {
                                                        alreadyAnnouncedMore = true
                                                        // Return a "+ more" text
                                                        return (
                                                            <li className="relative -mt-8 px-12 pb-8">
                                                                <div
                                                                    className="text-alt cursor-pointer pl-1 text-sm font-medium hover:underline"
                                                                    // onClick={() => setSlideoverOpen(true)}
                                                                >
                                                                    + {comment.comments[comment.comments.length - 1].comments.length} more
                                                                </div>
                                                            </li>
                                                        )
                                                    }
                                                })}
                                            </>
                                        )}
                                    </>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </Card>
        </>
    )
}

function FeedListItem({ ...props }: any) {
    const { comment, showLine, originalPost } = props
    const [likes, setLikes] = useState(comment.likes || 0)
    const [showReplyBox, setShowReplyBox] = useState(false)
    const [postContent, setPostContent] = originalPost
    const [postList, setPostList] = props.postState
    const { user } = useUserAccountStore()

    const handleReplySubmit = (commentBody: any, newPostContent: any, commentID: string) => {
        setShowReplyBox(false)

        // we need to append the comment to the replies to the reply
        newPostContent.comments.forEach((comment: any) => {
            // if we're replying to a reply, we need to find the reply we're replying to inside the replies of the reply
            if (comment.comments) {
                comment.comments.forEach((commentInside: any) => {
                    // just one more
                    if (commentInside.comments && commentInside.id === commentBody.parent) {
                        commentInside.comments.forEach((commentInsideAgain: any) => {
                            console.log(commentInsideAgain.id, commentID)
                            if (commentInsideAgain.id === commentID) {
                                // we just need to change forceRender to true.
                                commentInsideAgain.forceRender = true
                                commentInside.forceRender = true
                            }
                        })
                    }
                })
            }
        })

        setPostContent(newPostContent)
    }

    const deleteComment = () => {
        vg.howl({ id: comment.id })
            .delete()
            .then(({ data, error }) => {
                if (error) {
                    return toast.error(error.value ? `${error.status}: ${error.value.summary}` : 'Something went wrong')
                } else {
                    const newPostContent = { ...postContent }
                    newPostContent.comments = newPostContent.comments.filter((c: any) => c.id !== comment.id)
                    let newPostList = postList.map((post: any) => {
                        if (post.id === postContent.id) {
                            return newPostContent
                        }
                        return post
                    })
                    setPostList(newPostList)
                    setPostContent(newPostContent)
                    return toast.success('Comment deleted.')
                }
            })
    }

    return (
        <li>
            <div className="relative pb-8">
                {showLine ? <span className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-neutral-300 dark:bg-neutral-700" aria-hidden="true" /> : null}
                <div className="rounded-default hover:bg-box group relative flex cursor-pointer flex-col items-start space-x-3">
                    <div className="relative flex flex-row items-start space-x-3">
                        <div className="relative">
                            <Avatar user={comment.user} className="bg-box-alt flex items-center justify-center rounded-full ring-8 ring-surface-container-high" />

                            {comment.likedParent && (
                                <span className="bg-box-alt rounded-default absolute -bottom-0.5 -right-1 px-0.5 py-px">
                                    <HandThumbUpIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                </span>
                            )}
                        </div>
                        <div className="relative min-w-0 flex-1">
                            <div>
                                <div className="text-sm">
                                    <Link href={`/@${comment.user.username}/`} className="text-default font-medium">
                                        {comment.user.display_name || comment.user.username}
                                    </Link>
                                </div>
                                <p className="text-alt text-sm">
                                    {comment.created_at ? (
                                        <time dateTime={comment.created_at.toString()}>{moment(comment.created_at).fromNow()}</time>
                                    ) : (
                                        comment.user.username
                                    )}
                                </p>
                            </div>

                            <div
                                className="text-default mt-2 break-words text-sm"
                                style={{ wordBreak: 'break-word' }} // fix for long links
                                onClick={props.onClick}
                            >
                                {comment.body}
                            </div>
                        </div>
                    </div>

                    {/* Settings on hover */}
                    <div className="absolute right-0 top-0 -mr-2 -mt-2 hidden group-hover:block">
                        <div className="relative z-10 flex items-center space-x-4">
                            {/* Reply & Like */}
                            {/*<div className="bg-box-alt rounded-default flex flex-row items-center justify-between">*/}
                            {/*    <div className="flex flex-row items-center">*/}
                            {/*        <div className="rounded-default hover:bg-box flex flex-row items-center space-x-2 p-2">*/}
                            {/*            <HandThumbUpIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />*/}
                            {/*            {likes > 0 && <span className="text-alt text-sm">{likes}</span>}*/}
                            {/*        </div>*/}
                            {/*        <div className="rounded-default hover:bg-box flex flex-row items-center space-x-2 p-2" onClick={() => setShowReplyBox(!showReplyBox)}>*/}
                            {/*            <ChatBubbleLeftIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />*/}
                            {/*        </div>*/}
                            {/*    </div>*/}
                            {/*</div>*/}

                            {comment.user.id === user.id && (
                                <button
                                    type="button"
                                    className="bg-box-alt text-default hover:bg-box flex h-8 w-8 items-center justify-center rounded-full"
                                    aria-expanded="false"
                                    aria-haspopup="true"
                                    onClick={() => deleteComment()}
                                >
                                    <span className="sr-only">Open options</span>
                                    <TrashIcon className="h-5 w-5" aria-hidden="true" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Comment box to reply */}
                    {showReplyBox && (
                        <div className="mt-2 flex flex-row items-center">
                            <CommentBox originalPost={postContent} onSubmit={handleReplySubmit} />
                        </div>
                    )}
                </div>
            </div>
        </li>
    )
}

// Goes through replies, and calls itself again with padding if there are replies within replies.
function RecursiveCommentThread({ ...props }: any) {
    const { comment, showLine, originalPost, postState } = props

    return (
        <>
            <FeedListItem comment={comment} showLine={showLine || false} originalPost={originalPost} postState={postState} />
            {comment.comments &&
                comment.comments.length > 0 &&
                comment.comments.map((commentInside: any, commentInsideIdx: any) => (
                    <>
                        <div className="pl-12">
                            <RecursiveCommentThread
                                key={commentInsideIdx}
                                comment={commentInside}
                                showLine={commentInsideIdx !== comment.comments.length - 1}
                                originalPost={originalPost}
                            />
                        </div>
                    </>
                ))}
        </>
    )
}

function React({ post }: FeedPostType) {
    const { user } = useUserAccountStore()
    const [submitting, setSubmitting] = useState(false)

    const hasCurrentUser = post.reactions?.['0']?.includes(user?.id)

    const react = () => {
        if (submitting) return
        setSubmitting(true)

        const howlReact = vg.howl({ id: post.id }).react
        ;(hasCurrentUser ? howlReact.delete({ slot: 0 }) : howlReact.post({ slot: 0 })).then(({ data, error }) => {
            setSubmitting(false)
            if (error) {
                return toast.error(error.value ? `${error.status}: ${error.value.summary}` : 'Something went wrong')
            } else {
                if (!post.reactions)
                    post.reactions = {
                        '0': [],
                    }

                if (hasCurrentUser) {
                    post.reactions['0'] = post.reactions['0'].filter((id) => id !== user?.id)
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
        <Button variant="ghost" className="inline-flex !h-fit cursor-pointer items-center px-2 text-sm" onClick={react}>
            {!submitting ? (
                hasCurrentUser ? (
                    <XMarkIcon className="text-alt h-4 w-4 hover:text-accent-1" />
                ) : (
                    <HandThumbUpIcon className="text-alt h-4 w-4 hover:text-inherit" />
                )
            ) : (
                <LoadingCircle className="h-4 w-4" />
            )}
            {post.reactions?.['0']?.length > 0 && <Text className="text-alt ml-2 text-sm">{post.reactions['0'].length}</Text>}
        </Button>
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
    const { assets, truncate } = props
    const [, setSelectedMedia] = props.selectState

    const bucketRoot = useUIStore((state) => state.bucketRoot)
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
            <div className={assets.length > 1 ? 'flex flex-col' : ''}>
                <div className="aspect-w-10 aspect-h-7 block w-full overflow-hidden rounded">
                    {/* @todo: CLEANNNN */}
                    {assets[0].type === 'image' && (
                        <img
                            src={`${bucketRoot}/profiles/${assets[0].data.url}`}
                            alt=""
                            className="aspect-w-10 aspect-h-7 w-full rounded object-cover"
                            onClick={() => setSelectedMedia(assets[0])}
                        />
                    )}

                    {assets[0].type === 'video' && (
                        <video src={`${bucketRoot}/profiles/${assets[0].data.url}`} className="aspect-w-10 aspect-h-7 rounded object-cover" controls />
                    )}
                </div>

                {assets.length >= 2 && (
                    <div className={`mt-2 grid ${assets.length >= 2 ? 'grid-cols-3' : ''} gap-2`}>
                        {assets.slice(1).map(
                            (
                                object: {
                                    type: string
                                    data: {
                                        url: string
                                        name: string
                                    }
                                },
                                objectIndex: number,
                            ) => {
                                if (truncate && objectIndex === 2)
                                    return (
                                        <div key={objectIndex} className="w-full overflow-hidden rounded">
                                            <div className="relative aspect-square">
                                                <img
                                                    src={`${bucketRoot}/profiles/${object.data.url}`}
                                                    alt=""
                                                    className="aspect-square h-full w-full object-cover"
                                                    onClick={() => setSelectedMedia(object)}
                                                />

                                                {assets.length > 4 && (
                                                    <div className="absolute right-0 top-0 mr-2 mt-2 flex items-center justify-center">
                                                        <div className="bg-box rounded p-2">
                                                            {/* @ts-ignore - for fuck sake. */}
                                                            <span className="text-defualt-alt text-sm">+{assets.length - 4}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )

                                if (truncate && objectIndex >= 3) return null
                                // Check E2 for object variant
                                switch (object.type) {
                                    case 'image':
                                        return (
                                            <div key={objectIndex} className={`aspect-square w-full overflow-hidden rounded`} onClick={() => setSelectedMedia(object)}>
                                                <img src={`${bucketRoot}/profiles/${object.data.url}`} alt="" className="aspect-square h-full w-full object-cover" />
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

function CommentBox({ ...props }: any) {
    const { originalPost, onComment } = props
    const [commentSubmitting, setCommentSubmitting] = useState(false)
    const commentRef = useRef<HTMLInputElement>(null)
    const { user } = useUserAccountStore()

    const createComment = (e?: { preventDefault: () => void }) => {
        if (e) e.preventDefault()
        setCommentSubmitting(true)

        const commentBody = {
            body: commentRef.current?.value,
        }

        vg.howl({ id: originalPost.id })
            .comment.post(commentBody)
            .then(({ data, error }) => {
                console.log(data, error)
                setCommentSubmitting(false)
                if (error) {
                    return toast.error(error.value ? `${error.status}: ${error.value.summary}` : 'Something went wrong')
                } else {
                    commentRef.current.value = ''
                    onComment({
                        id: data.id,
                        ...commentBody,
                        user: user,
                    })
                    return toast.success('Commented!')
                }
            })
    }

    return (
        <div className={props.className}>
            {/* "Replying to [user]" text */}
            {!props.truncate && (
                <div className="mb-4 flex items-center space-x-2">
                    <div className="flex-shrink-0">
                        <img className="h-8 w-8 rounded-full" src={user.images?.avatar || `/img/default-avatar.png`} alt="" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-default cursor-pointer text-sm font-medium hover:underline">
                            Replying to {originalPost.user.display_name || originalPost.user.username}
                        </p>
                    </div>
                </div>
            )}

            <div
                className={clsx(
                    commentSubmitting
                        ? 'relative isolate overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:border before:border-x-0 before:border-b-0 before:border-t before:border-solid before:border-neutral-100/10 before:bg-gradient-to-r before:from-transparent before:via-neutral-500/5 before:to-transparent'
                        : '',
                    'relative flex items-center rounded',
                )}
            >
                <input
                    type="text"
                    name="comment"
                    id="comment"
                    className="border-default block w-full rounded bg-card px-10 placeholder:text-neutral-400 focus:border-primary focus:ring-primary sm:text-sm"
                    placeholder="Comment"
                    ref={commentRef}
                />
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <img className="h-5 w-5 rounded-full" src={user.images?.avatar || `/img/default-avatar.png`} alt="" />
                </div>
                <div className="absolute inset-y-0 right-0 flex cursor-pointer items-center py-2 pr-2">
                    {commentSubmitting ? (
                        <img className="h-5 w-5 animate-spin dark:invert" src={`/img/symbolic/process-working.symbolic.png`} alt="Process working spinner" />
                    ) : (
                        <PaperAirplaneIcon className="text-default h-5 w-5" onClick={createComment} />
                    )}
                </div>
            </div>
        </div>
    )
}
