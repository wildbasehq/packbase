/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

// src/components/feed/floating-compose-button.tsx
import { useResourceStore, useUIStore, useUserAccountStore } from '@/lib/state'
import UserAvatar from '@/components/shared/user/avatar'
import { Heading, Text } from '@/components/shared/text.tsx'
import { Editor } from '@/src/components'
import { useParams } from 'wouter'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { Invisible } from '../icons/plump/Invisible'
import { ChevronRightIcon, ArrowDownIcon } from '@heroicons/react/20/solid'
import Tooltip from '../shared/tooltip'
import { HashtagIcon } from '@heroicons/react/16/solid'
import { cn, vg } from '@/src/lib'
import { Camera } from '../icons/plump/Camera'
import ImageUploadStack, { type Image } from './image-placeholder-stack'
import { motion } from 'framer-motion'
import { CatSunglasses } from '../icons/plump/CatSunglasses'
import { toast } from 'sonner'
import ProgressBar from '../shared/progress-bar'
import { AlignLeft } from '../icons/plump/AlignLeft'
import { useLocalStorage } from 'usehooks-ts'
import { UserActionsContainer } from '../layout/user-sidebar'

export default function FloatingCompose({ onShouldFeedRefresh }: { onShouldFeedRefresh?: () => Promise<void> }) {
    const { user } = useUserAccountStore()
    const { navigation } = useUIStore()
    const { currentResource } = useResourceStore()

    let { channel } = useParams<{
        channel: string
    }>()

    const [channelName, setChannelName] = useState<string | null>(null)
    const [body, setBody] = useState<string>('')
    const [visible, setVisible] = useState(true)
    const [images, setImages] = useState<Image[]>([])
    const [uploading, setUploading] = useState<boolean>(false)
    const [uploadingTooLong, setUploadingTooLong] = useState<string | null>(null)
    const [userSidebarCollapsed, setUserSidebarCollapsed] = useLocalStorage<any>('user-sidebar-collapsed', false)

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
                    newImages.push({ id: `${file.name}-${crypto.randomUUID()}`, src: reader.result as string })

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
            .then(({ error }) => {
                if (error) {
                    setUploading(false)
                    setVisible(true)
                    return toast.error(error.value ? `${error.status}: ${error.value.summary}` : 'Something went wrong')
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
        <div className="sticky group top-0 left-0 right-0 inset-x-0 -mt-8 z-40">
            <motion.div
                ref={floatingComposeRef}
                className={cn(
                    'w-full flex bg-card flex-col border mx-auto',
                    visible ? 'rounded-b-xl shadow-sm' : 'rounded-b-none border-b-0'
                )}
                initial={false}
                animate={visible ? 'open' : 'closed'}
                variants={{
                    open: {
                        height: 'auto',
                        opacity: 1,
                        y: -1,
                    },
                    closed: { height: 0, opacity: 1, y: -8 },
                }}
                onAnimationStart={() => {
                    if (!visible) {
                        floatingComposeRef.current!.style.overflow = 'hidden'
                        hiddenComposeRef.current!.style.display = 'flex'
                    }
                }}
                onAnimationEnd={() => {
                    if (visible) {
                        floatingComposeRef.current!.style.overflow = 'visible'
                    }
                }}
                transition={{
                    type: visible ? 'spring' : 'ease',
                    stiffness: 500,
                    damping: 30,
                    duration: 0.25,
                    ease: [0.16, 1, 0.3, 1],
                }}
                {...(visible ? { 'aria-hidden': false } : { 'aria-hidden': true })}
            >
                {/* Top small bar */}
                <div className="min-h-12 border-b flex items-center justify-between px-4">
                    <Tooltip content="Hide" side="bottom">
                        <div className="bg-muted rounded-full w-7 h-7 p-1.5" onClick={() => setVisible(false)}>
                            <Invisible className="fill-muted-foreground w-full h-full" />
                        </div>
                    </Tooltip>
                    <div className="flex items-center gap-2">
                        {channel && (
                            <div className="flex items-center gap-1">
                                <UserAvatar user={currentResource} size={26} className="!rounded-full" />
                                <ChevronRightIcon className="w-5 h-5 text-muted-foreground" />
                                <Heading size="sm" className="flex justify-center items-center">
                                    <HashtagIcon className="w-4 h-4 inline-flex fill-muted-foreground" />
                                    {channelName}
                                </Heading>
                            </div>
                        )}

                        {!channel && <Heading size="sm">{currentResource.display_name}</Heading>}
                    </div>
                    <div className="flex items-center justify-center gap-2">
                        {userSidebarCollapsed && <UserActionsContainer />}
                        <AlignLeft className="w-7 h-7 fill-indigo-600" onClick={() => setUserSidebarCollapsed(!userSidebarCollapsed)} />
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
                        <ImageUploadStack images={images} setImages={setImages} />
                    </div>
                )}

                {/* Bottom small bar */}
                <div className="h-12 flex items-center justify-between px-2">
                    {/* Button group */}
                    <div className="flex items-center gap-1">
                        <ComposeButton className="rounded-l-[0.85rem] rounded-r-sm" onClick={() => fileInputRef.current?.click()}>
                            <input
                                aria-hidden
                                className="hidden"
                                type="file"
                                ref={fileInputRef}
                                multiple
                                accept="image/*"
                                onChange={e => addAttachment(e.target.files)}
                            />
                            <Camera className="w-5 h-5 fill-primary-light p-0.5" />
                        </ComposeButton>

                        <ComposeButton className="rounded-r-[0.85rem] rounded-l-sm">
                            <CatSunglasses className="h-5 fill-primary-light" />
                        </ComposeButton>
                    </div>
                    <ComposeButton
                        className="p-1"
                        onClick={() => {
                            submitHowl()
                        }}
                    >
                        <ArrowDownIcon className="w-5 h-5 fill-muted-foreground" />
                    </ComposeButton>
                </div>
            </motion.div>

            {!visible && (
                <div
                    ref={hiddenComposeRef}
                    className={cn(
                        'relative w-full h-6 bg-card overflow-hidden flex-col border border-t-0 -mt-px rounded-b mx-auto shadow-sm items-center animate-slide-down-fade justify-center transition-all',
                        uploading ? 'h-8 cursor-not-allowed' : 'h-6 group-hover:h-8'
                    )}
                    style={{ display: 'none' }}
                    onClick={() => {
                        if (!uploading) setVisible(true)
                    }}
                >
                    {uploading && (
                        <Text size="sm" alt className="italic">
                            {uploadingTooLong || 'Howling'}&hellip;
                        </Text>
                    )}

                    {!uploading && (
                        <>
                            <Text size="sm" alt className="italic group-hover:hidden">
                                hidden{body ? `, ${body.trim().slice(0, 10)}` : ''}&hellip;
                            </Text>
                            <Text size="sm" alt className="hidden group-hover:block">
                                &darr; Click to show howl composer &darr;
                            </Text>
                        </>
                    )}
                    {uploading && <ProgressBar indeterminate={true} className="absolute bottom-0 rounded-none" />}
                </div>
            )}
        </div>
    )
}

function ComposeButton({ onClick, children, className }: { onClick?: () => void; children: React.ReactNode; className?: string }) {
    return (
        <button
            className={cn(
                'border rounded-full py-1.5 px-4 ring-[0.05rem] flex justify-center items-center ring-default bg-card transition-all hover:bg-muted active:ring-2 active:bg-neutral-200 dark:active:bg-neutral-700',
                className
            )}
            onClick={onClick}
        >
            {children}
        </button>
    )
}
