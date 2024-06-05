/**
 * Forgive me, this is fucking horrible.
 */

import moment from 'moment'
import {ArrowUpOnSquareIcon, UserGroupIcon,} from '@heroicons/react/24/solid'
import Link from 'next/link'
import UserAvatar from '@/components/shared/user/avatar'
import {UserProfileBasic} from '@/lib/defs/user'
import ReactMarkdown from 'react-markdown'
import Card from '@/components/shared/card'
import {Text} from '@/components/shared/text'

export declare interface FeedPostDataType {
    id: string;
    user: UserProfileBasic
    body: string;
    created_at: string;
    pack?: any;
    howling: 'echo' | 'alongside';
    howlingUser: UserProfileBasic;
}

export declare interface FeedPostType {
    post: FeedPostDataType;
}

export default function FeedPost({post}: FeedPostType) {
    const {id, user, body, created_at, pack, howling, howlingUser} = post

    return (
        <>
            <Card className="!px-0 !py-0">
                <div className="relative">
                    <div className="px-4 pt-5 sm:px-6">
                        {/* "___ Rehowled" */}
                        {howling && (
                            <div className="flex items-center text-sm mb-6">
                                <ArrowUpOnSquareIcon className="w-4 h-4 mr-2"/>
                                <Link href={`/@${howlingUser?.username}/`}
                                      className="flex items-center text-default-alt">
                                    <UserAvatar size="xs" image={howlingUser?.images?.avatar || ''}
                                                className="mr-2"/>
                                    {howlingUser?.username} rehowled
                                </Link>
                            </div>
                        )}
                        {pack && (
                            <div className="flex items-center text-sm mb-6">
                                <UserGroupIcon className="w-4 h-4 mr-2"/>
                                <Link href={`/pack/@${pack?.slug}/`}
                                      className="flex items-center text-default-alt">
                                    <UserAvatar size="xs" icon={pack?.avatar || ''}
                                                className="mr-2"/>
                                    {pack?.name}
                                </Link>
                            </div>
                        )}
                        <div className="flex space-x-3">
                            <div className="flex-shrink-0">
                                <UserAvatar user={user}/>
                            </div>
                            <div className="min-w-0 flex-1 flex flex-col justify-center">
                                <Link href={`/@${user.username}/`}
                                      className="font-medium text-default cursor-pointer hover:underline">
                                    {user.display_name || user.username}
                                </Link>
                                {created_at && (
                                    <a href={`/@${user.username}/${id}`}
                                       className="text-sm text-default-alt cursor-pointer hover:underline">
                                        <time
                                            dateTime={created_at}>
                                            about {moment(created_at).fromNow()}
                                        </time>
                                    </a>
                                )}
                            </div>
                            <div className="flex-shrink-0 self-center flex space-x-2">
                            </div>
                        </div>
                    </div>

                    <div
                        className="min-h-fit w-full py-4 px-4 sm:px-6 cursor-pointer">
                        <div
                            className="text-sm text-neutral-700 space-y-4 dark:text-neutral-50">
                            <ReactMarkdown>
                                {body}
                            </ReactMarkdown>
                        </div>

                        {/* Post Objects (Images) */}
                        {/*{postContent?.objects && postContent.objects.length > 0 && (*/}
                        {/*    <MediaGrid objects={postContent.objects} selectState={[selectedMedia, setSelectedMedia]}*/}
                        {/*               post={postContent} truncate/>*/}
                        {/*)}*/}
                    </div>

                    {/* Floating "User is typing..." card */}
                    {/*<div className="absolute bottom-0 left-0 ml-4 sm:ml-6 bg-box-alt border-x border-t border-b-0 border-solid border-neutral-300 dark:border-neutral-700 rounded-tl-xl rounded-tr-xl">*/}
                    {/*    <div className="flex items-center space-x-2 px-4 py-2">*/}
                    {/*        <div className="flex-shrink-0">*/}
                    {/*            <img className="h-4 w-4 rounded-full"*/}
                    {/*                    src={postContent.user.avatar || `/img/avatar/default-avatar.png`}*/}
                    {/*                    alt=""/>*/}
                    {/*        </div>*/}
                    {/*        <div className="min-w-0 flex-1">*/}
                    {/*            <p className="text-sm font-medium text-default cursor-pointer hover:underline">*/}
                    {/*                {postContent.user.username} is typing...*/}
                    {/*            </p>*/}
                    {/*        </div>*/}
                    {/*    </div>*/}
                    {/*</div>*/}
                </div>

                {/* Footer - Like & Share on left, rest of space taken up by a reply textbox with send icon on right */}
                <div className="px-4 py-4 sm:px-6 flex justify-between space-x-8 border-t">
                    <div className="flex space-x-6">
                        {/*{user && (*/}
                        {/*    <span*/}
                        {/*        className="inline-flex items-center text-sm cursor-pointer hover:underline"*/}
                        {/*        onClick={() => {*/}
                        {/*            console.log('like')*/}
                        {/*        }}*/}
                        {/*    >*/}
                        {/*        <ChatBubbleBottomCenterTextIcon className="h-5 w-5 text-neutral-400"/>*/}
                        {/*    </span>*/}
                        {/*)}*/}
                        <Text size="xs">
                            🤷 No functions
                        </Text>
                    </div>
                </div>
            </Card>
        </>
    )
}

function MediaGrid({...props}: any) {
    const {objects, truncate} = props
    const [, setSelectedMedia] = props.selectState

    // IMPORTANT!
    /*
     *      (()__(()
     *      /       \
     *     ( /    \  \
     *      \ o o    /
     *      (_()_)__/ \
     *     / _,==.____ \
     *    (   |--|      )
     *    /\_.|__|'-.__/\_
     *   / (        /     \
     *   \  \      (      /
     *    )  '._____)    /
     * (((____.--(((____/mrf
     *
     * sincerely,
     * the bear
     */

    return (
        <div className="mt-4">
            <div className={objects.length > 1 ? 'flex flex-col' : ''}>
                <div className="aspect-w-10 aspect-h-7 block w-full overflow-hidden rounded-default">
                    {/* @todo: CLEANNNN */}
                    {objects[0]?.id?.split(':')[1].substring(2, 4) === 'C1' && (
                        <img
                            src={objects[0].url}
                            alt=""
                            className="aspect-w-10 aspect-h-7 w-full object-cover"
                        />
                    )}

                    {objects[0]?.id?.split(':')[1].substring(2, 4) === 'C2' && (
                        <video
                            src={objects[0].url}
                            className="aspect-w-10 aspect-h-7 object-cover"
                            controls
                        />
                    )}
                </div>

                {objects.length >= 2 && (
                    <div className={`mt-2 grid ${objects.length >= 2 ? 'grid-cols-3' : ''} gap-2`}>
                        {objects.slice(1).map((object: {
                            url: string | undefined;
                            id: string;
                        }, objectIndex: number) => {
                            if (truncate && objectIndex === 2) return (
                                <div key={objectIndex} className="w-full overflow-hidden rounded-default">
                                    <div className="relative aspect-square">
                                        <img
                                            src={object.url}
                                            alt=""
                                            className="aspect-square object-cover w-full h-full"
                                            onClick={/* @ts-ignore */
                                                () => setSelectedMedia(object)}
                                        />

                                        {/* @ts-ignore - postContent.objects is very obviously defined :| */}
                                        {objects.length > 4 && (
                                            <div
                                                className="absolute mt-2 mr-2 top-0 right-0 flex items-center justify-center">
                                                <div className="bg-box rounded-default p-2">
                                                    {/* @ts-ignore - for fuck sake. */}
                                                    <span
                                                        className="text-defualt-alt text-sm">+{objects.length - 4}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )

                            if (truncate && objectIndex >= 3) return null
                            // Check E2 for object variant
                            switch (object.id.split(':')[1].substring(2, 4)) {
                                case 'C1':
                                    return (
                                        <div key={objectIndex}
                                             className={`aspect-square w-full overflow-hidden rounded-default`}>
                                            <img
                                                src={object.url}
                                                alt=""
                                                className="aspect-square object-cover w-full h-full"
                                                onClick={/* @ts-ignore */
                                                    () => setSelectedMedia(object)}
                                            />
                                        </div>
                                    )
                            }
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
