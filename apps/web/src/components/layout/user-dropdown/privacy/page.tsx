import UserSettingsHeader from '@/components/layout/user-dropdown/user-settings-header'
import {vg} from '@/lib'
import FormToJSON from '@/lib/utils/FormJSON'
import {Button, FieldGroup, Label, Switch, SwitchGroup, useContentFrame} from '@/src/components'
import {Field} from '@headlessui/react'
import {FormEvent} from 'react'

export default function PrivacySettings() {
    const {
        data,
        isLoading,
        isRefetching,
        refetch: refetchSettings,
    } = useContentFrame('get', 'user.me.settings', undefined, {
        enabled: true,
        refetchOnMount: true,
    })

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        const formData = FormToJSON<{
            allow_rehowl: boolean
        }>(e.target, {
            allow_rehowl: false
        })

        saveSettings(formData)
    }

    const saveSettings = (data) => {
        vg.user.me.settings.post({
            ...data,
        }).then(() => refetchSettings())
    }

    return (
        <form onChange={submit} className="space-y-8" key={data}>
            <UserSettingsHeader title="Privacy" loading={isLoading || isRefetching}/>

            <FieldGroup>
                <SwitchGroup>
                    <Field className="flex items-center gap-2">
                        <Switch
                            onChange={(allow_rehowl) => {
                                saveSettings({allow_rehowl})
                            }}
                            defaultChecked={data?.allow_rehowl}
                            name="allow_rehowl"/>

                        <Label>
                            Allow other users to rehowl your content
                        </Label>
                    </Field>
                </SwitchGroup>
            </FieldGroup>

            <Button type="submit">
                Save
            </Button>
        </form>
    )
}