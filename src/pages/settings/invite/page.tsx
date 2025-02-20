'use client'

import {Container} from '@/components/layout/container'
import {Heading, Text} from '@/components/shared/text'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/shared/table'
import {Button} from '@/components/shared/experimental-button-rework'
import {useEffect, useState} from 'react'
import {vg} from '@/lib/api'
import {toast} from 'sonner'
import {Alert, AlertDescription, AlertTitle} from '@/components/shared/alert'

export default function SettingsInvite() {
    const [generating, setGenerating] = useState(false)
    const [error, setError] = useState<string | null>()
    const [invites, setInvites] = useState<{
        invite_code: string
        created_at: string
    }[]>([])

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

            toast.success('Invite generated!')
            setError(null)
            setInvites((prev) => [data, ...prev])
        })
    }

    return (
        <Container>
            {error && (
                <Alert variant="destructive" className="mb-8">
                    <AlertTitle>
                        {error}!
                    </AlertTitle>
                    <AlertDescription>
                        {error.toLowerCase().includes('enough points') && 'You haven\'t been active on Packbase enough to generate an invite code. Try again after a few days of activity!'}
                        {error.toLowerCase().includes('too many') && 'Woah, slow down! You can only have 10 unused invite codes at a time. Let people use some first, then try again!'}

                    </AlertDescription>
                </Alert>
            )}
            <Heading size="xl">
                Invite a friend
            </Heading>
            <Text>
                Invite a friend to join the community by sharing an invite code with them~
            </Text>

            {invites.length < 10 ? (
                <Button color="indigo" className="mt-8" disabled={generating} onClick={generateInvite}>
                    {generating ? 'Generating...' : 'Generate Invite'}
                </Button>
            ) : (
                <Text className="mt-8 !text-destructive">
                    You have too many unused invites. Let people use some first, then you can generate more!
                </Text>
            )}

            <Heading size="lg" className="mt-8">
                Unused Invites
            </Heading>
            <Text>
                Unused invites expire after 30 days. Share them before they expire!
            </Text>
            {/* Table of invites */}
            <Table>
                <TableHead>
                    <TableRow>
                        <TableHeader>Invite Code</TableHeader>
                        <TableHeader>Generated At</TableHeader>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {invites.map((invite) => (
                        <TableRow key={invite.invite_code}>
                            <TableCell>{invite.invite_code}</TableCell>
                            <TableCell>{invite.created_at}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <div className="mt-8">
            </div>
        </Container>
    )
}