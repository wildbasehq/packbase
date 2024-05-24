'use client'
import {useState} from 'react'
import NotFound from '@/app/not-found'

export default function UserResource({params}: { params: { slug: string } }) {
    const [user, setUser] = useState<any>(null)
    const [error, setError] = useState<any>(null)

    if (error) {
        return <>
            <NotFound/>
        </>
    } else {
        return (
            <div className="mx-auto w-fit">
            </div>
        )
    }
}