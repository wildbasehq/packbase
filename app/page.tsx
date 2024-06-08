'use client'
import Body from '@/components/layout/body'
import GuestLanding from '@/components/home/guestlanding'
import {useUserAccountStore} from '@/lib/states'
import UserAvatar from '@/components/shared/user/avatar'
import ReactMarkdown from 'react-markdown'
import {FormEvent, memo, useState} from 'react'
import {Heading, Text} from '@/components/shared/text'
import girlDogBusStop from '@/datasets/lottie/girl-dog-bus-stop.json'
import dynamic from 'next/dynamic'
import FeedList from '@/components/shared/feed/list'
import Card from '@/components/shared/card'
import Link from 'next/link'
import {DotIcon, PartyPopperIcon} from 'lucide-react'
import {Button} from '@/components/shared/ui/button'
import {FetchHandler} from '@/lib/api'
import {toast} from '@/lib/toast'
import {LoadingCircle} from '@/components/shared/icons'
import {CheckBadgeIcon, LinkIcon} from '@heroicons/react/24/solid'
import {Alert, AlertDescription, AlertTitle} from '@/components/shared/ui/alert'
import Modal from '@/components/modal'
import {BentoStaffBadge} from '@/lib/utils/pak'
import {Tab, TabGroup, TabList, TabPanel, TabPanels} from '@headlessui/react'
import {clsx} from 'clsx'
import {Input} from '@/components/shared/input/text'

export default function Home() {
    const {user} = useUserAccountStore()
    const [notice, setNotice] = useState<any>(null)
    const Lottie = memo(dynamic(() => import('lottie-react'), {ssr: false, suspense: true}))
    const [submitting, setSubmitting] = useState<boolean>(false)
    const [showModal, setShowModal] = useState<boolean>(false)
    const [willUpload, setWillUpload] = useState<number>(0)

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
        const post: {
            body: string
            content_type: string
            assets?: any[]
        } = {
            body: formData.get('body')?.toString() || '',
            content_type: 'markdown'
        }

        const assets = formData.getAll('assets')
        if (assets && assets.length > 0 && assets[0].name.length > 0) {
            const reader = new FileReader()
            // @ts-ignore
            reader.readAsDataURL(assets[0])
            reader.onloadend = () => {
                post.assets = [{
                    name: 'test',
                    data: reader.result
                }]

                uploadPost(post)
            }
        } else {
            uploadPost(post)
        }
    }

    const uploadPost = (post: any) => {
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

                {user?.waitlistType === 'wait' && (
                    <>
                        <div
                            className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mb-12 justify-center items-center">
                            <div className="flex flex-col space-y-4">
                                <Heading size="xl">
                                    So you've registered on the waitlist. Now what??
                                </Heading>
                                <div className="space-y-2">
                                    <Text className="text-sm text-default-alt">
                                        If you'd like to participate with the community, you'll need an invite from someone. As we have no "rolling invites", we allow
                                        users to gift invites to random (or specific) people in the waitlist~!
                                        <br/><br/>
                                        If you don't know anyone already in, your best bet is to wait.
                                        <span className="text-tertiary">
                                            If you've traded anything for an invite, you've been scammed.
                                        </span>
                                    </Text>
                                </div>

                                <Alert variant="success" className="select-none cursor-help hover:ring-4 ring-default transition-shadow"
                                       onClick={() => setShowModal(true)}>
                                    <CheckBadgeIcon
                                        className="h-5 w-5"/>
                                    <AlertTitle>
                                        Users created on this version are exempt from restrictions!
                                    </AlertTitle>
                                    <AlertDescription className="text-default-alt">
                                        The perks of being a test dummy. The stage's all yours, go wild! 🎉
                                    </AlertDescription>
                                </Alert>

                                <Modal showModal={showModal} setShowModal={setShowModal}>
                                    <div className="flex flex-col p-4 bg-card">
                                        <Heading size="xl">
                                            <PartyPopperIcon className="inline-flex mr-1 w-5 h-5"/>
                                            'sup volunteer
                                        </Heading>
                                        <Text className="mt-2">
                                            You work on this, nice.
                                            <br/><br/>
                                            On public release, you'll have a{' '} <BentoStaffBadge type="1" width={20} height={20} className="h-5 w-5 inline-flex"/>{' '}
                                            corgi badge next to your name (or a <BentoStaffBadge type="2" width={20} height={20} className="h-5 w-5 inline-flex"/> rainbow
                                            one if you're still with us 🫡)
                                        </Text>
                                        <Button variant="outline" className="mt-4" onClick={() => setShowModal(false)}>
                                            Got it
                                        </Button>
                                    </div>
                                </Modal>
                            </div>
                            <div className="flex items-end justify-end">
                                <Lottie className="h-80 w-auto right-0" animationData={girlDogBusStop}/>
                            </div>
                        </div>
                    </>
                )}
            </Body>

            <div className="px-8">
                {user && (
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
                                        className="text-sm space-y-4">
                                        <TabGroup>
                                            {({selectedIndex}) => (
                                                <>
                                                    <TabList className="flex items-center">
                                                        <Tab
                                                            className={({selected}) =>
                                                                clsx(
                                                                    selected
                                                                        ? 'bg-n-1/70 dark:bg-n-6'
                                                                        : 'transition-all hover:ring-2 ring-default hover:bg-n-2/25 dark:hover:bg-n-6/50',
                                                                    'rounded-md px-3 py-1.5 text-sm font-medium'
                                                                )
                                                            }
                                                        >
                                                            Write
                                                        </Tab>
                                                        <Tab
                                                            className={({selected}) =>
                                                                clsx(
                                                                    selected
                                                                        ? 'bg-n-1/70 dark:bg-n-6'
                                                                        : 'transition-all hover:ring-2 ring-default hover:bg-n-2/25 dark:hover:bg-n-6/50',
                                                                    'ml-2 rounded-md px-3 py-1.5 text-sm font-medium'
                                                                )
                                                            }
                                                        >
                                                            Preview
                                                        </Tab>

                                                        {selectedIndex === 0 ? (
                                                            <div className="ml-auto flex items-center space-x-5">
                                                                {willUpload ? `dbg: will upload ${willUpload}` : ''}
                                                                <div className="flex items-center">
                                                                    <button
                                                                        type="button"
                                                                        className="-m-2.5 inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-400 hover:text-gray-500"
                                                                        onClick={() => document.getElementById('assets')?.click()}
                                                                    >
                                                                        <span className="sr-only">Insert link</span>
                                                                        <LinkIcon className="h-5 w-5" aria-hidden="true"/>
                                                                    </button>
                                                                </div>
                                                                <input type="file" name="assets" id="assets" className="hidden" accept="image/*" onChange={(e) => {
                                                                    setWillUpload(e.target.files?.length || 0)
                                                                }}/>
                                                            </div>
                                                        ) : null}
                                                    </TabList>
                                                    <TabPanels className="mt-2">
                                                        <TabPanel className="-m-0.5 rounded-lg p-0.5">
                                                            <label htmlFor="comment" className="sr-only">
                                                                Comment
                                                            </label>
                                                            <div>
                                                                <Input
                                                                    type="textarea"
                                                                    rows={5}
                                                                    name="body"
                                                                    id="body"
                                                                    placeholder="Add your comment..."
                                                                />
                                                            </div>
                                                        </TabPanel>
                                                        <TabPanel className="-m-0.5 rounded-lg p-0.5">
                                                            <div className="border-b pb-4">
                                                                <ReactMarkdown>
                                                                    Cannot render :(
                                                                </ReactMarkdown>
                                                            </div>
                                                        </TabPanel>
                                                    </TabPanels>
                                                </>
                                            )}
                                        </TabGroup>
                                    </div>
                                </div>
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
                )}

                <FeedList/>
            </div>
        </>
    )
}
