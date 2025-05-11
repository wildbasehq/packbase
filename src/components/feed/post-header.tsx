// src/components/feed/PostHeader.tsx
import {ArrowUpOnSquareIcon, EllipsisHorizontalIcon} from '@heroicons/react/20/solid'
import {TrashIcon} from '@heroicons/react/16/solid'
import UserAvatar from '@/components/shared/user/avatar'
import UserInfoCol from '@/components/shared/user/info-col'
import Link from '@/components/shared/link'
import {UserProfileBasic} from '@/lib/defs/user'
import {FeedPostData} from './types/post'
import {Dropdown, DropdownItem, DropdownLabel, DropdownMenu} from '@/components/shared/dropdown'
import {MenuButton} from '@headlessui/react'
import {formatRelativeTime} from '@/lib/utils/date'

interface PostHeaderProps {
    post: FeedPostData;
    signedInUser?: UserProfileBasic | null;
    onDelete: () => void;
}

export default function PostHeader({post, signedInUser, onDelete}: PostHeaderProps) {
    const isAuthor = post.user?.id === signedInUser?.id

    return (
        <div className="px-3 pt-3 sm:px-5 sm:pt-5">
            {/* Share info (rehowl) */}
            {post.howling && (
                <div className="mb-3 flex items-center text-xs text-neutral-500 dark:text-neutral-400">
                    <ArrowUpOnSquareIcon className="mr-2 h-3.5 w-3.5 sm:h-3 sm:w-3"/>
                    <Link
                        href={`/@${post.actor?.username}/`}
                        className="flex items-center hover:text-neutral-700 dark:hover:text-neutral-300"
                    >
                        <UserAvatar
                            size="xs"
                            icon={post.actor?.images?.avatar || ''}
                            className="mr-1.5"
                        />
                        <span>{post.actor?.username} reshared</span>
                    </Link>
                </div>
            )}

            {/* Community info */}
            {post.pack && post.pack.slug !== 'universe' && (
                <div className="mb-3 flex items-center text-xs text-neutral-500 dark:text-neutral-400">
                    <Link
                        href={`/p/${post.pack?.slug}/`}
                        className="flex items-center hover:text-neutral-700 dark:hover:text-neutral-300 text-default"
                    >
                        <UserAvatar
                            size="xs"
                            icon={post.pack?.images?.avatar || ''}
                            className="mr-1.5 rounded-sm"
                        />
                        <span>{post.pack?.display_name}</span>
                    </Link>
                </div>
            )}

            {/* Author and timestamp */}
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <UserInfoCol
                        user={post.user}
                        tag={
                            <time
                                dateTime={post.created_at}
                                className="text-xs text-neutral-500 dark:text-neutral-400"
                            >
                                {formatRelativeTime(post.created_at)}
                            </time>
                        }
                    />
                </div>

                {/* Post actions menu */}
                {isAuthor && (
                    <div className="flex shrink-0 self-center">
                        <Dropdown>
                            <MenuButton className="flex h-10 w-10 sm:h-8 sm:w-8 items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800">
                                <EllipsisHorizontalIcon className="h-6 w-6 sm:h-5 sm:w-5 text-neutral-500"/>
                            </MenuButton>
                            <DropdownMenu className="w-36 p-1">
                                <DropdownItem onClick={onDelete}>
                                    <DropdownLabel className="group flex items-center gap-2 px-2 py-2 sm:py-1.5">
                                        <TrashIcon className="h-4 w-4 text-neutral-500 group-hover:text-red-500"/>
                                        <span className="text-sm font-medium">Delete</span>
                                    </DropdownLabel>
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                )}
            </div>
        </div>
    )
}
