import { FormEvent, useState } from 'react'
import { useUserAccountStore } from '@/lib/state'
import { supabase } from '@/lib/api'
import { useSearchParams } from 'wouter'
import { SignIn } from '@clerk/clerk-react'
import { Alert, AlertDescription, AlertTitle } from '@/src/components'

export default function IDLogin() {
    const { user } = useUserAccountStore()
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [searchParams] = useSearchParams()

    if (user) return (window.location.href = '/')

    const loginUser = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (submitting) return
        setSubmitting(true)

        const formData = new FormData(event.currentTarget)
        const user = {
            email: formData.get('email')?.toString() || '',
            password: formData.get('password')?.toString() || '',
        }
        supabase.auth
            .signInWithPassword(user)
            .then(r => {
                if (r.error) {
                    setSubmitting(false)
                    setError(r.error.toString())
                } else {
                    window.location.href = searchParams.get('redirect') || '/'
                }
            })
            .catch(e => {
                setSubmitting(false)
                setError(e.toString())
            })
    }

    return (
        <>
            <Alert className="shadow-xs ring-1 ring-n-5/10 border-0 mb-4">
                <AlertTitle>Signing in after 30/05/2025?</AlertTitle>
                <AlertDescription>
                    After that date, you'll need access to your email to sign in. If you no longer have access to this email address,
                    contact the email provider, or contact us if you have proof of ownership.
                </AlertDescription>
            </Alert>
            <div className="shadow-xs ring-1 ring-n-5/10 rounded overflow-clip">
                <SignIn
                    waitlistUrl="/id/create"
                    appearance={{
                        elements: {
                            cardBox: {
                                boxShadow: 'none',
                            },
                            logoBox: {
                                display: 'none',
                            },
                        },
                    }}
                />
            </div>
        </>
    )
}
