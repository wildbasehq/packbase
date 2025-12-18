/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

// src/components/howl-creator/content-label-input.tsx
import {Field, Label, Listbox, ListboxLabel, ListboxOption} from '@/src/components'

export default function ContentLabelInput({
                                              value,
                                              onChange
                                          }: {
    value: string
    onChange: (v: string) => void
}) {
    const options = [
        {
            label: 'R18 - NSFW',
            value: 'rating_explicit'
        },
        {
            label: 'R18 - Suggestive',
            value: 'rating_suggestive'
        },
        {
            label: 'M, MA16 - Mature',
            value: 'rating_mature'
        },
        {
            label: 'G, PG - SFW',
            value: 'rating_safe'
        }
    ]
    return (
        <Field>
            <Label>Content Label</Label>
            <Listbox name="Rating"
                     defaultValue={options.find(option => option.value === (value.length ? value : 'rating_safe'))?.value || options[options.length - 1]}
                     onChange={onChange}>
                {options.map(option => (
                    <ListboxOption value={option.value}>
                        <ListboxLabel>{option.label}</ListboxLabel>
                    </ListboxOption>
                ))}
            </Listbox>
        </Field>
    )
}
