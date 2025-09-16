import React from 'react'
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
    useContentFrame
} from '@/components/shared'
import {PaperAirplaneIcon} from '@heroicons/react/16/solid'
import {vg} from '@/lib'
import {toast} from 'sonner'
import {Text} from '@/components/shared/text.tsx'

const InviteSettings: React.FC = () => {
    const onInvite = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const email = formData.get('email')

        if (email) {
            toast.promise(async () => {
                const {data, error} = await vg.invite.generate.post({email})

                if (data) {
                    return data
                }

                if (error || data.summary) {
                    throw error
                }
            }, {
                loading: 'Trying to invite, one sec...',
                success: 'Successfully invited!',
                error: (error) => `We couldn\'t invite them: ${error.value.summary}`
            })
        }

    }
    const {data: invites} = useContentFrame('get', 'invite/list')
    return (
        <div>
            <div className="border-b pb-4 mb-4 border-n-5/10">
                <Heading className="font-bold !text-[17px]">Invite User</Heading>
            </div>

            <div className="flex flex-col gap-4">
                <form className="space-y-2" onSubmit={onInvite}>
                    <Field>
                        <Label htmlFor="email">
                            Email to invite
                        </Label>
                        <Description>
                            NOTE: You cannot invite someone if they're already in the waitlist and are close to receiving an invite.
                        </Description>
                        <Input name="email" type="email" required/>
                    </Field>
                    <Button color="indigo" type="submit">
                        <PaperAirplaneIcon data-slot="icon"/>
                        Invite
                    </Button>
                </form>

                <Divider/>

                <div className="">
                    <Heading>
                        Invited by you
                    </Heading>
                    <Text alt>
                        For security, emails are hashed when you invite, so we can't show them to you.
                    </Text>
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
                                <TableCell>
                                    {invite.invite_id}
                                </TableCell>
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
    )
}

export default InviteSettings
