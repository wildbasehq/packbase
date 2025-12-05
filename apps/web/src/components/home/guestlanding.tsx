/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {Heading, Text} from '@/components/shared/text'
import {Button} from '@/components/shared'
import {Container} from '@/components/layout/container'
import VerticalCutReveal from '../shared/text/vertical-cut-text'
import {AnimatePresence, motion} from 'motion/react'
import Tooltip from '../shared/tooltip'
import {
    ArrowUpRightIcon,
    BoltIcon,
    CheckIcon,
    CubeTransparentIcon,
    GlobeAltIcon,
    HeartIcon,
    ShieldCheckIcon,
    SparklesIcon,
} from '@heroicons/react/20/solid'
import {ReactNode, useMemo, useState} from 'react'
import {QuestionMarkCircleIcon} from '@heroicons/react/16/solid'
import Link from '../shared/link'
import {Badge, Logo} from '@/src/components'
import LandingBackground from '@/src/images/png/prjkorat-heading-proposed.png'
import NoAIBadge from '@/src/images/svg/noai/created.svg'

// Animation configuration
const animConfig = {
    spring: {
        stiffness: 250,
        damping: 25,
    },
    scale: {
        initial: 0.8,
        final: 1,
    },
    offset: {
        top: -50,
        bottom: 70,
    },
    delay: {
        center: 0,
        adjacent: 0.2,
        outer: 0.3,
        far: 0.4,
        bottomRowBase: 0,
    },
}

const links = [
    {name: 'Join Packbase', href: '/id/create', primary: true},
    {
        name: 'Discord Community',
        href: 'https://discord.gg/StuuK55gYA',
        tooltip: 'Discord invite - will open in a new tab',
    },
]

const posts = [
    // top
    {
        user: {
            name: 'Dan',
            avatar: 'https://profiles.cdn.packbase.app/d2a4c11c-5007-4ac4-b034-7dfbcde10f51/0/avatar.png?updated=1740511594212',
        },
        // content: 'Finally finished this commission of a Dutch Angel Dragon! Really proud of how the wings turned out ✨',
        image: 'https://profiles.cdn.packbase.app/d2a4c11c-5007-4ac4-b034-7dfbcde10f51/79796da0-1030-4ea5-b3b2-f36ecea46d4f/0.png',
    },
    {
        user: {
            name: 'JemZard',
            avatar: 'https://profiles.cdn.packbase.app/52c9daa9-f99c-4384-b61a-2ccacd6b3db8/0/avatar.png?updated=1740576567191',
        },
        content: 'guhhh',
        image: 'https://profiles.cdn.packbase.app/52c9daa9-f99c-4384-b61a-2ccacd6b3db8/271ada99-a1b6-4163-9c39-fa13d23a9948/0.gif',
    },
    {
        user: {
            name: 'JemZard',
            avatar: 'https://profiles.cdn.packbase.app/52c9daa9-f99c-4384-b61a-2ccacd6b3db8/0/avatar.png?updated=1740576567191',
        },
        content: 'guhhh i feel old :(',
        image: 'https://profiles.cdn.packbase.app/52c9daa9-f99c-4384-b61a-2ccacd6b3db8/b31ada27-5523-4141-9410-01179dad6fa1/0.gif',
    },
    {
        user: {
            name: 'Mocha',
            avatar: 'https://profiles.cdn.packbase.app/1d718d4f-8fab-43ef-a7ab-2c51d238fbf6/0/avatar.png',
        },
        content: 'Stares into your soul in a gay kinda way',
        image: 'https://profiles.cdn.packbase.app/1d718d4f-8fab-43ef-a7ab-2c51d238fbf6/09c4291f-2451-4b46-adf5-b14f3eac4ce3/0.png',
    },

    // bottom
    {
        user: {
            name: 'Rek',
            avatar: '/img/illustrations/onboarding/pfp/rekkisomo.png',
        },
        content:
            '(c) ✱base - Rekkisomo Harley (@rek), Meowcino (@cat),\nMocha (@mocha), T.J. (@tjcapy), Fludd (@flooderinodraws).\n\nSee you on Packbase~',
    },
    {
        user: {
            name: 'Mocha',
            avatar: 'https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvdXBsb2FkZWQvaW1nXzMwSFNUTUpTbjVTZWNNY1ZPV0lNaUxpTjBRSyJ9',
        },
        content: 'Stares into your soul in a gay kinda way',
        image: 'https://profiles.cdn.packbase.app/1d718d4f-8fab-43ef-a7ab-2c51d238fbf6/9a82b871-d6b5-4e31-ba68-2b5d1530ddc6/0.png',
    },
    {
        user: {
            name: 'Tempest Wolf',
            avatar: 'https://profiles.cdn.packbase.app/3dd43a7e-578e-4bef-a307-7c83c4a6f64d/0/avatar.png?updated=1740970106908',
        },
        content:
            'Saw the new Lilo and Stitch trailer~ It looks good, but they gave Pleakly a hologram disguise, taking away his cute frilly outfits~ :c',
    },
    {
        user: {name: 'swaggypaws', avatar: 'https://robohash.org/swaggypaws'},
        content: 'Just finished these custom paw print shoes! Taking orders for similar designs',
        image: 'https://profiles.cdn.packbase.app/3e133370-0ec2-4825-b546-77de3804c8b1/2682ee79-eddf-4b0c-b07f-649776018e41/0.png',
    },
]

interface AnimatedCardProps {
    className: string
    initialY: number
    delayTime: number
    children: ReactNode
}

const AnimatedCard = ({className, initialY, delayTime, children}: AnimatedCardProps) => (
    <motion.div
        className={className}
        initial={{scale: animConfig.scale.initial, opacity: 0, y: initialY}}
        animate={{scale: animConfig.scale.final, opacity: 1, y: 0}}
        transition={{
            type: 'spring',
            stiffness: animConfig.spring.stiffness,
            damping: animConfig.spring.damping,
            delay: delayTime,
        }}
    >
        {children}
    </motion.div>
)

function BottomRowCards() {
    return (
        <div className="absolute bottom-1/6 left-0 right-0 w-full">
            <AnimatedCard
                className="absolute left-0 w-1/3 h-40 mt-12 ml-2 overflow-hidden transform rounded ring-default ring-2 md:h-56 lg:h-72 bg-card -rotate-3"
                initialY={animConfig.offset.bottom}
                delayTime={animConfig.delay.bottomRowBase + animConfig.delay.far}
            >
                <FakePost user={posts[4].user} content={posts[4].content} image={posts[4].image}/>
            </AnimatedCard>
            <AnimatedCard
                className="absolute w-1/3 h-40 transform ring-default ring-2 rounded z-10 left-[30%] md:h-56 lg:h-72 bg-card rotate-1 overflow-hidden"
                initialY={animConfig.offset.bottom}
                delayTime={animConfig.delay.bottomRowBase + animConfig.delay.adjacent}
            >
                <FakePost user={posts[5].user} content={posts[5].content} image={posts[5].image}/>
            </AnimatedCard>
            <AnimatedCard
                className="absolute mt-6 z-[5] w-1/3 h-40 transform ring-default ring-2 rounded left-[50%] md:h-56 lg:h-72 bg-card rotate-4 overflow-hidden"
                initialY={animConfig.offset.bottom}
                delayTime={animConfig.delay.bottomRowBase}
            >
                <FakePost user={posts[6].user} content={posts[6].content} image={posts[6].image}/>
            </AnimatedCard>
            <AnimatedCard
                className="absolute mt-12 w-[24rem] h-40 transform ring-default ring-2 rounded -right-8 md:h-56 lg:h-72 bg-card -rotate-2 overflow-hidden"
                initialY={animConfig.offset.bottom}
                delayTime={animConfig.delay.bottomRowBase + animConfig.delay.adjacent}
            >
                <FakePost user={posts[7].user} content={posts[7].content} image={posts[7].image}/>
            </AnimatedCard>
        </div>
    )
}

function Hero() {
    return (
        <div className="relative overflow-hidden h-screen border-b">
            {/* Background image absolute covering the whole screen */}
            <img
                src={LandingBackground}
                alt="N-BG"
                className="absolute top-0 -z-10 w-full h-full object-cover object-bottom blur-xs"
                style={{objectPosition: '0 15%'}}
            />
            {/* Top row of skewed cards */}
            {/*<TopRowCards />*/}

            {/* Main hero content */}
            <Container className="relative z-10 text-center top-1/6 pb-82">
                <Heading
                    className="!text-2xl flex justify-center items-center [&>*]:!text-white tracking-tight font-new-spirit-bold overflow-visible sm:!text-5xl">
                    <div>
                        <Logo fullSize className="h-5 w-5 mr-2 sm:!h-10 sm:!w-10 sm:mr-4 -mt-1.5"/>
                    </div>
                    <VerticalCutReveal
                        reverse
                        splitBy="characters"
                        staggerDuration={0.025}
                        staggerFrom="first"
                        containerClassName="justify-center"
                        wordLevelClassName="sm:px-1"
                        transition={{
                            type: 'spring',
                            stiffness: 200,
                            damping: 21,
                        }}
                    >
                        Where conversations thrive
                    </VerticalCutReveal>
                </Heading>

                <div
                    className="mt-8 p-6 max-w-2xl mx-auto bg-sidebar rounded transform skew-x-4 ring-1 ring-default shadow">
                    <Text className="text-lg sm:text-xl font-medium transform -skew-x-4">
                        Join the Pack-based social platform where <HighlightedText>communities come
                        first</HighlightedText>. No ads, no
                        algorithms, just authentic conversations in your own space.
                    </Text>
                </div>

                <div className="mt-12 space-y-4 sm:space-y-0 sm:flex sm:justify-center sm:gap-4">
                    {links.map((link, index) =>
                        link.tooltip ? (
                            <Tooltip key={index} content={link.tooltip} delayDuration={0} side="top">
                                <Button href={link.href}
                                        color={(link.primary ? 'indigo' : 'zinc') as 'indigo' | 'zinc'}>
                                    {link.name} <ArrowUpRightIcon className="inline-flex w-4 h-4 text-white"/>
                                </Button>
                            </Tooltip>
                        ) : (
                            <Button key={index} href={link.href}
                                    color={(link.primary ? 'indigo' : 'zinc') as 'indigo' | 'zinc'}>
                                {link.name}
                            </Button>
                        )
                    )}
                </div>
            </Container>

            {/* Image of website. Centered in the middle of the screen */}
            <BottomRowCards/>
        </div>
    )
}

function FakePost({
                      user,
                      content,
                      image,
                  }: {
    user: {
        name: string
        avatar: string
    }
    content: string
    image?: string
}) {
    return (
        <div className="flex flex-col h-40">
            <div className="flex items-center justify-between p-3">
                <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 overflow-hidden rounded">
                        <img src={user.avatar} alt={user.name} className="object-cover w-full h-full"/>
                    </div>
                    <div>
                        <p className="font-medium">{user.name}</p>
                    </div>
                </div>
            </div>

            {content && (
                <div className="px-4 pb-3">
                    <pre className="text-sm line-clamp-4 font-lexend break-al">{content}</pre>
                </div>
            )}

            {image && (
                <div className="flex items-center justify-center flex-1 px-4 pb-4">
                    <img src={image} alt={content || user.name}
                         className="object-cover w-full rounded-lg max-h-36 ring-2 ring-default"/>
                </div>
            )}
        </div>
    )
}

// Reusable highlighted text component with randomized clip path
function HighlightedText({children, width = '100%'}: { children: ReactNode; width?: string }) {
    // Generate random wavy SVG path for highlight using a more efficient approach
    const svgPath = useMemo(() => {
        const segments = 10;
        const points = {
            top: Array.from({length: segments + 1}, () => Math.floor(Math.random() * 16) + 2),
            bottom: Array.from({length: segments + 1}, () => Math.floor(Math.random() * 15) + 80)
        };

        // Build path using array methods instead of loops
        const topEdge = points.top
            .map((y, i) => `L ${(i * 100) / segments},${y}`)
            .join(' ');

        const bottomEdge = points.bottom
            .reverse()
            .map((y, i) => `L ${((segments - i) * 100) / segments},${y}`)
            .join(' ');

        return `M 0,${points.top[0]} ${topEdge} L 100,${points.bottom[0]} ${bottomEdge} Z`;
    }, []);

    return (
        <span className="relative z-10 font-instrument-serif-italic text-default">
            {' '}
            <span
                className="absolute inset-0 -z-[1]"
                style={{width}}
            >
                <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        transform: 'rotate(1deg) skewX(1deg)',
                        marginTop: '0.25rem',
                        borderRadius: '1.25rem',
                    }}
                >
                    <path
                        d={svgPath}
                        fill="var(--highlight-color, oklch(0.901 0.076 70.697))"
                        fillOpacity="0.5"
                        className="dark:fill-orange-900 dark:fill-opacity-30"
                    />
                </svg>
            </span>
            {children}
        </span>
    );
}

// Replace the existing BlurFadeIn component with this new version
function BlurFadeIn({children, isVisible, staggerDelay = 0.05}: {
    children: ReactNode;
    isVisible: boolean;
    staggerDelay?: number
}) {
    // Extract text content from React elements
    const extractText = (node: ReactNode): string => {
        if (typeof node === 'string') return node
        if (typeof node === 'number') return node.toString()
        if (Array.isArray(node)) return node.map(extractText).join(' ')
        return ''
    }

    const text = extractText(children)
    const words = text.split(' ').filter(word => word.length > 0)

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="flex flex-wrap gap-1">
                    {words.map((word, index) => (
                        <motion.span
                            key={index}
                            initial={{filter: 'blur(2px)', opacity: 0}}
                            animate={{filter: 'blur(0px)', opacity: 1}}
                            exit={{filter: 'blur(2px)', opacity: 0}}
                            transition={{
                                duration: 0.4,
                                ease: 'easeOut',
                                delay: index * staggerDelay,
                            }}
                        >
                            {word}{' '}
                        </motion.span>
                    ))}
                </div>
            )}
        </AnimatePresence>
    )
}

function FeaturePromiseGrid() {
    const features = [
        {
            icon: 'SparklesIcon',
            title: 'Pack-Based Communities',
            description: 'Create or join intimate communities with their own identity, customs, and conversations.',
        },
        {
            icon: 'ShieldCheckIcon',
            title: 'Privacy Focused',
            description: "No ads, no selling your data. We promise to keep your information secure - we're using it too, y'know!",
        },
        {
            icon: 'CubeTransparentIcon',
            title: 'Complete Customization',
            description: 'Full HTML/CSS theming for your Profile, Pack, and UI, as well as custom domains for your own personal website',
        },
        {
            icon: 'BoltIcon',
            title: 'Lightning Fast',
            description: 'Built with cutting-edge tech and partnered with top-tier infrastructure providers for speed.',
            accordion:
                'Packbase is built using optimized and up-coming tech, including some that are experimental and not yet publicly available, given to us by partners under agreement.',
        },
        {
            icon: 'GlobeAltIcon',
            title: 'Transparent & Open',
            description: "By the end of private alpha, we'll make our spending and income public, plus open-source key components.",
        },
        {
            icon: 'HeartIcon',
            title: 'Forever Free',
            description: 'Core features always free. 15GB free storage, or bring your own.',
            accordion:
                "Packbase gives everyone 15GB of free object storage, but if that's not enough, you can link a Pixeldrain account to have full custody over the data you upload. If you need more and don't want to host it yourself, we can give you more free of charge, just ask.",
        },
    ]

    // Import icons dynamically based on the icon name in the features array
    const getIcon = iconName => {
        const icons = {
            SparklesIcon: props => <SparklesIcon {...props} />,
            ShieldCheckIcon: props => <ShieldCheckIcon {...props} />,
            CubeTransparentIcon: props => <CubeTransparentIcon {...props} />,
            BoltIcon: props => <BoltIcon {...props} />,
            GlobeAltIcon: props => <GlobeAltIcon {...props} />,
            HeartIcon: props => <HeartIcon {...props} />,
        }
        return icons[iconName] || null
    }

    return (
        <Container className="py-24">
            <div className="text-center mb-16">
                <Heading size="3xl" className="mb-4">
                    How <HighlightedText>social</HighlightedText> should be built
                </Heading>
                <Text className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Classic forums, reimagined for today's communities without the data mining. You <i>don't</i> have to
                    sacrifice your data
                    and sanity to communicate, you know that right?
                </Text>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {features.map((feature, index) => {
                    const IconComponent = getIcon(feature.icon)
                    const hasAccordion = !!feature.accordion
                    const [isAccordionOpen, setIsAccordionOpen] = useState(false)

                    return (
                        <div
                            key={index}
                            className="flex flex-col items-start gap-4 p-6 transition-all bg-white rounded-lg shadow-sm cursor-pointer ring-1 ring-default dark:bg-zinc-900 hover:shadow-md"
                            onClick={() => hasAccordion && setIsAccordionOpen(!isAccordionOpen)}
                        >
                            <div className="flex items-start w-full gap-4">
                                <div className="flex-shrink-0">
                                    <div className="p-2 bg-indigo-100 rounded-lg dark:bg-indigo-900/30">
                                        {IconComponent && <IconComponent
                                            className="w-6 h-6 text-indigo-500/80 dark:text-indigo-400"/>}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <Heading size="lg" className="mb-1 font-bold text-default">
                                            {feature.title}
                                        </Heading>
                                        {hasAccordion && (
                                            <button
                                                onClick={e => {
                                                    e.stopPropagation()
                                                    setIsAccordionOpen(!isAccordionOpen)
                                                }}
                                                className="flex items-center text-sm text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300"
                                            >
                                                <span>{isAccordionOpen ? 'Show less' : 'Learn more'}</span>
                                                <QuestionMarkCircleIcon className="w-4 h-4 ml-1"/>
                                            </button>
                                        )}
                                    </div>
                                    <Text alt>{feature.description}</Text>
                                </div>
                            </div>

                            {hasAccordion && isAccordionOpen && (
                                <motion.div
                                    initial={{height: 0, opacity: 0}}
                                    animate={{height: 'auto', opacity: 1}}
                                    exit={{height: 0, opacity: 0}}
                                    transition={{duration: 0.3}}
                                    className="w-full pt-3 pl-12 mt-2 border-t border-n-2/80 dark:border-n-6/80"
                                >
                                    <Text alt size="sm">
                                        <BlurFadeIn isVisible={isAccordionOpen} staggerDelay={0.002}>
                                            {feature.accordion}
                                        </BlurFadeIn>
                                    </Text>
                                </motion.div>
                            )}
                        </div>
                    )
                })}
            </div>
        </Container>
    )
}

function PackShowcase() {
    const packs = [
        {
            name: 'Furry Artists',
            members: '2.4k',
            description: 'Share your art, get feedback, and connect with fellow creators',
            color: 'bg-gradient-to-br from-purple-500 to-pink-500',
            avatar: '🎨',
        },
        {
            name: 'Tech Talk',
            members: '1.8k',
            description: 'Discuss the latest in technology, programming, and innovation',
            color: 'bg-gradient-to-br from-blue-500 to-cyan-500',
            avatar: '⚡',
        },
        {
            name: 'Gaming Hub',
            members: '3.1k',
            description: 'Share gameplay, reviews, and connect with fellow gamers',
            color: 'bg-gradient-to-br from-green-500 to-emerald-500',
            avatar: '🎮',
        },
        {
            name: 'Coffee Corner',
            members: '956',
            description: 'For coffee enthusiasts to share brewing tips and favorite beans',
            color: 'bg-gradient-to-br from-amber-500 to-orange-500',
            avatar: '☕',
        },
    ]

    return (
        <Container className="py-24">
            <div className="text-center mb-16">
                <Heading size="3xl" className="mb-4">
                    Discover Your <HighlightedText>Pack</HighlightedText>
                </Heading>
                <Text className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Every community has its own space, customization, and culture. Find where you belong, or create your
                    own.
                </Text>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {packs.map((pack, index) => (
                    <motion.div
                        key={index}
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        transition={{delay: index * 0.1}}
                        className="group relative overflow-hidden rounded bg-white dark:bg-zinc-800 ring-1 ring-default hover:ring-2 hover:ring-indigo-500/50 transition-all cursor-pointer"
                    >
                        <div
                            className={`absolute inset-0 ${pack.color} opacity-10 group-hover:opacity-20 transition-opacity`}/>
                        <div className="relative p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <div
                                    className={`w-12 h-12 rounded-xl ${pack.color} flex items-center justify-center text-xl`}>
                                    {pack.avatar}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-default">{pack.name}</h3>
                                    <p className="text-sm text-muted-foreground">{pack.members} members</p>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">{pack.description}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </Container>
    )
}

function MigrationSection() {
    const platforms = [
        {
            id: 'furaffinity',
            name: 'Fur Affinity',
            icon: '🦊',
            description: 'Seamlessly import your gallery and submissions',
            features: ['Gallery & submissions', 'Journals & stories', 'Shadow comments (displays as "From FA: {user}")'],
            color: 'bg-gradient-to-b from-orange-500/5 to-amber-500/5',
        },
        {
            id: 'phpbb',
            name: 'PhpBB Forums',
            icon: '💬',
            description: 'Complete forum migration with all threads and user data',
            features: [
                'Full thread history',
                'User accounts (Optional - requires contacting support)',
                'Forum structure',
                'Attachments & media',
            ],
            color: 'bg-gradient-to-b from-blue-500/5 to-indigo-500/5',
        },
    ]

    return (
        <Container className="relative py-24 z-10">
            <div className="text-center mb-16">
                <Badge className="mb-6" color="orange">
                    Coming Soon! (Contact support for earlier access. Must be &gt;500 member count)
                </Badge>
                <Heading size="3xl" className="mb-4">
                    Bring Your <HighlightedText>Community</HighlightedText> With You
                </Heading>
                <Text className="text-lg text-muted-foreground max-w-3xl mx-auto">
                    Switching platforms shouldn't mean starting over. We'll handle the heavy lifting and migrate your
                    entire community's
                    history, preserving years of conversations, connections, and content.
                </Text>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                {platforms.map(platform => (
                    <div
                        className={`relative overflow-hidden rounded p-8 transition-all ring-1 ring-default ${platform.color}`}>
                        <div className="relative">
                            <div className="flex items-start gap-4 mb-4">
                                <div
                                    className={`w-12 h-12 flex items-center justify-center text-2xl`}
                                >
                                    {platform.icon}
                                </div>
                                <div className="flex-1">
                                    <Heading as="h3" size="xl" className="font-bold text-default mb-1">
                                        {platform.name}
                                    </Heading>
                                    <Text alt>{platform.description}</Text>
                                </div>
                            </div>

                            <div className="space-y-2 mt-6">
                                {platform.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <div
                                            className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                                            <CheckIcon className="w-3 h-3 text-green-500"/>
                                        </div>
                                        <Text size="sm">{feature}</Text>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Migration process */}
            <div
                className="mt-16 p-8 rounded bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 ring-1 ring-default">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="text-center">
                        <div
                            className="w-12 h-12 mx-auto mb-4 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">1</span>
                        </div>
                        <Heading size="lg" className="mb-2">
                            Export Your Data
                        </Heading>
                        <Text alt size="sm">
                            Use your platform's export tools or our guided process to prepare your data
                        </Text>
                    </div>
                    <div className="text-center">
                        <div
                            className="w-12 h-12 mx-auto mb-4 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">2</span>
                        </div>
                        <Heading size="lg" className="mb-2">
                            We Handle the Rest
                        </Heading>
                        <Text alt size="sm">
                            The rats in our servers handle the migration for you and can take a while.
                        </Text>
                    </div>
                    <div className="text-center">
                        <div
                            className="w-12 h-12 mx-auto mb-4 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">3</span>
                        </div>
                        <Heading size="lg" className="mb-2">
                            Welcome Home
                        </Heading>
                        <Text alt size="sm">
                            Your community continues right where it left off, with all history intact
                        </Text>
                    </div>
                </div>
            </div>
        </Container>
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
                className="relative bg-white overflow-hidden z-10 rounded-b ring-2 ring-default dark:bg-zinc-900 shadow-xl">
                <Hero/>
                <FeaturePromiseGrid/>
                <PackShowcase/>
                <MigrationSection/>
            </div>

            {/* Minimal footer */}
            <div
                className="relative bottom-0 left-0 w-full px-4 sm:px-6 md:px-8 border-y border-n-2/80 dark:border-n-6/80">
                <div
                    className="flex w-full items-end justify-end h-auto md:h-80 border-x border-n-2/80 dark:border-n-6/80 py-4 sm:py-6">
                    {/* Horizontal dotted border at the top of items */}
                    <div
                        className="absolute left-0 right-0 border-t border-n-2/80 dark:border-n-6/80 hidden md:block"
                        style={{top: '2rem'}}
                    ></div>

                    {/* Items with grid border style */}
                    <div
                        className="flex w-full flex-col md:flex-row md:justify-end border-t border-n-2/80 dark:border-n-6/80 gap-4 sm:gap-6">
                        <img
                            src={NoAIBadge}
                            className="hidden sm:block h-8 sm:h-10 md:h-auto md:mr-8 pointer-events-none"
                            alt="No AI Reliance"
                        />
                        <div
                            className="relative w-full md:w-auto grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 px-4 py-4 sm:py-2 mb-6 sm:mb-8 md:mr-8 ring-1 ring-default">
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
                        className="absolute left-0 right-0 border-t border-n-2/80 dark:border-n-6/80 hidden md:block"
                        style={{bottom: '1.85rem'}}
                    ></div>

                    {/* Floating brand text on bottom-left - should not interact with other elements! */}
                    <h1 className="hidden md:fixed md:flex flex-col opacity-50 select-none bottom-1 left-7 font-bold">
            <span className="tracking-tighter text-6xl md:text-8xl -mb-3">
                <span className="font-extrabold text-primary-lime">✱</span> 
                <span className="font-wildbase-bold">base</span>
            </span>
                        <span
                            className="text-[10px] md:text-xs tracking-tight ml-22 text-default-alt font-wildbase-medium">
                &copy; 2025 ✱base
            </span>
                    </h1>
                </div>
            </div>
        </div>
    )
}
