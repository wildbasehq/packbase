'use client'
import Body from '@/components/layout/body'
import GuestLanding from '@/components/home/guestlanding'
import {useUserAccountStore} from '@/lib/states'
import UserAvatar from '@/components/shared/user/avatar'
import ReactMarkdown from 'react-markdown'
import {FormEvent, useState} from 'react'
import {Heading, Text} from '@/components/shared/text'
import girlDogBusStop from '@/datasets/lottie/girl-dog-bus-stop.json'
import dynamic from 'next/dynamic'
import FeedList from '@/components/shared/feed/list'
import Card from '@/components/shared/card'
import Link from 'next/link'
import {DotIcon} from 'lucide-react'
import {Input} from '@/components/shared/input/text'
import {Button} from '@/components/shared/ui/button'
import {FetchHandler} from '@/lib/api'
import {toast} from '@/lib/toast'
import {LoadingCircle} from '@/components/shared/icons'

export default function Home() {
    const {user} = useUserAccountStore()
    const [notice, setNotice] = useState<any>(null)
    const Lottie = dynamic(() => import('lottie-react'), {ssr: false})
    const [submitting, setSubmitting] = useState<boolean>(false)

    // useEffect(() => {
    //     if (!window || !user) return
    //     console.log('fetching notice')
    //     const supabase = createClient()
    //
    //     supabase.from('notice').select('*').then(({data, error}) => {
    //         if (error) {
    //             console.error(error)
    //         } else {
    //             if (data && data.length !== 0) {
    //                 setNotice(data[0])
    //             }
    //         }
    //     })
    // }, [])

    const submitPost = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (submitting) return
        setSubmitting(true)
        const formData = new FormData(event.currentTarget)
        const post = {
            body: formData.get('body')?.toString() || '',
            content_type: 'markdown'
        }

        FetchHandler.post('/content/post', {
            body: JSON.stringify(post)
        }).then(({data}) => {
            if (data?.message) {
                setSubmitting(false)
                return toast.error(data.message ? `${data.at}: ${data.message}` : 'Something went wrong')
            } else {
                toast.success('created!')

                // @todo just add the post to the feed
                return window.location.reload()
            }
        }).catch(error => {
            console.log(error)
            setSubmitting(false)
            toast.error('Something went wrong')
        })
    }

    return (
        <>
            <Body className="max-w-6xl">
                {!user && <GuestLanding/>}
                {notice && (
                    <div className="space-y-4 my-11 px-4 sm:px-6 lg:px-8">
                        <h2 className="text-base font-semibold leading-7 text-default">Updates from Yipnyap Team</h2>
                        <div className="flex space-x-3">
                            <div className="flex-shrink-0">
                                <UserAvatar name={notice.author_username}/>
                            </div>
                            <div className="min-w-0 flex-1 flex flex-col justify-center">
                                <a href={`/@ttt`}
                                   className="font-medium text-default cursor-pointer hover:underline">
                                    {notice.author_username}
                                </a>
                                {/*<p className="text-sm text-default-alt cursor-pointer hover:underline">*/}
                                {/*    <ReactMarkdown>*/}
                                {/*    </ReactMarkdown>*/}
                                {/*</p>*/}
                            </div>
                        </div>
                        {notice.title && (
                            <Heading size="2xl">{notice.title}</Heading>
                        )}
                        <ReactMarkdown>
                            {notice?.content}
                        </ReactMarkdown>
                    </div>
                )}

                {user?.waitlistType === 'h' && (
                    <>
                        <div
                            className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mb-12 justify-center items-center">
                            <div className="flex flex-col space-y-4">
                                <Heading size="xl">
                                    So you've registered on the waitlist. Now what??
                                </Heading>
                                <div className="space-y-2">
                                    <Text className="text-sm text-default-alt">
                                        If you'd like to participate with the community, you'll need an invite from
                                        someone. As we have no "rolling invites", we allow users to gift invites to
                                        random (or specific) people in the waitlist~!
                                        <br/><br/>
                                        If you don't know anyone already in, your best bet is to wait. <span
                                        className="text-tertiary">
                                        If you've traded anything for an invite, you've been scammed.
                                    </span>
                                    </Text>
                                </div>
                            </div>
                            <div className="flex items-end justify-end">
                                <Lottie className="h-80 w-auto right-0" animationData={girlDogBusStop}/>
                            </div>
                        </div>
                    </>
                )}
            </Body>

            <div className="px-8">
                <Card className="!px-0 !py-0 mx-auto mb-8">
                    <form onSubmit={submitPost}>
                        <div className="relative">
                            <div className="px-4 pt-5 sm:px-6">
                                <div className="flex space-x-3">
                                    <div className="flex-shrink-0">
                                        <UserAvatar user={user}/>
                                    </div>
                                    <div className="min-w-0 flex-1 flex flex-col justify-center">
                                        <Link href={`/@${user.username}/`}
                                              className="font-medium text-default">
                                            {user.display_name || user.username}
                                        </Link>
                                        <Text>
                                            New Howl
                                        </Text>
                                    </div>
                                    <div className="flex-shrink-0 self-center flex space-x-2">
                                        <DotIcon/>
                                    </div>
                                </div>
                            </div>

                            <div
                                className="min-h-fit w-full py-4 px-4 sm:px-6 cursor-pointer">
                                <div
                                    className="text-sm text-neutral-700 space-y-4 dark:text-neutral-50">
                                    <Input label="body" name="body" type="textarea"/>
                                </div>

                                {/* Post Objects (Images) */}
                                {/*{postContent?.objects && postContent.objects.length > 0 && (*/}
                                {/*    <MediaGrid objects={postContent.objects} selectState={[selectedMedia, setSelectedMedia]}*/}
                                {/*               post={postContent} truncate/>*/}
                                {/*)}*/}
                            </div>

                            {/* Floating "User is typing..." card */}
                            {/*<div className="absolute bottom-0 left-0 ml-4 sm:ml-6 bg-box-alt border-x border-t border-b-0 border-solid border-neutral-300 dark:border-neutral-700 rounded-tl-xl rounded-tr-xl">*/}
                            {/*    <div className="flex items-center space-x-2 px-4 py-2">*/}
                            {/*        <div className="flex-shrink-0">*/}
                            {/*            <img className="h-4 w-4 rounded-full"*/}
                            {/*                    src={postContent.user.avatar || `/img/avatar/default-avatar.png`}*/}
                            {/*                    alt=""/>*/}
                            {/*        </div>*/}
                            {/*        <div className="min-w-0 flex-1">*/}
                            {/*            <p className="text-sm font-medium text-default cursor-pointer hover:underline">*/}
                            {/*                {postContent.user.username} is typing...*/}
                            {/*            </p>*/}
                            {/*        </div>*/}
                            {/*    </div>*/}
                            {/*</div>*/}
                        </div>

                        {/* Footer - Like & Share on left, rest of space taken up by a reply textbox with send icon on right */}
                        <div className="px-4 py-4 sm:px-6 flex justify-between space-x-8 border-t">
                            <div className="flex items-center w-full space-x-6">
                                <div className="flex-1"/>
                                <Button disabled={submitting}>
                                    {!submitting ? 'Post' : <LoadingCircle/>}
                                </Button>
                            </div>
                        </div>
                    </form>
                </Card>

                <FeedList/>
            </div>
        </>
    )
}
