import { Heading, Text } from '@/components/shared/text'
import { Button } from '@/components/shared/experimental-button-rework'
import { Container } from '@/components/layout/container'
import VerticalCutReveal from '../shared/text/vertical-cut-text'
import { motion } from 'framer-motion'
import Tooltip from '../shared/tooltip'
import { ArrowUpRightIcon } from '@heroicons/react/20/solid'
import { ClockIcon, EyeIcon, UserIcon } from '@heroicons/react/24/solid'
import { ReactNode, useMemo } from 'react'
import { QuestionMarkCircleIcon } from '@heroicons/react/16/solid'

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
        bottomRowBase: 1.1,
    },
}

const links = [
    { name: 'Join Packbase', href: '/id/create/', primary: true },
    {
        name: 'Volunteer',
        href: 'https://discord.gg/StuuK55gYA',
        tooltip: 'Discord invite - Middle-click or right-click to open in new tab',
    },
]

const posts = [
    // top
    {
        user: {
            name: 'Dan',
            avatar: 'https://udxdytccktvaedirxooa.supabase.co/storage/v1/object/public/profiles/d2a4c11c-5007-4ac4-b034-7dfbcde10f51/0/avatar.png?updated=1740511594212',
        },
        // content: 'Finally finished this commission of a Dutch Angel Dragon! Really proud of how the wings turned out ✨',
        image: 'https://udxdytccktvaedirxooa.supabase.co/storage/v1/object/public/profiles/d2a4c11c-5007-4ac4-b034-7dfbcde10f51/79796da0-1030-4ea5-b3b2-f36ecea46d4f/0.png',
    },
    {
        user: {
            name: 'JemZard',
            avatar: 'https://udxdytccktvaedirxooa.supabase.co/storage/v1/object/public/profiles/52c9daa9-f99c-4384-b61a-2ccacd6b3db8/0/avatar.png?updated=1740576567191',
        },
        content: 'guhhh',
        image: 'https://udxdytccktvaedirxooa.supabase.co/storage/v1/object/public/profiles/52c9daa9-f99c-4384-b61a-2ccacd6b3db8/271ada99-a1b6-4163-9c39-fa13d23a9948/0.gif',
    },
    {
        user: {
            name: 'JemZard',
            avatar: 'https://udxdytccktvaedirxooa.supabase.co/storage/v1/object/public/profiles/52c9daa9-f99c-4384-b61a-2ccacd6b3db8/0/avatar.png?updated=1740576567191',
        },
        content: 'guhhh i feel old :(',
        image: 'https://udxdytccktvaedirxooa.supabase.co/storage/v1/object/public/profiles/52c9daa9-f99c-4384-b61a-2ccacd6b3db8/b31ada27-5523-4141-9410-01179dad6fa1/0.gif',
    },
    {
        user: {
            name: 'Mocha',
            avatar: 'https://udxdytccktvaedirxooa.supabase.co/storage/v1/object/public/profiles/1d718d4f-8fab-43ef-a7ab-2c51d238fbf6/0/avatar.png',
        },
        content: 'Stares into your soul in a gay kinda way',
        image: 'https://udxdytccktvaedirxooa.supabase.co/storage/v1/object/public/profiles/1d718d4f-8fab-43ef-a7ab-2c51d238fbf6/09c4291f-2451-4b46-adf5-b14f3eac4ce3/0.png',
    },

    // bottom
    {
        user: {
            name: 'Skele',
            avatar: 'https://udxdytccktvaedirxooa.supabase.co/storage/v1/object/public/profiles/3dd43a7e-578e-4bef-a307-7c83c4a6f64d/0/avatar.png?updated=1740970106908',
        },
        content: 'I may or may not enjoy werewolves playing the violin',
    },
    {
        user: {
            name: 'silica.jello',
            avatar: 'https://udxdytccktvaedirxooa.supabase.co/storage/v1/object/public/profiles/60544020-69df-4953-abaa-792f037fea4c/0/avatar.jpeg?updated=1741240165016',
        },
        content: 'NL-1331X XM detection vehicle.\n\nevent van from a game i play\n\ni wanna see it irl someday',
        image: 'https://udxdytccktvaedirxooa.supabase.co/storage/v1/object/public/profiles/60544020-69df-4953-abaa-792f037fea4c/b520b116-cacc-489b-a8fd-8d7e52e5882b/0.png',
    },
    {
        user: {
            name: 'Tempest Wolf',
            avatar: 'https://udxdytccktvaedirxooa.supabase.co/storage/v1/object/public/profiles/3dd43a7e-578e-4bef-a307-7c83c4a6f64d/0/avatar.png?updated=1740970106908',
        },
        content:
            'Saw the new Lilo and Stitch trailer~ It looks good, but they gave Pleakly a hologram disguise, taking away his cute frilly outfits~ :c',
    },
    {
        user: { name: 'swaggypaws', avatar: 'https://robohash.org/swaggypaws' },
        content: 'Just finished these custom paw print shoes! Taking orders for similar designs',
        image: 'https://udxdytccktvaedirxooa.supabase.co/storage/v1/object/public/profiles/3e133370-0ec2-4825-b546-77de3804c8b1/2682ee79-eddf-4b0c-b07f-649776018e41/0.png',
    },
]

interface AnimatedCardProps {
    className: string
    initialY: number
    delayTime: number
    children: React.ReactNode
}

const AnimatedCard = ({ className, initialY, delayTime, children }: AnimatedCardProps) => (
    <motion.div
        className={className}
        initial={{ scale: animConfig.scale.initial, opacity: 0, y: initialY }}
        animate={{ scale: animConfig.scale.final, opacity: 1, y: 0 }}
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

function TopRowCards() {
    return (
        <div className="absolute top-0 left-0 right-0 w-full">
            <div className="flex w-[115%] -ml-[5%]">
                <AnimatedCard
                    className="w-1/2 -mt-12 overflow-hidden transform rounded-lg ring-default ring-2 h-36 md:h-48 lg:h-64 bg-card rotate-6"
                    initialY={animConfig.offset.top}
                    delayTime={animConfig.delay.outer}
                >
                    <FakePost user={posts[0].user} content={posts[0].content} image={posts[0].image} />
                </AnimatedCard>
                <AnimatedCard
                    className="w-1/2 -mt-10 -ml-12 overflow-hidden transform rounded-lg ring-default ring-2 h-36 md:h-48 lg:h-64 bg-card rotate-1"
                    initialY={animConfig.offset.top}
                    delayTime={animConfig.delay.adjacent}
                >
                    <FakePost user={posts[1].user} content={posts[1].content} image={posts[1].image} />
                </AnimatedCard>
                <AnimatedCard
                    className="w-1/2 -mt-4 z-[2] transform ring-default ring-2 rounded-lg -ml-36 h-36 md:h-48 lg:h-64 bg-card -rotate-2 overflow-hidden"
                    initialY={animConfig.offset.top}
                    delayTime={animConfig.delay.center}
                >
                    <FakePost user={posts[2].user} content={posts[2].content} image={posts[2].image} />
                </AnimatedCard>
                <AnimatedCard
                    className="w-1/2 -mt-1.5 overflow-hidden transform rounded-lg ring-default ring-2 -ml-28 h-36 md:h-48 lg:h-64 bg-card rotate-3"
                    initialY={animConfig.offset.top}
                    delayTime={animConfig.delay.adjacent}
                >
                    <FakePost user={posts[3].user} content={posts[3].content} image={posts[3].image} />
                </AnimatedCard>
            </div>
        </div>
    )
}

function BottomRowCards() {
    return (
        <div className="lg:flex w-[97%] -top-42 hidden absolute">
            <AnimatedCard
                className="absolute left-0 w-1/3 h-40 mt-12 ml-2 overflow-hidden transform rounded ring-default ring-2 md:h-56 lg:h-72 bg-card -rotate-3"
                initialY={animConfig.offset.bottom}
                delayTime={animConfig.delay.bottomRowBase + animConfig.delay.far}
            >
                <FakePost user={posts[4].user} content={posts[4].content} image={posts[4].image} />
            </AnimatedCard>
            <AnimatedCard
                className="absolute w-1/3 h-40 transform ring-default ring-2 rounded z-10 left-[30%] md:h-56 lg:h-72 bg-card rotate-1 overflow-hidden"
                initialY={animConfig.offset.bottom}
                delayTime={animConfig.delay.bottomRowBase + animConfig.delay.adjacent}
            >
                <FakePost user={posts[5].user} content={posts[5].content} image={posts[5].image} />
            </AnimatedCard>
            <AnimatedCard
                className="absolute mt-6 z-[5] w-1/3 h-40 transform ring-default ring-2 rounded left-[50%] md:h-56 lg:h-72 bg-card rotate-4 overflow-hidden"
                initialY={animConfig.offset.bottom}
                delayTime={animConfig.delay.bottomRowBase}
            >
                <FakePost user={posts[6].user} content={posts[6].content} image={posts[6].image} />
            </AnimatedCard>
            <AnimatedCard
                className="absolute mt-12 w-[24rem] h-40 transform ring-default ring-2 rounded -right-8 md:h-56 lg:h-72 bg-card -rotate-2 overflow-hidden"
                initialY={animConfig.offset.bottom}
                delayTime={animConfig.delay.bottomRowBase + animConfig.delay.adjacent}
            >
                <FakePost user={posts[7].user} content={posts[7].content} image={posts[7].image} />
            </AnimatedCard>
        </div>
    )
}

function Hero() {
    return (
        <div className="relative">
            {/* Top row of skewed cards */}
            <TopRowCards />

            {/* Main hero content */}
            <Container className="relative z-10 text-center pt-96 pb-82">
                <Heading className="!text-5xl tracking-tight md:!text-7xl font-new-spirit-bold">
                    <VerticalCutReveal
                        reverse
                        splitBy="characters"
                        staggerDuration={0.025}
                        staggerFrom="first"
                        containerClassName="justify-center"
                        transition={{
                            type: 'spring',
                            stiffness: 200,
                            damping: 21,
                        }}
                    >
                        {`Your community`}
                    </VerticalCutReveal>
                    <span className="!text-primary-cosmos">
                        <VerticalCutReveal
                            splitBy="characters"
                            staggerDuration={0.025}
                            staggerFrom="first"
                            containerClassName="justify-center"
                            transition={{
                                type: 'spring',
                                stiffness: 200,
                                damping: 21,
                                delay: 1.1,
                            }}
                        >
                            {`Your pack`}
                        </VerticalCutReveal>
                    </span>
                </Heading>

                <div className="mt-12 space-y-4 sm:space-y-0 sm:flex sm:justify-center sm:gap-4">
                    {links.map(link =>
                        link.tooltip ? (
                            <Tooltip content={link.tooltip} delayDuration={0}>
                                <Button href={link.href} color={(link.primary ? 'indigo' : 'zinc') as 'indigo' | 'zinc'}>
                                    {link.name} <ArrowUpRightIcon className="inline-flex w-4 h-4 text-white" />
                                </Button>
                            </Tooltip>
                        ) : (
                            <Button href={link.href} color={(link.primary ? 'indigo' : 'zinc') as 'indigo' | 'zinc'}>
                                {link.name}
                            </Button>
                        )
                    )}
                </div>
            </Container>
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
                        <img src={user.avatar} alt={user.name} className="object-cover w-full h-full" />
                    </div>
                    <div>
                        <p className="font-medium">{user.name}</p>
                    </div>
                </div>
            </div>

            {content && (
                <div className="px-4 pb-3">
                    <p className="text-sm line-clamp-2">{content}</p>
                </div>
            )}

            {image && (
                <div className="flex items-center justify-center flex-1 px-4 pb-4">
                    <img src={image} alt={content || user.name} className="object-cover w-full rounded-lg max-h-36 ring-2 ring-default" />
                </div>
            )}
        </div>
    )
}

function LandingContent() {
    return (
        <div className="relative mx-8">
            <div className="w-full">
                <BottomRowCards />
            </div>

            <div className="relative z-10 flex items-center justify-center bg-white rounded dark:bg-zinc-900 ring-2 ring-default h-96">
                <Text size="3xl" className="max-w-2xl mx-auto tracking-tight text-center font-instrument-serif-regular">
                    A new social platform for furries
                    <br />
                    built for <span className="text-indigo-400 font-instrument-serif-italic">creativity</span> and{' '}
                    <span className="text-indigo-400 font-instrument-serif-italic">connection</span>.
                    <br />
                    The internet should be truly <span className="font-instrument-serif-italic">yours</span>,
                    <br />
                    to paint, to play, to <span className="font-instrument-serif-italic">connect</span> &mdash; without
                    <br />
                    any barriers, paywalls, or ads.
                </Text>
            </div>
        </div>
    )
}

// Reusable highlighted text component with randomized clip path
function HighlightedText({ children, width = '110%' }: { children: ReactNode; width?: string }) {
    // Generate random wavy SVG path for highlight
    const svgPath = useMemo(() => {
        const segments = 10
        let path = ''

        // Starting point
        path += `M 0,${Math.floor(Math.random() * 16) + 2} `

        // Top edge - random wavy line
        for (let i = 1; i <= segments; i++) {
            const x = (i * 100) / segments
            const y = Math.floor(Math.random() * 16) + 2
            path += `L ${x},${y} `
        }

        // Right edge
        path += `L 100,${Math.floor(Math.random() * 15) + 80} `

        // Bottom edge - random wavy line
        for (let i = segments - 1; i >= 0; i--) {
            const x = (i * 100) / segments
            const y = Math.floor(Math.random() * 15) + 80
            path += `L ${x},${y} `
        }

        // Close the path
        path += 'Z'

        return path
    }, [])

    return (
        <span className="relative z-10 font-instrument-serif-italic text-default">
            {' '}
            <span
                className="absolute inset-0 -z-[1]"
                style={{
                    width,
                }}
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
    )
}

function StopBeingPrey() {
    return (
        <Container className="[&>*]:space-y-3 py-42">
            <Heading className="!text-5xl tracking-tight font-instrument-serif-regular">
                Social media preys on your{' '}
                <span className="space-x-4">
                    <HighlightedText width="105%">
                        <EyeIcon className="inline-flex w-8 h-8 text-lime-500/80 dark:text-primary-lime" /> attention,
                    </HighlightedText>{' '}
                    <HighlightedText>
                        <UserIcon className="inline-flex w-8 h-8 text-lime-500/80 dark:text-primary-lime" /> data,
                    </HighlightedText>{' '}
                    <HighlightedText>
                        <ClockIcon className="inline-flex w-8 h-8 text-lime-500/80 dark:text-primary-lime" /> time
                    </HighlightedText>
                </span>
                .
                <br />— it doesn't have to be this way.
            </Heading>
            <Text>
                Twitter (X), Instagram, TikTok, etc. all do this &mdash; Meta alone makes ~$50 per user per year¹. While furry-centric
                platforms don't do any of this (
                <Tooltip
                    delayDuration={0}
                    content="Some furry sites force you pay a subscription - well, 'donate' - to use basic features."
                >
                    <span>
                        <sub>... to an extent</sub> <sup>?</sup>
                    </span>
                </Tooltip>
                ) and work for creators, there's a better way &mdash; a way that benefits everyone, even if they're not creators.
                Dating-esque apps like Barq <b>don't work</b> for community communication.
            </Text>
            <Text>Packbase puts communities first. Completely free, full HTML/CSS customisation, and no ads.</Text>
            <ul className="space-y-1 list-none">
                <li>
                    <Text alt size="xs" className="text-neutral-500">
                        <a
                            href="https://www.statista.com/statistics/234056/facebook-average-revenue-per-user/"
                            className="hover:underline"
                            target="_blank"
                        >
                            ¹Statista Data Value Per User Report (2023)
                        </a>
                    </Text>
                </li>
            </ul>
        </Container>
    )
}
export default function GuestLanding() {
    return (
        <div className="h-full pb-6 space-y-8 overflow-x-hidden overflow-y-auto bg-zinc-100 dark:bg-zinc-950">
            <div className="relative z-30 bg-white rounded-md ring-2 ring-default dark:bg-zinc-900">
                <Hero />
                <LandingContent />
                <StopBeingPrey />
            </div>
            {/* Minimal footer */}
            <div className="sticky bottom-0 left-0 z-0 w-full px-8 border-y border-n-2/80 dark:border-n-6/80 h-80">
                <div className="w-full px-8 h-80 border-x border-n-2/80 dark:border-n-6/80">
                    <h1 className="fixed flex flex-col opacity-50 select-none bottom-8 left-8 font-wildbase-bold">
                        <span className="text-8xl">
                            <span className="text-primary-cosmos">✱</span>base
                        </span>
                        <span className="mt-1 text-xs ml-22 text-default-alt font-wildbase-medium">
                            &copy; 2025 ✱base. All rights reserved.
                        </span>
                    </h1>
                </div>
            </div>
        </div>
    )
}
