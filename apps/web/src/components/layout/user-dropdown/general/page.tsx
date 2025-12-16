/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {
    Button,
    Description,
    Field,
    FieldGroup,
    Input,
    Label,
    Switch,
    SwitchField,
    SwitchGroup,
    Textarea
} from '@/components/shared'
import React, {useEffect} from 'react'
import {useUserAccountStore, vg} from '@/lib'
import {toast} from 'sonner'
import {PhotoIcon} from '@heroicons/react/24/solid'

const ProfileSettingsComponent: React.FC = ({noHeader}: { noHeader?: boolean }) => {
    const {user} = useUserAccountStore()

    // Text
    const bioRef = React.useMemo(() => React.createRef<HTMLTextAreaElement>(), [])
    const displayNameRef = React.useMemo(() => React.createRef<HTMLInputElement>(), [])

    // Checkbox
    const isAdultRestricted = user?.is_r18 ?? false
    const canChangeAdultRestricted = user?.is_r18 ?? false

    // Uploads
    const coverPicRef = React.useMemo(() => React.createRef<HTMLInputElement>(), [])


    const [submitting, setSubmitting] = React.useState<boolean>(false)
    const [coverPicPreview, setCoverPicPreview] = React.useState<string | undefined>(undefined)

    // When coverPicRef gets a valid photo uploaded, set the preview to the base64
    useEffect(() => {
        const handleFileChange = () => {
            const file = coverPicRef.current?.files?.[0]
            if (file) {
                const reader = new FileReader()
                reader.onloadend = () => {
                    setCoverPicPreview(reader.result as string)
                }
                reader.readAsDataURL(file)
            }
        }

        if (coverPicRef.current) {
            coverPicRef.current.addEventListener('change', handleFileChange)
        }
        return () => coverPicRef.current?.removeEventListener('change', handleFileChange)
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
            .then(({data, error}) => {
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
        <form className="space-y-8">
            {!noHeader && (
                <>
                    <div className="border-b pb-4 mb-4 border-n-5/10">
                        <h1 className="font-bold text-[17px]">Profile Settings</h1>
                    </div>

                    <div className="mb-4">
                        <p className="text-sm text-muted-foreground">Username and your Avatar can be changed in your
                            "Account" tab.</p>
                    </div>
                </>
            )}

            <FieldGroup>
                <span className="block select-none pb-2 font-medium leading-6 border-b">
                    How you interact
                </span>

                <SwitchGroup>
                    <SwitchField>
                        <Label>
                            I post and/or interact with content that's R18
                        </Label>
                        <Description>
                            This marks your profile as R18 and applies some exposure limits to accounts that have
                            opted out of R18 content. This is automatically enabled when you post your first R18
                            howl and cannot be disabled until all R18 content has been removed from your profile.
                        </Description>
                        <Switch name="is-r18" defaultChecked={isAdultRestricted} disabled={canChangeAdultRestricted}/>
                    </SwitchField>
                </SwitchGroup>

            </FieldGroup>
            <FieldGroup>
                <span className="block select-none pb-2 font-medium leading-6 border-b">
                    How you appear
                </span>

                <div className="col-span-full">
                    <label htmlFor="cover-photo"
                           className="block select-none text-sm font-medium leading-6">
                        Cover photo
                    </label>
                    <span className="text-sm text-muted-foreground">
                        Must be SFW (G - PG) rated, regardless of account settings.
                    </span>
                    <div
                        className="relative mt-2 flex aspect-banner items-center justify-center overflow-hidden rounded border-2 border-dashed bg-card px-6 py-10"
                        onClick={() => document.getElementById('cover-photo')?.click()}
                        key={coverPicPreview}
                    >
                        {coverPicPreview && (
                            <img
                                src={coverPicPreview}
                                alt=""
                                className="absolute inset-0 h-full w-full rounded-lg object-cover opacity-50 blur-lg"
                            />
                        )}
                        <div className="items-center justify-center text-center">
                            <PhotoIcon className="text-muted-foreground mx-auto h-12 w-12" aria-hidden="true"/>
                            <div className="text-muted-foreground mt-4 flex select-none text-sm leading-6">
                                <p className="pl-1">Upload a file (drag and drop not supported)</p>
                            </div>
                            <p className="text-muted-foreground select-none text-xs leading-5">PNG, JPG, GIF up to 10MB,
                                Aspect Ratio 3 / 1</p>
                        </div>
                    </div>
                </div>

                <input id="cover-photo" name="file-upload" type="file" className="sr-only" accept="image/*"
                       ref={coverPicRef}/>

                <Field>
                    <Label>Display Name</Label>
                    <Description>
                        Must be SFW (G - PG) rated, regardless of account settings.
                    </Description>
                    <Input ref={displayNameRef} name="display_name"/>
                </Field>

                <Field>
                    <Label>About Me</Label>
                    <Description>
                        Must be SFW (G - PG) rated, but can involve R18 links if your account is marked as R18.
                    </Description>
                    <Description>
                        Markdown is supported. Add custom HTML in the "Theme" tab.
                    </Description>
                    <Textarea ref={bioRef} name="bio"/>
                </Field>
            </FieldGroup>

            <div className="mt-4">
                <Button type="submit" className="btn btn-primary" onClick={saveProfile} disabled={submitting}>
                    {submitting ? 'Saving...' : 'Save'}
                </Button>
            </div>
        </form>
    )
}

const ProfileSettings = React.memo(ProfileSettingsComponent)

export default ProfileSettings
