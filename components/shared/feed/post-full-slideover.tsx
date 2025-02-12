import UserInfoCol from '@/components/shared/user/info-col'
import moment from 'moment/moment'
import Markdown from '@/components/shared/markdown'
import { Slideover } from '@/components/modal/slideover'
import { CommentBox, MediaGrid, React, RecursiveCommentThread } from '@/components/shared/feed/post'

export default function PostFullSlideover({
    postContent,
    setPostContent,
    signedInUser,
    slideoverMediaOpen,
    slideoverOpen,
    setSlideoverOpen,
    selectedMedia,
    setSelectedMedia,
    aspectRatio,
    onComment,
    postState,
}) {
    return (
        <Slideover
            expandNatural={aspectRatio > 1.2}
            className={`${
                slideoverMediaOpen ? '-translate-x-24 transition-transform duration-150 will-change-transform' : ''
            } transition-transform duration-150 will-change-transform`}
            open={[slideoverOpen, setSlideoverOpen]}
        >
            <div className="px-4 py-4 sm:px-6">
                <div className="sticky top-4 z-50 flex space-x-3 rounded bg-neutral-50 p-4 dark:bg-n-6/50">
                    <UserInfoCol user={postContent.user} tag={<time dateTime={postContent.created_at}>about {moment(postContent.created_at).fromNow()}</time>} />
                </div>

                <div className="text-default mt-4 space-y-4 break-words text-sm">
                    <Markdown>{postContent.body}</Markdown>
                </div>

                {postContent?.assets && postContent.assets.length > 0 && <MediaGrid assets={postContent.assets} selectState={[selectedMedia, setSelectedMedia]} />}
            </div>

            <div className="flex flex-col justify-between space-y-8 overflow-hidden rounded border-t-2 px-4 py-4 sm:px-6">
                <div className="flex space-x-6">{signedInUser && !signedInUser.anonUser && <React post={postContent} />}</div>

                {postContent?.comments && postContent.comments.length > 0 && (
                    <>
                        {signedInUser && !signedInUser.anonUser && <CommentBox className="flex-1" truncate originalPost={postContent} onComment={onComment} />}

                        <div className="flow-root">
                            <ul role="list" className="-mb-8">
                                {postContent.comments.map((comment) => (
                                    <RecursiveCommentThread key={comment.id} comment={comment} originalPost={[postContent, setPostContent]} postState={postState} />
                                ))}
                            </ul>
                        </div>
                    </>
                )}
            </div>
        </Slideover>
    )
}
