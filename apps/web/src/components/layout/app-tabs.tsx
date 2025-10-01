/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {ExpandableTabs} from '@/components/shared/expandable-tabs'
import {HomeIcon, MagnifyingGlassIcon, QuestionMarkCircleIcon} from '@heroicons/react/20/solid'

export function AppTabs({
                            tabs = [
                                {
                                    title: 'Your Nest',
                                    icon: HomeIcon,
                                    href: ['/', '', '/p/universe', '/p/universe/cosmos']
                                },
                                {type: 'search', icon: MagnifyingGlassIcon, href: '/search'},
                                {type: 'separator'},
                                // { title: 'Your Stuff', icon: FolderIcon, href: '/stuff' },
                                {title: 'Support', icon: QuestionMarkCircleIcon},
                            ],
                            className = '',
                        }) {

    return (
        <div className="flex flex-col gap-4 mx-auto">
            <ExpandableTabs tabs={tabs} className={className}/>
        </div>
    )
}
