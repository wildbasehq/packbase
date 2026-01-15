import {ContentModerationPopoverProps} from '@/components/feed/content-moderation/cmpopover'
import {vg} from '@/lib'
import FormToJSON from '@/lib/utils/FormJSON'
import {BubblePopover, Button, Description, Field, FieldGroup, Input, Label, PopoverHeader, Text} from '@/src/components'
import {ShieldBanIcon} from 'lucide-react'
import {FormEvent, useState} from 'react'

export function IssueWarning({post}: ContentModerationPopoverProps) {
    const [submissionState, setSubmissionState] = useState<'idle' | 'pending' | 'success'>('idle')

    const warn = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setSubmissionState('pending')

        const data = FormToJSON<{
            reason: string
        }>(e.target)

        console.log(data)

        if (data?.reason) {
            const reason = data.reason

            await vg.howl({id: post.id}).warn.post({
                reason
            }).then(({status, error}) => {
                if (status === 200) {
                    setSubmissionState('success')
                    alert('Warning issued!')
                } else {
                    setSubmissionState('idle')
                    alert('Failed to issue warning: ' + error?.value?.summary || 'Unknown error')
                }
            })
        }
    }
    return (
        <BubblePopover
            isCentered
            corner="top-right"
            id={`cm-issue-warning-${post.id}`}
            trigger={({setOpen}) => (
                <Button
                    type="button"
                    icon
                    color="icon/red"
                    onClick={() => setOpen(true)}
                    aria-label="Issue Warning"
                >
                    <ShieldBanIcon className="h-4 w-4"/>
                </Button>
            )}
        >
            {({setOpen}) => (
                <PopoverHeader
                    title="Issuing Warning"
                    description={
                        <form onSubmit={(e) => {
                            warn(e).finally(() => {
                                setOpen(false)
                            })
                        }} className="space-y-4">
                            <Text>
                                You're actioning as a Packbase Content Moderator.
                            </Text>
                            <FieldGroup>
                                <Field>
                                    <Label>Reason</Label>
                                    <Description>
                                        It must be one or two sentences, and cannot be a generic message.
                                        This immediately punishes the user and the reason <b><u>will be public.</u></b>
                                    </Description>

                                    <Input name="reason" required/>
                                </Field>
                            </FieldGroup>

                            <Button color="red" type="submit" className="w-full" submissionState={submissionState || 'idle'}>
                                punish them good pls
                            </Button>
                        </form>
                    }
                    variant="destructive"
                />
            )}
        </BubblePopover>
    )
}