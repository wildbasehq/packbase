import {Heading, Text} from '@/components/shared/text.tsx'
import {Alert, AlertDescription, AlertTitle} from '@/components/shared/alert.tsx'
import {UserCircleIcon} from '@heroicons/react/24/solid'
import UserAvatar from '@/components/shared/user/avatar.tsx'
import {Button, Field, Input, Label, Textarea} from '@/components/shared'
import {vg} from '@/lib/api'
import {toast} from 'sonner'
import {Activity, createRef, FormEvent, useEffect, useState} from 'react'
import {isVisible, useResourceStore} from '@/lib'
import {HandRaisedIcon} from "@heroicons/react/16/solid";
import {motion} from "motion/react";

export default function ResourceSettingsGeneral() {
    const {currentResource, setCurrentResource, resources, setResources} = useResourceStore()
    // For pack avatar upload
    const [profilePicUpload, setProfilePicUpload] = useState<File | undefined>()
    const [profilePicPreview, setProfilePicPreview] = useState<string | undefined>()
    const [headerPicUpload, setHeaderPicUpload] = useState<File | undefined>()
    const [headerPicPreview, setHeaderPicPreview] = useState<string | undefined>()
    const [submitting, setSubmitting] = useState<boolean>(false)
    const [hasChanges, setHasChanges] = useState<boolean>(false)

    useEffect(() => {
        if (profilePicUpload) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setProfilePicPreview(reader.result as string)
            }
            reader.readAsDataURL(profilePicUpload)
        } else {
            setProfilePicPreview(undefined)
        }

        if (headerPicUpload) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setHeaderPicPreview(reader.result as string)
            }
            reader.readAsDataURL(headerPicUpload)
        } else {
            setHeaderPicPreview(undefined)
        }
    }, [profilePicUpload, headerPicUpload])

    const fields = {
        display_name: {
            ref: createRef<HTMLInputElement>(),
        },
        slug: {
            ref: createRef<HTMLInputElement>(),
        },
        description: {
            ref: createRef<HTMLInputElement>(),
            type: 'textarea',
            api: 'about.bio',
        },
    }

    useEffect(() => {
        for (let ref in fields) {
            const fieldData = fields[ref]
            if (fieldData.ref?.current) {
                if ('api' in fieldData && fieldData.api) {
                    fieldData.ref.current.value = getObjectFromStringPath(currentResource, fieldData.api) || ''
                } else {
                    fieldData.ref.current.value = currentResource[ref] || ''
                }
            }
        }
    }, [])

    const getObjectFromStringPath = (obj: any, path: string) => {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj)
    }

    const snakeToTitle = (str: string) => {
        return str
            .split('__')[0]
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
    }

    const aggregateSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setSubmitting(true)

        // Helper function to build nested object structure
        const buildNestedObject = (path: string[], value: any) => {
            return path.reduceRight((acc, key) => ({[key]: acc}), value)
        }

        // Prepare the update object
        const packUpdate = {
            ...(profilePicPreview && {images: {avatar: profilePicPreview}}),
            ...(headerPicPreview && {
                images: {
                    ...((profilePicPreview && {avatar: profilePicPreview}) || {}),
                    header: headerPicPreview
                }
            }),
            ...Object.entries(fields).reduce((acc, [field, fieldData]) => {
                const value = fieldData.ref?.current.value
                if (!value) return acc

                if ('api' in fieldData && fieldData.api) {
                    const path = fieldData.api.split('.')
                    return {
                        ...acc,
                        ...buildNestedObject(path, value)
                    }
                }

                return {
                    ...acc,
                    [field]: value
                }
            }, {})
        }

        // Clean empty values
        const cleanedUpdate = Object.entries(packUpdate).reduce((acc, [key, value]) => {
            if (value && value !== '') {
                acc[key] = value
            }
            return acc
        }, {} as Record<string, any>)

        vg.pack({id: currentResource.id})
            .post(cleanedUpdate)
            .then(({error}) => {
                if (error) {
                    const errorMessage = (error.status as unknown as number) === 403
                        ? 'You are not authorized to perform this action.'
                        : error.value.summary
                    const propertyInfo = error.value.property
                        ? ` (/${error.value.on}${error.value.property})`
                        : ''
                    toast.error(`Whoops! ${error.status}: ${errorMessage}${propertyInfo}`)
                    return
                }

                toast.success('Settings saved!')

                setHasChanges(false)

                // Update resources with new data
                if (cleanedUpdate.images) {
                    cleanedUpdate.images = {
                        avatar: cleanedUpdate.images.avatar || currentResource.images.avatar,
                        header: cleanedUpdate.images.header || currentResource.images.header
                    }
                }

                const newResources = resources.map(r =>
                    r.id === currentResource.id ? {...r, ...cleanedUpdate} : r
                )
                setResources(newResources)
                setCurrentResource(newResources.find(r => r.id === currentResource.id))
            })
            .catch(e => {
                if (e.message?.includes('exceeded the quota')) {
                    return window.location.reload()
                }

                console.error(e)
                toast.error(e.message)
            })
            .finally(() => setSubmitting(false))
    }
    return (
        <form onSubmit={aggregateSubmit} onChange={() => setHasChanges(true)}>
            <div className="flex flex-1 flex-col gap-4 pb-12">
                <div>
                    <Heading>Settings</Heading>
                    <Text alt>Change pack settings</Text>
                </div>

                <Alert variant="destructive">
                    <AlertTitle>Trinkets will be required soon!</AlertTitle>
                    <AlertDescription>
                        Trinkets (T) are a new feature that will be required to perform certain actions in the future.
                        You can earn trinkets
                        from your community interacting with your pack, which is already counting! You can never buy or
                        exchange Trinkets
                        with real money.
                    </AlertDescription>
                </Alert>

                {/* form */}
                <div className="flex flex-col gap-4">
                    <div className="col-span-full">
                        <label htmlFor="avatar"
                               className="text-default block select-none text-sm font-medium leading-6">
                            Photo
                        </label>
                        <Input
                            type="file"
                            name="avatar"
                            accept="image/*"
                            id="avatar"
                            className="hidden!"
                            onChange={e => setProfilePicUpload(e.target.files?.[0] || undefined)}
                        />
                        <div className="mt-2 flex items-center gap-x-3">
                            <Activity mode={isVisible(!!profilePicPreview)}>
                                <UserAvatar icon={profilePicPreview} size="lg"/>
                            </Activity>
                            <Activity mode={isVisible(!profilePicPreview)}>
                                <UserCircleIcon className="text-muted-foreground h-12 w-12" aria-hidden="true"/>
                            </Activity>
                            <Button outline onClick={() => document.getElementById('avatar')?.click()}>
                                <div>Upload</div>
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2">
                        {/* Header image */}
                        <div>
                            <label htmlFor="header"
                                   className="text-default block select-none text-sm font-medium leading-6">
                                Header
                            </label>
                            <input
                                type="file"
                                name="header"
                                accept="image/*"
                                id="header"
                                className="hidden"
                                onChange={e => setHeaderPicUpload(e.target.files?.[0] || undefined)}
                            />
                            <div className="mt-2 flex items-center gap-x-3">
                                <Button outline onClick={() => document.getElementById('header')?.click()}>
                                    <div>Upload</div>
                                </Button>
                            </div>
                        </div>

                        <div className="aspect-3/1 rounded-lg bg-n-2/25">
                            {headerPicPreview ? (
                                <img src={headerPicPreview} alt="Header preview" className="rounded-lg object-cover"/>
                            ) : (
                                <div className="text-default flex h-full items-center justify-center">
                                    <Text alt>Upload a header image</Text>
                                </div>
                            )}
                        </div>
                    </div>

                    {Object.keys(fields).map((key, i) => (
                        fields[key].type === 'textarea' ? (<Field key={i}>
                            <Label htmlFor={snakeToTitle(key)}>
                                {snakeToTitle(key)}
                            </Label>
                            <Textarea
                                ref={fields[key].ref}
                                name={snakeToTitle(key)}
                                resizable
                            />
                        </Field>) : (<Field key={i}>
                            <Label htmlFor={snakeToTitle(key)}>
                                {snakeToTitle(key)}
                            </Label>
                            <Input
                                ref={fields[key].ref}
                                name={snakeToTitle(key)}
                                type={fields[key].type || 'text'}
                            />
                        </Field>)
                    ))}
                </div>
            </div>

            <motion.div
                animate={hasChanges ? 'visible' : 'hidden'}
                initial="hidden"
                variants={{
                    visible: {
                        y: 0,
                        scale: 1,
                        opacity: 1,
                        pointerEvents: 'auto'
                    },
                    hidden: {
                        y: 100,
                        scale: 0.85,
                        opacity: 0,
                        pointerEvents: 'none'
                    },
                }}
                transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 25,
                    duration: 0.65,
                }}
                className="w-full z-50 fixed left-0 right-0 bottom-0"
            >
                <div
                    className="mask-t-from-0 backdrop-blur-[1px] bg-linear-to-b from-transparent -z-1 to-background w-full h-24 fixed -bottom-2 left-0 right-0"
                />
                <div
                    className="flex justify-between rounded-2xl items-center z-10 gap-2 p-2 my-4 w-fit mx-auto dark min-h-10 min-w-[21.25rem] bg-n-7 bg-linear-to-b from-white/12 to-transparent pl-3 shadow-panel-n-7 dark:shadow-panel-black/8"
                >
                    <div className="flex items-center">
                        <HandRaisedIcon className="inline-block w-4 h-4 mr-1 text-muted-foreground"/>
                        <Text className="text-white text-xs!">
                            You have unsaved changes.
                        </Text>
                    </div>
                    <div className="flex-1"/>
                    <Button color="indigo" type="submit" className="text-xs! py-1! px-2!"
                            disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
                </div>
            </motion.div>
        </form>
    )
}
