'use client'
import {useEffect, useState} from 'react'
import {NGCard, NGFeed, NGHeading, NGTabList} from '@nextgen2'
import Body from '@/components/layout/body'
import Link from 'next/link'
import Button from '@/components/shared/button'
import {useUserAccountStore} from '@/lib/states'

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
}

export default function Feed() {
    const {user} = useUserAccountStore()
    const [target, setTarget] = useState<any>(null)
    const [rerender, setRerender] = useState<number>(0)

    useEffect(() => {
        if (target?.id === user?.id) {
            setTarget(null)
        }
    }, [target])

    return (
        <Body>
            <div className="max-w-3xl">
                {localStorage.ee_liam && (
                    <h1 className={`hidden text-2xl font-bold`}>
                        Liam fucking sucks &lt;3
                    </h1>
                )}

                {!user && (
                    <div
                        className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mb-12 mx-auto justify-center items-center">
                        <div className="flex flex-col space-y-4">
                            <NGHeading>
                                Below would be better with you in it
                            </NGHeading>
                            <div className="space-y-2">
                                <p className="text-sm text-alt">
                                    An account is free, and you don't even need an invite code to join. Just sign up,
                                    and
                                    you're good to go. We hope to see you soon!
                                </p>
                            </div>
                            <div className="mt-10 flex items-center gap-x-6">
                                <Link href="/id/create/">
                                    <Button>
                                        Sign up
                                    </Button>
                                </Link>
                                <Link href="/id/login/" className="text-sm font-semibold leading-6 text-default">
                                    Jump back in <span aria-hidden="true">→</span>
                                </Link>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <img src={`/img/illustrations/settings/import-begin.png`} alt="LITTLE BABY BOY"
                                 className="w-auto"/>
                        </div>
                    </div>
                )}

                <div className="lg:max-w-7xl sm:grid sm:grid-cols-12 sm:gap-8">
                    <main className="space-y-8 sm:col-span-8">
                        <NGTabList key={rerender} srLabel="Select a feed filter" tabs={[
                            {
                                name: 'Following',
                                children: <NGFeed feedID={user?.E2ID || 'Guest'}/>
                            }, {
                                name: 'Discover',
                                children: <NGFeed feedID="Guest"/>
                            }, {
                                name: 'Everything',
                                children: <NGFeed feedID="universe"/>
                            }
                        ]}/>
                    </main>
                    <aside className="hidden sm:block sm:col-span-4">
                        <div className="sticky top-0 space-y-4">
                            <NGCard
                                title={<p className="text-default font-extrabold">
                                    Help us make Yipnyap more comfy
                                </p>}
                                wellBody={true}>
                                <p className="text-sm leading-5 text-neutral-500">
                                    Help us make a chill, joyful, and welcoming experience by joining in
                                    on the conversation!
                                </p>
                                <div className="mt-3 text-sm leading-5">
                                    <a
                                        className="font-medium text-primary hover:text-indigo-500 focus:outline-none focus:underline transition ease-in-out duration-150"
                                        href="https://discord.gg/wrCGpAB"
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Join the Discord &rarr;
                                    </a>
                                </div>
                            </NGCard>
                        </div>
                    </aside>
                </div>
            </div>
        </Body>
    )
}
