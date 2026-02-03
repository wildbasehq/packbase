import Link from '@/components/shared/link'
import {useEffect} from 'react'
import {useLocalStorage} from 'usehooks-ts'
import {Button, Divider} from '../shared'
import {Alert, AlertDescription, AlertTitle} from '../shared/alert'
import {useModal} from './provider'

export default function BrowserCheck() {
    const modal = useModal()
    const {show, hide} = modal || {
        show: () => {
        },
        hide: () => {
        }
    }
    const [hasSeenWarningModal, setHasSeenWarningModal] = useLocalStorage('has-seen-browser-warning-modal', false)
    // Search navigator.userAgentData for Chromium.
    const isChrome = // @ts-ignore
        navigator.userAgentData?.brands?.find(brand => brand.brand.toLowerCase().includes('chrom'))

    const isZen = // @ts-ignore
        navigator.userAgentData?.brands?.find(brand => brand.brand.toLowerCase().includes('zen'))

    const isOpera = // @ts-ignore
        navigator.userAgentData?.brands?.find(brand => brand.brand.toLowerCase().includes('opera'))

    const dismiss = () => {
        setHasSeenWarningModal(true)
        hide()
    }

    useEffect(() => {
        if (hasSeenWarningModal) return

        // @ts-ignore
        if (isOpera) {
            show(
                <Alert variant="destructive" className="max-w-md">
                    <AlertTitle>Use anything else.</AlertTitle>
                    <AlertDescription>
                        We - among many other sites - are going against Opera GX. It is a bloated, slow, and insecure
                        browser that provides
                        no benefit to you, and harvests your data which is <b>on by default, probably on right now</b>.

                        <br/>
                        <br/>
                        It's also;
                        <ul>
                            <li>&bull; partly owned by a company that made 360 Secure Browser, which is known to have a
                                hidden
                                backdoor, with other software with spyware and financial username/password sniffing
                            </li>
                            <li>
                                &bull; Opera Group is running{' '}
                                <Link
                                    href="https://investor.opera.com/news-releases/news-release-details/okash-lands-kenya-allowing-android-smartphone-users-apply-loans">
                                    OKash & OPesa, a loan shark masked as an "easy short-term loan app",
                                </Link>{' '}
                                and stating it's bringing{' '}
                                <Link
                                    href="https://blogs.opera.com/africa/2020/01/how-microloans-bring-financial-reliability-to-people-in-kenya/">
                                    "financial reliability",
                                </Link>{' '}
                                all while it{' '}
                                <Link href="https://investor.opera.com/node/6621/pdf">
                                    contributes over $25 Million a year.
                                </Link>{' '}
                                They also own Cashbean, and OPay - both similar to OKash & OPesa. Their late-fee APR is
                                roughly 730% (2% per day).
                            </li>
                            <li>
                                &bull; After people started being vocal, they paid multiple news outlets to{' '}
                                <Link
                                    href="https://techcrunch.com/sponsor/opera/has-opera-secretly-incubated-one-of-the-hottest-brands-in-gaming-the-opera-gx-browser-just-crossed-the-20-million-mau-milestone/">
                                    shill their own software,
                                </Link>{' '}
                                and{' '}
                                <Link href="https://blogs.opera.com/security/2023/07/debunking-spyware-misinformation/">
                                    investigates themselves and found no wrong-doing. How convenient!
                                </Link>
                            </li>
                        </ul>
                    </AlertDescription>
                    <Divider className="my-2"/>
                    <AlertDescription>
                        You're free to continue, but bug reports WILL be rejected. Unlike some other sites, Packbase has
                        no safeguards to
                        stop Opera from injecting itself on the page - you chose to use this browser, so we won't stop
                        you.
                    </AlertDescription>
                    <Button className="w-full mt-2" color="orange" onClick={dismiss}>
                        Okay &mdash; Don't show again
                    </Button>
                </Alert>
            )
            // @ts-ignore
        } else if ((!isZen && !isChrome) || !navigator.userAgentData) {
            show(
                <Alert variant="destructive" className="max-w-md rounded-2xl!">
                    <AlertTitle>Your browser is not supported.</AlertTitle>
                    <AlertDescription>
                        Due to a multitude of visual quirks, we cannot fully support Gecko-based (excluding Zen and most of it's forks) and WebKit-based browsers. For the
                        best experience, please use a Chromium-based (or Zen) browser instead.
                    </AlertDescription>
                    <Divider className="my-2"/>
                    <AlertDescription>You're free to continue, but some specific bug reports may be rejected.</AlertDescription>
                    <Button className="w-full mt-2" color="orange" onClick={dismiss}>
                        Okay &mdash; Don't show again
                    </Button>
                </Alert>
            )
        }
    }, [])

    return <></>
}
