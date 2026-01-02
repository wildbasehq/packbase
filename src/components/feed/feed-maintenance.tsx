// src/components/feed/FeedMaintenance.tsx
import { WrenchScrewdriverIcon } from '@heroicons/react/20/solid'
import { Alert, AlertDescription, AlertTitle } from '@/components/shared/alert'
import { Button } from '@/components/shared/experimental-button-rework'
import { FeedMaintenanceProps } from './types/feed'
import WrenchCharacter from '@/src/images/svg/wrench-character.svg'

/**
 * Displays a maintenance notice when the feed is unavailable
 */
export default function FeedMaintenance({ message }: FeedMaintenanceProps) {
    return (
        <div className="flex flex-col items-center justify-center py-10">
            <Alert className="max-w-2xl shadow-md">
                <AlertTitle className="flex items-center gap-2 text-neutral-800 dark:text-neutral-200">
                    <WrenchScrewdriverIcon className="h-5 w-5 text-neutral-600" />
                    Feed Maintenance
                </AlertTitle>

                <AlertDescription className="mt-2">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                        <div className="md:col-span-3">
                            <p className="text-sm text-neutral-700 dark:text-neutral-300">
                                The feed is currently under maintenance and can't be used. Please check again later!
                            </p>

                            {message && <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">{message}</p>}

                            <div className="mt-4">
                                <Button color="indigo" href="https://discord.gg/StuuK55gYA" target="_blank">
                                    Join Discord
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-center justify-center md:col-span-2">
                            <img src={WrenchCharacter} alt="Maintenance character" className="h-32 w-auto" />
                        </div>
                    </div>
                </AlertDescription>
            </Alert>
        </div>
    )
}
