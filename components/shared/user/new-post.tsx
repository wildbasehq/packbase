import UserAvatar from '@/components/shared/user/avatar'
import Link from 'next/link'
import { Heading, Text } from '@/components/shared/text'
import { DotIcon } from 'lucide-react'
import { Button } from '@/components/shared/ui/button'
import { LoadingCircle } from '@/components/shared/icons'
import Card from '@/components/shared/card'
import React, { FormEvent, useState } from 'react'
import { FetchHandler } from '@/lib/api'
import { toast } from '@/lib/toast'
import { useResourceStore, useUserAccountStore } from '@/lib/states'
import { Editor } from '@/components/novel'
import { LinkIcon } from '@heroicons/react/24/solid'
import Modal from '@/components/modal'
import { Alert } from '@/components/shared/ui/alert'

export default function NewPost() {
    const { user } = useUserAccountStore()
    const { currentResource } = useResourceStore()
    const [submitting, setSubmitting] = useState<boolean>(false)
    const [willUpload, setWillUpload] = useState<number>(0)
    const [showModal, setShowModal] = useState<boolean>(false)

    const [body, setBody] = useState<string>('')

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
            body: body,
            content_type: 'markdown',
        }

        const assets = formData.getAll('assets')
        // @ts-ignore
        if (assets && assets.length > 0 && assets[0].name.length > 0) {
            const reader = new FileReader()
            // @ts-ignore
            reader.readAsDataURL(assets[0])
            reader.onloadend = () => {
                post.assets = [
                    {
                        name: 'test',
                        data: reader.result,
                    },
                ]

                uploadPost(post)
            }
        } else {
            uploadPost(post)
        }
    }

    const uploadPost = (post: any) => {
        FetchHandler.post('/xrpc/app.packbase.howl.create', {
            body: JSON.stringify(post),
        })
            .then(({ data }) => {
                if (data?.message) {
                    setSubmitting(false)
                    return toast.error(data.message ? `${data.at}: ${data.message}` : 'Something went wrong')
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

    return (
        <>
            <Button size="sm" variant="outline" className="w-full" onClick={() => setShowModal(true)}>
                + Howl {!currentResource.standalone && `in ${currentResource.display_name}`}
            </Button>

            <Modal showModal={showModal} setShowModal={setShowModal}>
                <Card className="!px-0 !py-0">
                    <Alert>
                        <Heading>This needs touch up. Whatever.</Heading>
                    </Alert>
                    <form onSubmit={submitPost}>
                        <div className="relative">
                            <div className="px-4 pt-5 sm:px-6">
                                <div className="flex space-x-3">
                                    <div className="flex-shrink-0">
                                        <UserAvatar user={user} />
                                    </div>
                                    <div className="flex min-w-0 flex-1 flex-col justify-center">
                                        <Link href={`/@${user?.username}/`} className="text-default font-medium">
                                            {user.display_name || user.username}
                                        </Link>
                                        <Text>New Howl</Text>
                                    </div>
                                    <div className="flex flex-shrink-0 space-x-2 self-center">
                                        <DotIcon />
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

                        {/* Footer - Like & Share on left, rest of space taken up by a reply textbox with send icon on right */}
                        <div className="flex justify-between space-x-8 border-t px-4 py-4 sm:px-6">
                            <div className="flex w-full items-center space-x-6">
                                <div className="ml-auto flex items-center space-x-5">
                                    {willUpload ? `dbg: will upload ${willUpload}` : ''}
                                    <div className="flex items-center">
                                        <button
                                            type="button"
                                            className="-m-2.5 inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-400 hover:text-gray-500"
                                            onClick={() => document.getElementById('assets')?.click()}
                                        >
                                            <span className="sr-only">Insert link</span>
                                            <LinkIcon className="h-5 w-5" aria-hidden="true" />
                                        </button>
                                    </div>
                                    <input
                                        type="file"
                                        name="assets"
                                        id="assets"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => {
                                            setWillUpload(e.target.files?.length || 0)
                                        }}
                                    />
                                </div>
                                <div className="flex-1" />
                                <Button disabled={submitting}>{!submitting ? 'Post' : <LoadingCircle />}</Button>
                            </div>
                        </div>
                    </form>
                </Card>
            </Modal>
        </>
    )
}
