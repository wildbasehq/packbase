/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import { Field, Input, Label, Textarea } from '@/components/shared'
import React, { useEffect } from 'react'
import { useUserAccountStore, vg } from '@/lib'
import { toast } from 'sonner'
import { Button } from '@/components/shared/experimental-button-rework'
import { PhotoIcon } from '@heroicons/react/24/solid'

const ProfileSettings: React.FC = () => {
    const { user } = useUserAccountStore()
    const bioRef = React.useMemo(() => React.createRef<HTMLTextAreaElement>(), [])
    const displayNameRef = React.useMemo(() => React.createRef<HTMLInputElement>(), [])
    const coverPicRef = React.useMemo(() => React.createRef<HTMLInputElement>(), [])
    const coverPicPreview = React.useMemo(() => React.createRef<string>(), [])

    const [submitting, setSubmitting] = React.useState<boolean>(false)

    // When coverPicRef gets a valid photo uploaded, set the preview to the base64
    useEffect(() => {
        const handleFileChange = () => {
            const file = coverPicRef.current?.files?.[0]
            if (file) {
                const reader = new FileReader()
                reader.onloadend = () => {
                    coverPicPreview.current = reader.result as string
                }
                reader.readAsDataURL(file)
            }
        }

        if (coverPicRef.current) {
            coverPicRef.current.addEventListener('change', handleFileChange)
            return () => coverPicRef.current?.removeEventListener('change', handleFileChange)
        }
    }, [coverPicRef])

    useEffect(() => {
        if (bioRef.current) bioRef.current.value = user?.about?.bio || ''
        if (displayNameRef.current) displayNameRef.current.value = user?.display_name || ''
    }, [])

    function saveProfile(e: { preventDefault: () => void }) {
        e.preventDefault()
        if (submitting) return
        setSubmitting(true)

        vg.user.me
            .post({
                display_name: displayNameRef.current?.value || user?.display_name,
                about: {
                    bio: bioRef.current?.value || undefined,
                },
                images: coverPicPreview
                    ? {
                          header: coverPicPreview,
                      }
                    : undefined,
            })
            .then(({ data, error }) => {
                if (data && !error) {
                    toast.success('Profile updated')
                    window.location.reload()
                } else {
                    setSubmitting(false)
                    toast.error(
                        "Couldn't save: " +
                            (error.value ? `${error.status}: ${error.value.summary || error.value.error}` : 'Something went wrong')
                    )
                }
            })
            .catch(err => {
                setSubmitting(false)
                toast.error("Couldn't save: " + (err.message ? `${err.cause}: ${err}` : 'Something went wrong'))
            })
    }

    return (
        <form>
            <div className="border-b pb-4 mb-4 border-n-5/10">
                <h1 className="font-bold text-[17px]">Profile Settings</h1>
            </div>

            <div className="mb-4">
                <p className="text-sm text-muted-foreground">Username can be changed in your "Account" tab.</p>
            </div>

            <div className="col-span-full">
                <label htmlFor="cover-photo" className="text-default block select-none text-sm font-medium leading-6">
                    Cover photo
                </label>
                <div
                    className="relative mt-2 flex aspect-banner items-center justify-center overflow-hidden rounded border-2 border-dashed bg-card px-6 py-10"
                    onClick={() => document.getElementById('cover-photo')?.click()}
                >
                    {coverPicPreview && (
                        <img
                            src={coverPicPreview.current}
                            alt=""
                            className="absolute inset-0 h-full w-full rounded-lg object-cover opacity-50 blur-lg"
                        />
                    )}
                    <div className="items-center justify-center text-center">
                        <PhotoIcon className="text-alt mx-auto h-12 w-12" aria-hidden="true" />
                        <div className="text-alt mt-4 flex select-none text-sm leading-6">
                            <p className="pl-1">Upload a file (drag and drop not supported)</p>
                        </div>
                        <p className="text-alt select-none text-xs leading-5">PNG, JPG, GIF up to 10MB, Aspect Ratio 3 / 1</p>
                    </div>
                </div>
            </div>

            <input id="cover-photo" name="file-upload" type="file" className="sr-only" accept="image/*" ref={coverPicRef} />

            <Field>
                <Label>Display Name</Label>
                <Input ref={displayNameRef} name="display_name" />
            </Field>

            <Field>
                <Label>About Me</Label>
                <Textarea ref={bioRef} name="bio" />
            </Field>

            <div className="mt-4">
                <Button type="submit" className="btn btn-primary" onClick={saveProfile} disabled={submitting}>
                    {submitting ? 'Saving...' : 'Save'}
                </Button>
            </div>
        </form>
    )
}

export default ProfileSettings
