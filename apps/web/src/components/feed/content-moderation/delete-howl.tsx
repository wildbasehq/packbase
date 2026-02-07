import {ContentModerationPopoverProps} from '@/components/feed/content-moderation/cmpopover'
import {useUserAccountStore} from '@/lib'
import {canContentModerate} from '@/lib/utils/can-content-moderate'
import FormToJSON from '@/lib/utils/FormJSON'
import {BubblePopover, Button, Description, Divider, Field, FieldGroup, Input, Label, PopoverHeader, Text} from '@/src/components'
import {TrashIcon} from '@heroicons/react/24/outline'

export function DeleteHowl({post, onAction}: ContentModerationPopoverProps) {
    const {user} = useUserAccountStore()

    return (
        <BubblePopover
            isCentered
            corner="top-right"
            trigger={({setOpen}) => (
                <Button
                    type="button"
                    icon
                    color="icon/red"
                    onClick={() => setOpen(true)}
                    aria-label="Delete howl"
                >
                    <TrashIcon className="w-4 h-4"/>
                </Button>
            )}
        >
            <PopoverHeader
                title="Delete Howl?"
                description={
                    <>
                        Deleting a howl is permanent and cannot be undone.
                        {(post.user.id !== user.id && canContentModerate(user)) && (
                            <form onSubmit={(e) => {
                                e.preventDefault()

                                const formData = FormToJSON<{
                                    audit_reason: string
                                }>(e.currentTarget)

                                onAction(formData.audit_reason)
                            }} className="space-y-4">
                                <Divider className="my-2"/>
                                <Text>
                                    You're actioning as a Packbase Content Moderator.
                                </Text>
                                <FieldGroup>
                                    <Field>
                                        <Label>Reason for deletion</Label>
                                        <Description>
                                            It must be one or two sentences, and cannot be a generic message.
                                            This immediately punishes the user and can't be bypassed.
                                            If you just want to warn the user, use "Issue Warning" dialog instead.
                                        </Description>

                                        <Input name="audit_reason" required/>
                                    </Field>
                                </FieldGroup>

                                <Button color="red" type="submit" className="w-full">
                                    Delete
                                </Button>
                            </form>
                        )}
                    </>
                }
                onPrimaryAction={(post.user.id !== user.id && canContentModerate(user)) ? undefined : onAction}
                variant="destructive"
            />
        </BubblePopover>
    )
}