import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/shared/table'
import {Heading, Text} from '@/components/shared/text'
import {UserInfo} from '@/components/shared/user/info-col'
import {useResourceStore} from '@/lib'
import {vg} from '@/lib/api'
import {hasPackPermissionBit, PACK_PERMISSIONS} from '@/lib/utils/has-pack-permission-bit'
import {Dropdown, DropdownButton, DropdownItem, DropdownMenu} from '@/src/components'
import {EllipsisHorizontalIcon} from '@heroicons/react/24/solid'
import {useEffect, useState} from 'react'
import {GiBootKick} from 'react-icons/gi'
import {toast} from 'sonner'

export default function ResourceSettingsMembers() {
    const {
        currentResource: {membership, id},
    } = useResourceStore()
    const [members, setMembers] = useState([])

    useEffect(() => {
        vg.pack({id})
            .members.get()
            .then(({data}) => {
                setMembers(data)
            })
    }, [])

    const canAction = hasPackPermissionBit(
        membership.permissions,
        [{
            type: 'any',
            bits: [PACK_PERMISSIONS.KickMembers, PACK_PERMISSIONS.BanMembers]
        }]
    )

    const kickMember = (memberId: string) => {
        vg.pack({id})
            .kick.post({user_id: memberId})
            .then(({status, error}) => {
                if (status === 200) {
                    toast.success('Member kicked successfully')
                    // Refresh members list
                    vg.pack({id})
                        .members.get()
                        .then(({data}) => {
                            setMembers(data)
                        })
                } else {
                    toast.error(error.value.summary || 'Failed to kick member')
                }
            })
    }

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
                        {canAction && (
                            <TableHeader>Actions</TableHeader>
                        )}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {members.map(member => (
                        <TableRow key={member.id}>
                            <TableCell>
                                <UserInfo user={member}/>
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

                            {canAction && (
                                <TableCell>
                                    <Dropdown>
                                        <DropdownButton plain>
                                            <EllipsisHorizontalIcon/>
                                        </DropdownButton>
                                        <DropdownMenu>
                                            {hasPackPermissionBit(membership.permissions, PACK_PERMISSIONS.KickMembers) && (
                                                <DropdownItem
                                                    className="hover:bg-red-600! *:data-[slot=icon]:fill-red-500! hover:*:data-[slot=icon]:fill-white!"
                                                    onClick={() => kickMember(member.id)}
                                                >
                                                    <GiBootKick data-slot="icon"/>
                                                    Kick
                                                </DropdownItem>
                                            )}

                                            {/*{hasPackPermissionBit(membership.permissions, PACK_PERMISSIONS.BanMembers) && (*/}
                                            {/*    <DropdownItem*/}
                                            {/*        className="hover:bg-red-600! *:data-[slot=icon]:text-red-500! hover:*:data-[slot=icon]:text-white!"*/}
                                            {/*    >*/}
                                            {/*        <BlockIcon/>*/}
                                            {/*        Ban*/}
                                            {/*    </DropdownItem>*/}
                                            {/*)}*/}
                                        </DropdownMenu>
                                    </Dropdown>
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
