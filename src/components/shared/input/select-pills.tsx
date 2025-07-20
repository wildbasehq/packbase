/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import { Description, Label, Radio, RadioGroup } from '@headlessui/react'
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid'
import { CheckIcon } from '@heroicons/react/24/solid'
import { useEffect, useState } from 'react'

type Option = { id: string; name: string; desc?: string; warn?: string; disabled?: boolean }
export default function SelectPills({
    label,
    id,
    options,
    onChange,
}: {
    label?: string
    id?: string
    options: Option[]
    onChange: (option: Option) => void
}) {
    const [selected, setSelected] = useState<null | Option>()

    if (!selected) setSelected(options[0])

    useEffect(() => {
        if (onChange) onChange(selected)
    }, [selected])
    return (
        <fieldset>
            {label && <legend className="text-default select-none text-sm font-medium">{label}</legend>}
            <div className="mt-2 space-y-5">
                <RadioGroup value={selected} onChange={setSelected} name={id}>
                    {label && <Label className="sr-only select-none">{label}</Label>}
                    <div className="space-y-2">
                        {options.map(option => (
                            <Radio
                                disabled={option.disabled}
                                key={option.name}
                                value={option}
                                className={({ focus, checked }) =>
                                    `${focus ? 'ring-2 ring-white ring-opacity-60 ring-offset-2 ring-offset-neutral-300' : ''}
                                ${checked ? 'bg-n-1/70 dark:bg-n-6' : 'hover:bg-n-2/25 hover:ring-2 dark:hover:bg-n-6/50'}
                                ${option.disabled ? 'cursor-not-allowed opacity-75 hover:ring-0' : 'cursor-default'}
                                ring-default flex select-none flex-col justify-center rounded border px-4 py-4 !no-underline transition-all`
                                }
                            >
                                {({ checked }) => (
                                    <>
                                        <div className="flex w-full items-center justify-between">
                                            <div className="flex items-center">
                                                <div className="text-sm">
                                                    <Label as="p" className={`font-medium  ${checked ? 'text-default' : 'text-alt'}`}>
                                                        {option.name}
                                                    </Label>
                                                    {(option.desc || option.warn) && (
                                                        <Description as="span" className="text-alt inline">
                                                            <span>{option.desc}</span>{' '}
                                                            {option.warn && (
                                                                <p className="mt-4 flex">
                                                                    <QuestionMarkCircleIcon className="text-alt mr-1 h-4 w-6" />
                                                                    <span>{option.warn}</span>
                                                                </p>
                                                            )}
                                                        </Description>
                                                    )}
                                                </div>
                                            </div>
                                            {checked && (
                                                <div className="text-default shrink-0">
                                                    <CheckIcon className="h-6 w-6" />
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </Radio>
                        ))}
                    </div>
                </RadioGroup>
            </div>
        </fieldset>
    )
}
