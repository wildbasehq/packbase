'use client'

import { FormEvent, Fragment, useState } from 'react'
import { Button } from '@/components/shared/ui/button'
import { Dialog, RadioGroup, Transition } from '@headlessui/react'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid'
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid'
import { Input } from '@/components/shared/input/text'
import { Text } from '@/components/shared/text'
import { LoadingCircle } from '@/components/shared/icons'

export default function PackAdd() {
    return (
        <>
            woops hey look a button
            <CreateGroupSidebar />
        </>
    )
}

const postPrivacy = [
    {
        name: 'Public',
        desc: 'Everyone in the world can see this',
    },
    {
        name: 'Friends Only',
        desc: 'Only your friends can see this',
    },
    {
        name: 'Followers Only',
        desc: 'Only your followers can see this',
        warn: 'Your friends are counted as followers',
    },
    {
        name: 'Private',
        desc: 'Just for you and people you invite',
    },
]

export function CreateGroupSidebar() {
    const [onboardOpen, setOnboardOpen] = useState(false)
    const [selected, setSelected] = useState(postPrivacy[0])
    const [submitting, setSubmitting] = useState(false)

    const createPack = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (submitting) return
        setSubmitting(true)
    }

    return (
        <>
            <Button onClick={() => setOnboardOpen(true)}>Create a Pack</Button>
            <Transition.Root show={onboardOpen} as={Fragment}>
                <Dialog as="div" className="fixed inset-0 z-50 overflow-hidden" onClose={setOnboardOpen}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-in-out duration-500"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in-out duration-500"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 backdrop-blur-[0.15rem] transition-opacity" />
                    </Transition.Child>

                    <div className="absolute inset-0 overflow-hidden">
                        {/*<Dialog.Overlay className="absolute inset-0" />*/}

                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-snapper duration-300"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-snapper duration-300"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <div className="pointer-events-auto w-screen sm:max-w-md">
                                    <form
                                        method="POST"
                                        onSubmit={createPack}
                                        className="flex h-full flex-col divide-y divide-neutral-200 bg-card/75 shadow-xl backdrop-blur-xl dark:divide-neutral-700"
                                    >
                                        <div className="h-0 flex-1 overflow-y-auto">
                                            <div className="rounded-bl rounded-br bg-white/50 px-4 py-6 shadow dark:bg-n-6/50 sm:px-6">
                                                <div className="flex items-center justify-between">
                                                    <Dialog.Title className="text-default text-lg font-medium"> Create a Pack </Dialog.Title>
                                                    <div className="ml-3 flex h-7 items-center">
                                                        <Button disabled={submitting} type="reset" variant="ghost" size="self" onClick={() => setOnboardOpen(false)}>
                                                            <span className="sr-only">Close panel</span>
                                                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="mt-1">
                                                    <Text alt>Packs are a group of people with self-elected leaders.</Text>
                                                </div>
                                            </div>

                                            <div className="flex flex-1 flex-col justify-between">
                                                <div className="divide-y divide-neutral-200 px-4 dark:divide-neutral-700 sm:px-6">
                                                    <div className="space-y-6 pb-5 pt-6">
                                                        <div>
                                                            <Input label="Pack Name" name="display_name" />
                                                        </div>
                                                        <div>
                                                            <Input label="Pack Slug" name="slug" suffix="packbase.app/p/" inputClassName="lowercase" />
                                                        </div>
                                                        <div>
                                                            <Input
                                                                label="Description"
                                                                type="textarea"
                                                                name="description"
                                                                rows={4}
                                                                className="block w-full"
                                                                // onChange={(e) => onPostUpdate({
                                                                //     description: e.target.value || ''
                                                                // })}
                                                            />
                                                        </div>
                                                        <fieldset>
                                                            <legend className="text-default text-sm font-medium">Privacy</legend>
                                                            <div className="mt-2 space-y-5">
                                                                <RadioGroup value={selected} onChange={setSelected}>
                                                                    <RadioGroup.Label className="sr-only">Privacy</RadioGroup.Label>
                                                                    <div className="space-y-2">
                                                                        {postPrivacy.map((privacyOption) => (
                                                                            <RadioGroup.Option
                                                                                key={privacyOption.name}
                                                                                value={privacyOption}
                                                                                className={({ active, checked }) =>
                                                                                    `${
                                                                                        active
                                                                                            ? 'ring-2 ring-white ring-opacity-60 ring-offset-2 ring-offset-neutral-300'
                                                                                            : ''
                                                                                    }
                                                                                    ${
                                                                                        checked
                                                                                            ? 'bg-n-1/70 dark:bg-n-6'
                                                                                            : 'hover:bg-n-2/25 hover:ring-2 dark:hover:bg-n-6/50'
                                                                                    }
                                                                                    ring-default flex select-none flex-col justify-center rounded border px-4 py-4 !no-underline transition-all`
                                                                                }
                                                                            >
                                                                                {({ checked }) => (
                                                                                    <>
                                                                                        <div className="flex w-full items-center justify-between">
                                                                                            <div className="flex items-center">
                                                                                                <div className="text-sm">
                                                                                                    <RadioGroup.Label
                                                                                                        as="p"
                                                                                                        className={`font-medium  ${
                                                                                                            checked ? 'text-default' : 'text-default-alt'
                                                                                                        }`}
                                                                                                    >
                                                                                                        {privacyOption.name}
                                                                                                    </RadioGroup.Label>
                                                                                                    <RadioGroup.Description as="span" className="text-alt inline">
                                                                                                        <span>{privacyOption.desc}</span>{' '}
                                                                                                        {privacyOption.warn && (
                                                                                                            <p className="inline-flex items-center">
                                                                                                                <QuestionMarkCircleIcon className="text-default-alt h-4 w-4" />
                                                                                                                <span className="ml-1">{privacyOption.warn}</span>
                                                                                                            </p>
                                                                                                        )}
                                                                                                    </RadioGroup.Description>
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
                                                                            </RadioGroup.Option>
                                                                        ))}
                                                                    </div>
                                                                </RadioGroup>
                                                            </div>
                                                        </fieldset>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-shrink-0 justify-end space-x-2 px-4 py-4">
                                            <Button disabled={submitting} type="reset" variant="grey" onClick={() => setOnboardOpen(false)}>
                                                Cancel
                                            </Button>
                                            <Button disabled={submitting}>{!submitting ? 'Create' : <LoadingCircle className="invert" />}</Button>
                                        </div>
                                    </form>
                                </div>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>
        </>
    )
}
