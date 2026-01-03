/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import PostSettingsModal from '@/components/howl-creator/post-settings-modal'
import {Camera} from '@/components/icons/plump'
import {ChatBubbleExclamation} from '@/components/icons/plump/chat-bubble-exclamation'
import {useModal} from '@/components/modal/provider'
import {markdownExtensions} from '@/components/novel/ui/editor/extensions'
import {useResourceStore, useUIStore, useUserAccountStore} from '@/lib/state'
import getInitials from '@/lib/utils/get-initials'
import PackbaseInstance from '@/lib/workers/global-event-emit'
import {Avatar, BubblePopover, Editor, Heading, LoadingCircle, Logo, PopoverHeader, Text} from '@/src/components'
import {API_URL, cn, isVisible, vg} from '@/src/lib'
import {HashtagIcon} from '@heroicons/react/16/solid'
import {ArrowDownIcon, PlusIcon} from '@heroicons/react/20/solid'
import {ChevronRightIcon} from '@heroicons/react/24/outline'
import {Activity, ReactNode, RefObject, useEffect, useRef, useState} from 'react'
import {toast} from 'sonner'
import {useLocation} from 'wouter'
import AssetUploadStack, {type Asset} from '../feed/image-placeholder-stack'

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
    const [assets, setAssets] = useState<Asset[]>([])
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
                    description: 'You can try again, but check in another tab if it worked first - I might\'ve just lost track of it.',
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

    const addAttachment = async (files: FileList | null) => {
        if (files) {
            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                if (!file) {
                    toast.error(`File ${i + 1} failed to process!!!`)
                    continue
                }

                const id = `${file.name}-${crypto.randomUUID()}`
                const type = file.type.startsWith('video/') ? 'video' : 'image'

                if (type === 'image') {
                    const reader = new FileReader()
                    reader.onloadend = async () => {
                        setAssets(prev => [...prev, {id, src: reader.result as string, type: 'image', uploading: true}])
                    }
                    reader.readAsDataURL(file)
                } else {
                    // Video first frame capture
                    const video = document.createElement('video')
                    video.src = URL.createObjectURL(file)
                    video.load()
                    video.onloadeddata = () => {
                        video.currentTime = 0.1 // Seek a bit to get a frame
                    }
                    video.onseeked = () => {
                        const canvas = document.createElement('canvas')
                        canvas.width = video.videoWidth
                        canvas.height = video.videoHeight
                        const ctx = canvas.getContext('2d')
                        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)
                        const src = canvas.toDataURL('image/jpeg')
                        setAssets(prev => [...prev, {id, src, type: 'video', uploading: true}])
                        URL.revokeObjectURL(video.src)
                    }
                }

                // Start chunked upload (non-blocking - all uploads happen in parallel)
                uploadFileChunked(file)
                    .then(assetId => {
                        setAssets(prev => prev.map(img => img.id === id ? {...img, assetId, uploading: false} : img))
                    })
                    .catch((e: any) => {
                        console.error(e)
                        toast.error(`Failed to upload ${file.name}: ${e.message || 'Unknown error'}`)
                        // Remove failed image
                        setAssets(prev => prev.filter(img => img.id !== id))
                    })
            }
            if (fileInputRef.current) fileInputRef.current.value = null
        }
    }

    const uploadFileChunked = async (file: File): Promise<string> => {
        const CHUNK_SIZE = 1 * 1024 * 1024 // 1MB

        // 1. INIT
        // @ts-ignore
        const initRes = await vg.howl.upload.init.post({
            command: 'INIT',
            total_bytes: file.size,
            asset_type: file.type
        })
        if (initRes.error) throw initRes.error
        const {asset_id} = initRes.data as { asset_id: string }

        // 2. APPEND
        const chunks = Math.ceil(file.size / CHUNK_SIZE)
        for (let i = 0; i < chunks; i++) {
            const start = i * CHUNK_SIZE
            const end = Math.min(file.size, start + CHUNK_SIZE)
            const chunk = file.slice(start, end)

            const formData = new FormData()
            formData.append('command', 'APPEND')
            formData.append('asset_id', asset_id)
            formData.append('segment_index', i.toString())
            formData.append('asset', chunk, file.name)

            // Retry logic for chunk upload
            let retries = 3
            let appendData
            while (retries > 0) {
                try {
                    // @ts-ignore
                    const appendRes = await fetch(`${API_URL}/howl/upload/append`, {
                        method: 'POST',
                        body: formData,
                        headers: {
                            // @ts-ignore
                            Authorization: `Bearer ${await window.Clerk?.session.getToken()}`
                        }
                    })
                    appendData = await appendRes.json()
                    if (appendData.error) throw appendData.error
                    break // Success, exit retry loop
                } catch (error) {
                    retries--
                    if (retries === 0) throw error
                    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1s before retry
                }
            }
        }

        // 3. FINALIZE
        // @ts-ignore
        const finalizeRes = await vg.howl.upload.finalize.post({
            command: 'FINALIZE',
            asset_id: asset_id
        })
        if (finalizeRes.error) throw finalizeRes.error

        return asset_id
    }

    const submitHowl = () => {
        const uploadingAssets = assets.filter(img => img.uploading)
        if (uploadingAssets.length > 0) {
            toast.error('Please wait for assets to finish uploading.')
            return
        }

        const post: {
            body: string
            content_type: string
            asset_ids?: string[]
            tags?: string[]
        } = {
            body: body || null,
            content_type: 'markdown',
            tags: [selectedContentLabel, ...selectedTags.split(',').map(t => t.trim()).filter(Boolean)],
            asset_ids: assets.map(img => img.assetId).filter(Boolean) as string[],
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
                    setAssets([])
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
                        assets={assets}
                        setAssets={setAssets}
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
                                    assets,
                                    setAssets,
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
    assets: Asset[];
    setAssets: (assets: Asset[]) => void;
    editorRef: RefObject<any>;
    body: string;
    setBody: (body: string) => void;
    fileInputRef: RefObject<HTMLInputElement>;
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
                {/*<Tooltip*/}
                {/*    content={*/}
                {/*        <div className="flex flex-col gap-1">*/}
                {/*            <span className="gap-2">*/}
                {/*                Jump into Deep Compose*/}
                {/*            </span>*/}
                {/*            <span className="text-xs">*/}
                {/*                Create or Draft multiple Howls and Stories quickly on a dedicated page.*/}
                {/*            </span>*/}
                {/*            <div>*/}
                {/*                <Badge color="red">*/}
                {/*                    Experimental - may be unstable*/}
                {/*                </Badge>*/}
                {/*            </div>*/}
                {/*        </div>*/}
                {/*    }*/}
                {/*    side="bottom"*/}
                {/*>*/}
                {/*    <div*/}
                {/*        className="bg-muted rounded-full w-7 h-7 p-1.5 text-indigo-500"*/}
                {/*        onClick={e => {*/}
                {/*            e.stopPropagation()*/}
                {/*            toast.error('"Your Stuff" is disabled by the instance owner.')*/}
                {/*        }}*/}
                {/*    >*/}
                {/*        <HardDisk className="fill-muted-foreground w-full h-full"/>*/}
                {/*    </div>*/}
                {/*</Tooltip>*/}

                {/* Dummy for now */}
                <div className="flex w-8 h-8"/>
            </div>

            <div className="grow p-4 overflow-y-auto max-h-[calc(100vh-11rem)]">
                {user?.requires_setup && (
                    <Text className="text-center text-sm text-red-500">
                        You need to complete your account setup before you can post howls.
                    </Text>
                )}

                {!user?.requires_setup && (
                    <Editor
                        extensions={markdownExtensions}
                        defaultValue={body}
                        onUpdate={e => {
                            editorRef.current = e
                            // @ts-ignore
                            setBody(e?.storage.markdown.getMarkdown())
                        }}
                    />
                )}
            </div>

            {!user?.requires_setup && (
                <>
                    {assets?.length > 0 && (
                        <div className="px-4 pb-2">
                            <AssetUploadStack assets={assets} setAssets={setAssets}/>
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
                                    accept="image/*,video/*,.mov"
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
                            className={cn('p-1 rounded-full', uploading && 'cursor-not-allowed opacity-80')}
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
