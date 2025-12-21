import {useParams} from 'wouter'
import ContentFrame from '@/lib/hooks/content-frame.tsx'
import {ChannelHeader} from '@/components/chat/ChannelHeader.tsx'
import {MessagesList} from '@/components/chat/MessagesList.tsx'
import {MessageComposer} from '@/components/chat/MessageComposer.tsx'

export default function ChatThreadPage() {
    const {id} = useParams<{ id: string }>()
    if (!id) return null

    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            <ContentFrame get={`dm.channels.${id}`} id={`channel-${id}`}>
                <ChannelHeader channelId={id}/>
                <div className="flex-1 flex flex-col overflow-hidden">
                    <ContentFrame get={`dm.channels.${id}.messages`} refetchInterval={5} id={`messages-${id}`}>
                        <MessagesList channelId={id}/>
                    </ContentFrame>
                    <MessageComposer channelId={id}/>
                </div>
            </ContentFrame>
        </div>
    )
}

