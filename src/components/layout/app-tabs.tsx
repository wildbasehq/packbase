import { ExpandableTabs } from '@/components/shared/expandable-tabs'
import { FolderIcon, HomeIcon, MagnifyingGlassIcon, PlusCircleIcon } from '@heroicons/react/20/solid'
import { useModal } from '@/components/modal/provider.tsx'
import { HowlCard } from '@/src/components'
import { useResourceStore, useUserAccountStore } from '@/lib'
import Card from '@/components/shared/card'
import { Heading, Text } from '@/components/shared/text'
import { Button } from '@/components/shared/experimental-button-rework'

export function AppTabs() {
    const tabs = [
        { title: 'Your Nest', icon: HomeIcon, href: ['/p/universe', '/p/universe/cosmos'] },
        { type: 'search', icon: MagnifyingGlassIcon, href: '/search' },
        { type: 'separator' },
        { title: 'Your Stuff', icon: FolderIcon, href: '/stuff' },
        // { title: 'Support', icon: QuestionMarkCircleIcon },
        { title: 'New Howl', icon: PlusCircleIcon },
    ]

    const { user } = useUserAccountStore()
    const { currentResource } = useResourceStore()
    const { show, hide } = useModal()

    const onChange = (tab: number) => {
        // Handle if its "New Howl", assume its just a click and not a navigation
        if (tab === 4) {
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
    }

    return (
        <div className="flex flex-col gap-4 mx-auto">
            <ExpandableTabs tabs={tabs} onChange={onChange} />
        </div>
    )
}
