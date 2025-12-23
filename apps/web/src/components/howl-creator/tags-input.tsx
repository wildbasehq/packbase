/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {HardDisk} from '@/components/icons/plump'
import {Button} from '@/components/shared/button'
import Tooltip from '@/components/shared/tooltip'
import {InputFieldClasses, Textarea} from '@/src/components'
import {cn, isVisible, vg} from '@/src/lib'
import {QuestionMarkCircleIcon} from '@heroicons/react/20/solid'
import {Activity, KeyboardEvent, useEffect, useRef, useState} from 'react'

export function TagsInput({
                              forcedTag,
                              value,
                              onChange
                          }: {
    value: string
    onChange: (v: string) => void
    forcedTag?: string
}) {
    const [usePlainEditor, setUsePlainEditor] = useState<boolean>(false)
    const [tagInput, setTagInput] = useState('')
    const [poofAnimations, setPoofAnimations] = useState<Record<string, { x: number, y: number }>>({})
    const [tagValidation, setTagValidation] = useState<Record<string, boolean>>({})
    const [tagSuggestions, setTagSuggestions] = useState<Record<string, string>>({})
    const inputRef = useRef<HTMLInputElement>(null)
    const tagRefs = useRef<Record<string, HTMLDivElement | null>>({})
    const tagInputUndo = useRef<string[]>([])
    const tagInputRedo = useRef<string[]>([])

    const getLevenshteinDistance = (a: string, b: string): number => {
        const matrix: number[][] = []

        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i]
        }

        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j
        }

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1]
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    )
                }
            }
        }

        return matrix[b.length][a.length]
    }

    const findClosestTag = async (invalidTag: string): Promise<string | null> => {
        try {
            const response = await vg.tags.get()
            const allTags = Array.isArray(response.data) ? response.data : []

            if (allTags.length === 0) return null

            let closestTag = allTags[0]
            let minDistance = getLevenshteinDistance(invalidTag, closestTag)

            for (const tag of allTags) {
                const distance = getLevenshteinDistance(invalidTag, tag)
                if (distance < minDistance) {
                    minDistance = distance
                    closestTag = tag
                }
            }

            // Only suggest if the distance is reasonable (not too different)
            return minDistance <= Math.max(3, invalidTag.length / 2) ? closestTag : null
        } catch (error) {
            console.error('Error finding closest tag:', error)
            return null
        }
    }

    useEffect(() => {
        const validateTags = async () => {
            const tags = (value || '').split(', ').filter(Boolean)
            const validationResults: Record<string, boolean> = {}
            const suggestions: Record<string, string> = {}

            for (const tag of tags) {
                const isValid = await getTagValid(tag)
                validationResults[tag] = isValid

                if (!isValid) {
                    const suggestion = await findClosestTag(tag)
                    if (suggestion) {
                        suggestions[tag] = suggestion
                    }
                }
            }

            setTagValidation(validationResults)
            setTagSuggestions(suggestions)
        }

        if (value) {
            validateTags()
        } else {
            setTagValidation({})
            setTagSuggestions({})
        }
    }, [value])

    // Shared sanitization: lowercase, allowed chars only, ensure ", " after commas,
    // convert spaces to underscores except immediately after commas.
    const sanitizeListText = (val: string) => {
        let s = (val || '').toLowerCase()
        s = s.replace(/[^a-z0-9_, ]+/g, '')
        s = s.replace(/,\s*/g, ', ')
        s = s.replace(/ /g, '_').replace(/,_/g, ', ')
        s = s.replace(/_+/g, '_')
        s = s.replace(/(?:,\s)+/g, ', ')
        return s
    }

    // Single tag sanitization: same rules, but commas are separators; strip them from a single tag.
    const sanitizeSingleTag = (val: string) => {
        return sanitizeListText(val).replace(/,/g, '')
    }

    // Backspace handler: if deleting the space after a comma, remove the comma too.
    const handleBackspaceCommaSpace = (
        e: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>,
        currentValue: string,
        setter: (v: string) => void
    ) => {
        if (e.key !== 'Backspace') return
        const target = e.currentTarget
        const pos = target.selectionStart ?? 0
        if (pos <= 0) return

        const before = currentValue.slice(0, pos)
        if (before.endsWith(' ') && before.length >= 2 && before[before.length - 2] === ',') {
            e.preventDefault()
            const newValue = before.slice(0, -2) + currentValue.slice(pos)
            const sanitized = sanitizeListText(newValue)
            setter(sanitized)
            requestAnimationFrame(() => {
                try {
                    const newCaret = (before.length - 2)
                    target.setSelectionRange(newCaret, newCaret)
                } catch (e) {
                    console.error('Failed to set selection range after backspace', e)
                }
            })
        }
    }

    const addTag = (tag: string) => {
        const cleaned = sanitizeSingleTag(tag).trim()
        if (!cleaned) {
            setTagInput('')
            return
        }
        const tagsArray = value ? value.split(', ').filter(Boolean) : []
        if (!tagsArray.includes(cleaned)) {
            const newTags = [...tagsArray, cleaned].join(', ')
            onChange(newTags)
        }
        if (tagInput) {
            tagInputUndo.current.push(tagInput)
            tagInputRedo.current = []
        }
        setTagInput('')
    }

    const removeTag = (tag: string) => {
        const tagElement = tagRefs.current[tag]
        if (tagElement && tagElement.parentElement) {
            const tagRect = tagElement.getBoundingClientRect()
            const containerRect = tagElement.parentElement.getBoundingClientRect()
            const x = tagRect.left - containerRect.left
            const y = tagRect.top - containerRect.top
            setPoofAnimations(prev => ({
                ...prev,
                [tag]: {x, y}
            }))
        }

        const tagsArray = (value || '').split(', ').filter(Boolean)
        const newTags = tagsArray.filter(t => t !== tag).join(', ')
        onChange(newTags)

        setTimeout(() => {
            setPoofAnimations(prev => {
                const newState = {...prev}
                delete newState[tag]
                return newState
            })
        }, 1000)
    }

    const handleTagInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
            e.preventDefault()
            if (e.shiftKey) {
                const redoVal = tagInputRedo.current.pop()
                if (redoVal !== undefined) {
                    tagInputUndo.current.push(tagInput)
                    setTagInput(redoVal)
                }
            } else {
                const undoVal = tagInputUndo.current.pop()
                if (undoVal !== undefined) {
                    tagInputRedo.current.push(tagInput)
                    setTagInput(undoVal)
                }
            }
            return
        }

        if (['Enter', ',', 'Tab'].includes(e.key) && tagInput.trim()) {
            e.preventDefault()
            addTag(tagInput.trim())
            return
        }
        if (e.key === 'Backspace' && !tagInput && value) {
            const tagsArray = value.split(', ').filter(Boolean)
            if (tagsArray.length > 0) {
                removeTag(tagsArray[tagsArray.length - 1])
            }
            return
        }
        handleBackspaceCommaSpace(e, tagInput, setTagInput)
    }

    const getTagValid = async (tag: string): Promise<boolean> => {
        // Use IndexedDB for cache, get from API if missing
        const DB_NAME = 'Packbase'
        const STORE_NAME = 'tags'

        // Open or create IndexedDB
        const openDB = (): Promise<IDBDatabase> => {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(DB_NAME)

                request.onerror = () => reject(request.error)
                request.onsuccess = () => resolve(request.result)

                request.onupgradeneeded = (event) => {
                    const db = (event.target as IDBOpenDBRequest).result
                    if (!db.objectStoreNames.contains(STORE_NAME)) {
                        const objectStore = db.createObjectStore(STORE_NAME, {keyPath: 'tag'})
                        objectStore.createIndex('timestamp', 'timestamp', {unique: false})
                    }
                }
            })
        }

        // Get cached value from IndexedDB
        const getCached = async (db: IDBDatabase, tag: string): Promise<{
            valid: boolean,
            timestamp: number
        } | null> => {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readonly')
                const store = transaction.objectStore(STORE_NAME)
                const request = store.get(tag)

                request.onerror = () => reject(request.error)
                request.onsuccess = () => resolve(request.result || null)
            })
        }

        // Set value in IndexedDB
        const setCached = async (db: IDBDatabase, tag: string, valid: boolean): Promise<void> => {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readwrite')
                const store = transaction.objectStore(STORE_NAME)
                const request = store.put({tag, valid, timestamp: Date.now()})

                request.onerror = () => reject(request.error)
                request.onsuccess = () => resolve()
            })
        }

        try {
            const db = await openDB()

            // Check cache first
            const cached = await getCached(db, tag)

            // Use cached value if it exists and is less than 24 hours old
            const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours
            if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
                db.close()
                return cached.valid
            }

            // Fetch all tags from API if not in cache or expired
            const response = await vg.tags.get()
            const allTags = Array.isArray(response.data) ? response.data : []
            const isValid = allTags.includes(tag)

            // Store in cache
            await setCached(db, tag, isValid)
            db.close()

            return isValid
        } catch (error) {
            console.error('Error validating tag:', error)
            // Fallback to API only if IndexedDB fails
            try {
                const response = await vg.tags.get()
                const allTags = Array.isArray(response.data) ? response.data : []
                return allTags.includes(tag)
            } catch (apiError) {
                console.error('API validation failed:', apiError)
                return false
            }
        }
    }

    // Forces a tag check
    useEffect(() => {
        getTagValid('dummy')
    }, [])

    return (
        <div className="relative">
            <Activity mode={isVisible(usePlainEditor)}>
                <Textarea
                    rows={6}
                    value={value}
                    onChange={e => {
                        const sanitized = sanitizeListText(e.target.value)
                        onChange(sanitized)
                    }}
                    onKeyDown={e => handleBackspaceCommaSpace(e, value, onChange)}
                    placeholder={value ? '' : 'Add tags...'}
                    className="w-full"
                />
            </Activity>

            <Activity mode={isVisible(!usePlainEditor)}>
                <div
                    className={cn('flex! flex-wrap gap-2 p-2 border rounded-xl min-h-[2.5rem] items-center relative', InputFieldClasses)}>
                    <Activity mode={isVisible(!!forcedTag)}>
                        <Tooltip content={(
                            <div className="flex flex-col gap-1">
                                <span>System tags are required to ensure content safety and moderation.</span>
                                <button
                                    className="cursor-pointer text-xs text-left text-muted-foreground!"
                                >
                                    System tags directly affect your howl's visibility. Learn More &rarr;
                                </button>
                            </div>
                        )}>
                            <div
                                className="flex items-center gap-1 bg-destructive/10 text-destructive px-2 py-1 rounded-md text-sm"
                            >
                                <HardDisk className="w-4 h-4 mr-1"/>
                                <span>{forcedTag || 'rating_safe'}</span>
                            </div>
                        </Tooltip>
                    </Activity>

                    {(value || '').split(', ').filter(Boolean).map(tag => {
                        const isValid = tagValidation[tag]
                        const suggestion = tagSuggestions[tag]

                        const tagElement = (
                            <div
                                key={tag}
                                // @ts-ignore
                                ref={el => tagRefs.current[tag] = el}
                                className={cn(
                                    'flex items-center gap-1 px-2 py-1 rounded-md text-sm',
                                    isValid ? 'bg-indigo-500/10 text-indigo-500' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                )}
                            >
                                <Activity mode={isVisible(!isValid)}>
                                    <QuestionMarkCircleIcon className="w-4 h-4 mr-1"/>
                                </Activity>
                                <span>{tag}</span>
                                <button
                                    onClick={() => removeTag(tag)}
                                    className={cn(
                                        isValid ? 'hover:text-indigo-500/70' : 'hover:text-amber-600/70 dark:hover:text-amber-400/70'
                                    )}
                                >
                                    ×
                                </button>
                            </div>
                        )

                        if (!isValid) {
                            return (
                                <Tooltip key={tag} content={(
                                    <div className="flex flex-col gap-1">
                                        <span>System doesn't know what {tag} is. It'll be queued for moderation.</span>
                                        <button
                                            className="cursor-pointer text-xs text-left text-muted-foreground!"
                                        >
                                            Learn More &rarr;
                                        </button>
                                        <Activity mode={isVisible(!!suggestion)}>
                                            <button
                                                onClick={() => {
                                                    const tagsArray = (value || '').split(', ').filter(Boolean)
                                                    const newTags = tagsArray.map(t => t === tag ? suggestion : t).join(', ')
                                                    onChange(newTags)
                                                }}
                                                className="cursor-pointer text-xs text-left text-muted-foreground!"
                                            >
                                                Did you mean {suggestion}?
                                            </button>
                                        </Activity>
                                    </div>
                                )} delayDuration={0}>
                                    {tagElement}
                                </Tooltip>
                            )
                        }

                        return tagElement
                    })}

                    {Object.entries(poofAnimations).map(([tag, pos]) => (
                        <div
                            key={`poof-${tag}`}
                            className="poof absolute"
                            style={{
                                left: `${pos.x}px`,
                                top: `${pos.y + 14}px`,
                                width: '32px',
                                height: '18px'
                            }}
                        />
                    ))}

                    <input
                        ref={inputRef}
                        type="text"
                        value={tagInput}
                        onChange={e => {
                            const sanitized = sanitizeSingleTag(e.target.value)
                            setTagInput(prev => {
                                if (prev !== sanitized) {
                                    tagInputUndo.current.push(prev)
                                    tagInputRedo.current = []
                                }
                                return sanitized
                            })
                        }}
                        onKeyDown={handleTagInputKeyDown}
                        placeholder={value ? '' : 'Add tags...'}
                        className="flex-1 outline-none bg-transparent min-w-[100px] text-sm"
                    />
                </div>
            </Activity>

            <Button plain className="h-6 px-2! py-1! rounded-sm text-xs! text-muted-foreground!"
                    onClick={() => setUsePlainEditor(!usePlainEditor)}>
                Switch to {usePlainEditor ? 'Rich Editor' : 'Plain Editor'} &rarr;
            </Button>
        </div>
    )
}
