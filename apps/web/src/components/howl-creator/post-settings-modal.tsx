/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {AvailablePagesType} from '@/components/howl-creator/floating-compose'
import {Button} from '@/components/shared/button'
import {Heading, Text} from '@/components/shared/text'
import {useUserAccountStore} from '@/lib'
import {useState} from 'react'
import ContentLabelInput from './content-label-input'
import {TagsInput} from './tags-input'

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
        toPage?: AvailablePagesType
    }) => void
}) {
    const {user} = useUserAccountStore()
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
                            contentLabel: selectedContentLabelState,
                            ...(![
                                'rating_safe',
                                'rating_mature'
                            ].includes(selectedContentLabelState) && !user.is_r18) && {
                                toPage: 'mature-rating-from-sfw-warning'
                            }
                        })
                    }}>
                        Done
                    </Button>
                </div>
            </div>
        </div>
    )
}
