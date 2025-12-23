import {Text} from '@/components/shared/text'
import UserAvatar from '@/components/shared/user/avatar'
import {cn} from '@/lib/utils/cn'
import {memo} from 'react'
import {ChatMessage} from './types'
import {usePerformanceMonitor} from './usePerformanceMonitor'

interface MessageItemProps {
    message: ChatMessage
    isOwn?: boolean
    onClick?: (m: ChatMessage) => void
    showAvatar?: boolean
}

export const MessageItem = memo<MessageItemProps>(({message, isOwn, onClick, showAvatar = true}) => {
    usePerformanceMonitor('MessageItem')
    if (message.senderType === 'system' || message.senderType === 'assistant') {
        return (
            <div className="flex w-full justify-center py-2">
                <div
                    className={cn(
                        'max-w-[85%] rounded-md border px-3 py-2 text-xs text-muted-foreground break-words whitespace-pre-wrap',
                        'border-dashed bg-n-5/5',
                    )}
                >
                    {message.content}
                </div>
            </div>
        )
    }

    return (
        <div className={cn('flex w-full gap-3 py-2', isOwn ? 'flex-row-reverse' : 'flex-row')}
             onClick={() => onClick?.(message)}>
            {showAvatar && (
                <UserAvatar user={message.user} size={32} className="shrink-0 justify-center self-end"/>
            )}
            <div className={cn('flex max-w-[75%] flex-col gap-1 rounded bg-muted ring-default ring-1')}>
                <Text size="xs" alt className="mx-3 mt-1 truncate">
                    {message.user?.display_name || message.user?.username || 'Unknown User'}
                </Text>
                <div
                    className={cn(
                        'rounded px-3 py-2 text-sm border-t border-default break-words whitespace-pre-wrap',
                        isOwn
                            ? 'bg-sidebar rounded-br-sm'
                            : 'bg-card text-default',
                    )}
                >
                    {message.content}
                </div>
            </div>
        </div>
    )
}, (prevProps, nextProps) => {
    return (
        prevProps.message.id === nextProps.message.id &&
        prevProps.message.content === nextProps.message.content &&
        prevProps.message.user?.id === nextProps.message.user?.id &&
        prevProps.isOwn === nextProps.isOwn &&
        prevProps.showAvatar === nextProps.showAvatar
    )
})
