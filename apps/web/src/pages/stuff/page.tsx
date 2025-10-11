import React, {useState} from 'react'
import FolderCollectionIcon from '@/components/icons/folder-collection.tsx'
import {Heading, Text} from '@/components/shared/text.tsx'
import FilesPage from "@/pages/files/page.tsx";

function EmptyState() {
    return (
        <div
            className="absolute flex justify-center items-center h-[calc(100vh-14rem)] top-14 lg:pl-18 w-full overflow-hidden grow">
            <div className="h-full flex items-center justify-center">
                <div className="w-full max-w-2xl">
                    <div className="flex flex-col items-center justify-center">
                        <div className="flex flex-col items-center justify-center max-w-xs text-center mb-4">
                            <FolderCollectionIcon className="h-24 mb-6"/>
                            <Heading className="mb-2">You have no stuff yet</Heading>
                            <Text alt>
                                Your "stuff" is collections of content you've saved across Packbase or copy-and-pasted
                                into here, and will
                                always have quick access to.
                            </Text>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function YourStuffPage() {
    // State to track if the user has content
    const [hasContent] = useState(true)

    return hasContent
        ? <div className="absolute h-[calc(100vh-14rem)] w-full lg:pl-18 overflow-auto">
            <FilesPage/>
        </div>
        : <EmptyState/>
}
