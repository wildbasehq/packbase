import UserAvatar from '@/components/shared/user/avatar'
import {Text} from '@/components/shared/text'
import {DotIcon} from 'lucide-react'
import {Button} from '@/components/shared/experimental-button-rework'
import {LoadingCircle} from '@/components/icons'
import Card from '@/components/shared/card'
import React, {FormEvent, useRef, useState} from 'react'
import {vg} from '@/lib/api'
import {toast} from 'sonner'
import {useResourceStore, useUserAccountStore} from '@/lib/states'
import {Editor} from '@/components/novel'
import {LinkIcon} from '@heroicons/react/24/solid'
import {Alert, AlertTitle} from '@/components/shared/alert'
import {QuestionMarkCircleIcon, XCircleIcon} from '@heroicons/react/20/solid'
import clsx from 'clsx'
import Tooltip from '@/components/shared/tooltip'
import {useModal} from '@/components/modal/provider'
import Link from '@/components/shared/link.tsx'

export default function HowlCreator() {
    const {user} = useUserAccountStore()
    const {currentResource} = useResourceStore()

    const {show} = useModal()

    return (
        <>
            {!user.reqOnboard && !currentResource.temporary && (
                <Button outline className="w-full mb-2" onClick={() => show(<HowlCard/>)}>
                    + Howl {!currentResource.standalone && `in ${currentResource.display_name}`}
                </Button>
            )}
        </>
    )
}

function HowlCard() {
    const {user} = useUserAccountStore()
    const {currentResource} = useResourceStore()

    const [submitting, setSubmitting] = useState<boolean>(false)
    const [showModal, setShowModal] = useState<boolean>(false)
    const [attachments, setAttachments] = useState<{ bright: boolean; data: string }[]>([])
    const [body, setBody] = useState<string>('')

    const fileInputRef = useRef<HTMLInputElement>(null)

    const submitPost = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (submitting) return
        setSubmitting(true)
        const formData = new FormData(event.currentTarget)
        const post: {
            body: string
            content_type: string
            assets?: any[]
        } = {
            body: body || null,
            content_type: 'markdown',
        }

        // @ts-ignore
        const assets = attachments?.map((attachment) => {
            return {
                name: 'e',
                data: attachment.data,
            }
        })

        if (assets) {
            post.assets = assets
        }

        uploadPost(post)
    }

    const uploadPost = (post: any) => {
        post.tenant_id = currentResource.id
        vg.howl.create
            .post(post)
            .then(({error}) => {
                if (error) {
                    setSubmitting(false)
                    return toast.error(error.value ? `${error.status}: ${error.value.summary}` : 'Something went wrong')
                } else {
                    toast.success('created!')

                    // @todo just add the post to the feed
                    return window.location.reload()
                }
            })
            .catch((error) => {
                console.log(error)
                setSubmitting(false)
                toast.error('Something went wrong')
            })
    }

    const addAttachment = (file: File | null) => {
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                // check if gray text would be unreadable on the top-right of the image
                // @ts-ignore
                const img = new Image()
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    const ctx = canvas.getContext('2d')
                    canvas.width = img.width
                    canvas.height = img.height

                    ctx?.drawImage(img, 0, 0)

                    const imageData = ctx?.getImageData(0, 0, img.width, img.height)
                    let bright = false
                    if (imageData) {
                        for (let i = 0; i < imageData.data.length; i += 4) {
                            const r = imageData.data[i]
                            const g = imageData.data[i + 1]
                            const b = imageData.data[i + 2]
                            const a = imageData.data[i + 3]
                            const avg = Math.floor((r + g + b) / 3)
                            const aThreshold = 120
                            const rgbThreshold = 120
                            if (a >= aThreshold && (avg >= rgbThreshold || r >= rgbThreshold || g >= rgbThreshold || b >= rgbThreshold)) {
                                bright = avg >= rgbThreshold
                                break
                            }
                        }
                    }

                    setAttachments([
                        ...attachments,
                        {
                            bright,
                            data: reader.result as string,
                        },
                    ])

                    img.remove()
                    canvas.remove()
                    if (fileInputRef.current) fileInputRef.current.value = ''
                }
                // @ts-ignore
                img.src = reader.result
            }
            reader.readAsDataURL(file)
        }
    }

    const removeAttachment = (idx: number) => {
        setAttachments(attachments.filter((_, i) => i !== idx))
    }

    return (
        <Card className="px-0! py-0! min-w-full sm:min-w-[32rem]">
            {!currentResource.standalone && (
                <Alert className="rounded-none! border-0!">
                    <AlertTitle className="flex items-center">
                        <UserAvatar name={currentResource.display_name} size={24} user={currentResource} className="mr-2 inline-flex"/>
                        {currentResource.display_name}
                        <Tooltip
                            content={`Howling into ${currentResource.display_name}. This howl will be visible to all members of this pack regardless of your settings.`}
                            side="right"
                        >
                            <QuestionMarkCircleIcon className="text-alt ml-1 h-4 w-4"/>
                        </Tooltip>
                    </AlertTitle>
                </Alert>
            )}
            <form onSubmit={submitPost}>
                <div className="relative border-t">
                    <div className="px-4 pt-5 sm:px-6">
                        <div className="flex space-x-3">
                            <div className="shrink-0">
                                <UserAvatar user={user}/>
                            </div>
                            <div className="flex min-w-0 flex-1 flex-col justify-center">
                                <Link href={`/@${user?.username}/`} className="text-default font-medium">
                                    {user.display_name || user.username}
                                </Link>
                                <Text>New Howl</Text>
                            </div>
                            <div className="flex shrink-0 space-x-2 self-center">
                                <DotIcon/>
                            </div>
                        </div>
                    </div>

                    <div className="min-h-fit w-full px-4 py-4 sm:px-6">
                        <Editor
                            onUpdate={(e) => {
                                setBody(e?.storage.markdown.getMarkdown())
                            }}
                        />
                    </div>
                </div>

                <div className="justify-between space-y-4 border-t px-4 py-4 sm:px-6">
                    <div className="flex w-full items-center space-x-6">
                        <div className="ml-auto flex items-center space-x-5">
                            <div className="flex items-center">
                                <button
                                    type="button"
                                    className="-m-2.5 inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-400 hover:text-gray-500"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <span className="sr-only">Insert link</span>
                                    <LinkIcon className="h-5 w-5" aria-hidden="true"/>
                                </button>
                            </div>
                            <input
                                type="file"
                                name="assets"
                                id="assets"
                                className="hidden"
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={(e) => addAttachment(e.target.files?.[0] || null)}
                            />
                        </div>
                        <div className="flex-1"/>
                        <Button type="submit" color="indigo" disabled={submitting}>{!submitting ? 'Post' : <LoadingCircle/>}</Button>
                    </div>

                    {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-7">
                            {attachments.map((attachment: any, idx: number) => (
                                <div key={idx} className="relative">
                                    <img src={attachment.data} alt="" className="h-20 w-20 rounded object-cover"/>
                                    <Button
                                        type="button"
                                        outline
                                        className={clsx('absolute right-0 top-0 h-5 w-5', attachment.bright ? 'text-alt' : 'text-white')}
                                        onClick={() => removeAttachment(idx)}
                                    >
                                        <span className="sr-only">Remove</span>
                                        <XCircleIcon className="h-5 w-5" aria-hidden="true"/>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </form>
        </Card>
    )
}
