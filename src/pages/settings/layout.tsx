import React, {useEffect, useState} from 'react'
import {useUserAccountStore} from '@/lib/states'
import {usePostHog} from 'posthog-js/react'
import {EnvelopeIcon, EnvelopeOpenIcon, IdentificationIcon, SwatchIcon, TrophyIcon} from '@heroicons/react/16/solid'

// Import all settings pages
import ProfileSettings from './general/page'
import TemplateSettings from './template/page'
import InviteSettings from './invite/page'
import UnlockableSettings from './unlockables/page'
import AnonUserSettings from './anon-user/page'
import { Heading } from '@/components/shared/heading'
import { Text } from '@/components/shared/text'
import UserAvatar from '@/components/shared/user/avatar'

export type SettingsTab = {
    id: string
    name: string
    description?: string | React.ReactNode
    icon: React.ElementType
    badge?: string
}

const SettingsDialog: React.FC = () => {
    const { user } = useUserAccountStore()
    const [activeTab, setActiveTab] = useState<string>('profile')
    const posthog = usePostHog()

    // Define tabs based on user state
    const getTabs = (): SettingsTab[] => {
        if (!user || user?.anonUser) {
            return [
                {
                    id: 'invite',
                    name: 'Enter Invite',
                    description: '',
                    icon: EnvelopeIcon,
                },
            ]
        }

        const tabs = [
            {
                id: 'profile',
                name: 'Public Information',
                icon: IdentificationIcon,
            },
            {
                id: 'invite',
                name: 'Invite',
                description: 'Invite a friend to join the community',
                icon: EnvelopeOpenIcon,
            },
            {
                id: 'unlockables',
                name: 'Events',
                description: 'Invite your friends to join the community and unlock special rewards!',
                badge: 'Limited Event',
                icon: TrophyIcon,
            },
        ]

        // Conditionally add template tab based on feature flag
        if (posthog?.isFeatureEnabled('settings-html-editor')) {
            tabs.splice(1, 0, {
                id: 'template',
                name: 'Template',
                icon: SwatchIcon,
            })
        }

        return tabs
    }

    const tabs = getTabs()

    // Auto-select first tab when tabs change
    useEffect(() => {
        if (tabs.length > 0 && !tabs.find(tab => tab.id === activeTab)) {
            setActiveTab(tabs[0].id)
        }
    }, [tabs])

    // Render the appropriate content for the active tab
    const renderContent = () => {
        if (!user) return null

        if (user.anonUser) {
            return <AnonUserSettings />
        }

        switch (activeTab) {
            case 'profile':
                return <ProfileSettings />
            case 'template':
                return <TemplateSettings />
            case 'invite':
                return <InviteSettings />
            case 'unlockables':
                return <UnlockableSettings />
            default:
                return <ProfileSettings />
        }
    }

    return (
        <div className="flex flex-col sm:flex-row h-[750px] max-h-[85vh] w-[1100px] max-w-[95vw] overflow-hidden rounded-xl bg-white dark:bg-zinc-900 shadow-2xl">
            {/* Sidebar */}
            <div className="hidden sm:block flex-shrink-0 border-r w-[25%] bg-sidebar">
                <div className="flex flex-col h-full">
                    <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
                        <Heading className="text-lg font-medium">Settings</Heading>
                        <Text className="text-sm text-gray-500 dark:text-gray-400">Manage your account preferences</Text>
                    </div>

                    <nav className="flex-1 p-4 overflow-y-auto">
                        <ul className="space-y-1">
                            {tabs.map(tab => (
                                <li
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex flex-col rounded-md px-3 py-2 text-left text-sm font-medium ${
                                        activeTab === tab.id
                                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300'
                                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800'
                                    }`}
                                >
                                    <div onClick={() => setActiveTab(tab.id)} className="flex flex-row items-center">
                                        <tab.icon
                                            className={`h-5 w-5 mr-3 ${
                                                activeTab === tab.id ? 'text-indigo-500' : 'text-gray-400 dark:text-gray-500'
                                            }`}
                                        />
                                        <Text>{tab.name}</Text>

                                        {tab.badge && (
                                            <Text
                                                size="xs"
                                                className="ml-auto rounded-full bg-amber-100 px-2.5 py-0.5 font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                            >
                                                {tab.badge}
                                            </Text>
                                        )}
                                    </div>

                                    {tab.description && typeof tab.description !== 'string' && (
                                        <div className="mt-1 mb-3 ml-8">{tab.description}</div>
                                    )}

                                    {tab.description && typeof tab.description === 'string' && tab.description.length > 0 && (
                                        <Text size="xs" className="mt-1 ml-8 text-alt">
                                            {tab.description}
                                        </Text>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <div className="p-4 border-t border-gray-200 dark:border-zinc-800">
                        <div className="flex items-center">
                            <UserAvatar user={user} size="lg" />
                            <div className="ml-2">
                                <Text className="text-sm font-medium">{user?.display_name || user?.username || 'Anonymous User'}</Text>
                                <Text className="text-xs text-alt">{user?.anonUser ? 'Not registered yet' : `@${user?.username}`}</Text>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto">
                <div className="h-full">{renderContent()}</div>
            </div>
        </div>
    )
}

export default SettingsDialog