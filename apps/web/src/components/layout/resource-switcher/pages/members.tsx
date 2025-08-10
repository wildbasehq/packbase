import { Heading, Text } from '@/components/shared/text.tsx'
import { useEffect, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shared/table.tsx'
import { vg } from '@/lib/api'
import { UserInfo } from '@/components/shared/user/info-col.tsx'
import { useResourceStore } from '@/lib/index'

export default function ResourceSettingsMembers() {
    const {
        currentResource: { id },
    } = useResourceStore()
    const [members, setMembers] = useState([])

    useEffect(() => {
        vg.pack({ id })
            .members.get()
            .then(({ data }) => {
                setMembers(data)
            })
    }, [])

    return (
        <div className="flex flex-1 flex-col gap-4">
            <div>
                <Heading>Memberships</Heading>
                <Text alt>Manage every member's access to this pack</Text>
            </div>

            <Table>
                <TableHead>
                    <TableRow>
                        <TableHeader>User</TableHeader>
                        <TableHeader>Joined At</TableHeader>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {members.map(member => (
                        <TableRow key={member.id}>
                            <TableCell>
                                <UserInfo user={member} />
                            </TableCell>
                            <TableCell>
                                {Intl.DateTimeFormat(navigator.language, {
                                    weekday: 'long',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: 'numeric',
                                    second: 'numeric',
                                }).format(new Date(member.joined_at))}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
