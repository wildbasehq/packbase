import UserInfoCol from '@/components/shared/user/info-col'
import moment from 'moment/moment'
import Markdown from '@/components/shared/markdown'
import { CommentBox, MediaGrid, React, RecursiveCommentThread } from '@/components/shared/feed/post'
import Card from '@/components/shared/card'

export default function PostModal({ postContent, setPostContent, signedInUser, selectedMedia, setSelectedMedia, onComment, postState }) {
    return (
        <div className="relative w-[42rem] max-w-2xl bg-neutral-50 dark:bg-n-8">
            <div className="sticky top-0 z-10 p-4">
                <UserInfoCol user={postContent.user} tag={<time dateTime={postContent.created_at}>about {moment(postContent.created_at).fromNow()}</time>} />
            </div>

            <Card className="relative z-20 max-w-full! space-y-4 p-0! dark:border-2">
                <div className="px-4 py-4 sm:px-6">
                    <div className="text-default mt-4 break-words text-sm">
                        <Markdown>{postContent.body}</Markdown>
                    </div>

                    {postContent?.assets && postContent.assets.length > 0 && <MediaGrid assets={postContent.assets} selectState={[selectedMedia, setSelectedMedia]} />}
                </div>

                <div className="flex flex-col justify-between space-y-8 overflow-hidden border-t px-4 py-4 sm:px-6">
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
            </Card>
        </div>
    )
}
