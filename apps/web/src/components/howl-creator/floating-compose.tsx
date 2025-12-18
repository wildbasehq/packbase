/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

// src/components/howl-creator/floating-compose.tsx
import {useResourceStore, useUIStore, useUserAccountStore} from '@/lib/state'
import {useLocation} from 'wouter'
import {Activity, ReactNode, useEffect, useRef, useState} from 'react'
import {ArrowDownIcon, PlusIcon} from '@heroicons/react/20/solid'
import {cn, isVisible, vg} from '@/src/lib'
import ImageUploadStack, {type Image} from '../feed/image-placeholder-stack'
import {toast} from 'sonner'
import {useModal} from '@/components/modal/provider'
import PackbaseInstance from '@/lib/workers/global-event-emit.ts'
import {
    Avatar,
    Badge,
    BubblePopover,
    Editor,
    Heading,
    LoadingCircle,
    Logo,
    PopoverHeader,
    Text
} from "@/src/components";
import {ChevronRightIcon} from "@heroicons/react/24/outline";
import Tooltip from "@/components/shared/tooltip.tsx";
import {Camera, HardDisk} from "@/components/icons/plump";
import {HashtagIcon} from "@heroicons/react/16/solid";
import PostSettingsModal from "@/components/howl-creator/post-settings-modal.tsx";
import {ChatBubbleExclamation} from "@/components/icons/plump/chat-bubble-exclamation.tsx";
import getInitials from "@/lib/utils/get-initials.ts";


export type AvailablePagesType = 'editor' | 'content-labelling' | 'mature-rating-from-sfw-warning'

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

export default function FloatingCompose() {
    const {user} = useUserAccountStore()
    const {navigation} = useUIStore()
    const {currentResource} = useResourceStore()
    const modal = useModal()

    // Get channel ID from url, i.e. /p/pack/channel/
    // Cannot use useParams here because this component is outside of router context
    const [location] = useLocation()
    const channel = location.split('/')[3] || undefined

    // Page state
    const [currentPage, setCurrentPage] = useState<AvailablePagesType>('editor')

    const [channelName, setChannelName] = useState<string | null>(null)
    const [body, setBody] = useState<string>('')
    const [images, setImages] = useState<Image[]>([])
    const [uploading, setUploading] = useState<boolean>(false)
    const [selectedTags, setSelectedTags] = useState<string>('')
    const [selectedContentLabel, setSelectedContentLabel] = useState<string>('rating_safe')

    const fileInputRef = useRef<HTMLInputElement>(null)
    const editorRef = useRef<any>(null)

    useEffect(() => {
        console.log(channel, location.split('/'))
        if (channel) {
            setChannelName(navigation.find(item => item.href.endsWith(channel))?.name)
        }
    }, [location, channel])

    useEffect(() => {
        let uploadingTimeout
        let heavyDelayTimeout
        let assumeWentWrongTimeout
        if (uploading) {
            assumeWentWrongTimeout = setTimeout(() => {
                setUploading(false)
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
                    newImages?.push({id: `${file.name}-${crypto.randomUUID()}`, src: reader.result as string})

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
        vg.howl.create
            .post(post)
            .then(({error}) => {
                if (error) {
                    setUploading(false)
                    toast.error(error.value ? `${error.status}: ${error.value.summary}` : 'A network error happened...')
                } else {
                    PackbaseInstance.emit('feed-reload', {})
                    setUploading(false)
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
                toast.error('Something went wrong')
            })
    }

    // Don't show if user is not logged in
    if (!user || user.anonUser) {
        return null
    }

    return (
        <div className="flex z-40 fixed bottom-24 sm:bottom-8 right-8">
            <BubblePopover id="howl-creator"
                           className="p-0 w-lg max-h-[calc(100vh-3.75rem)]"
                           custom={currentPage}
                           animateKey={currentPage}
                           corner="bottom-right" trigger={
                ({setOpen}) => (
                    <div
                        className="pointer-events-auto z-40 flex shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)] h-14 w-14 items-center justify-center rounded-full border bg-indigo-500 transition-transform hover:bg-indigo-400 active:scale-[1.02] md:active:scale-[0.98]"
                        onClick={() => {
                            if (uploading) return
                            setOpen(true)
                        }}
                    >
                        <PlusIcon className="h-6 w-6 text-white"/>
                    </div>
                )
            } isCentered={false}>
                <Activity mode={isVisible(currentPage === 'editor')}>
                    <FloatingComposeContent
                        channel={channel}
                        channelName={channelName}
                        currentResource={currentResource}
                        images={images}
                        setImages={setImages}
                        editorRef={editorRef}
                        body={body}
                        setBody={setBody}
                        fileInputRef={fileInputRef}
                        addAttachment={addAttachment}
                        submitHowl={submitHowl}
                        setCurrentPage={setCurrentPage}
                        uploading={uploading}
                    />
                </Activity>

                <Activity mode={isVisible(currentPage === 'content-labelling')}>
                    <PostSettingsModal selectedTags={selectedTags}
                                       selectedContentLabel={selectedContentLabel}
                                       onClose={({tags, contentLabel, toPage = 'editor'}) => {
                                           setSelectedTags(tags)
                                           setSelectedContentLabel(contentLabel)
                                           setCurrentPage(toPage)
                                       }}/>
                </Activity>

                <Activity mode={isVisible(currentPage === 'mature-rating-from-sfw-warning')}>
                    <div className="p-6">
                        <PopoverHeader
                            title="Set your account as R18?"
                            description="If you howl with this rating, your account will be forced as R18. This is a requirement if you want to use higher content labelling. You can't change back unless you delete all non-SFW content from your account."
                            variant="warning"
                            onClose={() => setCurrentPage('content-labelling')}
                            onPrimaryAction={() => setCurrentPage('editor')}
                        />
                    </div>
                </Activity>
            </BubblePopover>
        </div>
    )
}

function FloatingComposeContent({
                                    channel,
                                    channelName,
                                    currentResource,
                                    images,
                                    setImages,
                                    editorRef,
                                    body,
                                    setBody,
                                    fileInputRef,
                                    addAttachment,
                                    submitHowl,
                                    setCurrentPage,
                                    uploading
                                }: {
    channel?: string;
    channelName: string | null;
    currentResource: any;
    images: Image[];
    setImages: (images: Image[]) => void;
    editorRef: React.MutableRefObject<any>;
    body: string;
    setBody: (body: string) => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
    addAttachment: (files: FileList | null) => void;
    submitHowl: () => void;
    setCurrentPage: (value: 'editor' | 'content-labelling') => void;
    uploading: boolean;
}) {
    const {user} = useUserAccountStore()

    return (
        <>
            {/* Top small bar */}
            <div className="min-h-12 border-b flex items-center justify-between px-4">
                <Logo className="fill-muted-foreground h-5 w-5"/>
                <div className="flex items-center gap-2">
                    <Avatar square
                            src={currentResource?.images?.avatar || '/img/default-avatar.png'}
                            initials={getInitials(currentResource?.display_name || 'Dummy')}
                            className="size-6"
                    />
                    <Activity mode={isVisible(!!channel)}>
                        <div className="flex items-center gap-1">
                            <ChevronRightIcon className="w-5 h-5 text-muted-foreground"/>
                            <Heading size="sm" className="flex justify-center items-center">
                                <HashtagIcon className="w-4 h-4 inline-flex fill-muted-foreground"/>
                                {channelName}
                            </Heading>
                        </div>
                    </Activity>

                    <Activity mode={isVisible(!channel)}>
                        <Heading size="sm">{currentResource?.display_name}</Heading>
                    </Activity>
                </div>
                <Tooltip
                    content={
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
                    }
                    side="bottom"
                >
                    <div
                        className="bg-muted rounded-full w-7 h-7 p-1.5 text-indigo-500"
                        onClick={e => {
                            e.stopPropagation()
                            toast.error('"Your Stuff" is disabled by the instance owner.')
                        }}
                    >
                        <HardDisk className="fill-muted-foreground w-full h-full"/>
                    </div>
                </Tooltip>
            </div>

            <div className="grow p-4 overflow-y-auto max-h-[calc(100vh-11rem)]">
                {user?.requires_setup && (
                    <Text className="text-center text-sm text-red-500">
                        You need to complete your account setup before you can post howls.
                    </Text>
                )}

                {!user?.requires_setup && (
                    <Editor
                        defaultValue={body}
                        onUpdate={e => {
                            editorRef.current = e
                            setBody(e?.storage.markdown.getMarkdown())
                        }}
                    />
                )}
            </div>

            {!user?.requires_setup && (
                <>
                    {images?.length > 0 && (
                        <div className="px-4 pb-2">
                            <ImageUploadStack images={images} setImages={setImages}/>
                        </div>
                    )}

                    {/* Bottom small bar */}
                    <div className="h-12 flex items-center justify-between px-2">
                        {/* Button group */}
                        <div className="flex items-center gap-1">
                            <ComposeButton
                                className="rounded-l-[0.85rem] rounded-r-sm"
                                onClick={() => fileInputRef.current?.click()}
                            >
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
                                    setCurrentPage('content-labelling')
                                }}
                            >
                                <ChatBubbleExclamation className="h-5 fill-primary-light"/>
                            </ComposeButton>
                        </div>
                        <ComposeButton
                            className={cn("p-1 rounded-full", uploading && "cursor-not-allowed opacity-80")}
                            onClick={() => {
                                if (uploading) return
                                submitHowl()
                            }}
                        >
                            <Activity mode={isVisible(!uploading)}>
                                <ArrowDownIcon className="w-5 h-5 fill-muted-foreground"/>
                            </Activity>

                            <Activity mode={isVisible(uploading)}>
                                <LoadingCircle/>
                            </Activity>
                        </ComposeButton>
                    </div>
                </>
            )}
        </>
    )
}
