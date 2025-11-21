import {WrenchScrewdriverIcon} from '@heroicons/react/20/solid'
import {Alert, AlertDescription, AlertTitle} from '@/components/shared/alert'
import {Button} from '@/components/shared'
import WrenchCharacter from '@/src/images/svg/wrench-character.svg'
import {ProjectSafeName} from "@/lib";

/**
 * Full-page maintenance screen used when the app is in maintenance mode.
 *
 * This mirrors the styling of the `FeedMaintenance` card, but is
 * presented as a standalone page instead of an in-feed card.
 */
export default function MaintenancePage() {
    // Retry every 30 seconds
    if (typeof window !== 'undefined') {
        setTimeout(() => window.location.reload(), 30000)
    }
    return (
        <div
            className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-neutral-50 via-neutral-50 to-neutral-100 px-4 py-10 dark:from-neutral-950 dark:via-neutral-950 dark:to-black">

            {/* Subtle grid texture */}
            <div aria-hidden="true"
                 className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.04)_1px,transparent_1px)] [background-size:18px_18px] dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_1px,transparent_1px)]"/>

            <Alert
                className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-neutral-200/60 bg-white/70 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] backdrop-blur-xl dark:border-neutral-800/60 dark:bg-neutral-900/70">
                {/* Gradient hairline divider */}
                <div aria-hidden="true"
                     className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-muted to-transparent"/>

                <AlertTitle
                    className="flex items-center justify-between gap-3 text-lg font-semibold">
                    <span className="inline-flex items-center gap-2">
                        <span
                            className="relative inline-flex h-8 w-8 items-center justify-center rounded-full ring-1 ring-default">
                            <WrenchScrewdriverIcon className="h-4 w-4 text-indigo-500"/>
                        </span>
                        <span>{ProjectSafeName} ain't available</span>
                    </span>
                </AlertTitle>

                <AlertDescription className="mt-4" aria-live="polite">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-5 md:items-center md:gap-10">
                        <div className="space-y-3 text-sm md:col-span-3">
                            <p className="text-foreground">
                                {ProjectSafeName} is currently undergoing an upgrade to
                                a newer major version. During this maintenance, we cannot accept or
                                process new data.
                            </p>

                            <p className="text-muted-foreground text-xs">
                                Thank you for your patience. We&apos;ll be back up and running shortly, promise!
                            </p>

                            <div className="flex flex-wrap gap-2 pt-1">
                                <Button href="https://discord.gg/StuuK55gYA" target="_blank">
                                    Join Discord
                                </Button>
                            </div>

                            <p className="text-muted-foreground text-xs">
                                &copy; {new Date().getFullYear()} ✱base. Last attempt
                                at {new Date().toLocaleString()}
                            </p>
                        </div>

                        <div className="relative flex justify-center md:col-span-2">
                            <img
                                src={WrenchCharacter}
                                alt="Maintenance character"
                                className="h-44 w-auto select-none drop-shadow-xl md:h-56"
                            />
                        </div>
                    </div>
                </AlertDescription>
            </Alert>
        </div>
    )
}
