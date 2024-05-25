'use client'

import {AlertTriangle, XCircleIcon} from 'lucide-react'
import {useParams} from 'next/navigation'
import {FormEvent, useState} from 'react'
import {toast} from 'sonner'
import {LoadingDots} from '@/components/shared/icons'
import {Input} from '@/components/shared/input/text'
import Button from '@/components/shared/button'
import {ProjectName} from '@/lib/utils'

export default function ReportAbuse() {
    const [open, setOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    let {domain, slug} = useParams() as { domain: string; slug?: string }
    if (typeof window !== 'undefined') {
        domain = typeof domain === 'undefined' ? window?.location.hostname : domain
        slug = typeof slug === 'undefined' ? window?.location.pathname.replace('/', '') : slug
    }
    const url = slug ? `${domain}/${slug}` : `${domain}`

    const submit = async (formEvent: FormEvent<HTMLFormElement>) => {
        formEvent.preventDefault()
        setSubmitting(true)

        // artificial 1s delay
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setSubmitting(false)
        setOpen(false)
        toast.success(
            `We got it! Thanks for making ${ProjectName} even better. Click here to see your report.`,
        )
    }

    return (
        <div className="fixed bottom-5 right-5">
            <button
                className="rounded bg-default p-4 text-default shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl active:translate-y-0 active:shadow-sm"
                onClick={() => setOpen(!open)}
            >
                {open ? <XCircleIcon size={24}/> : <AlertTriangle size={24}/>}
            </button>
            {open && (
                <form onSubmit={submit}
                      className="absolute bottom-20 right-2 flex w-96 flex-col space-y-6 rounded-lg border border-default bg-default p-8 shadow-lg animate-in slide-in-from-bottom-5"
                >
                    <div>
                        <h3 className="font-display text-2xl font-bold">
                            Report Bug or Abuse
                        </h3>
                        <p className="mt-2 text-sm text-alt">
                            Found a bug or abuse? Let us know so we can fix it!
                        </p>
                        <p className="mt-2 text-sm text-alt">
                            When reporting a user, please go to their profile before doing this.
                        </p>
                    </div>

                    <div>
                        <Input label="Reporting Component" id="component" value={url} disabled/>
                    </div>

                    <div>
                        <Input label="What's up?" id="reason" className="bg-default-alt"/>
                    </div>

                    <div>
                        <input type="checkbox" id="screenshot" className="rounded-sm bg-default"/>
                        <label htmlFor="screenshot" className="ml-2 text-sm leading-5 text-alt">
                            Include a screenshot
                        </label>
                    </div>

                    <SubmitButton pending={submitting}/>
                </form>
            )}
        </div>
    )
}

function SubmitButton({pending}: { pending: boolean; }) {
    return (
        <Button variant="primary" type="submit" disabled={pending}>
            {pending ? <LoadingDots/> : <p>Report Abuse</p>}
        </Button>
    )
}