import React, {useEffect, useState} from 'react'
import {Container} from '@/components/layout/container'
import {Heading, Text} from '@/components/shared/text'
import {Button} from '@/components/shared/experimental-button-rework'
import {AnimatePresence, motion} from 'framer-motion'
import {vg} from '@/lib/api'
import {toast} from 'sonner'
import {Alert, AlertDescription, AlertTitle} from '@/components/shared/alert'
import {Gradient} from '@/components/shared/gradient'
import {CrawlText} from '@/components/shared/crawl-text'
import {CheckCircleIcon, EnvelopeIcon} from '@heroicons/react/24/solid'
import {ClipboardIcon, ShareIcon} from '@heroicons/react/20/solid'
import Card from '@/components/shared/card.tsx'

// Invite Card Component with animations
const InviteCard = ({invite, index}) => {
    const [copied, setCopied] = useState(false)

    // Calculate expiry date (30 days from creation)
    const createdDate = new Date(invite.created_at)
    const expiryDate = new Date(createdDate)
    expiryDate.setDate(expiryDate.getDate() + 30)

    // Calculate days remaining
    const today = new Date()
    const daysRemaining = Math.max(0, Math.ceil(((expiryDate as unknown as number) - (today as unknown as number)) / (1000 * 60 * 60 * 24)))

    const handleCopy = () => {
        navigator.clipboard.writeText(invite.invite_code)
        setCopied(true)
        toast.success('Invite code copied to clipboard!')
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{delay: index * 0.1, duration: 0.3}}
            className="relative overflow-hidden rounded-xl bg-white p-6 shadow-lg dark:bg-zinc-800/80"
        >
            {/* Decorative elements */}
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-indigo-400/10"/>
            <div className="absolute -left-4 -bottom-8 h-16 w-16 rounded-full bg-blue-400/10"/>

            <div className="relative">
                {/* Code display */}
                <div
                    className="mb-3 cursor-pointer overflow-hidden rounded bg-zinc-50 px-4 py-3 font-mono text-lg tracking-wide dark:bg-zinc-900/50"
                    onClick={handleCopy}
                >
                    {invite.invite_code}
                    {copied ? (
                        <motion.span
                            initial={{scale: 0}}
                            animate={{scale: 1}}
                            className="ml-2 inline-flex text-green-500"
                        >
                            <CheckCircleIcon className="h-5 w-5"/>
                        </motion.span>
                    ) : null}
                </div>

                {/* Card footer with date and actions */}
                <div className="flex items-center justify-between">
                    <div>
                        <Text size="xs" alt>
                            Created {new Date(invite.created_at).toLocaleDateString()}
                        </Text>
                        <Text
                            size="xs"
                            className={daysRemaining < 7 ? 'text-amber-500' : 'text-zinc-500'}
                        >
                            Expires in {daysRemaining} days
                        </Text>
                    </div>

                    <div className="flex gap-2">
                        <motion.button
                            whileHover={{scale: 1.05}}
                            whileTap={{scale: 0.95}}
                            className="flex items-center justify-center rounded-full bg-zinc-100 p-2 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
                            onClick={handleCopy}
                        >
                            <ClipboardIcon className="h-4 w-4"/>
                        </motion.button>

                        <motion.button
                            whileHover={{scale: 1.05}}
                            whileTap={{scale: 0.95}}
                            className="flex items-center justify-center rounded-full bg-zinc-100 p-2 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
                            onClick={() => {
                                const text = `Hey! Join me on Packbase with this invite code: ${invite.invite_code}`
                                if (navigator.share) {
                                    navigator.share({
                                        title: 'Packbase Invite',
                                        text: text
                                    }).catch(_ => {
                                        navigator.clipboard.writeText(text)
                                        toast.success('Invite message copied to clipboard!')
                                    })
                                } else {
                                    navigator.clipboard.writeText(text)
                                    toast.success('Invite message copied to clipboard!')
                                }
                            }}
                        >
                            <ShareIcon className="h-4 w-4"/>
                        </motion.button>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

const EmptyState = () => (
    <motion.div
        initial={{opacity: 0}}
        animate={{opacity: 1}}
        className="flex flex-col items-center justify-center space-y-6 rounded-xl border-2 border-dashed border-zinc-200 py-16 dark:border-zinc-700"
    >
        <motion.div
            animate={{
                y: [0, -10, 0],
                rotate: [0, 5, 0, -5, 0]
            }}
            transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: 'loop'
            }}
            className="rounded-full bg-indigo-100 p-5 dark:bg-indigo-900/30"
        >
            <EnvelopeIcon className="h-10 w-10 text-indigo-600 dark:text-indigo-400"/>
        </motion.div>
        <Text className="text-center text-zinc-500">
            No invite codes yet! Generate one to share with friends.
        </Text>
    </motion.div>
)

const SettingsInvite = () => {
    const [generating, setGenerating] = useState(false)
    const [error, setError] = useState(null)
    const [invites, setInvites] = useState([])
    const [showAnimation, setShowAnimation] = useState(false)

    useEffect(() => {
        vg.invite.list.get().then(({data, error}) => {
            if (error) {
                toast.error(error.value ? `${error.status}: ${error.value.summary}` : 'Something went wrong')
                setError(error.value ? error.value.summary : 'unknown')
                return
            }
            setInvites(data)
        })
    }, [])

    const generateInvite = () => {
        setGenerating(true)
        vg.invite.generate.post().then(({data, error}) => {
            setGenerating(false)
            if (error) {
                toast.error(error.value ? `${error.status}: ${error.value.summary}` : 'Something went wrong')
                setError(error.value ? error.value.summary : 'unknown')
                return
            }

            // Success animation
            setShowAnimation(true)
            setTimeout(() => setShowAnimation(false), 3000)

            toast.success('Invite generated!')
            setError(null)
            setInvites((prev) => [data, ...prev])
        })
    }

    return (
        <Container>
            {/* Hero section with gradient background */}
            <div className="relative mb-12 overflow-hidden rounded-2xl ring-default ring-2 p-8 dark:bg-zinc-800">
                <div className="absolute inset-0">
                    <Gradient className="h-full w-full opacity-30"/>
                </div>

                <div className="relative z-10">
                    <div className="flex flex-col space-y-2">
                        {/* Animated title */}
                        <motion.div
                            initial={{opacity: 0, y: -20}}
                            animate={{opacity: 1, y: 0}}
                        >
                            <Heading size="2xl" className="mb-2">
                                <EnvelopeIcon className="mr-2 inline-block h-8 w-8"/>
                                Share the Experience
                            </Heading>
                        </motion.div>

                        {/* Animated text */}
                        <div className="mb-6 text-zinc-700 dark:text-zinc-300 whitespace-break-spaces">
                            <CrawlText delay={300} fast>
                                ::c:white Invite friends to join the Packbase community. Each invite is ::bold unique and valid for 30 days.
                            </CrawlText>
                        </div>

                        {/* Generate button */}
                        <motion.div
                            initial={{opacity: 0, y: 20}}
                            animate={{opacity: 1, y: 0}}
                            transition={{delay: 0.3}}
                        >
                            {invites.length < 10 ? (
                                <Button
                                    color="indigo"
                                    className="mt-2"
                                    disabled={generating}
                                    onClick={generateInvite}
                                >
                                    {generating ? (
                                        <motion.div
                                            className="flex items-center"
                                            animate={{opacity: [0.5, 1, 0.5]}}
                                            transition={{duration: 1.5, repeat: Infinity}}
                                        >
                                            <EnvelopeIcon className="mr-2 h-5 w-5"/>
                                            Creating your invite...
                                        </motion.div>
                                    ) : (
                                        <motion.div className="flex items-center">
                                            <EnvelopeIcon className="mr-2 h-5 w-5"/>
                                            Generate New Invite
                                        </motion.div>
                                    )}
                                </Button>
                            ) : (
                                <motion.div
                                    initial={{opacity: 0, y: 10}}
                                    animate={{opacity: 1, y: 0}}
                                >
                                    <Alert variant="destructive" className="border-none bg-red-900/70">
                                        <AlertTitle>Invite Limit Reached</AlertTitle>
                                        <AlertDescription>
                                            You have 10 unused invites. Wait for some to be used before generating more.
                                        </AlertDescription>
                                    </Alert>
                                </motion.div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Success animation overlay */}
            <AnimatePresence>
                {showAnimation && (
                    <motion.div
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        className="fixed inset-0 z-50 flex items-center justify-center"
                    >
                        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"/>
                        <motion.div
                            initial={{scale: 0.8, opacity: 0}}
                            animate={{scale: 1, opacity: 1}}
                            exit={{scale: 0.8, opacity: 0}}
                            className="relative z-10 rounded-2xl bg-white p-8 text-center shadow-xl dark:bg-zinc-800"
                        >
                            <motion.div
                                animate={{
                                    scale: [1, 1.2, 1],
                                    rotate: [0, 10, -10, 0]
                                }}
                                transition={{duration: 0.7}}
                            >
                                <EnvelopeIcon className="mx-auto h-16 w-16 text-indigo-500"/>
                            </motion.div>
                            <Heading size="xl" className="mt-4">
                                Invite Created!
                            </Heading>
                            <Text className="mt-2">
                                Your new invite code is ready to share
                            </Text>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error alert */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{opacity: 0, height: 0}}
                        animate={{opacity: 1, height: 'auto'}}
                        exit={{opacity: 0, height: 0}}
                    >
                        <Alert variant="destructive" className="mb-8">
                            <AlertTitle>
                                {error}!
                            </AlertTitle>
                            <AlertDescription>
                                {error.toLowerCase().includes('enough points') && 'You haven\'t been active on Packbase enough to generate an invite code. Try again after a few days of activity!'}
                                {error.toLowerCase().includes('too many') && 'Woah, slow down! You can only have 10 unused invite codes at a time. Let people use some first, then try again!'}
                            </AlertDescription>
                        </Alert>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Invite codes section */}
            <div className="mt-12">
                <div className="mb-6 flex items-center justify-between">
                    <Heading size="xl">
                        Your Invites
                    </Heading>
                    <div className="rounded-full bg-zinc-100 px-3 py-1 dark:bg-zinc-800">
                        <Text alt className="font-medium">
                            {invites.length}/10 <span className="text-xs">available</span>
                        </Text>
                    </div>
                </div>

                {invites.length === 0 ? (
                    <EmptyState/>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {invites.map((invite, index) => (
                            <InviteCard
                                key={invite.invite_code}
                                invite={invite}
                                index={index}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Tips and info section */}
            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{delay: 0.5}}
                className="mt-12"
            >
                <Card className="!bg-primary/10 !max-w-full">
                    <Heading size="lg" className="mb-4">
                        Invite Tips
                    </Heading>
                    <ul className="ml-5 space-y-3 text-zinc-700 dark:text-zinc-300 list-disc">
                        <li><Text>Each invite code can only be used once</Text></li>
                        <li><Text>Invites automatically expire 30 days after generation</Text></li>
                        <li><Text>You can have up to 10 active invites at once</Text></li>
                        <li><Text>Make sure to give your invites to people who will contribute positively to the community, as their behaviour reflects on you as
                            well!</Text>
                        </li>
                    </ul>
                </Card>
            </motion.div>
        </Container>
    )
}

export default SettingsInvite