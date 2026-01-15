import {ContentModerationPopoverProps} from '@/components/feed/content-moderation/cmpopover'
import {TagsInput} from '@/components/howl-creator/tags-input'
import {BubblePopover, Button, Description, Field, FieldGroup, Input, Label, PopoverHeader, Text} from '@/src/components'
import {PencilIcon} from '@heroicons/react/24/outline'
import {useState} from 'react'

export function IssueTagReplacement({post, onAction}: ContentModerationPopoverProps) {
    const [tags, setTags] = useState<string>(post.tags.join(' '))

    return (
        <BubblePopover
            isCentered
            corner="top-right"
            id={`cm-issue-tag-replacement-${post.id}`}
            trigger={({setOpen}) => (
                <Button
                    type="button"
                    icon
                    color="icon/amber"
                    onClick={() => setOpen(true)}
                    aria-label="Issue tag replacement"
                >
                    <PencilIcon className="h-4 w-4"/>
                </Button>
            )}
        >
            <PopoverHeader
                title="Issuing tag replacement"
                description={
                    <form onSubmit={(e) => {
                        e.preventDefault()
                        onAction?.()
                    }} className="space-y-4">
                        <Text>
                            You're actioning as a Packbase Content Moderator.
                        </Text>
                        <Text>
                            Tags will bypass moderation and the system will immediately
                            recognise it.
                        </Text>
                        <FieldGroup>
                            <Field>
                                <TagsInput value={tags} onChange={setTags}/>
                            </Field>
                            <Field>
                                <Label>Reason for replacement</Label>
                                <Description>
                                    It must be one or two sentences, and cannot be a generic message.
                                    If replacing a rating, it will immediately punish the user and cannot
                                    be bypassed.
                                </Description>

                                <Input id="audit_reason" required/>
                            </Field>
                        </FieldGroup>

                        <Button color="red" type="submit" className="w-full">
                            Replace
                        </Button>
                    </form>
                }
                variant="warning"
            />
        </BubblePopover>
    )
}