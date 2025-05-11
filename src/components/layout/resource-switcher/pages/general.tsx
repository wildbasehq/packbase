import { Heading, Text } from '@/components/shared/text.tsx'
import { Alert, AlertDescription, AlertTitle } from '@/components/shared/alert.tsx'
import { UserCircleIcon } from '@heroicons/react/24/solid'
import UserAvatar from '@/components/shared/user/avatar.tsx'
import { Button } from '@/components/shared/button.tsx'
import { Input } from '@/components/shared/input/text.tsx'
import { vg } from '@/lib/api'
import { toast } from 'sonner'
import { createRef, useEffect, useState } from 'react'
import { useResourceStore } from '@/lib/index'

export default function ResourceSettingsGeneral() {
    const { currentResource, setCurrentResource, resources, setResources } = useResourceStore()
    // For pack avatar upload
    const [profilePicUpload, setProfilePicUpload] = useState<File | undefined>()
    const [profilePicPreview, setProfilePicPreview] = useState<string | undefined>()
    const [headerPicUpload, setHeaderPicUpload] = useState<File | undefined>()
    const [headerPicPreview, setHeaderPicPreview] = useState<string | undefined>()

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
            if (fields[ref].ref?.current) {
                if (fields[ref].api) {
                    fields[ref].ref.current.value = getObjectFromStringPath(currentResource, fields[ref].api) || ''
                } else {
                    fields[ref].ref.current.value = currentResource[ref] || ''
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

    const aggregateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        let packUpdate: any = {}
        if (profilePicPreview) {
            packUpdate.images = { avatar: profilePicPreview }
        }

        if (headerPicPreview) {
            packUpdate.images = { ...packUpdate.images, header: headerPicPreview }
        }

        for (let field in fields) {
            if (fields[field].api) {
                // 'about.bio' -> { about: { bio: value } }
                const path = fields[field].api.split('.')
                let obj = packUpdate
                for (let i = 0; i < path.length - 1; i++) {
                    obj[path[i]] = {}
                    obj = obj[path[i]]
                }
                obj[path[path.length - 1]] = fields[field].ref?.current.value
            } else {
                packUpdate[field] = fields[field].ref?.current.value
            }
        }

        // Remove undefined, null, empty strings
        for (let key in packUpdate) {
            if (!packUpdate[key] || packUpdate[key] === '') {
                delete packUpdate[key]
            }
        }

        vg.pack({ id: currentResource.id })
            .post(packUpdate)
            .then(({ error }) => {
                if (error) {
                    toast.error(
                        `Whoops! ${error.status}: ${
                            (error.status as unknown as number) === 403
                                ? 'You are not authorized to perform this action.'
                                : error.value.summary
                        }${error.value.property ? ` (/${error.value.on}${error.value.property})` : ''}`
                    )
                } else {
                    toast.success('Settings saved!')
                    // Set resources to reflect changes
                    if (packUpdate.images) {
                        packUpdate.images.avatar = packUpdate.images.avatar || currentResource.images.avatar
                        packUpdate.images.header = packUpdate.images.header || currentResource.images.header
                    }
                    const newResources = resources.map(r => (r.id === currentResource.id ? { ...r, ...packUpdate } : r))
                    setResources(newResources)
                    setCurrentResource(newResources.find(r => r.id === currentResource.id))
                }
            })
            .catch(e => {
                toast.error(e.status)
            })
    }

    return (
        <form onSubmit={aggregateSubmit}>
            <div className="flex flex-1 flex-col gap-4">
                <div>
                    <Heading>Settings</Heading>
                    <Text alt>Change pack settings</Text>
                </div>

                <Alert variant="destructive">
                    <AlertTitle>Trinkets will be required soon!</AlertTitle>
                    <AlertDescription>
                        Trinkets (T) are a new feature that will be required to perform certain actions in the future. You can earn trinkets
                        from your community interacting with your pack, which is already counting! You can never buy or exchange Trinkets
                        with real money.
                    </AlertDescription>
                </Alert>

                {/* form */}
                <div className="flex flex-col gap-4">
                    <div className="col-span-full">
                        <label htmlFor="avatar" className="text-default block select-none text-sm font-medium leading-6">
                            Photo
                        </label>
                        <input
                            type="file"
                            name="avatar"
                            accept="image/*"
                            id="avatar"
                            className="hidden"
                            onChange={e => setProfilePicUpload(e.target.files?.[0] || undefined)}
                        />
                        <div className="mt-2 flex items-center gap-x-3">
                            {!profilePicPreview ? (
                                <UserCircleIcon className="text-alt h-12 w-12" aria-hidden="true" />
                            ) : (
                                <UserAvatar icon={profilePicPreview} size="lg" />
                            )}
                            <Button asChild variant="outline" onClick={() => document.getElementById('avatar')?.click()}>
                                <div>Upload</div>
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2">
                        {/* Header image */}
                        <div>
                            <label htmlFor="header" className="text-default block select-none text-sm font-medium leading-6">
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
                                <Button asChild variant="outline" onClick={() => document.getElementById('header')?.click()}>
                                    <div>Upload</div>
                                </Button>
                            </div>
                        </div>

                        <div className="aspect-3/1 rounded-lg bg-n-2/25">
                            {headerPicPreview ? (
                                <img src={headerPicPreview} alt="Header preview" className="rounded-lg object-cover" />
                            ) : (
                                <div className="text-default flex h-full items-center justify-center">
                                    <Text alt>Upload a header image</Text>
                                </div>
                            )}
                        </div>
                    </div>

                    {Object.keys(fields).map((key, i) => (
                        <div key={i}>
                            <Input
                                ref={fields[key].ref}
                                name={snakeToTitle(key)}
                                label={snakeToTitle(key)}
                                type={fields[key].type || 'text'}
                                rows={4}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* buttons */}
            <div className="flex justify-end gap-4">
                {/*<Button variant="ghost" onClick={() => hide()}>*/}
                {/*    Cancel*/}
                {/*</Button>*/}
                <Button variant="primary">Save</Button>
            </div>
        </form>
    )
}
