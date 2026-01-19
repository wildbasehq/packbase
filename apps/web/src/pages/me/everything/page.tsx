import PackFeedController from '@/pages/pack/components'
import {Alert, AlertDescription} from '@/src/components'
import {Protect} from '@clerk/clerk-react'

export default function EverythingPage() {
    return (
        <>
            <Protect>
                <Alert className="max-w-3xl mx-auto mt-8" variant="warning">
                    <AlertDescription>
                        This feed shows everything uploaded to Packbase, regardless of whether it's been moderated
                        or not - we cannot feasibly moderate everything by the minute. <b>There's a high chance
                        you'll
                        see something you may regret to see.</b>
                    </AlertDescription>
                </Alert>
                <PackFeedController
                    channelID="0A000000000000"
                    feedQueryOverride='$posts = [Where posts:content_type ("markdown")] | PAGE({SKIP}, {TAKE}) | BULKPOSTLOAD() AS *;'
                />
            </Protect>
        </>
    )
}