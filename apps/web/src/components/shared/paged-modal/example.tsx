import React from 'react'
import PagedModal from './index'
import { Text } from '@/components/shared/text'
import { Heading } from '@/components/shared/heading'
import { BellIcon, CogIcon, HomeIcon, UserIcon } from '@heroicons/react/24/outline'

/**
 * Example usage of the PagedModal component
 *
 * This example demonstrates how to use the PagedModal component with:
 * - Custom header
 * - Custom footer
 * - Multiple pages with icons, titles, and descriptions
 */
const PagedModalExample: React.FC = () => {
    // Custom header component
    const CustomHeader = (
        <div>
            <Heading className="text-lg font-medium">My Application</Heading>
            <Text className="text-sm text-gray-500 dark:text-gray-400">Configure your settings</Text>
        </div>
    )

    // Custom footer component
    const CustomFooter = (
        <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                <UserIcon className="h-5 w-5" />
            </div>
            <div className="ml-2">
                <Text className="text-sm font-medium">John Doe</Text>
                <Text className="text-xs text-alt">@johndoe</Text>
            </div>
        </div>
    )

    return (
        <PagedModal header={CustomHeader} footer={CustomFooter}>
            <PagedModal.Page title="Home" icon={HomeIcon} description="Dashboard and overview">
                <div className="p-6">
                    <Heading>Home Page</Heading>
                    <Text className="mt-2">This is the home page content.</Text>
                </div>
            </PagedModal.Page>

            <PagedModal.Page title="Settings" icon={CogIcon} description="Configure your application settings">
                <div className="p-6">
                    <Heading>Settings Page</Heading>
                    <Text className="mt-2">This is the settings page content.</Text>

                    <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <Text className="font-medium">Application Settings</Text>
                        <div className="mt-2 space-y-2">
                            <div className="flex items-center">
                                <input type="checkbox" id="notifications" className="mr-2" />
                                <label htmlFor="notifications">Enable notifications</label>
                            </div>
                            <div className="flex items-center">
                                <input type="checkbox" id="darkMode" className="mr-2" />
                                <label htmlFor="darkMode">Dark mode</label>
                            </div>
                        </div>
                    </div>
                </div>
            </PagedModal.Page>

            <PagedModal.Page title="Profile" icon={UserIcon} description="Manage your profile information">
                <div className="p-6">
                    <Heading>Profile Page</Heading>
                    <Text className="mt-2">This is the profile page content.</Text>

                    <div className="mt-4">
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Name</label>
                            <input
                                type="text"
                                className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                                placeholder="John Doe"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <input
                                type="email"
                                className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                                placeholder="john@example.com"
                            />
                        </div>
                    </div>
                </div>
            </PagedModal.Page>

            <PagedModal.Page title="Notifications" icon={BellIcon} description="Manage your notification preferences" badge="New">
                <div className="p-6">
                    <Heading>Notifications Page</Heading>
                    <Text className="mt-2">This is the notifications page content.</Text>

                    <div className="mt-4 space-y-4">
                        <div className="p-3 border rounded-md dark:border-gray-700">
                            <div className="flex justify-between items-center">
                                <div>
                                    <Text className="font-medium">System Update</Text>
                                    <Text className="text-sm text-gray-500">A new system update is available</Text>
                                </div>
                                <div className="text-xs text-gray-500">2 hours ago</div>
                            </div>
                        </div>

                        <div className="p-3 border rounded-md dark:border-gray-700">
                            <div className="flex justify-between items-center">
                                <div>
                                    <Text className="font-medium">New Message</Text>
                                    <Text className="text-sm text-gray-500">You have a new message from Jane</Text>
                                </div>
                                <div className="text-xs text-gray-500">Yesterday</div>
                            </div>
                        </div>
                    </div>
                </div>
            </PagedModal.Page>
        </PagedModal>
    )
}

export default PagedModalExample
