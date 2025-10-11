/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

// src/components/feed/floating-compose-button.tsx
import {useResourceStore, useUIStore, useUserAccountStore} from '@/lib/state'
import UserAvatar from '@/components/shared/user/avatar'
import {Heading, Text} from '@/components/shared/text.tsx'
import {Editor} from '@/src/components'
import {useParams} from 'wouter'
import {Activity, ReactNode, useEffect, useRef, useState} from 'react'
import {ArrowDownIcon, ChevronRightIcon} from '@heroicons/react/20/solid'
import {HashtagIcon} from '@heroicons/react/16/solid'
import {cn, isVisible, vg} from '@/src/lib'
import {Camera} from '../icons/plump/Camera'
import ImageUploadStack, {type Image} from './image-placeholder-stack'
import {motion} from 'motion/react'
import {toast} from 'sonner'
import ProgressBar from '../shared/progress-bar'
import {AlignLeft} from '../icons/plump/AlignLeft'
import {useLocalStorage} from 'usehooks-ts'
import {UserActionsContainer} from '../layout/user-sidebar'
import Tooltip from "@/components/shared/tooltip.tsx";
import {Folder} from "lucide-react";
import Link from "@/components/shared/link.tsx";
import {useModal} from '@/components/modal/provider'
import {Button} from '@/components/shared/button'
import {ChatBubbleExclamation} from "@/components/icons/plump/chat-bubble-exclamation.tsx";
import {Input} from "@/components/shared/input/text.tsx";

export default function FloatingCompose({onShouldFeedRefresh}: { onShouldFeedRefresh?: () => Promise<void> }) {
    const {user} = useUserAccountStore()
    const {navigation} = useUIStore()
    const {currentResource} = useResourceStore()
    const modal = useModal()

    let {channel} = useParams<{
        channel: string
    }>()

    const [channelName, setChannelName] = useState<string | null>(null)
    const [body, setBody] = useState<string>('')
    const [visible, setVisible] = useState(true)
    const [images, setImages] = useState<Image[]>([])
    const [uploading, setUploading] = useState<boolean>(false)
    const [uploadingTooLong, setUploadingTooLong] = useState<string | null>(null)
    const [userSidebarCollapsed, setUserSidebarCollapsed] = useLocalStorage<any>('user-sidebar-collapsed', false)
    const [selectedTags, setSelectedTags] = useState<string>('')

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
        } = {
            body: body || null,
            content_type: 'markdown',
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
                    onShouldFeedRefresh?.().then(() => {
                        setUploading(false)
                        setVisible(true)
                        setBody('')
                        setImages([])
                        editorRef.current?.destroy()
                    })
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
                initial={false}
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
                    <Tooltip content="Hide" side="bottom">
                        <Link className="bg-muted rounded-full w-7 h-7 p-1.5" href="/stuff">
                            <Folder className="fill-muted-foreground w-full h-full"/>
                        </Link>
                    </Tooltip>
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
                    <div className="flex items-center justify-center gap-2">
                        {userSidebarCollapsed && <UserActionsContainer/>}
                        <AlignLeft className="w-7 h-7 fill-indigo-600"
                                   onClick={() => setUserSidebarCollapsed(!userSidebarCollapsed)}/>
                    </div>
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
                                        onClose={(tags) => {
                                            setSelectedTags(tags)
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
                               onClose,
                           }: {
    selectedTags: string
    onClose: (tags: string) => void
}) {
    const [selectedTagsState, setSelectedTagsState] = useState<string>(selectedTags)
    const [tagInput, setTagInput] = useState('')
    const [poofAnimations, setPoofAnimations] = useState<Record<string, { x: number, y: number }>>({})
    const [usePlainEditor, setUsePlainEditor] = useState<boolean>(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const tagRefs = useRef<Record<string, HTMLDivElement | null>>({})

    const addTag = (tag: string) => {
        const tagsArray = selectedTagsState ? selectedTagsState.split(', ').filter(Boolean) : []
        if (!tagsArray.includes(tag)) {
            const newTags = [...tagsArray, tag].join(',')
            setSelectedTagsState(newTags)
        }
        setTagInput('')
    }

    const removeTag = (tag: string) => {
        // Get the position of the tag element
        const tagElement = tagRefs.current[tag]
        if (tagElement && tagElement.parentElement) {
            const tagRect = tagElement.getBoundingClientRect()
            const containerRect = tagElement.parentElement.getBoundingClientRect()

            // Calculate position relative to container
            const x = tagRect.left - containerRect.left
            const y = tagRect.top - containerRect.top

            setPoofAnimations(prev => ({
                ...prev,
                [tag]: {x, y}
            }))
        }

        // Remove the tag immediately
        const tagsArray = selectedTagsState.split(', ').filter(Boolean)
        const newTags = tagsArray.filter(t => t !== tag).join(',')
        setSelectedTagsState(newTags)

        // Remove poof animation after ~1 second
        setTimeout(() => {
            setPoofAnimations(prev => {
                const newState = {...prev}
                delete newState[tag]
                return newState
            })
        }, 1000)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (['Enter', ',', 'Tab'].includes(e.key) && tagInput.trim()) {
            e.preventDefault()
            if (tagInput.trim()) {
                addTag(tagInput.trim())
            }
        } else if (e.key === 'Backspace' && !tagInput && selectedTagsState) {
            const tagsArray = selectedTagsState.split(',').filter(Boolean)
            if (tagsArray.length > 0) {
                removeTag(tagsArray[tagsArray.length - 1])
            }
        }
    }

    return (
        <div className="p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
                <Heading size="lg">
                    Content Labelling Settings
                </Heading>
            </div>

            <div className="space-y-4">
                <div>
                    <Text size="sm" className="mb-2 font-medium">
                        Tags
                    </Text>
                    <Text size="xs" alt className="mb-2">
                        These tags help others find or filter your howl. Press enter to add a tag, or press backspace to
                        remove the last tag.
                    </Text>
                    <div className="relative">
                        <Activity mode={isVisible(usePlainEditor)}>
                            <Input type="text"
                                   value={selectedTagsState}
                                   onChange={e => setSelectedTagsState(e.target.value)}
                                // onKeyDown={handleKeyDown}
                                   placeholder={!selectedTagsState ? 'Add tags...' : ''}
                                   className="w-full"
                            />
                        </Activity>

                        <Activity mode={isVisible(!usePlainEditor)}>
                            <div
                                className="flex flex-wrap gap-2 p-2 border rounded-xl bg-background min-h-[2.5rem] items-center relative">
                                {selectedTagsState.split(',').filter(Boolean).map(tag => (
                                    <div
                                        key={tag}
                                        // @ts-ignore
                                        ref={el => tagRefs.current[tag] = el}
                                        className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm"
                                    >
                                        <span>{tag}</span>
                                        <button
                                            onClick={() => removeTag(tag)}
                                            className="hover:text-primary/70"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}

                                {/* Render poof animations on top */}
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
                                        setTagInput(e.target.value)
                                    }}
                                    onKeyDown={handleKeyDown}
                                    placeholder={!selectedTagsState ? 'Add tags...' : ''}
                                    className="flex-1 outline-none bg-transparent min-w-[100px] text-sm"
                                />
                            </div>
                        </Activity>

                        <Button plain className="h-6 !px-2 !py-1 rounded-sm !text-xs !text-muted-foreground"
                                onClick={() => setUsePlainEditor(!usePlainEditor)}>
                            Plain Editor &rarr;
                        </Button>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button onClick={() => {
                        onClose(selectedTagsState)
                    }}>
                        Done
                    </Button>
                </div>
            </div>
        </div>
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
