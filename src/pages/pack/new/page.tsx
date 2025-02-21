import Body from '@/components/layout/body'
import {CTA, CTABody, CTASideImage} from '@/components/shared/cta'
import {LoadingCircle} from '@/components/icons'
import {Input} from '@/components/shared/input/text'
import {Heading, Text} from '@/components/shared/text'
import {Button} from '@/components/shared/button'
import {vg} from '@/lib/api'
import {useResourceStore, useUserAccountStore} from '@/lib/states'
import {toast} from 'sonner'
import {Description, Dialog, DialogTitle, Label, Radio, RadioGroup, Transition, TransitionChild} from '@headlessui/react'
import {BarsArrowUpIcon, ChevronDownIcon, MagnifyingGlassIcon, QuestionMarkCircleIcon} from '@heroicons/react/20/solid'
import {CheckIcon, XMarkIcon} from '@heroicons/react/24/solid'
import {FormEvent, Fragment, useEffect, useState} from 'react'
import PackCard from '@/components/shared/pack/card'

export default function PackAdd() {
    const {setCurrentResource} = useResourceStore()
    const user = useUserAccountStore((state) => state.user)

    useEffect(() => {
        setCurrentResource({id: 'new', slug: 'new', display_name: 'Create a Pack', standalone: true})
    }, [])

    return (
        <div className="divide-default grid grid-cols-1 space-y-12 divide-y pb-48">
            {user && !user.anonUser && (
                <Body noPadding>
                    <CTA>
                        <CTABody>
                            <Heading>A pack for your pack~</Heading>
                            <p className="text-alt text-sm">
                                They're groups of people like you, who share the same interests. There's no limit to how many you can join, and they appear in your home
                                feed, so go wild!
                            </p>
                            <div className="flex flex-col space-y-4">
                                <CreateGroupSidebar/>
                            </div>
                        </CTABody>

                        <CTASideImage src="/img/illustrations/settings/friends.svg" alt=""/>
                    </CTA>
                </Body>
            )}

            <div className="flex flex-col space-y-12 px-4 pt-12 sm:px-6 lg:px-12">
                <SearchablePackList/>
            </div>
        </div>
    )
}

const postPrivacy: {
    id: string
    name: string
    desc: string
    warn?: string
}[] = [
    {
        id: 'everyone',
        name: 'Public',
        desc: 'Everyone in the world can see this',
    },
    // {
    //     id: 'followers',
    //     name: 'Followers Only',
    //     desc: 'Only your followers can see this',
    //     warn: 'Your friends are counted as followers',
    // },
    // {
    //     id: 'friends',
    //     name: 'Friends Only',
    //     desc: 'Only your friends can see this',
    // },
    // {
    //     id: 'private',
    //     name: 'Private',
    //     desc: 'Just for you and people you invite',
    // },
]

function CreateGroupSidebar() {
    const [onboardOpen, setOnboardOpen] = useState(false)
    const [selected, setSelected] = useState(postPrivacy[0])
    const [submitting, setSubmitting] = useState(false)

    const createPack = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (submitting) return
        setSubmitting(true)

        vg.pack.create
            .post({
                display_name: event.currentTarget.display_name.value,
                slug: event.currentTarget.slug.value,
                description: event.currentTarget.description.value,
                // privacy: selected.id,
            })
            .then(({data, error}) => {
                if (error) {
                    setSubmitting(false)
                    toast.error(
                        `Whoops! ${error.status}: ${
                            (error.status as unknown as number) === 403 ? 'You are not authorized to perform this action.' : error.value.summary
                        }${error.value.property ? ` (/${error.value.on}${error.value.property})` : ''}`,
                    )
                    return
                }

                setOnboardOpen(false)
                setSubmitting(false)
                window.location.href = `/p/${data.slug}`
            })
    }

    return (
        <>
            <Button onClick={() => setOnboardOpen(true)}>Create a Pack</Button>
            <Transition show={onboardOpen} as={Fragment}>
                <Dialog as="div" className="fixed inset-0 z-50 overflow-hidden" onClose={setOnboardOpen}>
                    <TransitionChild
                        as="div"
                        enter="ease-in-out duration-500"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in-out duration-500"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                        className="fixed inset-0 p-8 backdrop-blur-[0.15rem]"
                    >
                        <Heading size="3xl">Something will show here. Probably templates, or a live theme editor, who knows.</Heading>
                        <Text className="mt-4">For now just take this i guess.</Text>
                        {/*<img src={PackDefaultHeader} className="fixed inset-0 -z-1 h-screen w-screen opacity-90 transition-opacity" alt="Default pack header" />*/}
                    </TransitionChild>

                    <div className="absolute inset-0 overflow-hidden">
                        {/*<Dialog.Overlay className="absolute inset-0" />*/}

                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
                            <TransitionChild
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
                                            <div className="rounded-bl rounded-br bg-white/50 px-4 py-6 shadow-sm dark:bg-n-6/50 sm:px-6">
                                                <div className="flex items-center justify-between">
                                                    <DialogTitle className="text-default select-none text-lg font-medium"> Create a Pack </DialogTitle>
                                                    <div className="ml-3 flex h-7 items-center">
                                                        <Button disabled={submitting} type="reset" variant="ghost" size="self" onClick={() => setOnboardOpen(false)}>
                                                            <span className="sr-only">Close panel</span>
                                                            <XMarkIcon className="h-6 w-6" aria-hidden="true"/>
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="mt-1 space-y-1">
                                                    <Text alt>Packs are a group of people with self-elected leaders and customisable UI.</Text>
                                                    <Text alt>
                                                        Making edits to critical components that directly affect public perception (i.e. name, tagline, etc.) and some UI
                                                        changes costs "trinkets", a meaningless currency your pack can earn monthly.{' '}
                                                        {/*<span className="text-destructive/90">*/}
                                                        {/*    Changing the @slug later resets all data, including posts, and users will receive a notification re-confirming*/}
                                                        {/*    if they want to stay.*/}
                                                        {/*</span>*/}
                                                    </Text>
                                                </div>
                                            </div>

                                            <div className="flex flex-1 flex-col justify-between">
                                                <div className="divide-y divide-neutral-200 px-4 dark:divide-neutral-700 sm:px-6">
                                                    <div className="space-y-6 pb-5 pt-6">
                                                        <div>
                                                            <Input label="Pack Name" name="display_name" description="Minor edits (up to 5T/month) can be done later."/>
                                                        </div>
                                                        <div>
                                                            <Input
                                                                label="Pack Slug"
                                                                description="Changing this later will reset the pack!"
                                                                name="slug"
                                                                suffix="packbase.app/p/"
                                                                inputClassName="lowercase"
                                                            />
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
                                                            <legend className="text-default select-none text-sm font-medium">Privacy</legend>
                                                            <div className="mt-2 space-y-5">
                                                                <RadioGroup value={selected} onChange={setSelected}>
                                                                    <Label className="sr-only select-none">Privacy</Label>
                                                                    <div className="space-y-2">
                                                                        {postPrivacy.map((privacyOption) => (
                                                                            <Radio
                                                                                key={privacyOption.name}
                                                                                value={privacyOption}
                                                                                className={({focus, checked}) =>
                                                                                    `${
                                                                                        focus
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
                                                                                {({checked}) => (
                                                                                    <>
                                                                                        <div className="flex w-full items-center justify-between">
                                                                                            <div className="flex items-center">
                                                                                                <div className="text-sm">
                                                                                                    <Label
                                                                                                        as="p"
                                                                                                        className={`font-medium  ${
                                                                                                            checked ? 'text-default' : 'text-alt'
                                                                                                        }`}
                                                                                                    >
                                                                                                        {privacyOption.name}
                                                                                                    </Label>
                                                                                                    <Description as="span" className="text-alt inline">
                                                                                                        <span>{privacyOption.desc}</span>{' '}
                                                                                                        {privacyOption.warn && (
                                                                                                            <p className="inline-flex items-center">
                                                                                                                <QuestionMarkCircleIcon className="text-alt h-4 w-4"/>
                                                                                                                <span className="ml-1">{privacyOption.warn}</span>
                                                                                                            </p>
                                                                                                        )}
                                                                                                    </Description>
                                                                                                </div>
                                                                                            </div>
                                                                                            {checked && (
                                                                                                <div className="text-default shrink-0">
                                                                                                    <CheckIcon className="h-6 w-6"/>
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
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 justify-end space-x-2 px-4 py-4">
                                            <Button disabled={submitting} type="reset" variant="grey" onClick={() => setOnboardOpen(false)}>
                                                Cancel
                                            </Button>
                                            <Button disabled={submitting}>{!submitting ? 'Create' : <LoadingCircle className="invert"/>}</Button>
                                        </div>
                                    </form>
                                </div>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>
    )
}

function SearchablePackList() {
    // from the dummy wireframe figma
    const [packs, setPacks] = useState([])
    const [packsHidden, setPacksHidden] = useState<number>(0)

    useEffect(() => {
        vg.packs.get().then(({data}) => {
            // Set packs except for 'universe' slug
            setPacks(data?.packs.filter((pack) => pack.slug !== 'universe') || [])
            setPacksHidden(data?.hidden)
        })
    }, [])

    return (
        <>
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <Heading size="lg">Search Packs</Heading>
                    {packsHidden > 0 && (
                        <Text size="sm" alt>
                            {packsHidden} pack already apart of
                        </Text>
                    )}
                </div>
                <div className="mt-3 sm:ml-4 sm:mt-0">
                    <label htmlFor="desktop-search-pack" className="sr-only">
                        Search
                    </label>
                    <div className="flex rounded-md shadow-xs">
                        <div className="relative grow focus-within:z-10">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <MagnifyingGlassIcon className="text-default-alt h-5 w-5" aria-hidden="true"/>
                            </div>
                            <div
                                className="flex rounded-md rounded-br-none rounded-tr-none bg-white shadow-xs ring-1 ring-inset ring-neutral-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600! dark:bg-white/5 dark:ring-white/10 sm:max-w-md">
                                <input
                                    type="text"
                                    name="desktop-search-pack"
                                    id="desktop-search-pack"
                                    autoComplete="none"
                                    className="no-legacy text-default block flex-1 border-0 bg-transparent py-2.5 pl-10 pr-3 placeholder:text-neutral-400 focus:ring-0 sm:text-sm sm:leading-6"
                                    placeholder="Search packs"
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            className="bg-default text-default hover:bg-default-alt relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-neutral-300 dark:ring-white/10"
                        >
                            <BarsArrowUpIcon className="text-default-alt -ml-0.5 h-5 w-5" aria-hidden="true"/>
                            Sort
                            <ChevronDownIcon className="text-default-alt -mr-1 h-5 w-5" aria-hidden="true"/>
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {packs.map((pack) => (
                    <PackCard key={pack.id} pack={pack}/>
                ))}
            </div>
        </>
    )
}
