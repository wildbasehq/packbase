/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import React, {lazy, Suspense, useState} from 'react'
import {Theme, useThemes} from '@/lib/api/theme.ts'
import {Button} from '@/components/shared'
import {PencilIcon, PlusIcon, TrashIcon} from '@heroicons/react/24/outline'
import {CheckCircleIcon} from '@heroicons/react/24/solid'
import {Heading, Text} from '@/components/shared/text.tsx'

const ThemeEditor = lazy(() => import('@/components/layout/resource/pages/theme-editor.tsx'))

export default function TemplateSettings() {
    const {themes, loading, error, addTheme, updateTheme, deleteTheme} = useThemes()
    const [isEditorOpen, setIsEditorOpen] = useState(false)
    const [currentTheme, setCurrentTheme] = useState<Theme | null>(null)

    // Handle creating a new theme
    const handleCreateTheme = () => {
        setCurrentTheme({
            name: 'New Theme',
            html: '<div class="p-2 ring-1 ring-default rounded-lg">\n  <h1>My Profile</h1>\n  <p>Welcome to my page!</p>\n</div>',
            css: '/* Add your custom CSS here */',
            is_active: false,
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
        if (confirm('Are you sure you want to delete this theme?')) {
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
            await updateTheme(theme.id, {...theme, is_active: true})
        }
    }

    return (
        <div>
            <div className="border-b flex justify-between items-center pb-4 mb-4 border-n-5/10">
                <h1 className="font-bold text-[17px]">Themes</h1>
                <Button plain onClick={handleCreateTheme} className="!py-1 !-mt-1.5 mr-4">
                    <PlusIcon className="h-5 w-5 mr-2"/>
                    Create New Theme
                </Button>
            </div>

            {(() => {
                if (loading) {
                    return <div className="text-center py-8">Loading themes...</div>
                }

                if (error) {
                    return <div className="text-red-500 py-8">{error}</div>
                }

                if (themes.length === 0) {
                    return (
                        <div className="text-center py-8 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                            <p className="text-gray-500 dark:text-gray-400">No themes found. Create your first theme to
                                get started.</p>
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
                                            <PencilIcon className="h-4 w-4"/>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTheme(theme.id!)}
                                            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700"
                                            title="Delete theme"
                                        >
                                            <TrashIcon className="h-4 w-4"/>
                                        </button>
                                    </div>
                                </div>

                                {theme.is_active ? (
                                    <div className="flex items-center text-sm text-indigo-600 dark:text-indigo-400">
                                        <CheckCircleIcon className="h-4 w-4 mr-1"/>
                                        Active
                                    </div>
                                ) : (
                                    <Button outline={true} onClick={() => handleSetActive(theme)}
                                            className="text-xs mt-2">
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
                            {currentTheme.id ? `Edit Theme: ${currentTheme.name}` : 'Create New Theme'}
                        </Heading>
                        <Text alt>⚠️ Sorry this is so huge! This will be replaced in an inline editor the future.</Text>
                        <div className="pt-8 h-[calc(100vh-12rem)]">
                            <Suspense fallback={<div className="flex items-center justify-center h-full">Loading
                                editor...</div>}>
                                <ThemeEditor theme={currentTheme} onSave={handleSaveTheme}
                                             onCancel={() => setIsEditorOpen(false)}/>
                            </Suspense>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
