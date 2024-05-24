import {CrawlText} from '@nextgen2'

const links = [
    {name: 'Volunteer', href: 'https://yipnyap.atlassian.net/servicedesk/customer/portal/3/group/11/create/43'},
    {name: 'Donate', href: '/fund/'},
]

interface User {
    username: string;
    displayName: string;
    header?: string;
    avatar?: string;
    verified?: boolean;
}

const usersOne: User[] = [
    {
        username: 'hazeyr',
        displayName: 'Hazeyr',
        header: 'https://api.yipnyap.me/vault/@server/uploads/members/243/cover-image/64bf4f71d8d0e-yp-cover-image.png',
        avatar: 'https://api.yipnyap.me/vault/@server/uploads/members/243/avatars//1690259312-bpfull.png'
    },
    {username: 'strappleberri', displayName: 'Strappleberri'},
    {username: 'bernie_burr', displayName: 'Bernie', verified: true},
    {username: 'erice', displayName: 'Eric Enderson'},
    {username: 'LuniFoxo', displayName: 'LuniFoxo'},
    {
        username: 'rek',
        displayName: 'Rekkisomo',
        verified: true,
        header: 'https://ecwxmakixjrsklydfmtl.supabase.co/storage/v1/object/public/users/01A164575a5c4fa08b49d0eefad7da/posts/03A1fd79e929b8719c59022f8f41/03A1fd79e929b8719c59022f8f41:03S249ed3a1acc8f6ba02fe7a21d15c4a7755de70ebdb3f809c2.png',
        avatar: 'https://ecwxmakixjrsklydfmtl.supabase.co/storage/v1/object/public/users/01A164575a5c4fa08b49d0eefad7da/posts/03A1be14b24551996e38a30f8b0f3559c66c0abe02975511/03A1be14b24551996e38a30f8b0f3559c66c0abe02975511:03S10716f9fa3b5e313ae7e095a55db6f4997c9145f4317b.png',
    },
].sort(() => Math.random() - 0.5)

const usersTwo: User[] = [
    {
        username: 'bradesu',
        displayName: 'Bra',
        header: 'https://api.yipnyap.me/vault/@server/uploads/members/172/cover-image/63694f6a29b3f-yp-cover-image.png',
        avatar: 'https://api.yipnyap.me/vault/@server/uploads/members/172/avatars//1667845993-bpfull.png'
    },
    {
        username: 'shunp0',
        displayName: 'Shun',
        header: 'https://ecwxmakixjrsklydfmtl.supabase.co/storage/v1/object/public/users/01A1c0d3cae5e5d6d2af60c8b3f0254695/posts/03A1bc8ee09157d90112e7f5b4943e19c7c32d7dff1d/03A1bc8ee09157d90112e7f5b4943e19c7c32d7dff1d:03S24bad7c8942dd940065165532bc47d35b658b.gif',
        avatar: 'https://api.yipnyap.me/vault/@server/uploads/members/1026/avatars//1683453240-bpfull.png'
    },
    {
        username: 'tjcapyart',
        displayName: 'T.J. Capy',
        header: 'https://api.yipnyap.me/vault/@server/uploads/members/246/cover-image/63eb771382959-yp-cover-image.png',
        avatar: 'https://api.yipnyap.me/vault/@server/uploads/members/246/avatars//1668753551-bpfull.jpg'
    },
    {username: 'theluckynas', displayName: 'Lucky', verified: true},
    {username: 'uchuuken', displayName: 'uchu!',},
    {username: 'EnderHoodie_', displayName: 'Hoodie', verified: true},
].sort(() => Math.random() - 0.5)

const teamPeople = [
    {
        name: 'Rekkisomo',
        role: 'Team Lead',
        imageUrl: `/img/illustrations/onboarding/pfp/rekkisomo.png`,
        username: 'rekkisomo',
    },
    {
        name: 'Canned Meow',
        role: 'Realtime API Dev',
        imageUrl: 'https://api.yipnyap.me/vault/@server/uploads/members/3/avatars/1676264063-bpfull.png',
        username: 'puppercino',
    },
    {
        name: 'Relms',
        role: 'Realtime API Dev',
        imageUrl: 'https://api.yipnyap.me/vault/@server/uploads/members/687/avatars/1675426737-bpfull.jpg',
        username: 'relmswah',
    },
    {
        name: 'Mestre',
        role: 'Cybersec, PR',
        imageUrl: `/img/illustrations/onboarding/pfp/mestre.png`,
        username: 'pintora',
    },
    {
        name: 'Winston',
        role: 'Moderator',
        imageUrl: 'https://api.yipnyap.me/vault/@server/uploads/members/758/avatars/1675096287-bpfull.jpg',
        username: 'desertcryptid',
    },
    {
        name: 'Viia',
        role: 'Moderator',
        imageUrl: 'https://api.yipnyap.me/vault/@server/uploads/members/630/avatars/1675059865-bpfull.png',
        username: 'ferret',
    },
    {
        name: 'Hydeenazz',
        role: 'Moderator',
        imageUrl: 'https://api.yipnyap.me/vault/@server/uploads/members/723/avatars/1675421747-bpfull.jpg',
        username: 'hydeenazz',
    }
    // More people...
]

export default function GuestLanding() {
    return (
        <div className="flex flex-col">
            <div className="relative isolate py-24 sm:py-32">
                <div
                    className="hidden snapanim-hue-blur sm:absolute sm:-top-32 sm:right-1/2 sm:-z-10 sm:mr-10 sm:block sm:transform-gpu"
                    aria-hidden="true"
                >
                    <div
                        className="aspect-[1097/845] w-[68.5625rem] bg-gradient-to-tr from-[#ff4694] to-[#776fff] opacity-20"
                        style={{
                            clipPath:
                                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                        }}
                    />
                </div>
                <div
                    className="absolute snapanim-hue-blur-reverse -top-52 left-1/2 -z-10 -translate-x-1/2 transform-gpu sm:top-[-28rem] sm:ml-16 sm:translate-x-0 sm:transform-gpu"
                    aria-hidden="true"
                >
                    <div
                        className="aspect-[1097/845] w-[68.5625rem] bg-gradient-to-tr from-[#ff4694] to-[#776fff] opacity-20"
                        style={{
                            clipPath:
                                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                        }}
                    />
                </div>
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:mx-0">
                        <h2 className="text-4xl font-bold tracking-tight text-default sm:text-6xl"
                            style={{
                                whiteSpace: 'break-spaces',
                            }}
                        >
                            <CrawlText>
                                a random ass furry site
                            </CrawlText>
                            <p className="mt-4 text-lg text-alt">
                                <CrawlText delay={700} fast>
                                    :)
                                </CrawlText>
                            </p>
                        </h2>
                    </div>
                </div>
            </div>
        </div>
    )
}
