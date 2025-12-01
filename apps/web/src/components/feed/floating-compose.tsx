/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

// src/components/feed/floating-compose-button.tsx
import {useResourceStore, useUIStore, useUserAccountStore} from '@/lib/state'
import UserAvatar from '@/components/shared/user/avatar'
import {Heading, Text} from '@/components/shared/text.tsx'
import {Badge, Editor, Field, Label, Listbox, ListboxLabel, ListboxOption, Textarea} from '@/src/components'
import {useParams} from 'wouter'
import {Activity, ReactNode, useEffect, useRef, useState} from 'react'
import {ArrowDownIcon, ChevronRightIcon, QuestionMarkCircleIcon} from '@heroicons/react/20/solid'
import {HashtagIcon} from '@heroicons/react/16/solid'
import {cn, isVisible, vg} from '@/src/lib'
import {Camera} from '../icons/plump/Camera'
import ImageUploadStack, {type Image} from './image-placeholder-stack'
import {motion} from 'motion/react'
import {toast} from 'sonner'
import ProgressBar from '../shared/progress-bar'
import Tooltip from "@/components/shared/tooltip.tsx";
import {useModal} from '@/components/modal/provider'
import {Button} from '@/components/shared/button'
import {ChatBubbleExclamation} from "@/components/icons/plump/chat-bubble-exclamation.tsx";
import {HardDisk} from "@/components/icons/plump";
import PackbaseInstance from "@/lib/workers/global-event-emit.ts";

export default function FloatingCompose() {
    const {user} = useUserAccountStore()
    const {navigation} = useUIStore()
    const {currentResource} = useResourceStore()
    const modal = useModal()

    let {channel} = useParams<{
        channel: string
    }>()

    const [channelName, setChannelName] = useState<string | null>(null)
    const [body, setBody] = useState<string>('')
    const [visible, setVisible] = useState(false)
    const [images, setImages] = useState<Image[]>([])
    const [uploading, setUploading] = useState<boolean>(false)
    const [uploadingTooLong, setUploadingTooLong] = useState<string | null>(null)
    const [selectedTags, setSelectedTags] = useState<string>('')
    const [selectedContentLabel, setSelectedContentLabel] = useState<string>('rating_safe')

    const fileInputRef = useRef<HTMLInputElement>(null)
    const floatingComposeRef = useRef<HTMLDivElement>(null)
    const hiddenComposeRef = useRef<HTMLDivElement>(null)
    const editorRef = useRef<any>(null)

    useEffect(() => {
        if (channel) {
            setChannelName(navigation.find(item => item.href.endsWith(channel))?.name)
        }
    }, [channel])

    useEffect(() => {
        let uploadingTimeout
        let heavyDelayTimeout
        let assumeWentWrongTimeout
        if (uploading) {
            uploadingTimeout = setTimeout(() => {
                setUploadingTooLong('Stillllll howlingggggg')
            }, 10000)
            heavyDelayTimeout = setTimeout(() => {
                setUploadingTooLong("Nice weather we're having")
            }, 20000)
            assumeWentWrongTimeout = setTimeout(() => {
                setUploadingTooLong(null)
                setUploading(false)
                setVisible(true)
                toast('The howl took way too long!', {
                    duration: Infinity,
                    description: "You can try again, but check in another tab if it worked first - I might've just lost track of it.",
                    action: {
                        label: 'Check',
                        onClick: () => {
                            window.open(window.location.href, '_blank')
                        },
                    },
                })
            }, 30000)
        } else {
            setUploadingTooLong(null)
        }
        return () => {
            clearTimeout(uploadingTimeout)
            clearTimeout(heavyDelayTimeout)
            clearTimeout(assumeWentWrongTimeout)
        }
    }, [uploading])

    const addAttachment = (files: FileList | null) => {
        if (files) {
            const newImages = []
            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                if (!file) {
                    toast.error(`File ${i + 1} failed to process!!!`)
                    continue
                }
                const reader = new FileReader()
                reader.onloadend = () => {
                    newImages.push({id: `${file.name}-${crypto.randomUUID()}`, src: reader.result as string})

                    if (i === files.length - 1) {
                        setImages([...images, ...newImages])
                        fileInputRef.current!.value = null
                    }
                }

                reader.readAsDataURL(file)
            }
        }
    }

    const submitHowl = () => {
        const post: {
            body: string
            content_type: string
            assets?: any[]
            tags?: string[]
        } = {
            body: body || null,
            content_type: 'markdown',
            tags: [selectedContentLabel, ...selectedTags.split(',').map(t => t.trim()).filter(Boolean)],
        }

        // @ts-ignore
        const assets = images?.map(attachment => {
            return {
                name: 'e',
                data: attachment.src,
            }
        })

        if (assets) {
            post.assets = assets
        }

        uploadHowl(post)
    }

    const uploadHowl = (post: any) => {
        post.tenant_id = currentResource.id
        post.channel_id = channel

        setUploading(true)
        setVisible(false)
        vg.howl.create
            .post(post)
            .then(({error}) => {
                if (error) {
                    setUploading(false)
                    setVisible(true)
                    toast.error(error.value ? `${error.status}: ${error.value.summary}` : 'A network error happened...')
                } else {
                    PackbaseInstance.emit('feed-reload', {})
                    setUploading(false)
                    setVisible(true)
                    setBody('')
                    setImages([])
                    setSelectedContentLabel('rating_safe')
                    setSelectedTags('')
                    editorRef.current?.destroy()
                }
            })
            .catch(error => {
                console.log(error)
                setUploading(false)
                setVisible(true)
                toast.error('Something went wrong')
            })
    }

    // Don't show if user is not logged in
    if (!user || user.anonUser) {
        return null
    }

    return (
        <div
            className="sticky group top-0 left-0 right-0 inset-x-0 z-40"
            onMouseEnter={() => {
                if (!uploading) setVisible(true)
            }}
            onMouseLeave={() => setVisible(false)}>
            <motion.div
                ref={floatingComposeRef}
                className={cn(
                    'w-full flex bg-card flex-col border mx-auto',
                    visible ? 'rounded-b-3xl shadow-sm' : 'rounded-b-none border-b-0'
                )}
                initial={true}
                animate={visible ? 'open' : 'closed'}
                variants={{
                    open: {
                        height: 'auto',
                        opacity: 1,
                        y: -1,
                    },
                    closed: {height: 0, opacity: 1, y: -8},
                }}
                onAnimationStart={() => {
                    if (!visible) {
                        floatingComposeRef.current!.style.overflow = 'hidden'
                        hiddenComposeRef.current!.style.display = 'flex'
                    }
                }}
                onAnimationComplete={() => {
                    if (visible) {
                        floatingComposeRef.current!.style.overflow = 'visible'
                    }
                }}
                transition={{
                    type: visible ? 'spring' : 'tween',
                    stiffness: 500,
                    damping: 30,
                    duration: 0.25,
                    ease: [0.16, 1, 0.3, 1],
                }}
                {...(visible ? {'aria-hidden': false} : {'aria-hidden': true})}
            >
                {/* Top small bar */}
                <div className="min-h-12 border-b flex items-center justify-between px-4">
                    {/*<Tooltip content="Manage storage" side="bottom">*/}
                    {/*    <div className="bg-muted rounded-full w-7 h-7 p-1.5 text-indigo-500" onClick={(e) => {*/}
                    {/*        e.stopPropagation()*/}
                    {/*        toast.error('"Your Stuff" is disabled by the instance owner.')*/}
                    {/*    }}>*/}
                    {/*        <HardDisk className="fill-muted-foreground w-full h-full"/>*/}
                    {/*    </div>*/}
                    {/*</Tooltip>*/}
                    <div className="flex items-center justify-center gap-2"/>
                    <div className="flex items-center gap-2">
                        <Activity mode={isVisible(!!channel)}>
                            <div className="flex items-center gap-1">
                                <UserAvatar user={currentResource} size={26} className="!rounded-full"/>
                                <ChevronRightIcon className="w-5 h-5 text-muted-foreground"/>
                                <Heading size="sm" className="flex justify-center items-center">
                                    <HashtagIcon className="w-4 h-4 inline-flex fill-muted-foreground"/>
                                    {channelName}
                                </Heading>
                            </div>
                        </Activity>

                        <Activity mode={isVisible(!channel)}>
                            <Heading size="sm">{currentResource.display_name}</Heading>
                        </Activity>
                    </div>
                    <Tooltip content={
                        <div className="flex flex-col gap-1">
                            <span className="gap-2">
                                Jump into Deep Compose
                            </span>
                            <span className="text-xs">
                                Create or Draft multiple Howls and Stories quickly on a dedicated page.
                            </span>
                            <div>
                                <Badge color="red">
                                    Experimental - may be unstable
                                </Badge>
                            </div>
                        </div>
                    } side="bottom">
                        <div className="bg-muted rounded-full w-7 h-7 p-1.5 text-indigo-500" onClick={(e) => {
                            e.stopPropagation()
                            toast.error('"Your Stuff" is disabled by the instance owner.')
                        }}>
                            <HardDisk className="fill-muted-foreground w-full h-full"/>
                        </div>
                    </Tooltip>
                </div>

                <div className="flex-grow p-4">
                    <Editor
                        onUpdate={e => {
                            editorRef.current = e
                            setBody(e?.storage.markdown.getMarkdown())
                        }}
                    />
                </div>

                {images.length > 0 && (
                    <div className="px-4 pb-2">
                        <ImageUploadStack images={images} setImages={setImages}/>
                    </div>
                )}

                {/* Bottom small bar */}
                <div className="h-12 flex items-center justify-between px-2">
                    {/* Button group */}
                    <div className="flex items-center gap-1">
                        <ComposeButton className="rounded-l-[0.85rem] rounded-r-sm"
                                       onClick={() => fileInputRef.current?.click()}>
                            <input
                                aria-hidden
                                className="hidden"
                                type="file"
                                ref={fileInputRef}
                                multiple
                                accept="image/*"
                                onChange={e => addAttachment(e.target.files)}
                            />
                            <Camera className="w-5 h-5 fill-primary-light p-0.5"/>
                        </ComposeButton>

                        {/* Post Settings Button */}
                        <ComposeButton
                            className="rounded-r-[0.85rem] rounded-l-sm"
                            onClick={() => {
                                modal?.show(
                                    <PostSettingsModal
                                        selectedTags={selectedTags}
                                        selectedContentLabel={selectedContentLabel}
                                        onClose={({tags, contentLabel}) => {
                                            setSelectedTags(tags)
                                            setSelectedContentLabel(contentLabel)
                                            modal.hide()
                                        }}
                                    />
                                )
                            }}
                        >
                            <ChatBubbleExclamation className="h-5 fill-primary-light"/>
                        </ComposeButton>
                    </div>
                    <ComposeButton
                        className="p-1 rounded-full"
                        onClick={() => {
                            submitHowl()
                        }}
                    >
                        <ArrowDownIcon className="w-5 h-5 fill-muted-foreground"/>
                    </ComposeButton>
                </div>
            </motion.div>

            {/* Cannot use <Activity>: It removes the component way to quick, causing it to re-hide itself.*/}
            {!visible && (
                <div
                    ref={hiddenComposeRef}
                    className={cn(
                        'h-8 relative w-full bg-card overflow-hidden flex-col border border-t-0 -mt-px rounded-b-3xl mx-auto shadow-sm items-center animate-slide-down-fade justify-center transition-all',
                        uploading ?? 'cursor-not-allowed'
                    )}
                    style={{display: 'none'}}
                >
                    <Activity mode={isVisible(!uploading)}>
                        <Text size="sm" alt className="italic">
                            Hover to howl{body ? `, ${body.trim().slice(0, 10)}` : ''}&hellip;
                        </Text>
                    </Activity>

                    <Activity mode={isVisible(uploading)}>
                        <Text size="sm" alt className="italic">
                            {uploadingTooLong || 'Howling'}&hellip;
                        </Text>

                        <ProgressBar indeterminate mask className="absolute bottom-0 rounded-none"/>
                    </Activity>
                </div>
            )}
        </div>
    )
}

function PostSettingsModal({
                               selectedTags,
                               selectedContentLabel,
                               onClose,
                           }: {
    selectedTags: string
    selectedContentLabel: string
    onClose: (options: {
        tags: string
        contentLabel: string
    }) => void
}) {
    const [selectedTagsState, setSelectedTagsState] = useState<string>(selectedTags)
    const [selectedContentLabelState, setSelectedContentLabelState] = useState<string>(selectedContentLabel)

    return (
        <div className="p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
                <Heading size="lg">
                    Content Labelling Settings
                </Heading>
            </div>

            <div className="space-y-4">
                <div>
                    <Text size="sm" className="mb-2">
                        Tags
                    </Text>
                    <Text size="xs" alt className="mb-2">
                        These tags help others find or filter your howl. Press enter to add a tag, or press backspace to
                        remove the last tag.
                    </Text>

                    <TagsInput
                        forcedTag={selectedContentLabelState}
                        value={selectedTagsState}
                        onChange={setSelectedTagsState}
                    />
                </div>

                <ContentLabelInput
                    value={selectedContentLabelState}
                    onChange={setSelectedContentLabelState}
                />

                <div className="flex justify-end gap-2 pt-4">
                    <Button onClick={() => {
                        onClose({
                            tags: selectedTagsState,
                            contentLabel: selectedContentLabelState
                        })
                    }}>
                        Done
                    </Button>
                </div>
            </div>
        </div>
    )
}

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
        e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>,
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

    const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
                    className="flex flex-wrap gap-2 p-2 border rounded-xl min-h-[2.5rem] items-center relative bg-transparent">
                    <Activity mode={isVisible(!!forcedTag)}>
                        <Tooltip content={(
                            <div className="flex flex-col gap-1">
                                <span>System tags are required to ensure content safety and moderation.</span>
                                <button
                                    className="cursor-pointer text-xs text-left !text-muted-foreground"
                                >
                                    System tags directly affect your howl's visibility. Learn More &rarr;
                                </button>
                            </div>
                        )}
                                 delayDuration={0}>
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
                                    "flex items-center gap-1 px-2 py-1 rounded-md text-sm",
                                    isValid ? "bg-indigo-500/10 text-indigo-500" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                )}
                            >
                                <Activity mode={isVisible(!isValid)}>
                                    <QuestionMarkCircleIcon className="w-4 h-4 mr-1"/>
                                </Activity>
                                <span>{tag}</span>
                                <button
                                    onClick={() => removeTag(tag)}
                                    className={cn(
                                        isValid ? "hover:text-indigo-500/70" : "hover:text-amber-600/70 dark:hover:text-amber-400/70"
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
                                            className="cursor-pointer text-xs text-left !text-muted-foreground"
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
                                                className="cursor-pointer text-xs text-left !text-muted-foreground"
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

            <Button plain className="h-6 !px-2 !py-1 rounded-sm !text-xs !text-muted-foreground"
                    onClick={() => setUsePlainEditor(!usePlainEditor)}>
                Switch to {usePlainEditor ? 'Rich Editor' : 'Plain Editor'} &rarr;
            </Button>
        </div>
    )
}

function ContentLabelInput({
                               value,
                               onChange
                           }: {
    value: string
    onChange: (v: string) => void
}) {
    const options = [
        {
            label: 'R18 - NSFW',
            value: 'rating_explicit'
        },
        {
            label: 'R18 - Suggestive',
            value: 'rating_suggestive'
        },
        {
            label: 'MA16 - Mature',
            value: 'rating_mature'
        },
        {
            label: 'G, PG, M - SFW',
            value: 'rating_safe'
        }
    ]
    return (
        <Field>
            <Label>Content Label</Label>
            <Listbox name="Rating"
                     defaultValue={options.find(option => option.value === (value.length ? value : 'rating_safe'))?.value || options[options.length - 1]}
                     onChange={onChange}>
                {options.map(option => (
                    <ListboxOption value={option.value}>
                        <ListboxLabel>{option.label}</ListboxLabel>
                    </ListboxOption>
                ))}
            </Listbox>
        </Field>
    )
}

function ComposeButton({onClick, children, className}: {
    onClick?: () => void;
    children: ReactNode;
    className?: string
}) {
    return (
        <button
            className={cn(
                'border py-1.5 px-4 ring-[0.05rem] flex justify-center items-center ring-default bg-card transition-all hover:bg-muted active:ring-2 active:bg-neutral-200 dark:active:bg-neutral-700',
                className
            )}
            onClick={onClick}
        >
            {children}
        </button>
    )
}
