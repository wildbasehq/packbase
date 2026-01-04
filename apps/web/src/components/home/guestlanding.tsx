/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {EyeMovingIcon} from '@/components/home/eye-moving'
import {HeroCardMarquee} from '@/components/home/hero-card-marquee'
import {Heading} from '@/components/shared/text'
import {UserProfileBasic} from '@/lib'
import {FeedPostData, Logo, ThreadPost} from '@/src/components'
import NoAIBadge from '@/src/images/svg/noai/created.svg'
import {BanknotesIcon} from '@heroicons/react/24/solid'
import {motion} from 'motion/react'
import Link from '../shared/link'

function Hero() {
    const container = {
        hidden: {opacity: 0},
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.12,
                delayChildren: 3,
            },
        },
    } as const

    const item = {
        hidden: {opacity: 0, y: 18, rotate: -1, filter: 'blur(6px)'},
        show: {
            opacity: 1,
            y: 0,
            rotate: 0,
            filter: 'blur(0px)',
            transition: {type: 'spring', stiffness: 460, damping: 54, mass: 12} as const,
        },
    } as const

    return (
        <div className="relative overflow-hidden h-screen">
            <HeroCardMarquee/>

            <motion.div
                className="absolute bottom-0 left-0 flex-col gap-4 px-4 sm:px-6 md:px-8 pb-10 md:pb-16 lg:pb-24"
                variants={container}
                initial="hidden"
                animate="show"
            >
                <motion.h1
                    className="flex flex-wrap items-center text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight max-w-full"
                    aria-label="The web, rewilded, unleashed."
                >
                    <motion.span variants={item} className="inline-flex items-center shrink-0">
                        <motion.span
                            className="inline-flex"
                            variants={item}
                            whileHover={{rotate: 3, scale: 1.03}}
                            transition={{type: 'spring', stiffness: 500, damping: 22} as const}
                        >
                            <Logo className="block w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 fill-default"/>
                        </motion.span>

                        <span className="inline-flex w-3 sm:w-4 md:w-6"/>
                    </motion.span>

                    <span className="flex flex-wrap max-w-full font-new-spirit-bold">
                        {'The Internet you were promised'.split(' ').map((word, i) => (
                            <motion.span
                                key={`${word}-${i}`}
                                variants={item}
                                className="inline-flex mr-2 sm:mr-3"
                            >
                                {word}
                            </motion.span>
                        ))}
                    </span>
                </motion.h1>

                <motion.p
                    className="mt-6 text-lg md:text-xl max-w-2xl text-n-2"
                    variants={item}
                >
                    <EyeMovingIcon className="inline-flex w-6 h-6 text-n-5"/> Facebook and{' '}
                    <BanknotesIcon className="inline-flex w-6 h-6 text-n-5"/> Xhitter has done unbelievable harm to the WWW, we’re here to fix it.
                    No tracking, no ads, no lies, just pure unleashed social owned by you.
                </motion.p>
            </motion.div>
        </div>
    )
}

const USERPROFILES: UserProfileBasic[] = [
    {
        id: '3e133370-0ec2-4825-b546-77de3804c8b1',
        username: 'rek',
        slug: 'rek',
        display_name: 'Rekki',
        type: '2'
    },
    {
        id: 'user2',
        username: 'staff',
        display_name: 'Packbase Staff',
        slug: 'packbase',
        images: {
            avatar: '/avatars/packbase.png',
            header: '/headers/packbase-header.png',
        },
        type: '1',
    }
]

function FeatureThreads() {
    const THREAD_POSTS: FeedPostData[] = [
        {
            id: 'post1',
            user: USERPROFILES[1],
            body: {
                type: 'doc',
                content: [
                    {
                        type: 'paragraph',
                        content: [
                            {
                                type: 'text',
                                text: '"Community" sites on the WWW is flawed.',
                            }
                        ],
                    },
                    {
                        type: 'paragraph',
                        content: []
                    },
                    {
                        type: 'paragraph',
                        content: [
                            {
                                type: 'text',
                                text: `There's no sense of ownership, no respect for data, rampant misinformation, and where the f##k did custom HTML/CSS themes go???\n`
                            }
                        ],
                    },
                    {
                        type: 'paragraph',
                        content: [
                            {
                                type: 'text',
                                text: `Now you have to give your ID to just to message someone! Riveting...`
                            }
                        ],
                    }
                ],
            },
            created_at: new Date().toISOString(),
            comments: [{
                id: 'comment1',
                user: USERPROFILES[0],
                body: {
                    type: 'doc',
                    content: [
                        {
                            type: 'paragraph',
                            content: [
                                {
                                    type: 'text',
                                    text: 'apparently I\'m a minor according to Epic Games\' own "KWS", even with a Gov\'t ID. sure...',
                                    marks: [
                                        {
                                            type: 'italic'
                                        }
                                    ]
                                }
                            ],
                        }
                    ]
                },
                created_at: new Date().toISOString(),
            }]
        },
        {
            id: 'post2',
            user: USERPROFILES[0],
            body: {
                type: 'doc',
                content: [
                    {
                        type: 'paragraph',
                        content: [
                            {
                                type: 'text',
                                text: `It doesn't have to be like this, though. I'm saying something here\n\nany maybe down here that catches your attention! woah!`,
                            }
                        ],
                    }
                ]
            },
            created_at: new Date().toISOString(),
        },
    ]

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 mt-32 pb-16 space-y-12">
            {THREAD_POSTS.map(post => (
                <ThreadPost key={post.id} post={post}/>
            ))}
        </div>
    )
}

export default function GuestLanding() {
    const links = {
        Packbase: [
            {
                name: 'Usage Policy',
                href: '/terms',
            },
            {
                name: 'Data Handling',
                href: '/terms',
            },
            {
                name: 'Bluesky',
                href: 'https://bsky.app/profile/packbase.app',
            },
        ],
        Wildbase: [
            {
                name: 'Site',
                href: 'https://wildbase.xyz/',
            },
            {
                name: 'Discord',
                href: 'https://discord.gg/StuuK55gYA',
            },
        ],
    }

    return (
        <div className="h-full overflow-x-hidden overflow-y-auto scrollbar-hide">
            <div
                className="relative overflow-hidden z-10 bg-neutral-900">
                <Hero/>

                {/* <FeatureThreads/> */}
            </div>

            {/* Minimal footer */}
            <div
                className="relative bottom-0 left-0 w-full px-4 sm:px-6 md:px-8 border-y">
                <div
                    className="flex w-full items-end justify-end h-auto md:h-80 border-x py-4 sm:py-6">
                    {/* Horizontal dotted border at the top of items */}
                    <div
                        className="absolute left-0 right-0 border-t hidden md:block"
                        style={{top: '2rem'}}
                    ></div>

                    {/* Items with grid border style */}
                    <div
                        className="flex w-full flex-col md:flex-row mb-2 border-t gap-4 sm:gap-6">
                        <h1 className="hidden md:flex flex-col self-end opacity-50 select-none bottom-1 left-7 font-bold">
                            <span className="tracking-tighter text-6xl md:text-8xl -mb-3">
                                <span className="font-extrabold text-primary-lime">✱</span>
                                <span className="font-wildbase-bold">base</span>
                            </span>
                            <span className="text-[10px] md:text-xs tracking-tight ml-22 text-default-alt font-wildbase-medium">
                                &copy; 2025 ✱base
                            </span>
                        </h1>

                        <div className="grow"/>

                        <img
                            src={NoAIBadge}
                            className="hidden sm:block h-8 sm:h-10 md:h-auto md:mr-8 pointer-events-none"
                            alt="No AI Reliance"
                        />
                        <div
                            className="relative w-full md:w-auto h-full grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 px-4 py-4 sm:py-2 border-l">
                            {Object.entries(links).map(([category, items]) => (
                                <div key={category}>
                                    <Heading className="mb-3 !font-bold !uppercase">{category}</Heading>
                                    <ul className="space-y-2">
                                        {items.map(item => (
                                            <li key={item.name}>
                                                <Link
                                                    href={item.href}
                                                    className="text-sm transition-colors text-muted-foreground hover:!text-primary-cosmos hover:underline"
                                                >
                                                    {item.name}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Horizontal dotted border at the bottom of items */}
                    <div
                        className="absolute left-0 right-0 border-t hidden md:block"
                        style={{bottom: '2rem'}}
                    ></div>
                </div>
            </div>
        </div>
    )
}
