import LoginGradient from '@/app/id/create/client/gradient'
import CrawlText from '@/components/shared/CrawlText'
import { Heading } from '@/components/shared/text'
import { OctagonAlertIcon } from 'lucide-react'
import Body from '../layout/body'
import UserInfoCol from '../shared/user/info-col'

export default function GuestLanding() {
    const people = [
        {
            username: 'Rek',
            role: 'Team Lead',
            images: {
                avatar: 'https://udxdytccktvaedirxooa.supabase.co/storage/v1/object/public/profiles/3e133370-0ec2-4825-b546-77de3804c8b1/0/avatar.png',
            },
        },
        // More people...
    ]

    return (
        <Body className="space-y-8">
            <div className="relative isolate overflow-hidden rounded-2xl border-2 bg-[#8cd605] shadow-md">
                <div className="flex py-24 sm:py-32">
                    <div className="-z-10">
                        {/* @TODO: THIS IS CPU GPU & MEM EXPENSIVE!!!!1! */}
                        <LoginGradient
                            // opacity={0.5}
                            grainBlending={0.15}
                            cDistance={2.5}
                            positionX={0}
                            positionY={1}
                            positionZ={0.3}
                            rotationX={0}
                            rotationY={0}
                            rotationZ={0}
                            color1="#CEFF1C"
                            color2="#22BCE9"
                            color3="#FFFFFF"
                            cAzimuthAngle={0}
                            uSpeed={0.05}
                            uStrength={2}
                            enableTransition={false}
                        />
                    </div>
                    <div className="z-10 mx-auto w-full max-w-7xl px-6 lg:px-8">
                        <div className="mx-auto max-w-3xl lg:mx-0">
                            <h2
                                className="text-4xl font-bold tracking-tight text-white sm:text-6xl"
                                style={{
                                    whiteSpace: 'break-spaces',
                                }}
                            >
                                <CrawlText>Giving back ::break: web creativity</CrawlText>
                                <div className="mt-4 text-xl">
                                    <p className="mb-4 select-none">
                                        <OctagonAlertIcon className="-mt-px inline-flex h-5 w-5 fill-white text-tertiary" /> HEY! This ain't ready for 'ya fuzzface, we're
                                        still QA'ing shit! We won't stop you from signing up and viewing the feed, but we're only caring about internal feedback for now.
                                    </p>
                                    <CrawlText delay={700} fast>
                                        The internet doesn't have to be boring everywhere; Find your pack that shares that oddly specific interest, share it with everyone
                                        in the Universe, or maybe just keep it to yourself. You control your feed and profile, your pack leader controls the view.
                                    </CrawlText>
                                </div>
                            </h2>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto flex w-full max-w-7xl flex-col px-8">
                <Heading size="2xl">The pack leader for {process.env.NEXT_PUBLIC_PACKBASE_UNIVERSE || '???'} doesn't let you view the feed while signed out.</Heading>
                <ul role="list" className="mt-4 grid gap-x-8 gap-y-12 sm:grid-cols-2 sm:gap-y-16 xl:col-span-2">
                    {people.map((person) => (
                        <li key={person.username}>
                            <UserInfoCol user={person} tag={<p className="text-sm font-semibold leading-6 text-indigo-600">{person.role}</p>} />
                        </li>
                    ))}
                </ul>
            </div>
        </Body>
    )
}
