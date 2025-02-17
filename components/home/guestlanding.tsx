import CrawlText from '@/components/shared/crawl-text'
import {Heading, Text} from '@/components/shared/text'
import {Button} from '@/components/shared/ui/button'
import Tooltip from '@/components/shared/tooltip'
import {HelpCircleIcon} from 'lucide-react'
import Link from '@/components/shared/link'
import Countdown from '@/components/home/countdown'
import {Gradient} from '@/components/shared/gradient'
import {Container} from '@/components/layout/container'
import Image from 'next/image'

const links = [
    { name: 'Join Packbase', href: '/id/create/' },
    { name: 'Volunteer', href: 'https://discord.gg/StuuK55gYA' },
]

function Hero() {
    const taglines = [
        // default
        'This is a place ::break: where people meet',
        'This is a place ::break: where creativity thrives',

        // Packs
        {
            pack: {
                name: 'Rhythm Gamers!',
                slug: 'rhythm',
                image: 'https://udxdytccktvaedirxooa.supabase.co/storage/v1/object/public/packs/19753a52-27a0-43d0-817b-d9b41218342b/avatar.png',
            },
            tagline: 'A place where ::break: you feel the rhythm',
        },
        {
            pack: {
                name: 'Final Fantasy XIV',
                slug: 'ffxiv',
                image: 'https://udxdytccktvaedirxooa.supabase.co/storage/v1/object/public/packs/8ab9e313-e9fa-476f-993e-4cba6f32ca31/avatar.png',
            },
            tagline: 'A place for Scions ::break: of the Seventh Dawn',
        },
        {
            pack: {
                name: 'Packbase Support',
                slug: 'support',
                image: 'https://udxdytccktvaedirxooa.supabase.co/storage/v1/object/public/profiles/549329ff-74dd-4ac9-85b1-d33f5c73d8ac/0/avatar.png',
            },
            tagline: 'A place to ::break: support each other',
        }
    ].sort(() => Math.random() - 0.5)

    const tagline = taglines[0]

    return (
        <div className="relative">
            <Gradient className="absolute inset-2 bottom-0 rounded-4xl ring-1 ring-inset ring-black/5" />
            <Container className="relative">
                <div className="pb-24 pt-16 sm:pb-32 sm:pt-24 md:pb-48 md:pt-32">
                    <Heading className="font-display text-n-7 text-6xl font-medium tracking-tight sm:text-7xl whitespace-break-spaces">
                        "
                        <CrawlText fast>
                            {typeof tagline === 'string' ? tagline : tagline.tagline}
                        </CrawlText>
                        "
                    </Heading>
                    {typeof tagline !== 'string' && (
                        <div className="flex items-center mt-4">
                            <Image src={tagline.pack.image}
                                   alt=""
                                   className="h-7 w-7 rounded-md"
                                   width={28}
                                   height={28}
                            />
                            <Link href={`/p/${tagline.pack.slug}`}>
                                <Text size="lg" className="ml-2">
                                    {tagline.pack.name} Pack &rarr;
                                </Text>
                            </Link>
                        </div>
                    )}
                    <Text size="lg" className="mt-8 max-w-2xl font-medium">
                        Putting fun back into the internet. We're a community of creators, artists, gamers, hobbyists, and whatever you are.
                        <br/><br/>
                        Why settle for a
                        multi-billion dollar corp that can't give you customisation, when you have full HTML/CSS control here and owned by you 'eh?
                    </Text>
                    <div className="mt-12 flex flex-col gap-x-6 gap-y-4 sm:flex-row">
                        {links.map((link) => (
                            <Link key={link.name} href={link.href}>
                                <Button>{link.name}</Button>
                            </Link>
                        ))}
                    </div>
                </div>
            </Container>
        </div>
    )
}

export default function GuestLanding() {
    return (
        <div className="overflow-hidden space-y-8">
            <Hero />
            <div className="mx-auto flex w-full max-w-7xl flex-col px-8">
                <Countdown />

                {/* Groups */}
                <div className="overflow-hidden lg:py-24">
                    <div className="mx-auto max-w-7xl">
                        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none xl:grid-cols-2">
                            <div className="order-last lg:pr-8 lg:pt-4 xl:order-first">
                                <div className="lg:max-w-lg">
                                    <Heading className="mt-2 text-3xl font-bold! sm:text-4xl">A pack for your pack</Heading>
                                    <Text size="lg" className="mt-6">
                                        Packbase is group focused. They're where almost everything lives, even our global "Universe" feed is a pack! You can create your
                                        own pack, join others, or just vibe in the Universe.
                                    </Text>
                                </div>
                            </div>

                            {/* Group card with fake outlines of a stack behind */}
                            <div className="relative h-fit">
                                <div className="absolute inset-0 flex flex-col">
                                    <div className="h-full w-full flex-1 -rotate-3 rounded border border-solid shadow-md transition-transform hover:-rotate-2" />
                                </div>
                                <div className="absolute inset-0 flex flex-col">
                                    <div className="h-full w-full flex-1 rotate-6 rounded border border-solid bg-card shadow-lg transition-transform hover:rotate-[5deg]" />
                                </div>

                                <div className="bg-default relative rotate-2 rounded border border-solid p-6 shadow-xl transition-transform hover:rotate-1">
                                    <div className="flex">
                                        <div className="shrink-0">
                                            <img
                                                className="h-10 w-10 rounded-full"
                                                src="data:image/png;base64,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"
                                                alt=""
                                            />
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-base font-medium">The Critique Place</h3>
                                            <p className="text-sm font-medium">
                                                <span className="sr-only">The Critique Place, </span> 2,000+ members
                                            </p>
                                        </div>
                                    </div>

                                    <p className="mt-4 text-sm">
                                        A place to get feedback and critique for WIPs or finished works. Remember to be kind and keep all criticism constructive!
                                    </p>

                                    <div className="mt-6 hidden lg:block">
                                        <Button disabled>
                                            Join the group<span className="ml-1 text-xs">* </span>
                                        </Button>
                                    </div>

                                    {/*<p className="mt-2 hidden text-xs font-medium lg:block">*/}
                                    {/*    * Clicking this will take you to a real group, which is not affiliated to Yipnyap or Yipnyap Foundation staff.*/}
                                    {/*</p>*/}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profile upsell with skewed grid-like layout */}
                <div className="relative w-full py-12 lg:py-24">
                    <div className="relative flex flex-col justify-center">
                        {/*<div className="hidden lg:absolute lg:inset-y-0 lg:block lg:h-full lg:w-full">*/}
                        {/*    <div className="relative mx-auto h-full max-w-prose text-lg" aria-hidden="true">*/}
                        {/*        <svg className="absolute left-full top-12 translate-x-32 transform" width={404} height={384} fill="none" viewBox="0 0 404 384">*/}
                        {/*            <defs>*/}
                        {/*                <pattern id="74b3fd99-0a6f-4271-bef2-e80eeafdf357" x={0} y={0} width={20} height={20} patternUnits="userSpaceOnUse">*/}
                        {/*                    <rect x={0} y={0} width={4} height={4} className="text-gray-200" fill="currentColor" />*/}
                        {/*                </pattern>*/}
                        {/*            </defs>*/}
                        {/*            <rect width={404} height={384} fill="url(#74b3fd99-0a6f-4271-bef2-e80eeafdf357)" />*/}
                        {/*        </svg>*/}
                        {/*        <svg*/}
                        {/*            className="absolute right-full top-1/2 -translate-x-32 -translate-y-1/2 transform"*/}
                        {/*            width={404}*/}
                        {/*            height={384}*/}
                        {/*            fill="none"*/}
                        {/*            viewBox="0 0 404 384"*/}
                        {/*        >*/}
                        {/*            <defs>*/}
                        {/*                <pattern id="f210dbf6-a58d-4871-961e-36d5016a0f49" x={0} y={0} width={20} height={20} patternUnits="userSpaceOnUse">*/}
                        {/*                    <rect x={0} y={0} width={4} height={4} className="text-gray-200" fill="currentColor" />*/}
                        {/*                </pattern>*/}
                        {/*            </defs>*/}
                        {/*            <rect width={404} height={384} fill="url(#f210dbf6-a58d-4871-961e-36d5016a0f49)" />*/}
                        {/*        </svg>*/}
                        {/*        <svg className="absolute bottom-12 left-full translate-x-32 transform" width={404} height={384} fill="none" viewBox="0 0 404 384">*/}
                        {/*            <defs>*/}
                        {/*                <pattern id="d3eb07ae-5182-43e6-857d-35c643af9034" x={0} y={0} width={20} height={20} patternUnits="userSpaceOnUse">*/}
                        {/*                    <rect x={0} y={0} width={4} height={4} className="text-gray-200" fill="currentColor" />*/}
                        {/*                </pattern>*/}
                        {/*            </defs>*/}
                        {/*            <rect width={404} height={384} fill="url(#d3eb07ae-5182-43e6-857d-35c643af9034)" />*/}
                        {/*        </svg>*/}
                        {/*    </div>*/}
                        {/*</div>*/}

                        {/* Askewed 2-row marquee wall of profile cards */}
                        {/*<div className="-translate-x-1/4 -rotate-3 space-y-12 overflow-visible">*/}
                        {/*    <div className="relative -left-3/4 flex space-x-12">*/}
                        {/*        {usersOne.map((user, i) => (*/}
                        {/*            <div key={i} className={`min-w-[412px] ${i > 4 ? 'hidden sm:block' : ''}`}>*/}
                        {/*                <ProfileHeader user={user} />*/}
                        {/*            </div>*/}
                        {/*        ))}*/}
                        {/*    </div>*/}
                        {/*    <div className="relative -left-[50%] flex space-x-8">*/}
                        {/*        {usersTwo.map((user, i) => (*/}
                        {/*            <div key={i} className={`min-w-[412px] ${i > 4 ? 'hidden sm:block' : ''}`}>*/}
                        {/*                <ProfileHeader user={user} />*/}
                        {/*            </div>*/}
                        {/*        ))}*/}
                        {/*    </div>*/}
                        {/*</div>*/}

                        {/* Profile customisation upsell text */}
                        <div className="space-y-8 sm:space-y-12">
                            <div className="space-y-5 sm:mx-auto sm:space-y-4">
                                <Heading className="mt-2 text-3xl font-bold! sm:text-4xl">Yours to paint</Heading>
                                <Text size="lg" className="mt-4">
                                    You're not just limited to your avatar and header. While other sites struggle to give you the most basic control of your profile's
                                    colours, we just gave you complete HTML/CSS control and even the ability to set your own custom domain, with no ads nor tracking.
                                    <br />
                                    <br />
                                    Oh... and infinite storage for your site
                                    <Tooltip
                                        content="You have unlimited storage, but each file cannot exceed 10MB. This only affects our storage, so if you need more space you can always use a third-party service."
                                        side="right"
                                    >
                                        <HelpCircleIcon className="-mt-2 h-4 w-4" />
                                    </Tooltip>
                                </Text>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Made by a community */}
                <div className="mx-auto py-12 lg:py-24">
                    <div className="space-y-8 sm:space-y-12">
                        <div className="space-y-5 sm:mx-auto sm:space-y-4">
                            <Heading className="mt-2 text-3xl font-bold! sm:text-4xl">Made by a community, not a company</Heading>
                            <Text size="lg">
                                Unlike other social media platforms, we don't have a multi-million dollar company backing us, so we rely on the support of our users to
                                keep the lights on, and all of us volunteers to keep the site running. All profits go right back into Packbase.
                            </Text>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <Text size="sm" className="mt-12">
                    Thank you to the community for helping us get this far. We hope you enjoy Packbase as much as we do.
                </Text>

                {/* copyright */}
                <div className="my-12 border-t pt-8">
                    <Text alt>
                        &copy; 2025 ✱base. All rights reserved to their respective owners. We acknowledges the Wurundjeri people of the Kulin Nation as the Traditional
                        Custodians of the land on which we work and live, and recognise their continuing connection to land, water and community. We pay respect to Elders
                        past, present and emerging.
                    </Text>
                </div>
            </div>
        </div>
    )
}
