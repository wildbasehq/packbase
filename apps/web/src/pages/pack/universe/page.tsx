/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import PackFeedController from '@/pages/pack/components.tsx'
import { Protect } from '@clerk/clerk-react'
import { Heading, Text } from '@/components/shared/text.tsx'

export default function UniversePack({ useEverythingQuery }: { useEverythingQuery?: boolean }) {
    return (
        <>
            <Protect>
                <div
                    className="hidden sm:block px-20 pt-10 pb-64 m-4 ring-1 ring-default shadow rounded-xl highlight-white/5"
                    style={{
                        background: `linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.3)), url('/img/illustrations/home/fox-in-snowy-oasis.webp') center center / cover no-repeat`,
                    }}
                >
                    <div className="rounded dark p-8 bg-sidebar backdrop-blur flex flex-col xl:w-1/2 space-y-4">
                        <Heading size="xl">Hey, you! Yeah, you!</Heading>
                        <Text size="md">
                            You can now invite other people to join you on Packbase, and you'll get trinkets you can spend for badges!
                        </Text>
                        <Text alt>
                            * Trinkets are value-less and untradeable. Anyone selling or offering to trade you trinkets or invites are
                            scamming you.
                        </Text>
                    </div>
                </div>

                <PackFeedController
                    channelID={useEverythingQuery ? '0A' : null}
                    feedQueryOverride={useEverythingQuery ? '[Where posts:content_type ("markdown")]' : undefined}
                />
            </Protect>
        </>
    )
}
