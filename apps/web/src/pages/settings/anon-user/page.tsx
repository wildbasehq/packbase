import React from 'react'
import {Input} from '@/components/shared/input/text'
import {Button} from '@/components/shared'
import {Heading, Text} from '@/components/shared/text'
import Link from '@/components/shared/link'
import {EnvelopeIcon} from '@heroicons/react/24/solid'
import {vg} from '@/lib/api'
import WolfoxDrawing from '@/src/images/png/wolfox-drawing.png'

const AnonUserSettings: React.FC = () => {
    const submitInviteCode = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const post = {
            invite_code: formData.get('invite_code')?.toString() || '',
            username: formData.get('username')?.toString() || '',
        }

        if (!post.invite_code) {
            alert('Please enter an invite code')
            return
        }
        if (!post.username) {
            alert('Please enter a username')
            return
        }

        vg.user.me
            .post({
                invite_code: formData.get('invite_code')?.toString() || '',
                username: formData.get('username')?.toString() || '',
            })
            .then(({status, data, error}) => {
                if (status === 200) window.location.reload()
                else {
                    if (status === 422) {
                        alert('Invalid invite code or unacceptable username!')
                        return
                    }

                    alert(data?.message || data?.error || error?.value.summary || JSON.stringify(error) || 'An error occurred')
                }
            })
            .catch((e) => {
                alert(e)
            })
    }

    return (
        <div className="h-full p-6 overflow-y-auto">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <div className="flex flex-col">
                    <Heading size="2xl" className="mb-4">
                        Got a code?!?
                    </Heading>
                    <div className="space-y-4">
                        <Text alt size="sm">
                            If yes, yippee! We're glad you're here. Please enter a valid invite code to get
                            started.{' '}
                            <span className="text-tertiary">
                                If you've traded anything for an invite, whether it be an art trade, or even money, you've been scammed.
                                Report that code instead and work on getting whatever you gave back.
                            </span>
                        </Text>
                        <Text alt size="sm">
                            If you haven't already, please familiarise yourself with our{' '}
                            <Link href="/terms">Community & Data Security Guidelines</Link>.
                        </Text>
                    </div>

                    <div className="flex flex-col mt-8">
                        <form onSubmit={submitInviteCode} className="space-y-4">
                            <div>
                                <label htmlFor="username" className="block mb-1 text-sm font-medium">
                                    Username
                                </label>
                                <Input name="username" id="username" placeholder="Desired username" className="w-full"
                                       required/>
                            </div>

                            <div>
                                <label htmlFor="invite_code" className="block mb-1 text-sm font-medium">
                                    Invite Code
                                </label>
                                <Input
                                    name="invite_code"
                                    id="invite_code"
                                    placeholder="Enter your invite code"
                                    className="w-full"
                                    required
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <EnvelopeIcon className="w-5 h-5 text-indigo-500"/>
                                <Text alt size="sm">
                                    Enter the invite code you received
                                </Text>
                            </div>

                            <Button color="indigo" type="submit" className="w-full sm:w-auto">
                                Submit Code
                            </Button>
                        </form>
                    </div>
                </div>

                <div className="items-center justify-center hidden lg:flex">
                    <img src={WolfoxDrawing} alt="Packbase Mascot" className="w-4/5 max-w-xs"/>
                </div>
            </div>
        </div>
    )
}

export default AnonUserSettings