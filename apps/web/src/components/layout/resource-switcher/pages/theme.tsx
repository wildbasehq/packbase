/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import { lazy, Suspense, useState } from 'react'
import { usePackThemes } from '@/lib/api/pack-theme.ts'
import { Button } from '@/components/shared/experimental-button-rework.tsx'
import { PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { Heading, Text } from '@/components/shared/text.tsx'
import Body from '@/components/layout/body.tsx'
import { useParams } from 'wouter'
import { useResourceStore } from '@/lib/state'
import { Theme } from '@/lib/api/theme.ts'

const ThemeEditor = lazy(() => import('@/components/layout/resource-switcher/pages/theme-editor.tsx'))

export default function ResourceSettingsTheme() {
    const { slug } = useParams<{ slug: string }>()
    const { currentResource } = useResourceStore()
    const packId = currentResource?.id || slug

    const { themes, loading, error, addTheme, updateTheme, deleteTheme } = usePackThemes(packId)
    const [isEditorOpen, setIsEditorOpen] = useState(false)
    const [currentTheme, setCurrentTheme] = useState<Theme | null>(null)

    // Handle creating a new theme
    const handleCreateTheme = () => {
        setCurrentTheme({
            pack_id: packId,
            name: 'New Pack Theme',
            html: '<div class="some-class p-4 ring-1 ring-default rounded-lg">\n\t<h1>Welcome to the jank editor!</h1>\n\t<p>Make something fun.</p>\n</div>\n',
            css: '/* Add your custom CSS here */\n.some-class {\n  /* Some styles for that HTML element */\n}',
            is_active: true,
        })
        setIsEditorOpen(true)
    }

    // Handle editing an existing theme
    const handleEditTheme = (theme: Theme) => {
        setCurrentTheme(theme)
        setIsEditorOpen(true)
    }

    // Handle deleting a theme
    const handleDeleteTheme = async (id: string) => {
        if (confirm('Are you sure you want to delete this pack theme?')) {
            await deleteTheme(id)
        }
    }

    // Handle saving a theme (create or update)
    const handleSaveTheme = async (theme: Theme) => {
        if (theme.id) {
            await updateTheme(theme.id, theme)
        } else {
            await addTheme(theme)
        }
        setIsEditorOpen(false)
    }

    // Handle setting a theme as active
    const handleSetActive = async (theme: Theme) => {
        if (theme.id) {
            await updateTheme(theme.id, { ...theme, is_active: true })
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6 mr-6">
                <div>
                    <Heading>Themes</Heading>
                    <Text alt>Manage this pack's look and feel</Text>
                </div>
                <Button onClick={handleCreateTheme}>
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Create New Theme
                </Button>
            </div>

            {(() => {
                if (loading) {
                    return <div className="text-center py-8">Loading pack themes...</div>
                }

                if (error) {
                    return <div className="text-red-500 py-8">{error}</div>
                }

                if (themes.length === 0) {
                    return (
                        <div className="text-center py-8 bg-muted rounded-lg">
                            <Heading alt className="mb-4">
                                No themes found. Create your first pack theme to get started.
                            </Heading>
                            <Text alt size="sm">
                                Pack themes allow you to customize the appearance of your pack for all members and visitors.
                            </Text>
                        </div>
                    )
                }

                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {themes.map(theme => (
                            <div
                                key={theme.id}
                                className={`p-4 rounded-lg border ${
                                    theme.is_active
                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                        : 'border-gray-200 dark:border-zinc-700'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-medium">{theme.name}</h3>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleEditTheme(theme)}
                                            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700"
                                            title="Edit theme"
                                        >
                                            <PencilIcon className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTheme(theme.id!)}
                                            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700"
                                            title="Delete theme"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="text-xs text-muted-foreground mb-3">
                                    {theme.created_at && <p>Created: {new Date(theme.created_at).toLocaleDateString()}</p>}
                                    {theme.updated_at && theme.updated_at !== theme.created_at && (
                                        <p>Updated: {new Date(theme.updated_at).toLocaleDateString()}</p>
                                    )}
                                </div>

                                {theme.is_active ? (
                                    <div className="flex items-center text-sm text-indigo-600 dark:text-indigo-400">
                                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                                        Active
                                    </div>
                                ) : (
                                    <Button outline={true} onClick={() => handleSetActive(theme)} className="text-xs mt-2">
                                        Set as active
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                )
            })()}

            {/* Fullscreen Theme Editor Dialog */}
            {isEditorOpen && currentTheme && (
                <div className="overflow-hidden bg-card flex flex-col !z-[10001] fixed inset-0 overflow-y-auto">
                    <div className="p-6 flex-1 overflow-auto">
                        <Heading className="text-xl mb-4">
                            {currentTheme.id ? `Edit Pack Theme: ${currentTheme.name}` : 'Create New Pack Theme'}
                        </Heading>
                        <Text alt>⚠️ Pack themes are visible to all pack members and visitors.</Text>
                        <div className="pt-8 h-[calc(100vh-12rem)]">
                            <Suspense fallback={<div className="flex items-center justify-center h-full">Loading editor...</div>}>
                                <ThemeEditor theme={currentTheme} onSave={handleSaveTheme} onCancel={() => setIsEditorOpen(false)} />
                            </Suspense>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
