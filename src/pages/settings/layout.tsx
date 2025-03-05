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

export type SettingsTab = {
    id: string;
    name: string;
    description?: string | React.ReactNode;
    icon: React.ElementType;
    badge?: string;
};

const SettingsDialog: React.FC = () => {
    const {user} = useUserAccountStore()
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
                }
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
            }
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
            return <AnonUserSettings/>
        }

        switch (activeTab) {
            case 'profile':
                return <ProfileSettings/>
            case 'template':
                return <TemplateSettings/>
            case 'invite':
                return <InviteSettings/>
            case 'unlockables':
                return <UnlockableSettings/>
            default:
                return <ProfileSettings/>
        }
    }

    return (
        <div className="flex h-[750px] max-h-[85vh] w-[1100px] max-w-[95vw] overflow-hidden rounded-xl bg-white dark:bg-zinc-900 shadow-2xl">
            {/* Sidebar */}
            <div className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950">
                <div className="flex h-full flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Settings</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage your account preferences</p>
                    </div>

                    <nav className="flex-1 overflow-y-auto p-4">
                        <ul className="space-y-1">
                            {tabs.map((tab) => (
                                <li key={tab.id}>
                                    <button
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center rounded-md px-3 py-2 text-left text-sm font-medium ${
                                            activeTab === tab.id
                                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                                                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800'
                                        }`}
                                    >
                                        <tab.icon className={`h-5 w-5 mr-3 ${
                                            activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'
                                        }`}/>
                                        <span>{tab.name}</span>

                                        {tab.badge && (
                                            <span
                                                className="ml-auto rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                        {tab.badge}
                      </span>
                                        )}
                                    </button>

                                    {tab.description && typeof tab.description !== 'string' && (
                                        <div className="ml-8 mt-1 mb-3">{tab.description}</div>
                                    )}

                                    {tab.description && typeof tab.description === 'string' && tab.description.length > 0 && (
                                        <p className="ml-8 mt-1 text-xs text-gray-500 dark:text-gray-400">{tab.description}</p>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <div className="border-t border-gray-200 dark:border-zinc-800 p-4">
                        <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                                {user?.display_name?.[0] || user?.username?.[0] || '?'}
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {user?.display_name || user?.username || 'Anonymous User'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {user?.anonUser ? 'Not registered yet' : `@${user?.username}`}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto">
                <div className="h-full">
                    {renderContent()}
                </div>
            </div>
        </div>
    )
}

export default SettingsDialog