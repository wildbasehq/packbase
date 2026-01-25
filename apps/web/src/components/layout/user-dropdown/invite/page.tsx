import UserSettingsHeader from '@/components/layout/user-dropdown/user-settings-header'
import {
    Button,
    Description,
    Divider,
    Field,
    Heading,
    Input,
    Label,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    useContentFrame,
} from '@/components/shared'
import {Text} from '@/components/shared/text'
import {vg} from '@/lib'
import inviteFailureSFX from '@/src/audio/invite-failure.wav'
import inviteStartSFX from '@/src/audio/invite-success.wav'
import {PaperAirplaneIcon} from '@heroicons/react/16/solid'
import {FC, FormEvent, useRef, useState} from 'react'
import {toast} from 'sonner'
import useSound from 'use-sound'

const InviteSettings: FC = () => {
    const [celebrate, setCelebrate] = useState(false)
    const [failed, setFailed] = useState(false)
    const [playInviteStartSFX] = useSound(inviteStartSFX, {playbackRate: 0.8})
    const [playInviteFailureSFX] = useSound(inviteFailureSFX, {playbackRate: 0.7})
    const formRef = useRef<HTMLFormElement>(null)

    const onInvite = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const email = formData.get('email')
        setFailed(false)

        if (email) {
            const invitePromise = (async () => {
                const {data, error} = await vg.invite.generate.post({email})

                if (data) {
                    return
                }

                if (error || (data as any)?.summary) {
                    throw error
                }
            })()

            toast.promise(invitePromise, {
                loading: 'Preparing them an invite...',
                success: 'An invite was beamed to their inbox!',
                error: error => `We couldn\'t invite them: ${error.value.summary}`,
            })

            invitePromise
                .then(() => {
                    formRef.current?.reset()
                    setFailed(false)
                    setCelebrate(true)
                    playInviteStartSFX()
                    window.setTimeout(() => setCelebrate(false), 450)
                })
                .catch(() => {
                    setFailed(true)
                    playInviteFailureSFX()
                })
        }
    }
    const {data: invites} = useContentFrame('get', 'invite/list')
    return (
        <div>
            <UserSettingsHeader title="Invite User"/>

            <div className="flex flex-col">
                <form
                    className="space-y-2 p-6 bg-new-card"
                    onSubmit={onInvite}
                    ref={formRef}
                    onInvalid={() => {
                        if (failed) return
                        setFailed(true)
                        playInviteFailureSFX()
                    }}
                >
                    <Field className="relative">
                        <Label htmlFor="email">Email to invite</Label>
                        <Description>
                            NOTE: You cannot invite someone if they're already in the waitlist and are close to
                            receiving an invite.
                        </Description>
                        <div className="relative">
                            <Input className="!z-50 ring-" name="email" type="email" required
                                   onChange={() => setFailed(false)}/>
                            {failed && (
                                <span
                                    aria-hidden
                                    className="pointer-events-none absolute w-full h-9 bottom-0 rounded-lg opacity-60 mix-blend-difference [background-size:500%_100%] bg-[linear-gradient(90deg,transparent_0%,transparent_10%,rgba(239,68,68,0.35)_20%,rgba(239,68,68,0.5)_30%,rgba(220,38,38,0.6)_50%,rgba(185,28,28,0.5)_70%,rgba(153,27,27,0.35)_80%,transparent_90%,transparent_100%)] animate-gradient-x-half-once"
                                />
                            )}
                        </div>
                        {celebrate && (
                            <span
                                aria-hidden
                                className="pointer-events-none absolute w-full h-9 bottom-0 rounded-lg opacity-60 mix-blend-difference [background-size:500%_100%] bg-[linear-gradient(90deg,transparent_0%,transparent_10%,rgba(34,211,238,0.35)_20%,rgba(34,211,238,0.5)_30%,rgba(167,139,250,0.6)_50%,rgba(244,114,182,0.5)_70%,rgba(244,114,182,0.35)_80%,transparent_90%,transparent_100%)] animate-gradient-x-once"
                            />
                        )}
                    </Field>
                    <Button color="indigo" type="submit" className={celebrate ? 'overflow-hidden' : undefined}>
                        <PaperAirplaneIcon data-slot="icon"/>
                        Invite
                        {celebrate && (
                            <span
                                aria-hidden
                                className="pointer-events-none absolute inset-0 rounded-lg opacity-60 mix-blend-screen [background-size:500%_100%] bg-[linear-gradient(90deg,transparent_0%,transparent_10%,rgba(34,211,238,0.35)_20%,rgba(34,211,238,0.5)_30%,rgba(167,139,250,0.6)_50%,rgba(244,114,182,0.5)_70%,rgba(244,114,182,0.35)_80%,transparent_90%,transparent_100%)] animate-gradient-x-once"
                            />
                        )}
                    </Button>
                </form>

                <Divider/>

                <div className="p-6 bg-new-card">
                    <div className="">
                        <Heading>Invited by you</Heading>
                        <Text alt>For security, emails are hashed when you invite, so we can't show them to you.</Text>
                    </div>
                    <Table striped grid dense bleed className="ring-1 ring-default rounded mt-2 shadow-xs">
                        <TableHead>
                            <TableRow>
                                <TableHeader>ID</TableHeader>
                                <TableHeader>Invited At</TableHeader>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {invites?.map(invite => (
                                <TableRow key={invite.id}>
                                    <TableCell>{invite.invite_id}</TableCell>
                                    <TableCell>
                                        {Intl.DateTimeFormat(navigator.language, {
                                            weekday: 'long',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: 'numeric',
                                            minute: 'numeric',
                                            second: 'numeric',
                                        }).format(new Date(invite.created_at))}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}

export default InviteSettings
