/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

// src/components/feed/floating-compose-button.tsx
import { PlusIcon } from '@heroicons/react/24/outline'
import { useResourceStore, useUserAccountStore } from '@/lib/state'
import UserAvatar from '@/components/shared/user/avatar'
import { useModal } from '@/components/modal/provider.tsx'
import Card from '@/components/shared/card.tsx'
import { Heading, Text } from '@/components/shared/text.tsx'
import { Button, HowlCard } from '@/src/components'

export default function FloatingComposeButton() {
    const { user } = useUserAccountStore()
    const { show, hide } = useModal()
    const { currentResource } = useResourceStore()

    const handleClick = () => {
        console.log('Opening creator dialog...')
        if (user.reqOnboard || currentResource.temporary) {
            show(
                <Card>
                    <Heading size="xl" className="mb-2 pb-3 border-b">
                        ⚠️ You can't howl right now
                    </Heading>
                    <Text>
                        {user.reqOnboard
                            ? 'You need to create a profile first! Complete the onboarding then try again.'
                            : 'You have to join this pack first to howl into it.'}
                    </Text>

                    <Button outline className="mt-3" onClick={hide}>
                        Alright
                    </Button>
                </Card>
            )
        } else {
            show(<HowlCard />)
        }
    }

    // Don't show if user is not logged in
    if (!user || user.anonUser) {
        return null
    }

    return (
        <div className="fixed bottom-0 inset-x-0 md:ml-96 z-40 pointer-events-none">
            <div className="max-w-2xl mx-auto p-4">
                <button
                    onClick={handleClick}
                    className="pointer-events-auto w-full bg-sidebar backdrop-blur-xl border rounded shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] p-4 flex items-center gap-3 group"
                >
                    <div className="flex-shrink-0">
                        <UserAvatar user={user} size="sm" className="rounded-full" />
                    </div>
                    <span className="text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors text-left">
                        Start a new thread{currentResource.standalone ? '' : ' in ' + currentResource.display_name}...
                    </span>
                    <div className="ml-auto flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 hover:bg-indigo-600 flex items-center justify-center transition-colors">
                        <PlusIcon className="w-5 h-5 text-white" />
                    </div>
                </button>
            </div>
        </div>
    )
}
