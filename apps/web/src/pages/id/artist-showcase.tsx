/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {Text} from '@/components/shared/text'
import UserInfoCol from '@/components/shared/user/info-col'
import {useState} from 'react'

export default function IDArtistShowcase() {
    const [notice] = useState<any>({
        if_youre_seeing_this_its_because_we_dont_have_a_showcase_yet: true,
        user: {
            id: '52c9daa9-f99c-4384-b61a-2ccacd6b3db8',
            username: 'jemzard',
            slug: 'jemzard',
            display_name: 'JemZard',
            space_type: 'default',
            post_privacy: 'everyone',
            about: {
                bio: '20🫠🏳️‍🌈 / artist and animator who draws silly lizards :D',
            },
            images: {
                avatar: 'https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvdXBsb2FkZWQvaW1nXzJ4bzFiTTQ2dGNybEIyUFdyVkRRZDJXUzhKUyJ9',
                header: 'https://profiles.cdn.packbase.app/52c9daa9-f99c-4384-b61a-2ccacd6b3db8/0/header.png?updated=1740576243073',
            },
            following: true,
        },
        image: 'https://profiles.cdn.packbase.app/52c9daa9-f99c-4384-b61a-2ccacd6b3db8/48c1454a-25b4-44d4-b00d-cfeac6a9207e/0.png',
    })

    if (!notice) return <></>

    return (
        <div className="relative h-full w-full">
            <div className="absolute left-4 top-16 rounded border-2 bg-card p-2">
                <Text alt className="mb-2">
                    &copy; {notice.user.username}
                    <br/>
                    All rights reserved
                </Text>
                <UserInfoCol user={notice.user}/>
            </div>
            <img className="inset-0 h-full w-full object-cover" src={notice.image} alt=""/>
        </div>
    )
}
