/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import PackFeedController from '@/pages/pack/components.tsx'
import {Protect} from '@clerk/clerk-react'
import {Activity} from "react";
import {isVisible} from "@/lib";
import {Alert, AlertDescription} from "@/src/components";

export default function UniversePack({useEverythingQuery}: { useEverythingQuery?: boolean }) {
    return (
        <>
            <Protect>
                <Activity mode={isVisible(useEverythingQuery)}>
                    <Alert className="max-w-3xl mx-auto mt-8" variant="warning">
                        <AlertDescription>
                            This feed shows everything uploaded to Packbase, regardless of whether it's been moderated
                            or not - we cannot feasibly moderate everything by the minute. <b>There's a high chance
                            you'll
                            see something you may regret to see.</b>
                        </AlertDescription>
                    </Alert>
                </Activity>
                <PackFeedController
                    channelID={useEverythingQuery ? '0A' : null}
                    feedQueryOverride={useEverythingQuery ? '[Where posts:content_type ("markdown")]' : undefined}
                />
            </Protect>
        </>
    )
}
