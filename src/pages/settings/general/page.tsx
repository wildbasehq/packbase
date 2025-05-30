import { Field, Label, Textarea } from '@/components/shared'
import React, { useEffect } from 'react'
import { useUserAccountStore } from '@/lib'

const ProfileSettings: React.FC = () => {
    const { user } = useUserAccountStore()
    const bioRef = React.useMemo(() => React.createRef<HTMLTextAreaElement>(), [])

    useEffect(() => {
        if (bioRef.current) bioRef.current.value = user?.about?.bio || ''
    }, [])
    return (
        <form>
            <div className="border-b pb-4 mb-4 border-n-5/10">
                <h1 className="font-bold text-[17px]">Profile Settings</h1>
            </div>

            <Field>
                <Label>About Me</Label>
                <Textarea ref={bioRef} name="bio" />
            </Field>
        </form>
    )
}

export default ProfileSettings
