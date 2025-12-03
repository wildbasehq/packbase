/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

// src/components/howl-creator/post-settings-modal.tsx
import {useState} from 'react'
import {Heading, Text} from '@/components/shared/text.tsx'
import {Button} from '@/components/shared/button'
import {TagsInput} from './tags-input'
import ContentLabelInput from './content-label-input'

export default function PostSettingsModal({
                                              selectedTags,
                                              selectedContentLabel,
                                              onClose,
                                          }: {
    selectedTags: string
    selectedContentLabel: string
    onClose: (options: {
        tags: string
        contentLabel: string
    }) => void
}) {
    const [selectedTagsState, setSelectedTagsState] = useState<string>(selectedTags)
    const [selectedContentLabelState, setSelectedContentLabelState] = useState<string>(selectedContentLabel)

    return (
        <div className="p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
                <Heading size="lg">
                    Content Labelling Settings
                </Heading>
            </div>

            <div className="space-y-4">
                <div>
                    <Text size="sm" className="mb-2">
                        Tags
                    </Text>
                    <Text size="xs" alt className="mb-2">
                        These tags help others find or filter your howl. Press enter to add a tag, or press backspace to
                        remove the last tag.
                    </Text>

                    <TagsInput
                        forcedTag={selectedContentLabelState}
                        value={selectedTagsState}
                        onChange={setSelectedTagsState}
                    />
                </div>

                <ContentLabelInput
                    value={selectedContentLabelState}
                    onChange={setSelectedContentLabelState}
                />

                <div className="flex justify-end gap-2 pt-4">
                    <Button onClick={() => {
                        onClose({
                            tags: selectedTagsState,
                            contentLabel: selectedContentLabelState
                        })
                    }}>
                        Done
                    </Button>
                </div>
            </div>
        </div>
    )
}
