import { ExpandableTabs } from '@/components/shared/expandable-tabs'
import { FolderIcon, HomeIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid'

export function AppTabs() {
    const tabs = [
        { title: 'Your Nest', icon: HomeIcon, href: ['/p/universe', '/p/universe/cosmos'] },
        { type: 'search', icon: MagnifyingGlassIcon, href: '/search' },
        { type: 'separator' },
        { title: 'Your Stuff', icon: FolderIcon, href: '/stuff' },
        // { title: 'Support', icon: QuestionMarkCircleIcon },
        // { title: 'New Howl', icon: PlusCircleIcon },
    ]

    return (
        <div className="flex flex-col gap-4 mx-auto">
            <ExpandableTabs tabs={tabs} />
        </div>
    )
}
