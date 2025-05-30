import { Field, Label, Textarea } from '@/components/shared'
import React, { useEffect } from 'react'
import { useUserAccountStore, vg } from '@/lib'
import { toast } from 'sonner'
import { Button } from '@/components/shared/experimental-button-rework'

const ProfileSettings: React.FC = () => {
    const { user } = useUserAccountStore()
    const bioRef = React.useMemo(() => React.createRef<HTMLTextAreaElement>(), [])

    const [submitting, setSubmitting] = React.useState<boolean>(false)

    useEffect(() => {
        if (bioRef.current) bioRef.current.value = user?.about?.bio || ''
    }, [])

    function saveProfile(e: { preventDefault: () => void }) {
        e.preventDefault()
        if (submitting) return
        setSubmitting(true)

        vg.user.me
            .post({
                about: {
                    bio: bioRef.current?.value || undefined,
                },
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
