'use client'
import Button from '@/components/shared/button'
import Avatar from '@/components/shared/user/avatar'
import {ArrowUpRightIcon, PhotoIcon, UserCircleIcon} from '@heroicons/react/24/solid'
import {useEffect, useState} from 'react'
import {useUserAccountStore} from '@/lib/states'
import {Heading, Text} from '@/components/shared/text'
import {ProjectName} from '@/lib/utils'
import ProfileHeader from '@/components/shared/user/header'
import {createClient} from '@/lib/supabase/client'

export default function SettingsGeneral() {
    const {user} = useUserAccountStore()
    const [handleInput, setHandleInput] = useState<string | null>(user?.username)
    const [slugInput, setSlugInput] = useState<string | null>(user?.slug)
    const [nicknameInput, setNicknameInput] = useState<string | null>(user?.displayName)
    const [aboutInput, setAboutInput] = useState<string | null>(user?.bio)

    // Profile pic and cover pic upload fields
    const [profilePicUpload, setProfilePicUpload] = useState<File | null>(null)
    const [coverPicUpload, setCoverPicUpload] = useState<File | null>(null)

    // Profile pic and cover pic upload previews
    const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null)
    const [coverPicPreview, setCoverPicPreview] = useState<string | null>(null)

    useEffect(() => {
        if (profilePicUpload) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setProfilePicPreview(reader.result as string)
            }
            reader.readAsDataURL(profilePicUpload)
        } else {
            setProfilePicPreview(null)
        }
    }, [profilePicUpload])

    useEffect(() => {
        if (coverPicUpload) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setCoverPicPreview(reader.result as string)
            }
            reader.readAsDataURL(coverPicUpload)
        } else {
            setCoverPicPreview(null)
        }
    }, [coverPicUpload])

    const saveProfile = async () => {
        const supabase = createClient()
        const profile = {
            id: user.id,
            username: handleInput,
            slug: slugInput,
            display_name: nicknameInput,
            bio: aboutInput
        }
        if (user?.reqOnboard) {
            await supabase.from('profiles').insert(profile)
        } else {
            await supabase.from('profiles').update(profile).eq('id', user.id)
        }
    }

    return (
        <div className="max-w-6xl mx-auto">
            <form>
                <div className="space-y-12 mx-auto">
                    <div className="bg-card pb-12 rounded">
                        <ProfileHeader user={{
                            username: handleInput || user?.username,
                            displayName: nicknameInput,
                            about: aboutInput,
                            images: {
                                avatar: profilePicPreview || user?.images?.avatar,
                                header: coverPicPreview || user?.images?.header
                            },
                            followers: 69,
                            following: 420,
                            posts: 1337,
                        }}/>
                    </div>
                    <div className="border-b pb-12">
                        <Heading size="xl">
                            Public Profile
                        </Heading>
                        <Text className="mt-1 text-alt">
                            This information will be displayed publicly so be careful what you share. View above
                            to see how it will look.
                        </Text>

                        <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                            <div className="relative sm:col-span-4">
                                <label htmlFor="username" className="block text-sm font-medium leading-6 text-default">
                                    Space URL & Username
                                    <Text size="xs" className="text-alt">
                                        Your username is used to find and reference you across {ProjectName}. Your Space
                                        URL holds your personal customised site.
                                    </Text>
                                </label>
                                <div className="mt-2">
                                    <div
                                        className="flex rounded-md bg-default shadow-sm ring-1 ring-inset ring-neutral-300 dark:ring-neutral-800 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md">
                                        <input
                                            type="text"
                                            name="slug"
                                            id="slug"
                                            autoComplete="slug"
                                            className="no-legacy block flex-1 border-0 bg-transparent py-1.5 px-3 text-default placeholder:text-neutral-400 focus:ring-0 sm:text-sm sm:leading-6"
                                            value={slugInput || ''}
                                            onChange={(e) => setSlugInput(e.target.value)}
                                        />
                                        <span
                                            className="flex select-none items-center pr-3 text-neutral-500 sm:text-sm">.packbase.app</span>
                                    </div>
                                    <Text size="xs" className="mt-1 text-alt">
                                        This is used to access your personal space - not your main profile.
                                    </Text>
                                </div>

                                <div className="mt-2">
                                    <div
                                        className="flex rounded-md bg-default shadow-sm ring-1 ring-inset ring-neutral-300 dark:ring-neutral-800 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md">
                                    <span
                                        className="flex select-none items-center pl-3 text-neutral-500 sm:text-sm">@</span>
                                        <input
                                            type="text"
                                            name="username"
                                            id="username"
                                            autoComplete="username"
                                            className="no-legacy block flex-1 border-0 bg-transparent py-1.5 pl-1 text-default placeholder:text-neutral-400 focus:ring-0 sm:text-sm sm:leading-6"
                                            value={handleInput || ''}
                                            onChange={(e) => setHandleInput(e.target.value)}
                                        />
                                    </div>
                                    <Text size="xs" className="mt-1 text-alt">
                                        This is used for others to find you and your profile.
                                    </Text>
                                </div>
                            </div>

                            <div className="sm:col-span-4">
                                <label htmlFor="display_name"
                                       className="block text-sm font-medium leading-6 text-default">
                                    Display Name
                                </label>
                                <div className="mt-2">
                                    <div
                                        className="flex rounded-md bg-default shadow-sm ring-1 ring-inset ring-neutral-300 dark:ring-neutral-800 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md">
                                        <input
                                            type="text"
                                            name="display_name"
                                            id="display_name"
                                            autoComplete="display_name"
                                            className="no-legacy block flex-1 border-0 bg-transparent py-1.5 px-3 text-default placeholder:text-neutral-400 focus:ring-0 sm:text-sm sm:leading-6"
                                            placeholder="Some Display Name"
                                            value={user?.displayName}
                                            onChange={(e) => setNicknameInput(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <Text size="xs" className="mt-1 text-alt">
                                    This appears alongside your username.
                                </Text>
                            </div>

                            <div className="col-span-full">
                                <label htmlFor="about" className="block text-sm font-medium leading-6 text-default">
                                    About
                                </label>
                                <div className="mt-2">
                                <textarea
                                    id="about"
                                    name="about"
                                    rows={3}
                                    className="no-legacy block w-full rounded-md border-0 py-1.5 text-default bg-default shadow-sm ring-1 ring-inset ring-neutral-300 dark:ring-neutral-800 placeholder:text-neutral-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                    defaultValue={user?.bio || ''}
                                    onChange={(e) => setAboutInput(e.target.value)}
                                />
                                </div>
                                <p className="mt-3 text-sm leading-6 text-default-alt">
                                    Write a few sentences about yourself. <a href="https://commonmark.org/help/"
                                                                             target="_blank"
                                                                             rel="noopener noreferrer"
                                                                             className="text-primary">Markdown <ArrowUpRightIcon
                                    className="h-4 w-4 inline"/></a> is supported.
                                </p>
                            </div>

                            <div className="col-span-full">
                                <label htmlFor="avatar" className="block text-sm font-medium leading-6 text-default">
                                    Photo
                                </label>
                                <input type="file" name="avatar" id="avatar" className="hidden"
                                       onChange={(e) => setProfilePicUpload(e.target.files?.[0] || null)}/>
                                <div className="mt-2 flex items-center gap-x-3">
                                    {!profilePicPreview
                                        ? <UserCircleIcon className="h-12 w-12 text-default-alt" aria-hidden="true"/>
                                        : <Avatar avatar={profilePicPreview} size="lg"/>
                                    }
                                    <Button onClick={() => document.getElementById('avatar')?.click()}>
                                        Upload
                                    </Button>
                                </div>
                                <p className="mt-3 text-sm leading-6 text-default-alt">
                                    We don't resize your photo. Scroll up to the header to see how it will look.
                                </p>
                            </div>

                            <div className="col-span-full">
                                <label htmlFor="cover-photo"
                                       className="block text-sm font-medium leading-6 text-default">
                                    Cover photo
                                </label>
                                <div
                                    className="relative aspect-banner mt-2 flex items-center justify-center bg-card rounded border border-dashed px-6 py-10 cursor-pointer overflow-hidden"
                                    onClick={() => document.getElementById('cover-photo')?.click()}>
                                    {coverPicPreview && (
                                        <img src={coverPicPreview} alt=""
                                             className="absolute inset-0 w-full h-full object-cover rounded-lg blur-lg opacity-50"/>
                                    )}
                                    <div className="text-center items-center justify-center">
                                        <PhotoIcon className="mx-auto h-12 w-12 text-default-alt" aria-hidden="true"/>
                                        <div className="mt-4 flex text-sm leading-6 text-default-alt">
                                            <label
                                                htmlFor="cover-photo"
                                                className="relative cursor-pointer rounded-md font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
                                            >
                                                <span>Upload a file</span>
                                                <input id="cover-photo" name="file-upload" type="file"
                                                       className="sr-only"
                                                       onChange={(e) => setCoverPicUpload(e.target.files?.[0] || null)}/>
                                            </label>
                                            <p className="pl-1">(drag and drop not supported)</p>
                                        </div>
                                        <p className="text-xs leading-5 text-default-alt">PNG, JPG, GIF up to 10MB,
                                            Aspect
                                            Ratio 3 / 1</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-x-6">
                    <Button onClick={saveProfile}>
                        Save
                    </Button>
                </div>
            </form>
        </div>
    )
}
