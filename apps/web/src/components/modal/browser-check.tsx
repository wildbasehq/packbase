import { Button, Divider } from '../shared'
import { Alert, AlertDescription, AlertTitle } from '../shared/alert'
import { useModal } from './provider'
import { useEffect } from 'react'

export default function BrowserCheck() {
    const { show, hide } = useModal()
    // Search navigator.userAgentData for Chromium.
    const browserEngine =
        navigator.userAgentData?.brands?.find(brand => brand.brand.toLowerCase() === 'chromium') ||
        navigator.userAgent.toLowerCase().includes('chrom')

    const isOpera =
        navigator.userAgentData?.brands?.find(brand => brand.brand.toLowerCase() === 'opera') ||
        navigator.userAgent.toLowerCase().includes('opera')

    useEffect(() => {
        if (isOpera) {
            show(
                <Alert variant="destructive" className="max-w-md !rounded-2xl">
                    <AlertTitle>Use anything else.</AlertTitle>
                    <AlertDescription>
                        We - among many other sites - are going against Opera GX. It is a bloated, slow, and insecure browser that provides
                        no benefit to you, and harvests your data which is <b>on by default, probably on right now</b>. It's also partly
                        owned by a company that made 360 Secure Browser, which is known to have a hidden backdoor, as well as other software
                        with spyware, financial username/password stealing, and more.
                        <br />
                        <br />
                        Care more about your privacy; Use any open-source browser instead. While we don't support Gecko or Firefox based
                        browsers, it would be INFINITELY better than what you're on now.
                    </AlertDescription>
                    <Divider className="my-2" />
                    <AlertDescription>
                        You're free to continue, but bug reports WILL be rejected. Unlike some other sites, Packbase has no safeguards to
                        stop Opera from injecting itself on the page - you chose to use this browser, so we won't stop you.
                    </AlertDescription>
                    <Button className="w-full mt-2" color="orange" onClick={hide}>
                        Continue Anyway
                    </Button>
                </Alert>
            )
        } else if (!browserEngine) {
            show(
                <Alert variant="destructive" className="max-w-md !rounded-2xl">
                    <AlertTitle>Your browser is not supported.</AlertTitle>
                    <AlertDescription>
                        Due to a multitude of quirks, we cannot support Gecko-based and WebKit-based browsers. For the best experience,
                        please use a Chromium-based browser instead.
                    </AlertDescription>
                    <Divider className="my-2" />
                    <AlertDescription>You're free to continue, but some bug reports may be rejected.</AlertDescription>
                    <Button className="w-full mt-2" color="orange" onClick={hide}>
                        Continue Anyway
                    </Button>
                </Alert>
            )
        }
    }, [])

    return <></>
}
