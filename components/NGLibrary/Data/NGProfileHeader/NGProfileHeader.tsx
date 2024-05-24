'use client'
import React, {Fragment, useEffect, useState} from 'react'
import ReactMarkdown from 'react-markdown'
import {NGHeading} from '@/components/NGLibrary'
import {buildClassObject} from '@/lib/ColourScheme.utils'
import {Menu, Transition} from '@headlessui/react'
import {follow, friendRequest, getRelationship, isFollowing, unfollow,} from '@/lib/api/relationships/post'
import {
    ChatBubbleLeftIcon,
    CheckBadgeIcon,
    ChevronDownIcon,
    LinkIcon,
    UserGroupIcon,
    UserMinusIcon,
    UserPlusIcon,
} from '@heroicons/react/20/solid'

export declare interface NGProfileHeaderType {
    user: any;
    self?: boolean;
    loggedIn?: boolean;
    defaults?: {
        header?: string; profile?: string;
    }
    theme?: any;
    children?: React.ReactNode;
}

export const NGProfileHeaderTheming = {
    main: [],
    button: ['w-full', 'inline-flex', 'justify-center', 'py-2', 'px-4', 'border', 'border-neutral-300 dark:border-neutral-500', 'rounded-lg', 'shadow-sm', 'bg-card', 'text-sm', 'font-medium', 'text-default', 'hover:bg-neutral-50 dark:hover:bg-neutral-700'],
}

const items = [{
    id: 'new_friend_request',
    name: 'Send Friend Request',
    description: 'Being friend\'s with a user will still count a follow.',
}, /* "There is a genuine danger to it too. Stalkers. You can't block a stalker when you don't know their account."
     * -Tap
     *
     * "That being said It will happen regardless of if it's not there"
     * -^
     *
     * Original Description:
     * "They will be unable to see that you follow them, but you will still affect their count."
     */
    // {
    //     name: 'Follow silently',
    //     description: 'They will still see that you follow them, but no one else can. Yipnyap can still see who you
    // follow.', href: '#' }, { name: 'Block', href: '#' },
    // {
    //     name: 'Poke',
    //     description: 'This sends a push-notification in chat that you want to talk to them.',
    //     href: '#'
    // },
]

function classNames(...classes: any[]) {
    return classes.filter(Boolean).join(' ')
}

function NGFollowButton({...props}: any) {
    const [following, setFollowing] = useState<boolean>(false)
    const {user} = props

    async function toggleFollow() {
        if (user) {
            if (following) {
                // Unfollow
                unfollow(user.id).then(res => {
                    if (res.success) {
                        setFollowing(false)
                    }
                })
            } else {
                // Follow
                follow(user.id).then(res => {
                    if (res.success) {
                        setFollowing(true)
                    }
                })
            }
        }
    }

    async function sendFriendRequest() {
        if (user) {
            friendRequest(user.id).then(res => {
                if (res.success) {
                    // Replace Item ID 'new_friend_request'
                    items.map((item, index) => {
                        if (item.id === 'new_friend_request') {
                            items[index].name = 'Undo Friend Request'
                            items[index].description = 'You have sent a friend request to this user.'
                        }
                    })
                }
            })
        }
    }

    useEffect(() => {
        isFollowing(user.id).then((res) => {
            setFollowing(res)
        })

        getRelationship(user.id).then((res) => {
            const {relationship} = res
            const {status} = relationship
            console.log(relationship)
            if (status.indexOf('is_friend') > -1) {
                // Replace Item ID 'new_friend_request'
                items.map((item, index) => {
                    if (item.id === 'new_friend_request') {
                        items[index].name = 'Unfriend'
                        items[index].description = 'You are friends with this user.'
                    }
                })
            } else if (status.indexOf('pending') > -1) {
                // Replace Item ID 'new_friend_request'
                items.map((item, index) => {
                    if (item.id === 'new_friend_request') {
                        items[index].name = 'Undo Friend Request'
                        items[index].description = 'You have sent a friend request to this user.'
                    }
                })
            } else if (status.indexOf('awaiting_response') > -1) {
                // Replace Item ID 'new_friend_request'
                items.map((item, index) => {
                    if (item.id === 'new_friend_request') {
                        items[index].name = 'Answer Friend Request'
                        items[index].description = 'You have a friend request from this user.'
                    }
                })
            }
        })
    }, [props.user])

    return (
        <span className="relative inline-flex shadow-sm rounded-lg">
      <button
          type="button"
          className={`${props.theme.button} relative items-center rounded-none rounded-l-md`}
          onClick={toggleFollow}
      >
          {!following ? <>
              <UserPlusIcon className="-ml-1 mr-2 h-5 w-5 text-neutral-400 dark:text-white" aria-hidden="true"/>
              Follow
          </> : <>
              <UserMinusIcon className="-ml-1 mr-2 h-5 w-5 text-neutral-400 dark:text-white" aria-hidden="true"/>
              Unfollow
          </>}
      </button>
      <Menu as="span" className="-ml-px relative block">
        <Menu.Button className={`${props.theme.button} relative rounded-none px-2 rounded-r-md`}>
          <span className="sr-only">Open options</span>
          <ChevronDownIcon className="h-5 w-5" aria-hidden="true"/>
        </Menu.Button>
        <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items
              className="origin-top-right absolute right-0 mt-2 -mr-1 w-56 rounded-lg shadow-lg bg-card ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              {items.map((item) => (
                  <Menu.Item key={item.name}>
                      {/* @ts-ignore */}
                      {({active}) => (
                          <div
                              onClick={item.id === 'new_friend_request' ? sendFriendRequest : () => {
                              }}
                              className={classNames(active ? 'bg-default-alt text-alt' : 'text-default', 'block px-4 py-2 text-sm')}
                          >
                              {item.name}
                              {item.description && (
                                  <span className="block text-xs text-gray-400">{item.description}</span>
                              )}
                          </div>
                      )}
                  </Menu.Item>
              ))}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </span>
    )
}

export default function NGProfileHeader({...props}: NGProfileHeaderType) {
    let theme = buildClassObject(NGProfileHeaderTheming, props.theme || undefined)
    const profile = props.user
    const header = profile.header || props.defaults?.header

    const URL_REGEX = /(http|ftp|https):\/\/([\w_-]+(?:\.[\w_-]+)+)([\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-])/
    const renderBio = (bio: string) => {
        return bio
            .split(/([ \n])+/)
            .map(part => URL_REGEX.test(part) ? <a key={part} href={part}>{part} </a> : part + ' ')
    }

    return (
        <div className={`${!header ? 'mt-12' : ''} relative z-10 pb-8 border border-default rounded-default bg-card`}>
            <div className={!header ? 'h-0' : ''}>
                {header ? <img className="rounded-default aspect-banner object-cover w-full" src={header}
                               alt="Profile cover"/> : <div className="h-4"></div>}
            </div>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="-mt-12 sm:-mt-16 sm:flex sm:items-end sm:space-x-5">
                    <div className="flex">
                        <img
                            className="bg-card h-24 w-24 rounded-full ring-4 ring-white dark:ring-neutral-800 sm:h-32 sm:w-32"
                            src={profile.avatar || props.defaults?.profile || '/img/avatar/default-avatar.png'} alt=""/>
                    </div>
                    <div
                        className="mt-6 sm:flex-1 sm:min-w-0 sm:flex sm:items-center sm:justify-end sm:space-x-6 sm:pb-1">
                        <div className="sm:hidden md:block mt-6 min-w-0 flex-1">
                            <NGHeading>
                                {profile.display_name || profile.username}
                                {profile.verified && <CheckBadgeIcon className="h-5 inline ml-1 text-primary" style={(
                                    profile.ui_skin?.primary
                                ) ? {
                                    color: profile.ui_skin.primary,
                                } : {}}/>}
                            </NGHeading>
                            {/* Small @username */}
                            <div className="flex items-center">
                                <p className="text-sm font-medium text-alt-2 truncate">
                                    @{profile.username}
                                </p>
                            </div>
                        </div>
                        {props.loggedIn && !props.self && (
                            <div
                                className="mt-6 flex flex-col justify-stretch space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
                                {/*<button
                                    type="button"
                                    className={`${theme.button}`}
                                >
                                    <EnvelopeIcon className="-ml-1 mr-2 h-5 w-5 text-neutral-400 dark:text-white" aria-hidden="true" />
                                    <span>Message</span>
                                </button>*/}
                                <NGFollowButton theme={theme} user={profile}/>
                            </div>
                        )}
                    </div>
                </div>
                <div className="hidden sm:block md:hidden mt-6 min-w-0 flex-1">
                    <NGHeading>
                        {profile.username}
                    </NGHeading>
                </div>
                <div className="block min-w-0 flex-1 text-default">
                    {/* Bio */}
                    {profile.bio && (
                        <div className="mt-6 text-sm whitespace-pre-line">
                            <ReactMarkdown>{profile.bio}</ReactMarkdown>
                        </div>
                    )}

                    <div className="mt-2 flex flex-col text-sm text-alt-2">
                        <div className="flex">
                            {/* Follower count */}
                            {profile.followers !== undefined && (
                                <>
                                    <UserGroupIcon className="flex-shrink-0 mr-1.5 h-5 w-5" aria-hidden="true"/>
                                    <span>
                                        {profile.followers} followers
                                    </span>
                                </>
                            )}

                            {/* Following count */}
                            {profile.following !== undefined && (
                                <>
                                    <span className="mx-2"> | </span>
                                    <span>
                                        {profile.following} following
                                    </span>
                                </>
                            )}
                        </div>

                        <div className="flex">
                            {/* Post count */}
                            {profile.posts !== undefined && (
                                <>
                                    <ChatBubbleLeftIcon className="flex-shrink-0 mr-1.5 h-5 w-5" aria-hidden="true"/>
                                    <span>
                                        {profile.posts} posts
                                    </span>
                                </>
                            )}
                        </div>

                        <div className="flex items-center">
                            {/* Post count */}
                            {profile.exturl !== undefined && (
                                <>
                                    <LinkIcon className="flex-shrink-0 mr-1.5 h-5 w-5" aria-hidden="true"/>
                                    <a href={profile.exturl} target="_blank" rel="noreferrer">
                                        {profile.exturl}
                                    </a>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
