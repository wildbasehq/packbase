'use client'

import {createClient} from '@/lib/supabase/client'
import {useEffect, useState} from 'react'
import UserInfoCol from '@/components/shared/user/info-col'
import {Text} from '@/components/shared/text'

export default function IDArtistShowcase() {
    const [notice, setNotice] = useState<any>(null)

    useEffect(() => {
        if (!window) return
        console.log('fetching notice')
        const supabase = createClient()

        supabase
            .from('notice')
            .select('*')
            .eq('type', 'id_showcase')
            .then(({data, error}) => {
                if (error) {
                    console.error(error)
                } else {
                    if (data && data.length !== 0) {
                        setNotice(data[0])
                    }
                }
            })
    }, [])

    if (!notice) return <></>

    return (
        <div className="relative h-full w-full">
            <div className="absolute left-4 top-4 rounded border-2 bg-card p-2">
                <Text alt className="mb-2">
                    &copy; {notice.user.username}
                    <br/>
                    All rights reserved
                </Text>
                <UserInfoCol user={notice.user}/>
            </div>
            <img className="inset-0 h-full w-full object-cover" src={notice.image} alt="" width={3840} height={2160} quality={100}/>
        </div>
    )
}
