/**
 * Renders JSON Schema configs from server as user-configurable options
 */
import {Button, Description, Field, Input, Label, Select, useContentFrameMutation} from '..'
import {Heading, Text} from '@/components/shared/text.tsx'
import React, {Activity} from 'react'
import {cn, isVisible} from '@/lib'

interface ConfigItem {
    key: string
    value: string
    definition: {
        type: 'string' | 'boolean' | 'number'
        values?: string[]
        default?: string
        userModifiable: boolean
        description?: string
        category?: string
    }
    accessible: boolean
    modifiable: boolean
}

export function decideCategoryDescription(category: string) {
    if (category === 'server_configuration') return "Change this Pack's internal server configs"
}

function ServerConfigRenderComponent({config, updateEndpoint}: { config: ConfigItem[]; updateEndpoint: string }) {
    const [loading, setLoading] = React.useState(false)

    const submit = useContentFrameMutation('post', updateEndpoint, {
        onSuccess: () => {
            setLoading(false)
        },
        onError: () => {
            setLoading(false)
        },
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.target as HTMLFormElement)
        const formObject: Record<string, string> = {}
        formData.forEach((value, key) => {
            formObject[key] = value.toString()
        })
        submit.mutate(formObject)
    }

    const decideElement = (setting: ConfigItem) => {
        if (setting.definition.type === 'string' && setting.definition.values)
            return (
                <Select name={setting.key} defaultValue={setting.value || setting.definition.default}>
                    {setting.definition.values.map(value => (
                        <option value={value}>{value.toTitleCase()}</option>
                    ))}
                </Select>
            )
        if (setting.definition.type === 'string') return <Input id={setting.key} name={setting.key}/>
        return <Text>Cannot render {setting.key}</Text>
    }

    return (
        <form className="flex flex-col space-y-2" onSubmit={handleSubmit}>
            <div className="border-b flex flex-col pb-4 mb-4 border-n-5/10">
                <Heading>{config[0].definition.category.toTitleCase()}</Heading>
            </div>

            <Activity mode={isVisible(loading)}>
                <div className="flex flex-col">
                    <Text>
                        <b>Updating server configs...</b>
                    </Text>
                </div>
            </Activity>

            {config
                .toSorted((a, b) => Number(a.modifiable) - Number(b.modifiable))
                .map((setting, idx) =>
                    setting.modifiable ? (
                        <Field key={setting.key} className={cn(!config[idx]?.modifiable && 'border-t')}>
                            <Label>{setting.key.toTitleCase()}</Label>
                            {setting.definition.description &&
                                <Description>{setting.definition.description}</Description>}
                            {decideElement(setting)}
                        </Field>
                    ) : (
                        <Text alt>
                            <b>{setting.key.toTitleCase()}</b> (Read-only
                            {setting.definition.description ? `, ${setting.definition.description}` : ''}): {setting.value}
                        </Text>
                    )
                )}

            <Button type="submit" className="mt-4">
                Save Changes
            </Button>
        </form>
    )
}

const ServerConfigRender = React.memo(ServerConfigRenderComponent)

export default ServerConfigRender
