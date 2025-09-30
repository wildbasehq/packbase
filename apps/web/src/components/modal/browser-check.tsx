import {Button, Divider} from '../shared'
import {Alert, AlertDescription, AlertTitle} from '../shared/alert'
import {useModal} from './provider'
import {useEffect} from 'react'
import useLocalStorage from '@/lib/hooks/use-local-storage.ts'

export default function BrowserCheck() {
    const {show, hide} = useModal()
    const [hasSeenWarningModal, setHasSeenWarningModal] = useLocalStorage('has-seen-browser-warning-modal', false)
    // Search navigator.userAgentData for Chromium.
    const browserEngine = // @ts-ignore
        navigator.userAgentData?.brands?.find(brand => brand.brand.toLowerCase().includes('chrom'))

    const isOpera = // @ts-ignore
        navigator.userAgentData?.brands?.find(brand => brand.brand.toLowerCase().includes('opera'))

    const dismiss = () => {
        setHasSeenWarningModal(true)
        hide()
    }

    useEffect(() => {
        if (hasSeenWarningModal) return

        // @ts-ignore
        if (!navigator.userAgentData) {
            show(
                <Alert variant="destructive" className="max-w-md !rounded-2xl">
                    <AlertTitle>Your browser has no user agent data.</AlertTitle>
                    <AlertDescription>
                        We'll assume you're on a Gecko/Firefox based browser, which may disable some features.
                    </AlertDescription>
                    <Button className="w-full mt-2" color="orange" onClick={dismiss}>
                        Continue Anyway
                    </Button>
                </Alert>
            )
        } else if (isOpera) {
            show(
                <Alert variant="destructive" className="max-w-md !rounded-2xl">
                    <AlertTitle>Use anything else.</AlertTitle>
                    <AlertDescription>
                        We - among many other sites - are going against Opera GX. It is a bloated, slow, and insecure browser that provides
                        no benefit to you, and harvests your data which is <b>on by default, probably on right now</b>. It's also partly
                        owned by a company that made 360 Secure Browser, which is known to have a hidden backdoor, as well as other software
                        with spyware, financial username/password stealing, and more.
                        <br/>
                        <br/>
                        Care more about your privacy; Use any open-source browser instead. While we don't support Gecko or Firefox based
                        browsers, it would be INFINITELY better than what you're on now.
                    </AlertDescription>
                    <Divider className="my-2"/>
                    <AlertDescription>
                        You're free to continue, but bug reports WILL be rejected. Unlike some other sites, Packbase has no safeguards to
                        stop Opera from injecting itself on the page - you chose to use this browser, so we won't stop you.
                    </AlertDescription>
                    <Button className="w-full mt-2" color="orange" onClick={dismiss}>
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
                    <Divider className="my-2"/>
                    <AlertDescription>You're free to continue, but some bug reports may be rejected.</AlertDescription>
                    <Button className="w-full mt-2" color="orange" onClick={dismiss}>
                        Continue Anyway
                    </Button>
                </Alert>
            )
        }
    }, [])

    return <></>
}
