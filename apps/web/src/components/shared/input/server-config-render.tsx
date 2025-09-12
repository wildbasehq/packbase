/**
 * Renders JSON Schema configs from server as user-configurable options
 */
import { Description, Field, Input, InputGroup, Label, Select } from '..'
import { Heading, Text } from '@/components/shared/text.tsx'
import React from 'react'
import { cn } from '@/lib'

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

export default function ServerConfigRender({ config }: { config: ConfigItem[] }) {
    const decideElement = (setting: ConfigItem) => {
        if (setting.definition.type === 'string' && setting.definition.values)
            return (
                <Select name={setting.key}>
                    {setting.definition.values.map(value => (
                        <option value={value}>{value.toTitleCase()}</option>
                    ))}
                </Select>
            )
        if (setting.definition.type === 'string') return <Input id={setting.key} name={setting.key} />
    }

    return (
        <form>
            <div className="border-b flex flex-col pb-4 mb-4 border-n-5/10">
                <Heading>{config[0].definition.category.toTitleCase()}</Heading>
            </div>

            {config
                .toSorted((a, b) => Number(a.modifiable) - Number(b.modifiable))
                .map((setting, idx) =>
                    !setting.modifiable ? (
                        <Text alt>
                            <b>{setting.key.toTitleCase()}</b> (Read-only
                            {setting.definition.description ? `, ${setting.definition.description}` : ''}): {setting.value}
                        </Text>
                    ) : (
                        <Field key={setting.key} className={cn('mt-4', !config[idx]?.modifiable && 'border-t pt-2')}>
                            <Label>{setting.key.toTitleCase()}</Label>
                            {setting.definition.description && <Description>{setting.definition.description}</Description>}
                            {decideElement(setting)}
                        </Field>
                    )
                )}
        </form>
    )
}
