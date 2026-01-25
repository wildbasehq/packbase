import {FlaskIcon} from '@/components/icons/plump/flask'
import UserSettingsHeader from '@/components/layout/user-dropdown/user-settings-header'
import PagedModal from '@/components/shared/paged-modal'
import {useUserAccountStore, vg} from '@/lib'
import {Description, FieldGroup, Label, Select, Switch, SwitchField, useContentFrame} from '@/src/components'
import {Field} from '@headlessui/react'
import {AdjustmentsHorizontalIcon, EyeIcon, ShieldCheckIcon, SparklesIcon, UserIcon,} from '@heroicons/react/24/solid'

const categoryIcons: Record<string, any> = {
    privacy: EyeIcon,
    content: ShieldCheckIcon,
    general: UserIcon,
    appearance: SparklesIcon,
    labs: FlaskIcon
}

const categoryDescriptions: Record<string, string> = {
    labs: 'Experimental features that are considered controversial to implement.'
}

export default function UserSettingsFromServer() {
    const {settings} = useUserAccountStore()
    const {
        data,
        isLoading,
        isRefetching,
        refetch: refetchSettings,
    } = useContentFrame('get', 'user.me.settings', undefined, {
        enabled: true,
        refetchOnMount: true,
        initialData: settings,
    })

    const {setSettings} = useUserAccountStore()

    const saveSettings = (newData: any) => {
        vg.user.me.settings.post({
            ...newData,
        }).then(() => refetchSettings().then(({data}) => {
            if (data) {
                setSettings(data)
            }
        }))
    }

    if (isLoading && !data) {
        return null
    }

    const definitions = data?.definitions || {}
    const order = ['privacy', 'content', 'appearance', 'labs']

    const settingsByGroup = order.reduce((acc, category) => {
        acc[category] = Object.entries(definitions)
            .filter(([, def]: [string, any]) => def.userModifiable && (def.category || 'general') === category)
            .map(([key, def]: [string, any]) => ({key, ...def}))
        return acc
    }, {} as Record<string, any[]>)

    return (
        <>
            {Object.entries(settingsByGroup).map(([category, settings]) => (
                <PagedModal.Page
                    key={category}
                    id={category}
                    title={category.charAt(0).toUpperCase() + category.slice(1)}
                    description={categoryDescriptions[category] || ''}
                    icon={categoryIcons[category] || AdjustmentsHorizontalIcon}
                >
                    <PagedModal.Body>
                        <UserSettingsHeader
                            title={category.charAt(0).toUpperCase() + category.slice(1)}
                            description={categoryDescriptions[category] || ''}
                            loading={isLoading || isRefetching}
                        />

                        <form className="space-y-8 p-6 bg-new-card" key={JSON.stringify(data)}>
                            <FieldGroup>
                                {settings.map((setting) => (
                                    <SettingField
                                        key={setting.key}
                                        name={setting.key}
                                        definition={setting}
                                        value={data[setting.key]}
                                        onChange={(val: any) => saveSettings({[setting.key]: val})}
                                    />
                                ))}
                            </FieldGroup>
                        </form>
                    </PagedModal.Body>
                </PagedModal.Page>
            ))}
        </>
    )
}

function SettingField({name, definition, value, onChange}: any) {
    if (definition.type === 'boolean') {
        return (
            <SwitchField className="flex items-center gap-2">
                <Switch
                    onChange={onChange}
                    defaultChecked={value ?? definition.default}
                    name={name}
                />

                <Label>
                    {definition.display_name || definition.description || name}
                </Label>

                {definition.description && (
                    <Description>{definition.description}</Description>
                )}
            </SwitchField>
        )
    }

    if (definition.type === 'string' && definition.values) {
        return (
            <Field className="space-y-2">
                <Label>{definition.display_name || definition.description || name}</Label>
                {definition.description && (
                    <Description>{definition.description}</Description>
                )}
                <Select
                    value={value ?? definition.default}
                    onChange={(e: any) => onChange(e.target.value)}
                >
                    {definition.values.map((val: string) => (
                        <option key={val} value={val}>
                            {val.charAt(0).toUpperCase() + val.slice(1)}
                        </option>
                    ))}
                </Select>
            </Field>
        )
    }

    return null
}
